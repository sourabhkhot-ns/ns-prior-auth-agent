"""Standalone letter-generation endpoint for regenerating / remoding an existing evaluation."""
from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.letter_generator import letter_generator_node
from app.agents.state import AgentState
from app.core.llm import start_usage_tracking, end_usage_tracking
from app.db.database import async_session
from app.services.catalog_service import get_test_by_code
from app.services.rules_service import find_payor_rule
from app.models.evaluation import PAEvaluation
from app.models.letter import MedicalNecessityLetter
from app.models.order import Order

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["letter"])


class LetterRequest(BaseModel):
    order: Order
    evaluation: PAEvaluation
    letter_mode: str | None = None  # "draft" | "placeholder" | "override" | None


class LetterResponse(BaseModel):
    letter: MedicalNecessityLetter | None = None
    refusal_reason: str | None = None


@router.post("/letter", response_model=LetterResponse)
async def generate_letter(request: LetterRequest) -> LetterResponse:
    """Generate a medical necessity letter from an existing Order + PAEvaluation.

    Useful for:
    - Regenerating the letter in a different mode (e.g. draft → override)
    - Generating a letter for an evaluation that was run without `generate_letter=true`
    """
    # Look up test catalog + payor rule fresh from the DB so the letter is self-contained.
    async with async_session() as session:
        test_entry = await get_test_by_code(session, request.order.test_code)
        payor_name = ""
        if request.order.insurance and request.order.insurance.primary:
            payor_name = request.order.insurance.primary.company_name
        elif request.order.insurance and request.order.insurance.secondary:
            payor_name = request.order.insurance.secondary.company_name

        payor_rule = None
        if payor_name:
            test_category = test_entry.category if test_entry else "WES_WGS"
            payor_rule = await find_payor_rule(session, payor_name, test_category)

    if not payor_rule:
        raise HTTPException(
            status_code=400,
            detail="No payor rule found for this order — cannot generate letter without policy context.",
        )

    state: AgentState = {
        "order": request.order,
        "evaluation": request.evaluation,
        "test_catalog_entry": test_entry,
        "payor_rule": payor_rule,
        "criteria_evaluation": request.evaluation.criteria_evaluation,
        "letter_mode": request.letter_mode,
        "generate_letter": True,
        "errors": [],
    }

    start_usage_tracking()
    try:
        result = await letter_generator_node(state)
    finally:
        end_usage_tracking(eval_tag=(request.evaluation.evaluation_id or "regen")[:8])

    return LetterResponse(
        letter=result.get("letter"),
        refusal_reason=result.get("letter_refusal_reason"),
    )
