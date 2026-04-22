"""Field mapper — populates template fields from an Order + catalog entry."""
from __future__ import annotations

import logging
from typing import Any

from app.models.catalog import TestCatalogEntry
from app.models.order import Order
from app.mnf.models import FormTemplate, PopulatedField

logger = logging.getLogger(__name__)


def _resolve(order: Order, test_entry: TestCatalogEntry | None, field_id: str) -> tuple[Any, str, str]:
    """Return (value, source, confidence) for a given field_id.

    Returns (None, source, "low") when the value can't be derived — the
    caller will flag it as manual.
    """
    p = order.patient
    ins = order.insurance.primary if order.insurance and order.insurance.primary else None
    ct = order.care_team
    ci = order.clinical_info
    s = order.sample

    icd_codes = [c.code for c in ci.icd10_codes]
    icd_descs = [f"{c.code}: {c.description}" for c in ci.icd10_codes]

    # Patient / member basics
    if field_id in ("member_name_last", "patient_name_last"):
        return p.last_name, "order.patient.last_name", "high"
    if field_id in ("member_name_first", "patient_name_first"):
        return p.first_name, "order.patient.first_name", "high"
    if field_id == "patient_name":
        return f"{p.first_name} {p.last_name}".strip(), "order.patient", "high"
    if field_id in ("member_dob", "patient_dob"):
        return p.date_of_birth.isoformat() if p.date_of_birth else None, "order.patient.date_of_birth", "high" if p.date_of_birth else "low"
    if field_id in ("member_sex", "patient_sex"):
        return p.sex, "order.patient.sex", "high"
    if field_id == "patient_ethnicity":
        if p.ethnicity:
            return ", ".join(p.ethnicity), "order.patient.ethnicity", "high"
        return None, "order.patient.ethnicity", "low"

    # Insurance
    if field_id == "member_id":
        return (ins.member_id if ins else None), "order.insurance.primary.member_id", "high" if ins and ins.member_id else "low"
    if field_id == "group_number":
        return (ins.group_id if ins else None), "order.insurance.primary.group_id", "high" if ins and ins.group_id else "low"
    if field_id == "prior_auth_number":
        return (ins.authorization_number if ins else None), "order.insurance.primary.authorization_number", "high" if ins and ins.authorization_number else "low"

    # Provider
    if field_id in ("provider_name", "ordering_provider_name"):
        name = f"{ct.ordering_provider_first_name} {ct.ordering_provider_last_name}".strip()
        return name or None, "order.care_team.ordering_provider", "high" if name else "low"
    if field_id in ("institution", "practice_name"):
        return ct.institution_name or None, "order.care_team.institution_name", "high" if ct.institution_name else "low"
    if field_id == "provider_phone":
        return ct.ordering_provider_phone, "order.care_team.ordering_provider_phone", "high" if ct.ordering_provider_phone else "low"
    if field_id in ("provider_specialty", "provider_npi", "referring_provider_name", "referring_provider_npi", "lab_clia_number", "lab_name"):
        # Not in our Order model — needs manual entry
        return None, f"manual:{field_id}", "manual"

    # Test info
    if field_id == "test_name":
        return (test_entry.test_name if test_entry else order.test_name) or order.test_code, "test_catalog.test_name", "high"
    if field_id == "test_type":
        if test_entry and test_entry.category:
            return test_entry.category, "test_catalog.category", "high"
        return None, "test_catalog.category", "low"
    if field_id == "cpt_codes":
        codes = test_entry.cpt_codes if test_entry else []
        return codes, "test_catalog.cpt_codes", "high" if codes else "low"
    if field_id == "specimen_type":
        return s.sample_type or None, "order.sample.sample_type", "high" if s.sample_type else "low"
    if field_id == "collection_date":
        return s.collection_date.isoformat() if s.collection_date else None, "order.sample.collection_date", "high" if s.collection_date else "low"
    if field_id == "gene_panel_detail":
        if ci.genes_of_interest:
            return ", ".join(ci.genes_of_interest), "order.clinical_info.genes_of_interest", "high"
        return None, "order.clinical_info.genes_of_interest", "low"

    # Clinical indications
    if field_id == "icd10_primary":
        return (icd_codes[0] if icd_codes else None), "order.clinical_info.icd10_codes[0]", "high" if icd_codes else "low"
    if field_id == "icd10_secondary":
        return icd_codes[1:], "order.clinical_info.icd10_codes[1:]", "high"
    if field_id == "icd10_codes":
        return icd_codes, "order.clinical_info.icd10_codes", "high" if icd_codes else "low"
    if field_id == "clinical_indications":
        lines: list[str] = []
        if icd_descs:
            lines.append("ICD-10: " + "; ".join(icd_descs))
        if ci.indications:
            ind_labels = []
            for ind in ci.indications:
                lbl = ind.name
                if ind.category:
                    lbl += f" ({ind.category})"
                ind_labels.append(lbl)
            lines.append("Indications: " + "; ".join(ind_labels))
        if ci.supplemental_notes:
            lines.append(ci.supplemental_notes)
        return "\n".join(lines) or None, "order.clinical_info", "high" if lines else "low"
    if field_id == "family_history":
        return ci.family_history, "order.clinical_info.family_history", "high" if ci.family_history else "low"
    if field_id == "prior_testing":
        if ci.prior_genetic_testing and ci.prior_testing_details:
            return ci.prior_testing_details, "order.clinical_info.prior_testing_details", "high"
        if ci.prior_genetic_testing:
            return "Prior genetic testing performed — details not recorded.", "order.clinical_info.prior_genetic_testing", "medium"
        return None, "order.clinical_info.prior_genetic_testing", "low"
    if field_id == "urgency":
        if ci.is_inpatient:
            return "URGENT - Inpatient", "order.clinical_info.is_inpatient", "high"
        return None, "order.clinical_info.is_inpatient", "low"

    # Documents / checkboxes
    if field_id == "genetic_counseling_completed":
        has = _has_doc(order, ["genetic counseling", "counseling"])
        return has, "order.documents", "high" if has else "low"
    if field_id == "post_test_counseling_planned":
        return None, "manual:post_test_counseling_planned", "manual"
    if field_id == "informed_consent":
        has = _has_doc(order, ["consent"]) or bool(order.consents)
        return has, "order.consents|documents", "high" if has else "low"
    if field_id == "clinical_notes_attached":
        has = _has_doc(order, ["physician notes", "clinical notes", "clinical"])
        return has, "order.documents", "high" if has else "low"
    if field_id == "prior_testing_results_attached":
        has = _has_doc(order, ["test reports", "prior testing", "results"])
        return has, "order.documents", "high" if has else "low"
    if field_id == "consent_genetic_testing":
        return bool(order.consents), "order.consents", "high" if order.consents else "low"
    if field_id == "consent_incidental_findings":
        return None, "manual:consent_incidental_findings", "manual"

    # Narrative + attestation — filled by the generator / reviewer
    if field_id in ("medical_necessity_narrative", "clinical_justification"):
        return None, "generator:justification", "manual"
    if field_id == "planned_management_if_positive":
        return None, "manual:planned_management", "manual"
    if field_id == "physician_signature":
        return None, "manual:signature", "manual"
    if field_id == "signature_date":
        return None, "manual:signature_date", "manual"
    if field_id == "likelihood_pathogenic":
        return None, "manual:likelihood_pathogenic", "manual"

    return None, "unknown", "manual"


def _has_doc(order: Order, needles: list[str]) -> bool:
    """Check if the order has a document whose title or type contains any of the needles."""
    for d in order.documents:
        hay = f"{d.title} {d.document_type}".lower()
        if any(n.lower() in hay for n in needles):
            return True
    return False


def map_fields(
    order: Order,
    template: FormTemplate,
    test_entry: TestCatalogEntry | None,
) -> list[PopulatedField]:
    """Populate every field in the template from the order + catalog entry."""
    out: list[PopulatedField] = []
    for f in template.fields:
        value, source, confidence = _resolve(order, test_entry, f.field_id)

        flag: str | None = None
        # Checkbox-style boolean values that came back False: flag for review
        if f.field_type == "checkbox" and value is False:
            flag = f"'{f.label}' not confirmed in source data — verify with provider"
        if f.required and (value is None or (isinstance(value, str) and not value.strip()) or (isinstance(value, list) and not value)):
            if confidence == "manual":
                flag = flag or f"'{f.label}' requires manual entry"
            else:
                flag = flag or f"'{f.label}' missing in source data"
        out.append(PopulatedField(
            field_id=f.field_id,
            value=value,
            confidence=confidence,
            source=source,
            flag_reason=flag,
        ))
    return out
