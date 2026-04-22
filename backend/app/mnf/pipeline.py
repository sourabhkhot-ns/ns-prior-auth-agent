"""MNF generation pipeline — ties together template + mapping + justification + validation."""
from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any, AsyncIterator

from app.db.database import async_session
from app.mnf.calibration import PayorCalibrator
from app.mnf.field_mapper import map_fields
from app.mnf.generator import (
    MNF_SYSTEM,
    build_layer_prompts,
    build_weaving_prompt,
    generate_justification,
    run_layer,
)
from app.mnf.guidelines import GuidelineStore
from app.mnf.models import DraftForm, FormTemplate, JustificationLayers
from app.mnf.templates import TemplateRegistry
from app.mnf.validator import validate
from app.models.evaluation import PAEvaluation
from app.models.order import Order
from app.services.catalog_service import get_test_by_code
from app.services.rules_service import find_payor_rule

logger = logging.getLogger(__name__)


# Module-level singletons — JSON loading is idempotent and cheap to keep cached.
_templates = TemplateRegistry()
_guidelines = GuidelineStore()
_calibrator = PayorCalibrator()


class MNFError(Exception):
    pass


# Map the catalog's test category (and a handful of CPT codes we care about)
# to the canonical test_type string used by MNF templates + guidelines.
_CATEGORY_TO_TEST_TYPE = {
    "WES": "wes_wgs",
    "WGS": "wes_wgs",
    "WES_WGS": "wes_wgs",
    "HEREDITARY_CANCER_PANEL": "hereditary_cancer_panel",
    "HEREDITARY_CANCER": "hereditary_cancer_panel",
    "PANEL": "hereditary_cancer_panel",  # soft default
    "CARRIER_SCREENING": "carrier_screening",
    "CARRIER": "carrier_screening",
    "PGX": "pharmacogenomics",
    "PHARMACOGENOMICS": "pharmacogenomics",
}

_CPT_TO_TEST_TYPE = {
    # WES/WGS CPT codes
    "81415": "wes_wgs", "81416": "wes_wgs", "81417": "wes_wgs",
    "81425": "wes_wgs", "81426": "wes_wgs", "81427": "wes_wgs",
    # Hereditary cancer panels
    "81432": "hereditary_cancer_panel",
    "81433": "hereditary_cancer_panel",
    "81435": "hereditary_cancer_panel",
    "81436": "hereditary_cancer_panel",
    "81162": "hereditary_cancer_panel",
}


def _resolve_test_type(test_entry, test_code: str) -> str:
    """Pick the canonical test_type for template / guideline lookup."""
    if test_entry and test_entry.category:
        key = test_entry.category.upper()
        if key in _CATEGORY_TO_TEST_TYPE:
            return _CATEGORY_TO_TEST_TYPE[key]
    if test_code:
        # Strip suffixes like "x1" (e.g. "81415x1" → "81415")
        core = test_code.split("x", 1)[0].strip()
        if core in _CPT_TO_TEST_TYPE:
            return _CPT_TO_TEST_TYPE[core]
    return "wes_wgs"  # fallback — matches the majority of our sample orders


def _select_template(payor_id: str, test_type: str) -> tuple[FormTemplate, str | None]:
    """4-level template fallback. Returns (template, fallback_note).

    Raises MNFError if no templates exist at all.
    """
    template = _templates.find(payor_id, test_type)
    if template:
        return template, None

    template = _templates.find_any_for_payor(payor_id)
    if template:
        return template, (
            f"No {payor_id} template for test type '{test_type}'. "
            f"Using '{template.template_id}' (types: {', '.join(template.test_types)}) as a fallback — "
            "a reviewer must adapt section headings and field labels if the submission target "
            "is a different form."
        )

    template = _templates.find_any_for_test_type(test_type)
    if template:
        return template, (
            f"No template matches payor '{payor_id}' exactly. "
            f"Using '{template.template_id}' from {template.payor_name} because it targets the same "
            f"test type ('{test_type}') — a reviewer must re-label fields for the actual payor."
        )

    template = _templates.find_any()
    if template:
        return template, (
            f"No template matches payor '{payor_id}' or test type '{test_type}'. "
            f"Using the generic '{template.template_id}' as a starting point — "
            "large manual edits will be required before submission."
        )

    raise MNFError(
        "No MNF templates configured. Add at least one template under "
        "backend/data/mnf/templates/."
    )


