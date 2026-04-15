"""Enrichment Agent — resolves test catalog + payor rules from DB."""
from __future__ import annotations

import logging
from app.agents.state import AgentState
from app.db.database import async_session
from app.services.catalog_service import get_test_by_code
from app.services.rules_service import find_payor_rule

logger = logging.getLogger(__name__)


async def enrichment_node(state: AgentState) -> dict:
    """Look up test catalog entry and payor rules for this order."""
    order = state.get("order")
    if not order:
        return {"errors": state.get("errors", []) + ["No order data available for enrichment"]}

    errors = list(state.get("errors", []))
    test_entry = None
    payor_rule = None

    async with async_session() as session:
        # Look up test catalog
        test_entry = await get_test_by_code(session, order.test_code)
        if not test_entry:
            logger.warning("Test code %s not found in catalog", order.test_code)
            errors.append(f"Test code {order.test_code} not found in test catalog")

        # Determine test category from catalog entry
        test_category = test_entry.category if test_entry else "WES_WGS"

        # Look up payor rules
        payor_name = ""
        if order.insurance and order.insurance.primary:
            payor_name = order.insurance.primary.company_name
        elif order.insurance and order.insurance.secondary:
            payor_name = order.insurance.secondary.company_name

        if payor_name:
            payor_rule = await find_payor_rule(session, payor_name, test_category)
            if not payor_rule:
                logger.warning("No payor rules found for %s / %s", payor_name, test_category)
                errors.append(f"No payor rules found for '{payor_name}' / test category '{test_category}'")
        else:
            errors.append("No insurance information found on order")

    result = {}
    if test_entry:
        result["test_catalog_entry"] = test_entry
    if payor_rule:
        result["payor_rule"] = payor_rule
    if errors:
        result["errors"] = errors

    return result
