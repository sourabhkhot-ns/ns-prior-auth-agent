"""Risk Scorer Agent — synthesizes all findings into final PA evaluation."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime

from app.agents.state import AgentState
from app.core.llm import llm_call_json
from app.core.prompts import RISK_SCORER_SYSTEM, RISK_SCORER_USER
from app.models.evaluation import PAEvaluation, Issue

logger = logging.getLogger(__name__)


async def risk_scorer_node(state: AgentState) -> dict:
    """Produce final PA evaluation with denial risk score."""
    order = state.get("order")
    payor_rule = state.get("payor_rule")
    test_entry = state.get("test_catalog_entry")
    code_eval = state.get("code_evaluation")
    criteria_eval = state.get("criteria_evaluation")
    gap_report = state.get("gap_report")

    order_id = order.order_id if order else "UNKNOWN"
    evaluation_id = str(uuid.uuid4())

    if not order or not payor_rule:
        return {"evaluation": PAEvaluation(
            order_id=order_id,
            evaluation_id=evaluation_id,
            denial_risk="HIGH",
            summary="Evaluation incomplete — missing order data or payor rules",
            issues=[Issue(
                severity="CRITICAL",
                category="OTHER",
                description="; ".join(state.get("errors", ["Unknown error"])),
                resolution="Provide complete order data and ensure payor rules are configured",
            )],
        )}

    # Format evaluation results for the risk scorer
    code_eval_str = ""
    if code_eval:
        code_eval_str = f"Summary: {code_eval.summary}\n"
        for r in code_eval.icd10_results:
            code_eval_str += f"  ICD-10 {r.code}: {r.status} — {r.reason}\n"
        for r in code_eval.cpt_results:
            code_eval_str += f"  CPT {r.code}: {r.status} — {r.reason}\n"
    else:
        code_eval_str = "Not evaluated"

    criteria_eval_str = ""
    if criteria_eval:
        criteria_eval_str = f"Summary: {criteria_eval.summary}\nOverall Met: {criteria_eval.overall_met}\n"
        for r in criteria_eval.criteria_results:
            status = "MET" if r.met else "NOT MET"
            criteria_eval_str += f"  [{status}] {r.criterion}: {r.evidence}\n"
    else:
        criteria_eval_str = "Not evaluated"

    gap_str = ""
    if gap_report:
        gap_str = f"Summary: {gap_report.summary}\n"
        for item in gap_report.missing_documents:
            gap_str += f"  [{item.status}] {item.requirement}: {item.detail}\n"
        for item in gap_report.missing_clinical_info:
            gap_str += f"  [{item.status}] {item.requirement}: {item.detail}\n"
    else:
        gap_str = "Not evaluated"

    test_name = test_entry.test_name if test_entry else order.test_name or order.test_code
    insurance_type = order.insurance.insurance_type if order.insurance else "UNKNOWN"

    logger.info("Scoring risk for order %s", order_id)

    try:
        result = await llm_call_json(
            system_prompt=RISK_SCORER_SYSTEM,
            user_prompt=RISK_SCORER_USER.format(
                order_id=order_id,
                test_name=test_name,
                test_code=order.test_code,
                payor_name=payor_rule.payor_name,
                insurance_type=insurance_type,
                code_evaluation=code_eval_str,
                criteria_evaluation=criteria_eval_str,
                gap_report=gap_str,
            ),
        )

        evaluation = PAEvaluation(
            order_id=order_id,
            evaluation_id=evaluation_id,
            timestamp=datetime.utcnow(),
            denial_risk=result.get("denial_risk", "HIGH"),
            summary=result.get("summary", ""),
            code_evaluation=code_eval,
            criteria_evaluation=criteria_eval,
            gap_report=gap_report,
            issues=[Issue(**i) for i in result.get("issues", [])],
        )
        return {"evaluation": evaluation}
    except Exception as e:
        logger.error("Risk scoring failed: %s", e)
        return {"evaluation": PAEvaluation(
            order_id=order_id,
            evaluation_id=evaluation_id,
            denial_risk="HIGH",
            summary=f"Risk scoring failed: {e}",
        )}
