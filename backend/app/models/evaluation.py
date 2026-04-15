from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class CodeResult(BaseModel):
    code: str
    description: str = ""
    status: str  # ACCEPTED, REJECTED, UNCERTAIN
    reason: str = ""


class CodeEvaluation(BaseModel):
    icd10_results: list[CodeResult] = Field(default_factory=list)
    cpt_results: list[CodeResult] = Field(default_factory=list)
    summary: str = ""


class CriterionResult(BaseModel):
    criterion: str
    met: bool
    evidence: str = ""  # What in the order supports/contradicts this
    notes: str | None = None


class CriteriaEvaluation(BaseModel):
    criteria_results: list[CriterionResult] = Field(default_factory=list)
    overall_met: bool = False
    summary: str = ""


class GapItem(BaseModel):
    requirement: str  # What the payor requires
    status: str  # MISSING, PRESENT, PARTIAL
    detail: str = ""  # Specific description of what's missing


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
