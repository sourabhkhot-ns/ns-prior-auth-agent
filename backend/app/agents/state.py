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
from app.models.letter import MedicalNecessityLetter


class AgentState(TypedDict, total=False):
    # Inputs
    raw_pdf_text: str
    order: Order
    input_is_pdf: bool

    # Multi-document inputs
    document_texts: dict[str, str]  # {"order_summary": "...", "physician_notes": "...", ...}
    cross_reference: dict  # Cross-reference findings from document analyzer

    # Enrichment
    test_catalog_entry: TestCatalogEntry | None
    payor_rule: PayorRule | None

    # Agent outputs
    code_evaluation: CodeEvaluation
    criteria_evaluation: CriteriaEvaluation
    gap_report: GapReport

    # Final output
    evaluation: PAEvaluation

    # Letter generation (opt-in)
    generate_letter: bool
    letter_mode: str | None  # "draft" | "placeholder" | "override" | None (auto)
    letter: MedicalNecessityLetter | None
    letter_refusal_reason: str | None

    # Errors
    errors: list[str]
