from __future__ import annotations

from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator


def _coerce_met(v: object) -> str:
    """Coerce LLM responses to tri-state: 'met', 'partial', 'not_met'."""
    if isinstance(v, bool):
        return "met" if v else "not_met"
    if isinstance(v, str):
        low = v.lower().strip()
        if low in ("true", "yes", "1", "met"):
            return "met"
        if low in ("partial", "partially", "partially met", "partial met"):
            return "partial"
        return "not_met"
    return "met" if v else "not_met"


def _coerce_bool(v: object) -> bool:
    """Coerce LLM responses to bool."""
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.lower().strip() in ("true", "yes", "1", "met")
    return bool(v)


class CodeResult(BaseModel):
    code: str = ""
    description: str = ""
    status: str = "UNCERTAIN"  # ACCEPTED, REJECTED, UNCERTAIN
    reason: str = ""

    @field_validator("code", "description", "reason", mode="before")
    @classmethod
    def default_str(cls, v: str | None) -> str:
        return v or ""


class CodeEvaluation(BaseModel):
    icd10_results: list[CodeResult] = Field(default_factory=list)
    cpt_results: list[CodeResult] = Field(default_factory=list)
    summary: str = ""


class CriterionResult(BaseModel):
    criterion: str = ""
    met: str = "not_met"  # tri-state: "met", "partial", "not_met"
    evidence: str = ""
    notes: str | None = None

    @field_validator("met", mode="before")
    @classmethod
    def coerce_met(cls, v: object) -> str:
        return _coerce_met(v)

    @field_validator("criterion", "evidence", mode="before")
    @classmethod
    def default_str(cls, v: str | None) -> str:
        return v or ""


class CriteriaEvaluation(BaseModel):
    criteria_results: list[CriterionResult] = Field(default_factory=list)
    overall_met: bool = False
    summary: str = ""

    @field_validator("overall_met", mode="before")
    @classmethod
    def coerce_overall_met(cls, v: object) -> bool:
        return _coerce_bool(v)


class GapItem(BaseModel):
    requirement: str = ""
    status: str = "MISSING"  # MISSING, PRESENT, PARTIAL
    detail: str = ""

    @field_validator("requirement", "detail", mode="before")
    @classmethod
    def default_str(cls, v: str | None) -> str:
        return v or ""


class GapReport(BaseModel):
    missing_documents: list[GapItem] = Field(default_factory=list)
    missing_clinical_info: list[GapItem] = Field(default_factory=list)
    summary: str = ""


class Issue(BaseModel):
    severity: str = "WARNING"
    category: str = "OTHER"
    description: str = ""
    resolution: str = ""

    @field_validator("severity", "category", "description", "resolution", mode="before")
    @classmethod
    def default_str(cls, v: str | None) -> str:
        return v or ""


class PAEvaluation(BaseModel):
    order_id: str
    evaluation_id: str = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    denial_risk: str = ""
    summary: str = ""

    code_evaluation: CodeEvaluation = Field(default_factory=CodeEvaluation)
    criteria_evaluation: CriteriaEvaluation = Field(default_factory=CriteriaEvaluation)
    gap_report: GapReport = Field(default_factory=GapReport)

    issues: list[Issue] = Field(default_factory=list)
