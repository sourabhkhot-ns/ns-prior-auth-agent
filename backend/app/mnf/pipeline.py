"""MNF generation pipeline — ties together template + mapping + justification + validation."""
from __future__ import annotations

import logging
import uuid

from app.db.database import async_session
from app.mnf.calibration import PayorCalibrator
from app.mnf.field_mapper import map_fields
from app.mnf.generator import generate_justification
from app.mnf.guidelines import GuidelineStore
from app.mnf.models import DraftForm
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


async def generate_mnf_draft(
    order: Order,
    evaluation: PAEvaluation | None,
) -> DraftForm:
    """Produce a DraftForm from an Order (+ optional PAEvaluation for evaluation_id linking)."""
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

    # Pick the template
    payor_id = payor_rule.payor_code if payor_rule else payor_name.upper().replace(" ", "_")
    template = _templates.find(payor_id, test_type)
    if not template:
        raise MNFError(
            f"No MNF template available for payor '{payor_id}' and test type '{test_type}'."
        )
    logger.info(
        "MNF: selected template=%s payor=%s test_type=%s",
        template.template_id, payor_id, test_type,
    )

    # Map fields from the order
    populated = map_fields(order, template, test_entry)

    # Collect relevant guidelines + calibration
    icd_codes = [c.code for c in order.clinical_info.icd10_codes]
    guidelines = _guidelines.find_relevant(test_type, icd_codes)
    calibration = _calibrator.get(payor_id)
    logger.info(
        "MNF: guidelines=%d calibration=%s",
        len(guidelines), calibration.detail_level,
    )

    # Generate the 4-layer narrative
    layers, narrative = await generate_justification(
        order=order,
        test_entry=test_entry,
        guidelines=guidelines,
        calibration=calibration,
        payor_name=template.payor_name,
        test_type=test_type,
    )

    # Put the narrative into the justification field on the populated list
    justification_field_id = template.justification_field_id
    for pf in populated:
        if pf.field_id == justification_field_id:
            pf.value = narrative
            pf.confidence = "medium"
            pf.source = "generator:4-layer"
            pf.flag_reason = "AI-generated — clinician must review before signing"
            break

    # Validate
    errors, flags = validate(template, populated, narrative)

    draft = DraftForm(
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
    return draft