async def _resolve_context(order: Order):
    """Shared first step: look up test_entry, payor_rule, derive payor_id + test_type."""
    async with async_session() as session:
        test_entry = await get_test_by_code(session, order.test_code)
        payor_name = ""
        if order.insurance and order.insurance.primary:
            payor_name = order.insurance.primary.company_name
        elif order.insurance and order.insurance.secondary:
            payor_name = order.insurance.secondary.company_name
        test_type = _resolve_test_type(test_entry, order.test_code)
        payor_rule = None
        if payor_name:
            category_for_rule = test_entry.category if test_entry else "WES_WGS"
            payor_rule = await find_payor_rule(session, payor_name, category_for_rule)

    # payor_id from the order's insurance name directly — the fuzzy rule lookup
    # will happily fall back to a different payor's rule, which would hide the
    # real payor from template matching.
    if payor_name:
        payor_id = payor_name.upper().replace(" ", "_")
    elif payor_rule:
        payor_id = payor_rule.payor_code
    else:
        payor_id = "UNKNOWN"

    return test_entry, payor_rule, payor_name, payor_id, test_type


def _attach_narrative_to_field(populated, justification_field_id: str, narrative: str) -> None:
    for pf in populated:
        if pf.field_id == justification_field_id:
            pf.value = narrative
            pf.confidence = "medium"
            pf.source = "generator:4-layer"
            pf.flag_reason = "AI-generated — clinician must review before signing"
            break


def _assemble_draft(
    order: Order,
    evaluation: PAEvaluation | None,
    template: FormTemplate,
    populated,
    layers: JustificationLayers,
    narrative: str,
    guidelines,
    template_fallback_note: str | None,
) -> DraftForm:
    errors, flags = validate(template, populated, narrative)
    if template_fallback_note:
        flags.insert(0, template_fallback_note)
    return DraftForm(
        draft_id=f"MNF-{uuid.uuid4().hex[:8].upper()}",
        order_id=order.order_id or "UNKNOWN",
        evaluation_id=evaluation.evaluation_id if evaluation else None,
        template=template,
        fields=populated,
        justification_text=narrative,
        justification_layers=layers,
        guidelines_cited=guidelines,
        validation_errors=errors,
        flags=flags,
        status="review",
    )


async def generate_mnf_draft(
    order: Order,
    evaluation: PAEvaluation | None,
) -> DraftForm:
    """Non-streaming entrypoint — produces a DraftForm in one shot."""
    test_entry, _, _, payor_id, test_type = await _resolve_context(order)
    template, fallback_note = _select_template(payor_id, test_type)
    if fallback_note:
        logger.warning("MNF: %s", fallback_note)
    logger.info(
        "MNF: selected template=%s payor=%s test_type=%s",
        template.template_id, payor_id, test_type,
    )

    populated = map_fields(order, template, test_entry)
    icd_codes = [c.code for c in order.clinical_info.icd10_codes]
    guidelines = _guidelines.find_relevant(test_type, icd_codes)
    calibration = _calibrator.get(payor_id)
    logger.info("MNF: guidelines=%d calibration=%s", len(guidelines), calibration.detail_level)

    layers, narrative = await generate_justification(
        order=order, test_entry=test_entry, guidelines=guidelines,
        calibration=calibration, payor_name=template.payor_name, test_type=test_type,
    )
    _attach_narrative_to_field(populated, template.justification_field_id, narrative)
    return _assemble_draft(order, evaluation, template, populated, layers, narrative, guidelines, fallback_note)


# ─────────────────────────────────────────────────────────────────────────
#  Streaming / agent-like pipeline
# ─────────────────────────────────────────────────────────────────────────

# Order + label of the agent steps shown in the UI. The four layer_* nodes
# run concurrently (fanned out from find_guidelines, joined at weave).
MNF_PIPELINE_STEPS: list[tuple[str, str]] = [
    ("select_template",   "Selecting payor template"),
    ("map_fields",        "Mapping fields from the order"),
    ("find_guidelines",   "Finding matching ACMG / NCCN guidelines"),
    ("layer_patient",     "Drafting patient-specific justification"),
    ("layer_test",        "Drafting test-specific rationale"),
    ("layer_guideline",   "Drafting guideline citation layer"),
    ("layer_utility",     "Drafting clinical-utility statement"),
    ("weave",             "Weaving the final narrative"),
    ("validate",          "Validating draft"),
]


def _event(kind: str, **data: Any) -> dict:
    return {"type": kind, **data}


