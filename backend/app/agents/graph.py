"""LangGraph workflow definition — orchestrates the PA evaluation pipeline."""
from __future__ import annotations

from langgraph.graph import StateGraph, END

from app.agents.state import AgentState
from app.agents.order_parser import order_parser_node
from app.agents.enrichment import enrichment_node
from app.agents.code_evaluator import code_evaluator_node
from app.agents.criteria_evaluator import criteria_evaluator_node
from app.agents.gap_detector import gap_detector_node
from app.agents.risk_scorer import risk_scorer_node


def _should_continue_after_parse(state: AgentState) -> str:
    """Route after parsing: continue if we have an order, end if errors."""
    if state.get("order"):
        return "enrichment"
    return "risk_scorer"  # Will produce error evaluation


def _fanout_after_enrichment(state: AgentState) -> list[str] | str:
    """Fan out to parallel evaluators if we have payor rules; otherwise skip to gap detector."""
    if state.get("payor_rule"):
        return ["code_evaluator", "criteria_evaluator"]
    return "gap_detector"


def build_graph() -> StateGraph:
    """Build the PA evaluation LangGraph workflow.

    Flow:
        order_parser → enrichment → [code_evaluator ∥ criteria_evaluator] → gap_detector → risk_scorer

    code_evaluator and criteria_evaluator run concurrently — they don't depend on each other.
    gap_detector waits for both (LangGraph joins on incoming edges).
    """
    graph = StateGraph(AgentState)

    graph.add_node("order_parser", order_parser_node)
    graph.add_node("enrichment", enrichment_node)
    graph.add_node("code_evaluator", code_evaluator_node)
    graph.add_node("criteria_evaluator", criteria_evaluator_node)
    graph.add_node("gap_detector", gap_detector_node)
    graph.add_node("risk_scorer", risk_scorer_node)

    graph.set_entry_point("order_parser")

    # order_parser → enrichment (or risk_scorer on error)
    graph.add_conditional_edges(
        "order_parser",
        _should_continue_after_parse,
        {
            "enrichment": "enrichment",
            "risk_scorer": "risk_scorer",
        },
    )

    # enrichment → parallel [code_evaluator, criteria_evaluator] (or skip to gap_detector)
    graph.add_conditional_edges(
        "enrichment",
        _fanout_after_enrichment,
        ["code_evaluator", "criteria_evaluator", "gap_detector"],
    )

    # Both evaluators fan in to gap_detector; LangGraph waits for both to finish.
    graph.add_edge("code_evaluator", "gap_detector")
    graph.add_edge("criteria_evaluator", "gap_detector")

    graph.add_edge("gap_detector", "risk_scorer")
    graph.add_edge("risk_scorer", END)

    return graph


# Compiled graph — ready to invoke
pa_evaluation_graph = build_graph().compile()
