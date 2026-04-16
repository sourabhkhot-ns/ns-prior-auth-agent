from __future__ import annotations

from datetime import date
from pydantic import BaseModel, Field, field_validator


class ICD10Code(BaseModel):
    code: str
    description: str = ""

    @field_validator("description", mode="before")
    @classmethod
    def default_description(cls, v: str | None) -> str:
        return v or ""


class Indication(BaseModel):
    name: str
    category: str = ""
    custom_value: str | None = None


class Document(BaseModel):
    title: str = ""
    document_type: str = ""

    @field_validator("title", "document_type", mode="before")
    @classmethod
    def default_str(cls, v: str | None) -> str:
        return v or ""


class Relative(BaseModel):
    relationship: str = ""
    first_name: str = ""
    last_name: str = ""
    date_of_birth: date | None = None
    sex: str | None = None
    medical_record_number: str | None = None
    test_codes: list[str] = Field(default_factory=list)
    sample_status: str | None = None


class Patient(BaseModel):
    first_name: str
    last_name: str
    middle_name: str | None = None
    date_of_birth: date
    sex: str
    ethnicity: list[str] = Field(default_factory=list)
    medical_record_number: str = ""
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    preferred_language: str = "ENGLISH"
    relatives: list[Relative] = Field(default_factory=list)


class InsuranceDetail(BaseModel):
    company_name: str
    company_code: str | None = None
    member_id: str = ""
    group_id: str = ""
    authorization_number: str | None = None
    relationship: str = "SELF"
    type: str = "PRIMARY"


class Insurance(BaseModel):
    payment_method: str = "INSURANCE"
    insurance_type: str = "COMMERCIAL"
    primary: InsuranceDetail | None = None
    secondary: InsuranceDetail | None = None


class ClinicalInfo(BaseModel):
    icd10_codes: list[ICD10Code] = Field(default_factory=list)
    indications: list[Indication] = Field(default_factory=list)
    genes_of_interest: list[str] = Field(default_factory=list)
    prior_genetic_testing: bool = False
    prior_testing_details: str | None = None
    supplemental_notes: str | None = None
    is_inpatient: bool = False
    family_history: str | None = None
    additional_info: str | None = None

    @field_validator(
        "prior_testing_details", "supplemental_notes",
        "family_history", "additional_info",
        mode="before",
    )
    @classmethod
    def _coerce_to_str(cls, v):
        """LLMs sometimes return structured dicts/lists for narrative fields — flatten to text."""
        if v is None or isinstance(v, str):
            return v
        if isinstance(v, dict):
            return "; ".join(f"{k}: {val}" for k, val in v.items() if val)
        if isinstance(v, list):
            return "; ".join(str(item) for item in v if item)
        return str(v)


class CareTeam(BaseModel):
    institution_name: str = ""
    institution_code: str = ""
    ordering_provider_first_name: str = ""
    ordering_provider_last_name: str = ""
    ordering_provider_email: str | None = None
    ordering_provider_phone: str | None = None
    primary_contact_first_name: str | None = None
    primary_contact_last_name: str | None = None

    @field_validator(
        "institution_name", "institution_code",
        "ordering_provider_first_name", "ordering_provider_last_name",
        mode="before",
    )
    @classmethod
    def _coerce_str(cls, v: str | None) -> str:
        return v or ""


class SampleInfo(BaseModel):
    status: str = ""
    sample_type: str = ""
    collection_date: date | None = None


class Order(BaseModel):
    order_id: str = ""
    test_code: str
    test_name: str | None = None

    patient: Patient
    insurance: Insurance = Field(default_factory=Insurance)
    clinical_info: ClinicalInfo = Field(default_factory=ClinicalInfo)
    care_team: CareTeam = Field(default_factory=CareTeam)
    sample: SampleInfo = Field(default_factory=SampleInfo)
    documents: list[Document] = Field(default_factory=list)
    consents: list[dict] = Field(default_factory=list)

    @field_validator("order_id", mode="before")
    @classmethod
    def default_order_id(cls, v: str | None) -> str:
        return v or ""
