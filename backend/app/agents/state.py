"""Shared state for the LangGraph agent workflow."""
from __future__ import annotations

from typing import TypedDict
from app.models.order import Order
from app.models.catalog import TestCatalogEntry
from app.models.rules import PayorRule
from app.models.evaluation import (
    CodeEvaluation,
    CriteriaEvaluation,
    GapReport,
    PAEvaluation,
)


class AgentState(TypedDict, total=False):
    # Inputs
    raw_pdf_text: str
    order: Order
    input_is_pdf: bool

    # Enrichment
    test_catalog_entry: TestCatalogEntry | None
    payor_rule: PayorRule | None

    # Agent outputs
    code_evaluation: CodeEvaluation
    criteria_evaluation: CriteriaEvaluation
    gap_report: GapReport

    # Final output
    evaluation: PAEvaluation

    # Errors
    errors: list[str]
