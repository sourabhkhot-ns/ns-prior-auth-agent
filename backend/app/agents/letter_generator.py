"""Letter Generator Agent — drafts a medical necessity letter from the evaluation."""
from __future__ import annotations

import logging

from app.agents.state import AgentState
from app.core.llm import llm_call_json
from app.core.prompts import LETTER_GENERATOR_SYSTEM, LETTER_GENERATOR_USER
from app.models.letter import KnownIssue, MedicalNecessityLetter

logger = logging.getLogger(__name__)


# Default mode picked from the risk verdict when caller doesn't specify one.
_MODE_FROM_RISK = {
    "LOW": "draft",
    "MEDIUM": "placeholder",
    "HIGH": None,  # refused unless overridden
}


def _resolve_mode(requested: str | None, denial_risk: str) -> tuple[str | None, str | None]:
    """Return (mode, refusal_reason). If mode is None the caller should skip generation."""
    if requested:
        req = requested.lower().strip()
        if req in ("draft", "placeholder", "override"):
            return req, None
        return None, f"Unknown letter_mode '{requested}'"

    mode = _MODE_FROM_RISK.get((denial_risk or "").upper())
    if mode is None:
        return None, (
            "Denial risk is HIGH — letter generation refused by default. "
            "Resolve the flagged issues or pass letter_mode='override' to force a draft "
            "that discloses the known issues."
        )
    return mode, None


def _patient_block(order) -> str:
    p = order.patient
    parts = [f"Name: {p.first_name} {p.last_name}"]
    if p.date_of_birth:
        parts.append(f"DOB: {p.date_of_birth}")
    parts.append(f"Sex: {p.sex}")
    if p.medical_record_number:
        parts.append(f"MRN: {p.medical_record_number}")
    if p.ethnicity:
        parts.append(f"Ethnicity: {', '.join(p.ethnicity)}")
    return " | ".join(parts)


def _clinical_block(order) -> str:
    ci = order.clinical_info
    lines: list[str] = []
    if ci.icd10_codes:
        lines.append("ICD-10 codes on order:")
        for c in ci.icd10_codes:
            lines.append(f"  - {c.code}: {c.description}")
    if ci.indications:
        lines.append("Clinical indications:")
        for ind in ci.indications:
            lines.append(f"  - {ind.name}{f' ({ind.category})' if ind.category else ''}")
    if ci.genes_of_interest:
        lines.append(f"Genes of interest: {', '.join(ci.genes_of_interest)}")
    if ci.prior_genetic_testing:
        detail = ci.prior_testing_details or "(no details provided)"
        lines.append(f"Prior genetic testing: {detail}")
    if ci.family_history:
        lines.append(f"Family history: {ci.family_history}")
    if ci.supplemental_notes:
        lines.append(f"Supplemental notes: {ci.supplemental_notes}")
    if ci.additional_info:
        lines.append(f"Additional info: {ci.additional_info}")
    if ci.is_inpatient:
        lines.append("Setting: Inpatient")
    return "\n".join(lines) if lines else "(no clinical information recorded)"


def _documents_block(order) -> str:
    if not order.documents:
        return "(no documents listed)"
    return "\n".join(f"  - {d.title} ({d.document_type})" for d in order.documents)


def _criteria_block(criteria_eval, payor_rule) -> str:
    """Cross-reference payor criteria with evaluation results."""
    if not criteria_eval or not criteria_eval.criteria_results:
        # Fall back to payor's raw criteria list
        if not payor_rule.medical_necessity_criteria:
            return "(no criteria defined)"
        return "\n".join(
            f"  - {c.description} (not yet evaluated)"
            for c in payor_rule.medical_necessity_criteria
        )
    lines = []
    for r in criteria_eval.criteria_results:
        status = r.met.upper().replace("_", " ")
        lines.append(f"  [{status}] {r.criterion}")
        if r.evidence:
            lines.append(f"      evidence: {r.evidence}")
        if r.notes:
            lines.append(f"      notes: {r.notes}")
    return "\n".join(lines)


def _required_docs_block(payor_rule) -> str:
    if not payor_rule.required_documentation:
        return "(none specified)"
    return "\n".join(f"  - {d}" for d in payor_rule.required_documentation)


