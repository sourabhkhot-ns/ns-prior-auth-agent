"""4-layer medical necessity justification generator.

Generates four independent narrative layers in parallel, then weaves them
into a single continuous justification paragraph. Ported from the `mnf`
reference project's JustificationGenerator.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import date

from app.core.llm import llm_call
from app.mnf.calibration import CalibrationParams
from app.mnf.models import GuidelineCitation, JustificationLayers
from app.mnf.prompts import (
    GUIDELINE_LAYER_USER,
    MNF_SYSTEM,
    PATIENT_LAYER_USER,
    TEST_CONTEXTS,
    TEST_LAYER_USER,
    UTILITY_CONTEXTS,
    UTILITY_LAYER_USER,
    WEAVING_USER,
)
from app.models.catalog import TestCatalogEntry
from app.models.order import Order

logger = logging.getLogger(__name__)


def _age_years(dob: date | None) -> str:
    if not dob:
        return "age not recorded"
    today = date.today()
    years = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        years -= 1
    if years < 2:
        months = (today.year - dob.year) * 12 + (today.month - dob.month)
        return f"{max(months, 0)} months old"
    return f"{years} years old"


def _indications_block(order: Order) -> str:
    lines = []
    for c in order.clinical_info.icd10_codes:
        lines.append(f"  - {c.code}: {c.description}")
    for ind in order.clinical_info.indications:
        extra = f" [{ind.category}]" if ind.category else ""
        lines.append(f"  - {ind.name}{extra}")
    return "\n".join(lines) if lines else "  - (none recorded)"


def _indications_inline(order: Order) -> str:
    parts: list[str] = []
    for c in order.clinical_info.icd10_codes:
        parts.append(f"{c.code}: {c.description}")
    if not parts and order.clinical_info.indications:
        for ind in order.clinical_info.indications:
            parts.append(ind.name)
    return "; ".join(parts) or "not specified"


def _family_history_block(order: Order) -> str:
    fh = order.clinical_info.family_history
    return f"Family History:\n{fh}" if fh else "Family History: No significant family history reported"


def _prior_testing_block(order: Order) -> str:
    ci = order.clinical_info
    if ci.prior_genetic_testing:
        detail = ci.prior_testing_details or "(no details recorded)"
        return f"Prior Genetic Testing:\n  - {detail}"
    return "Prior Genetic Testing: None on record"


def _provider_notes_block(order: Order) -> str:
    notes = order.clinical_info.supplemental_notes
    return f"Ordering Provider Notes: {notes}" if notes else ""


def _guidelines_block(guidelines: list[GuidelineCitation]) -> str:
    if not guidelines:
        return (
            "No specific matching guidelines found. If guidelines do not clearly support "
            "testing for this specific indication, note that testing is being performed based "
            "on clinical judgment."
        )
    parts: list[str] = []
    for g in guidelines:
        parts.append(f"\n[{g.source} {g.year}] {g.title}")
        parts.append(f"Excerpt: {g.excerpt}")
        if g.key_points:
            parts.append(f"Key Points: {'; '.join(g.key_points)}")
    return "\n".join(parts)


def _strip_markdown(text: str) -> str:
    """Remove headings, bullets, and stray bold — we want plain narrative."""
    import re
    out = re.sub(r"^#+\s+", "", text, flags=re.MULTILINE)
    out = re.sub(r"^\*\*.*?\*\*\s*", "", out, flags=re.MULTILINE)
    out = re.sub(r"^[-*]\s+", "", out, flags=re.MULTILINE)
    return out.strip()


async def run_layer(system: str, user: str, tag: str) -> str:
    """Public helper: make one LLM call with the MNF system prompt and strip markdown."""
    raw = await llm_call(system_prompt=system, user_prompt=user, tag=tag)
    return _strip_markdown(raw or "")


# Alias kept for backwards compatibility with callers that imported _layer directly.
_layer = run_layer


def build_layer_prompts(
    order: Order,
    test_entry: TestCatalogEntry | None,
    guidelines: list[GuidelineCitation],
    test_type: str,
) -> dict[str, str]:
    """Assemble the 4 user prompts for the justification layers (no LLM calls)."""
    test_name = (test_entry.test_name if test_entry else order.test_name) or order.test_code
    cpt_codes = test_entry.cpt_codes if test_entry else []
    cpt_str = ", ".join(cpt_codes) if cpt_codes else "(not listed)"

    patient = order.patient
    full_name = f"{patient.first_name} {patient.last_name}".strip()
    age_str = _age_years(patient.date_of_birth)
    ethnicity_line = (
        f"Ethnicity: {', '.join(patient.ethnicity)}"
        if patient.ethnicity else ""
    )
    genes_line = (
        f"Genes on panel: {', '.join(order.clinical_info.genes_of_interest)}"
        if order.clinical_info.genes_of_interest else ""
    )
    test_context = TEST_CONTEXTS.get(test_type, "")
    utility_context = UTILITY_CONTEXTS.get(
        test_type,
        "  - If positive: clinical management may change based on identified variants\n"
        "  - If negative: current management continues",
    )
    prior_testing_note = (
        "NOTE: Prior testing was performed — explain why this additional/broader test is "
        "needed despite that." if order.clinical_info.prior_genetic_testing else ""
    )

    return {
        "patient": PATIENT_LAYER_USER.format(
            patient_name=full_name or "Patient",
            age_str=age_str,
            dob=patient.date_of_birth.isoformat() if patient.date_of_birth else "not recorded",
            sex=patient.sex,
            ethnicity_line=ethnicity_line,
            indications_block=_indications_block(order),
            family_history_block=_family_history_block(order),
            prior_testing_block=_prior_testing_block(order),
            provider_notes_block=_provider_notes_block(order),
        ),
        "test": TEST_LAYER_USER.format(
            test_name=test_name,
            test_type=test_type or "(not specified)",
            genes_line=genes_line,
            cpt_codes_str=cpt_str,
            indications_block=_indications_block(order),
            test_context=test_context or "(no standard context on file for this test type)",
            prior_testing_note=prior_testing_note,
        ),
        "guideline": GUIDELINE_LAYER_USER.format(
            test_type=test_type or "(not specified)",
            indications_inline=_indications_inline(order),
            guidelines_block=_guidelines_block(guidelines),
        ),
        "utility": UTILITY_LAYER_USER.format(
            test_name=test_name,
            test_type=test_type or "(not specified)",
            age_str=age_str,
            sex=patient.sex,
            indications_inline=_indications_inline(order),
            utility_context=utility_context,
        ),
    }


def build_weaving_prompt(
    layers: JustificationLayers,
    calibration: CalibrationParams,
    payor_name: str,
) -> str:
    emphasis_lines_parts: list[str] = []
    if calibration.emphasize_family_history:
        emphasis_lines_parts.append(
            "EMPHASIS: Include detailed family history with relationships and ages at diagnosis."
        )
    if calibration.emphasize_prior_testing:
        emphasis_lines_parts.append(
            "EMPHASIS: Explain prior testing results and why additional/broader testing is needed."
        )
    emphasis_lines = ("\n".join(emphasis_lines_parts) + "\n") if emphasis_lines_parts else ""
    notes_line = f"Additional Guidance: {calibration.notes}" if calibration.notes else ""

    return WEAVING_USER.format(
        patient_layer=layers.patient,
        test_layer=layers.test,
        guideline_layer=layers.guideline,
        utility_layer=layers.clinical_utility,
        payor_name=payor_name,
        detail_level=calibration.detail_level,
        target_word_count=calibration.target_word_count,
        preferred_sources=", ".join(calibration.preferred_guideline_sources),
        emphasis_lines=emphasis_lines,
        notes_line=notes_line,
    )


async def generate_justification(
    order: Order,
    test_entry: TestCatalogEntry | None,
    guidelines: list[GuidelineCitation],
    calibration: CalibrationParams,
    payor_name: str,
    test_type: str,
) -> tuple[JustificationLayers, str]:
    """Run the 4 layer prompts in parallel, then weave. Non-streaming wrapper."""
    logger.info("Generating MNF justification for order %s", order.order_id)
    prompts = build_layer_prompts(order, test_entry, guidelines, test_type)
    patient_layer, test_layer, guideline_layer, utility_layer = await asyncio.gather(
        run_layer(MNF_SYSTEM, prompts["patient"], tag="mnf.patient"),
        run_layer(MNF_SYSTEM, prompts["test"], tag="mnf.test"),
        run_layer(MNF_SYSTEM, prompts["guideline"], tag="mnf.guideline"),
        run_layer(MNF_SYSTEM, prompts["utility"], tag="mnf.utility"),
    )
    layers = JustificationLayers(
        patient=patient_layer,
        test=test_layer,
        guideline=guideline_layer,
        clinical_utility=utility_layer,
    )
    weaving_prompt = build_weaving_prompt(layers, calibration, payor_name)
    narrative = await run_layer(MNF_SYSTEM, weaving_prompt, tag="mnf.weave")
    return layers, narrative
