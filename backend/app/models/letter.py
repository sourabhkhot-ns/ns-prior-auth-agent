from __future__ import annotations

from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator


class KnownIssue(BaseModel):
    severity: str = "WARNING"
    category: str = "OTHER"
    description: str = ""

    @field_validator("severity", "category", "description", mode="before")
    @classmethod
    def default_str(cls, v: str | None) -> str:
        return v or ""


class MedicalNecessityLetter(BaseModel):
    mode: str = "draft"  # "draft" | "placeholder" | "override"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    payor_name: str = ""
    policy_id: str = ""
    policy_version: str = ""

    patient_name: str = ""
    test_name: str = ""
    cpt_codes: list[str] = Field(default_factory=list)
    icd10_codes: list[str] = Field(default_factory=list)
    ordering_provider: str = ""
    institution: str = ""

    introduction: str = ""
    clinical_summary: str = ""
    medical_necessity_justification: str = ""
    supporting_documentation: list[str] = Field(default_factory=list)
    conclusion: str = ""

    known_issues: list[KnownIssue] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

    body_markdown: str = ""

    @field_validator(
        "payor_name", "policy_id", "policy_version",
        "patient_name", "test_name", "ordering_provider", "institution",
        "introduction", "clinical_summary", "medical_necessity_justification",
        "conclusion", "body_markdown",
        mode="before",
    )
    @classmethod
    def default_str(cls, v) -> str:
        if v is None:
            return ""
        if isinstance(v, str):
            return v
        if isinstance(v, (list, dict)):
            return str(v)
        return str(v)
