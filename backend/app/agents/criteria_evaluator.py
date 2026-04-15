"""Criteria Evaluator Agent — checks medical necessity criteria against payor rules."""
from __future__ import annotations

import logging
from datetime import date
from app.agents.state import AgentState
from app.core.llm import llm_call_json
from app.core.prompts import CRITERIA_EVALUATOR_SYSTEM, CRITERIA_EVALUATOR_USER
from app.models.evaluation import CriteriaEvaluation, CriterionResult

logger = logging.getLogger(__name__)


def _calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


async def criteria_evaluator_node(state: AgentState) -> dict:
    """Evaluate whether order meets payor's medical necessity criteria."""
    order = state.get("order")
    payor_rule = state.get("payor_rule")
    test_entry = state.get("test_catalog_entry")

    if not order:
        return {"criteria_evaluation": CriteriaEvaluation(summary="No order data available")}

    if not payor_rule:
        return {"criteria_evaluation": CriteriaEvaluation(
            summary="No payor rules available — cannot evaluate criteria"
        )}

    patient = order.patient
    clinical = order.clinical_info

    # Format criteria
    criteria_str = ""
    for c in payor_rule.medical_necessity_criteria:
        prefix = "[REQUIRED]" if c.required else f"[{c.group or 'OPTIONAL'}]"
        criteria_str += f"{prefix} {c.description}\n"
        if c.group and c.group_min_required:
            criteria_str += f"  (Group {c.group}: need at least {c.group_min_required} from this group)\n"

    provider_req_str = "\n".join(f"- {r}" for r in payor_rule.ordering_provider_requirements) or "None specified"
    prior_testing_str = "\n".join(f"- {r}" for r in payor_rule.prior_testing_requirements) or "None specified"
    exclusions_str = "\n".join(f"- {e}" for e in payor_rule.exclusions) or "None"

    icd10_str = ", ".join(f"{c.code} ({c.description})" for c in clinical.icd10_codes) or "None"
    indications_str = "\n".join(
        f"- {i.name} (Category: {i.category})" + (f" — {i.custom_value}" if i.custom_value else "")
        for i in clinical.indications
    ) or "None"
    genes_str = ", ".join(clinical.genes_of_interest) if clinical.genes_of_interest else "None"

    age = _calculate_age(patient.date_of_birth) if patient.date_of_birth else "Unknown"

    logger.info("Evaluating criteria for order %s against %s", order.order_id, payor_rule.payor_name)

    try:
        result = await llm_call_json(
            system_prompt=CRITERIA_EVALUATOR_SYSTEM,
            user_prompt=CRITERIA_EVALUATOR_USER.format(
                patient_name=f"{patient.first_name} {patient.last_name}",
                patient_dob=str(patient.date_of_birth),
                patient_age=age,
                patient_sex=patient.sex,
                patient_ethnicity=", ".join(patient.ethnicity) or "Not specified",
                test_name=test_entry.test_name if test_entry else order.test_name or order.test_code,
                test_code=order.test_code,
                icd10_codes=icd10_str,
                indications=indications_str,
                genes_of_interest=genes_str,
                prior_testing=f"Yes — {clinical.prior_testing_details}" if clinical.prior_genetic_testing else "No",
                supplemental_notes=clinical.supplemental_notes or "None",
                additional_info=clinical.additional_info or "None",
                is_inpatient="Yes" if clinical.is_inpatient else "No",
                family_history=clinical.family_history or "Not provided",
                ordering_provider=f"{order.care_team.ordering_provider_first_name} {order.care_team.ordering_provider_last_name}".strip() or "Not specified",
                institution=f"{order.care_team.institution_name} ({order.care_team.institution_code})" if order.care_team.institution_name else "Not specified",
                payor_name=payor_rule.payor_name,
                medical_necessity_criteria=criteria_str,
                provider_requirements=provider_req_str,
                prior_testing_requirements=prior_testing_str,
                exclusions=exclusions_str,
            ),
        )
        evaluation = CriteriaEvaluation(
            criteria_results=[CriterionResult(**r) for r in result.get("criteria_results", [])],
            overall_met=result.get("overall_met", False),
            summary=result.get("summary", ""),
        )
        return {"criteria_evaluation": evaluation}
    except Exception as e:
        logger.error("Criteria evaluation failed: %s", e)
        return {"criteria_evaluation": CriteriaEvaluation(summary=f"Criteria evaluation failed: {e}")}
