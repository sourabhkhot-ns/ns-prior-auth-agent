from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, field_validator


def _coerce_bool(v: object) -> bool:
    """Coerce LLM responses like 'partially', 'yes', 'no' to bool."""
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.lower() in ("true", "yes", "1", "met")
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
    met: bool = False
    evidence: str = ""
    notes: str | None = None

    @field_validator("met", mode="before")
    @classmethod
    def coerce_met(cls, v: object) -> bool:
        return _coerce_bool(v)

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
    severity: str  # CRITICAL, WARNING, INFO
    category: str  # CODE_MISMATCH, MISSING_DOC, CRITERIA_NOT_MET, PROVIDER_ISSUE
    description: str
    resolution: str = ""


class PAEvaluation(BaseModel):
    order_id: str
    evaluation_id: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Overall
    denial_risk: str = ""  # HIGH, MEDIUM, LOW
    summary: str = ""

    # Detail sections
    code_evaluation: CodeEvaluation = Field(default_factory=CodeEvaluation)
    criteria_evaluation: CriteriaEvaluation = Field(default_factory=CriteriaEvaluation)
    gap_report: GapReport = Field(default_factory=GapReport)

    # Actionable
    issues: list[Issue] = Field(default_factory=list)
