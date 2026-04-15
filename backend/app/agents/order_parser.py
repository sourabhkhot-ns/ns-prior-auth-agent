"""Order Parser Agent — extracts structured order data from PDF text."""
from __future__ import annotations

import logging
from app.agents.state import AgentState
from app.core.llm import llm_call_json
from app.core.prompts import ORDER_PARSER_SYSTEM, ORDER_PARSER_USER
from app.models.order import Order

logger = logging.getLogger(__name__)


async def order_parser_node(state: AgentState) -> dict:
    """Parse raw PDF text into structured Order. Skipped if order already provided."""
    if state.get("order") and not state.get("input_is_pdf"):
        logger.info("Order already structured, skipping parser")
        return {}

    raw_text = state.get("raw_pdf_text", "")
    if not raw_text:
        return {"errors": state.get("errors", []) + ["No PDF text or order data provided"]}

    logger.info("Parsing order from PDF text (%d chars)", len(raw_text))

    try:
        result = await llm_call_json(
            system_prompt=ORDER_PARSER_SYSTEM,
            user_prompt=ORDER_PARSER_USER.format(document_text=raw_text),
        )
        order = Order.model_validate(result)
        return {"order": order}
    except Exception as e:
        logger.error("Order parsing failed: %s", e)
        return {"errors": state.get("errors", []) + [f"Order parsing failed: {e}"]}
