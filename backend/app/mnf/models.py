"""Pydantic models for MNF templates, fields, and drafts."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field, field_validator


FieldType = Literal["text", "textarea", "checkbox", "date", "code", "npi", "phone", "multiselect"]
FieldConfidence = Literal["high", "medium", "low", "manual"]
DraftStatus = Literal["generating", "review", "confirmed", "submitted"]


class FormField(BaseModel):
    field_id: str
    label: str
    field_type: FieldType = "text"
    required: bool = True
    max_length: int | None = None
    options: list[str] | None = None
    data_source_hint: str | None = None
    section: str = ""
    help_text: str | None = None


class FormTemplate(BaseModel):
    template_id: str
    payor_id: str
    payor_name: str
    test_types: list[str]
    version: str
    effective_date: str
    archived_date: str | None = None
    fields: list[FormField]
    justification_field_id: str


class PopulatedField(BaseModel):
    field_id: str
    value: str | bool | list[str] | None = None
    confidence: FieldConfidence = "low"
    source: str = ""  # which part of the order / evaluation this came from
    flag_reason: str | None = None

    @field_validator("source", mode="before")
    @classmethod
    def _default_source(cls, v) -> str:
        return v or ""


class JustificationLayers(BaseModel):
    patient: str = ""
    test: str = ""
    guideline: str = ""
    clinical_utility: str = ""


class GuidelineCitation(BaseModel):
    id: str
    source: str
    title: str
    year: int
    excerpt: str = ""
    key_points: list[str] = Field(default_factory=list)


class DraftForm(BaseModel):
    draft_id: str
    order_id: str
    evaluation_id: str | None = None
    template: FormTemplate
    fields: list[PopulatedField]
    justification_text: str = ""
    justification_layers: JustificationLayers = Field(default_factory=JustificationLayers)
    guidelines_cited: list[GuidelineCitation] = Field(default_factory=list)
    validation_errors: list[str] = Field(default_factory=list)
    flags: list[str] = Field(default_factory=list)
    pending_entry: list[str] = Field(default_factory=list)
    status: DraftStatus = "review"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_by: str | None = None
    confirmed_at: datetime | None = None