async def generate_mnf_draft_streaming(
    order: Order,
    evaluation: PAEvaluation | None,
) -> AsyncIterator[dict]:
    """Yields pipeline events, then a final `draft` event.

    Event shapes:
      {"type": "pipeline", "agents": [{id, label, status: "pending"}, ...]}
      {"type": "agent_update", "id": ..., "status": "running" | "completed" | "error", "label": ..., "message"?}
      {"type": "draft", "data": <DraftForm dict>}
      {"type": "error", "message": ...}
    """
    yield _event(
        "pipeline",
        agents=[{"id": sid, "label": label, "status": "pending"} for sid, label in MNF_PIPELINE_STEPS],
    )

    try:
        test_entry, _, _, payor_id, test_type = await _resolve_context(order)

        # 1. select_template
        yield _event("agent_update", id="select_template", status="running",
                     label="Selecting payor template")
        template, fallback_note = _select_template(payor_id, test_type)
        if fallback_note:
            logger.warning("MNF: %s", fallback_note)
        yield _event(
            "agent_update", id="select_template", status="completed",
            label="Selecting payor template",
            message=f"{template.template_id} · {template.payor_name} ({', '.join(template.test_types)})",
        )

        # 2. map_fields
        yield _event("agent_update", id="map_fields", status="running",
                     label="Mapping fields from the order")
        populated = map_fields(order, template, test_entry)
        auto = sum(1 for p in populated if p.confidence in ("high", "medium"))
        manual = sum(1 for p in populated if p.confidence == "manual")
        yield _event(
            "agent_update", id="map_fields", status="completed",
            label="Mapping fields from the order",
            message=f"{auto} auto-populated · {manual} need manual entry",
        )

        # 3. find_guidelines
        yield _event("agent_update", id="find_guidelines", status="running",
                     label="Finding matching ACMG / NCCN guidelines")
        icd_codes = [c.code for c in order.clinical_info.icd10_codes]
        guidelines = _guidelines.find_relevant(test_type, icd_codes)
        calibration = _calibrator.get(payor_id)
        yield _event(
            "agent_update", id="find_guidelines", status="completed",
            label="Finding matching ACMG / NCCN guidelines",
            message=(
                f"{len(guidelines)} guideline{'s' if len(guidelines) != 1 else ''} matched"
                + (": " + ", ".join(g.id for g in guidelines) if guidelines else "")
            ),
        )

        # 4-7. four layers in parallel
        prompts = build_layer_prompts(order, test_entry, guidelines, test_type)
        layer_plan = [
            ("layer_patient",   "Drafting patient-specific justification", prompts["patient"],   "mnf.patient"),
            ("layer_test",      "Drafting test-specific rationale",        prompts["test"],      "mnf.test"),
            ("layer_guideline", "Drafting guideline citation layer",       prompts["guideline"], "mnf.guideline"),
            ("layer_utility",   "Drafting clinical-utility statement",     prompts["utility"],   "mnf.utility"),
        ]

        # Emit running for all four simultaneously
        for sid, label, _p, _t in layer_plan:
            yield _event("agent_update", id=sid, status="running", label=label)

        async def _run_layer(sid: str, label: str, prompt: str, tag: str):
            try:
                text = await run_layer(MNF_SYSTEM, prompt, tag=tag)
                return sid, label, text, None
            except Exception as e:
                return sid, label, "", e

        tasks = [asyncio.create_task(_run_layer(s, l, p, t)) for s, l, p, t in layer_plan]
        layer_texts: dict[str, str] = {}
        for coro in asyncio.as_completed(tasks):
            sid, label, text, err = await coro
            if err:
                yield _event("agent_update", id=sid, status="error", label=label, message=str(err))
                raise err
            layer_texts[sid] = text
            words = len(text.split())
            yield _event(
                "agent_update", id=sid, status="completed", label=label,
                message=f"{words} words",
            )

        layers = JustificationLayers(
            patient=layer_texts["layer_patient"],
            test=layer_texts["layer_test"],
            guideline=layer_texts["layer_guideline"],
            clinical_utility=layer_texts["layer_utility"],
        )

        # 8. weave
        yield _event("agent_update", id="weave", status="running", label="Weaving the final narrative")
        weaving_prompt = build_weaving_prompt(layers, calibration, template.payor_name)
        narrative = await run_layer(MNF_SYSTEM, weaving_prompt, tag="mnf.weave")
        _attach_narrative_to_field(populated, template.justification_field_id, narrative)
        yield _event(
            "agent_update", id="weave", status="completed",
            label="Weaving the final narrative",
            message=f"{len(narrative.split())} words · {calibration.detail_level} detail",
        )

        # 9. validate + assemble
        yield _event("agent_update", id="validate", status="running", label="Validating draft")
        draft = _assemble_draft(
            order, evaluation, template, populated, layers, narrative, guidelines, fallback_note,
        )
        yield _event(
            "agent_update", id="validate", status="completed",
            label="Validating draft",
            message=f"{len(draft.validation_errors)} errors · {len(draft.flags)} flags",
        )

        yield _event("draft", data=draft.model_dump(mode="json"))

    except MNFError as e:
        yield _event("error", message=str(e))
    except Exception as e:
        logger.exception("MNF streaming pipeline failed")
        yield _event("error", message=f"{type(e).__name__}: {e}")
