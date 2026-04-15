from __future__ import annotations

from datetime import date
from pydantic import BaseModel, Field


class Criterion(BaseModel):
    description: str
    category: str  # CLINICAL_PRESENTATION, AGE, PROVIDER, PRIOR_TESTING, etc.
    required: bool = True  # Must meet vs. supporting
    group: str | None = None  # For "meet X of Y" logic (e.g., "GROUP_A")
    group_min_required: int | None = None  # Minimum criteria from this group


class PayorRule(BaseModel):
    payor_name: str
    payor_code: str
    test_category: str  # WES, WGS, Hereditary Cancer Panel, etc.
    policy_version: str = ""
    effective_date: date | None = None

    # What the payor accepts
    accepted_cpt_codes: list[str] = Field(default_factory=list)
    accepted_icd10_categories: list[str] = Field(default_factory=list)

    # Requirements
    medical_necessity_criteria: list[Criterion] = Field(default_factory=list)
    required_documentation: list[str] = Field(default_factory=list)
    ordering_provider_requirements: list[str] = Field(default_factory=list)
    prior_testing_requirements: list[str] = Field(default_factory=list)

    # Submission
    submission_channel: str = ""  # FHIR_PAS, EDI_X12_278, PORTAL
    submission_notes: str | None = None

    # Exclusions
    exclusions: list[str] = Field(default_factory=list)
