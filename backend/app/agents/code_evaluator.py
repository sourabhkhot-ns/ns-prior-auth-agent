"""Code Evaluator Agent — checks ICD-10/CPT codes against payor rules."""
from __future__ import annotations

import logging
from app.agents.state import AgentState
from app.core.llm import llm_call_json
from app.core.prompts import CODE_EVALUATOR_SYSTEM, CODE_EVALUATOR_USER
from app.models.evaluation import CodeEvaluation, CodeResult

logger = logging.getLogger(__name__)


async def code_evaluator_node(state: AgentState) -> dict:
    """Evaluate ICD-10 and CPT codes against payor rules."""
    order = state.get("order")
    payor_rule = state.get("payor_rule")
    test_entry = state.get("test_catalog_entry")

    if not order:
        return {"code_evaluation": CodeEvaluation(summary="No order data available")}

    if not payor_rule:
        return {"code_evaluation": CodeEvaluation(
            summary="No payor rules available — cannot evaluate codes"
        )}

    # Format ICD-10 codes
    icd10_str = "\n".join(
        f"- {c.code}: {c.description}" for c in order.clinical_info.icd10_codes
    ) or "None provided"

    # Format CPT codes from test catalog
    cpt_str = ", ".join(test_entry.cpt_codes) if test_entry else "Unknown (test not in catalog)"

    # Format accepted codes
    accepted_cpt_str = ", ".join(payor_rule.accepted_cpt_codes) or "Not specified"
    accepted_icd10_str = "\n".join(
        f"- {cat}" for cat in payor_rule.accepted_icd10_categories
    ) or "Not specified"

    exclusions_str = "\n".join(f"- {e}" for e in payor_rule.exclusions) or "None"

    logger.info("Evaluating codes for order %s against %s", order.order_id, payor_rule.payor_name)

    try:
        result = await llm_call_json(
            system_prompt=CODE_EVALUATOR_SYSTEM,
            user_prompt=CODE_EVALUATOR_USER.format(
                test_name=test_entry.test_name if test_entry else order.test_name or order.test_code,
                test_code=order.test_code,
                icd10_codes=icd10_str,
                cpt_codes=cpt_str,
                payor_name=payor_rule.payor_name,
                accepted_cpt_codes=accepted_cpt_str,
                accepted_icd10_info=accepted_icd10_str,
                exclusions=exclusions_str,
            ),
            tag="code_evaluator",
        )
        evaluation = CodeEvaluation(
            icd10_results=[CodeResult(**r) for r in result.get("icd10_results", [])],
            cpt_results=[CodeResult(**r) for r in result.get("cpt_results", [])],
            summary=result.get("summary", ""),
        )
        return {"code_evaluation": evaluation}
    except Exception as e:
        logger.error("Code evaluation failed: %s", e)
        return {"code_evaluation": CodeEvaluation(summary=f"Code evaluation failed: {e}")}
