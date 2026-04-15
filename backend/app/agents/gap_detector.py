"""Gap Detector Agent — identifies missing documentation and clinical info."""
from __future__ import annotations

import logging
from app.agents.state import AgentState
from app.core.llm import llm_call_json
from app.core.prompts import GAP_DETECTOR_SYSTEM, GAP_DETECTOR_USER
from app.models.evaluation import GapReport, GapItem

logger = logging.getLogger(__name__)


async def gap_detector_node(state: AgentState) -> dict:
    """Detect documentation and clinical information gaps."""
    order = state.get("order")
    payor_rule = state.get("payor_rule")
    test_entry = state.get("test_catalog_entry")
    code_eval = state.get("code_evaluation")
    criteria_eval = state.get("criteria_evaluation")

    if not order:
        return {"gap_report": GapReport(summary="No order data available")}

    if not payor_rule:
        return {"gap_report": GapReport(
            summary="No payor rules available — cannot detect gaps"
        )}

    clinical = order.clinical_info

    docs_str = "\n".join(
        f"- {d.title} (Type: {d.document_type})" for d in order.documents
    ) or "No documents attached"

    required_docs_str = "\n".join(
        f"- {d}" for d in payor_rule.required_documentation
    ) or "None specified"

    icd10_str = ", ".join(f"{c.code} ({c.description})" for c in clinical.icd10_codes) or "None"
    indications_str = ", ".join(
        f"{i.name} ({i.category})" for i in clinical.indications
    ) or "None"
    genes_str = ", ".join(clinical.genes_of_interest) if clinical.genes_of_interest else "None"

    code_eval_summary = code_eval.summary if code_eval else "Not evaluated"
    criteria_eval_summary = criteria_eval.summary if criteria_eval else "Not evaluated"

    logger.info("Detecting gaps for order %s", order.order_id)

    try:
        result = await llm_call_json(
            system_prompt=GAP_DETECTOR_SYSTEM,
            user_prompt=GAP_DETECTOR_USER.format(
                attached_documents=docs_str,
                icd10_codes=icd10_str,
                indications=indications_str,
                supplemental_notes=clinical.supplemental_notes or "None",
                prior_testing=f"Yes — {clinical.prior_testing_details}" if clinical.prior_genetic_testing else "No",
                family_history=clinical.family_history or "Not provided",
                genes_of_interest=genes_str,
                required_documentation=required_docs_str,
                code_evaluation_summary=code_eval_summary,
                criteria_evaluation_summary=criteria_eval_summary,
                payor_name=payor_rule.payor_name,
                test_name=test_entry.test_name if test_entry else order.test_name or order.test_code,
            ),
        )
        report = GapReport(
            missing_documents=[GapItem(**item) for item in result.get("missing_documents", [])],
            missing_clinical_info=[GapItem(**item) for item in result.get("missing_clinical_info", [])],
            summary=result.get("summary", ""),
        )
        return {"gap_report": report}
    except Exception as e:
        logger.error("Gap detection failed: %s", e)
        return {"gap_report": GapReport(summary=f"Gap detection failed: {e}")}