def _issues_block(evaluation) -> str:
    if not evaluation or not evaluation.issues:
        return ""
    lines = ["**Flagged Issues (for override mode disclosure):**"]
    for i in evaluation.issues:
        lines.append(f"  - [{i.severity}] ({i.category}) {i.description}")
        if i.resolution:
            lines.append(f"      resolution: {i.resolution}")
    return "\n".join(lines)


async def letter_generator_node(state: AgentState) -> dict:
    """Generate a medical necessity letter from the evaluation outputs."""
    order = state.get("order")
    evaluation = state.get("evaluation")
    payor_rule = state.get("payor_rule")
    test_entry = state.get("test_catalog_entry")
    criteria_eval = state.get("criteria_evaluation")
    requested_mode = state.get("letter_mode")

    if not order or not evaluation or not payor_rule:
        logger.info("Letter generation skipped — missing order/evaluation/payor_rule")
        return {"letter": None}

    mode, refusal = _resolve_mode(requested_mode, evaluation.denial_risk)
    if mode is None:
        logger.info("Letter generation refused: %s", refusal)
        return {
            "letter": None,
            "letter_refusal_reason": refusal,
        }

    cpt_codes = test_entry.cpt_codes if test_entry else []
    icd10_codes = [c.code for c in order.clinical_info.icd10_codes]
    ordering_provider = (
        f"{order.care_team.ordering_provider_first_name} "
        f"{order.care_team.ordering_provider_last_name}".strip()
        or "(ordering provider not recorded)"
    )
    test_name = (test_entry.test_name if test_entry else None) or order.test_name or order.test_code

    try:
        result = await llm_call_json(
            system_prompt=LETTER_GENERATOR_SYSTEM,
            user_prompt=LETTER_GENERATOR_USER.format(
                mode=mode,
                payor_name=payor_rule.payor_name,
                policy_id=payor_rule.payor_code,
                policy_version=payor_rule.policy_version,
                test_name=test_name,
                cpt_codes_str=", ".join(cpt_codes) if cpt_codes else "(not listed)",
                patient_block=_patient_block(order),
                ordering_provider=ordering_provider,
                institution=order.care_team.institution_name or "(institution not recorded)",
                clinical_block=_clinical_block(order),
                documents_block=_documents_block(order),
                criteria_block=_criteria_block(criteria_eval, payor_rule),
                required_docs_block=_required_docs_block(payor_rule),
                denial_risk=evaluation.denial_risk,
                overall_met=criteria_eval.overall_met if criteria_eval else "unknown",
                issue_count=len(evaluation.issues),
                issues_block=_issues_block(evaluation) if mode == "override" else "",
            ),
            tag="letter_generator",
        )
    except Exception as e:
        logger.error("Letter generation failed: %s", e)
        return {
            "letter": None,
            "letter_refusal_reason": f"Letter generator error: {e}",
        }

    raw_issues = result.get("known_issues", []) or []
    known_issues = [KnownIssue(**i) for i in raw_issues] if mode == "override" else []

    warnings = list(result.get("warnings", []) or [])
    if mode == "override":
        warnings.insert(
            0,
            f"Letter generated in OVERRIDE mode despite denial risk = {evaluation.denial_risk}. "
            f"Review the known_issues section before signing.",
        )
    elif mode == "placeholder":
        warnings.insert(
            0,
            "Letter contains [EVIDENCE NEEDED] placeholders. "
            "Fill in the missing clinical evidence before sending.",
        )

    letter = MedicalNecessityLetter(
        mode=mode,
        payor_name=payor_rule.payor_name,
        policy_id=payor_rule.payor_code,
        policy_version=payor_rule.policy_version,
        patient_name=f"{order.patient.first_name} {order.patient.last_name}".strip(),
        test_name=test_name,
        cpt_codes=cpt_codes,
        icd10_codes=icd10_codes,
        ordering_provider=ordering_provider,
        institution=order.care_team.institution_name or "",
        introduction=result.get("introduction", ""),
        clinical_summary=result.get("clinical_summary", ""),
        medical_necessity_justification=result.get("medical_necessity_justification", ""),
        supporting_documentation=list(result.get("supporting_documentation", []) or []),
        conclusion=result.get("conclusion", ""),
        known_issues=known_issues,
        warnings=warnings,
        body_markdown=result.get("body_markdown", ""),
    )
    return {"letter": letter}
