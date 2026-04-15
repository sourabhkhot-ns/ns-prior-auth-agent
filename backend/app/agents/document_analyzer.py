"""Document Analyzer Agent — extracts and cross-references data from multiple PA documents."""
from __future__ import annotations

import logging
from app.agents.state import AgentState
from app.core.llm import llm_call_json
from app.models.order import Order

logger = logging.getLogger(__name__)

DOCUMENT_ANALYZER_SYSTEM = """You are a medical document analysis agent for genomics/diagnostic laboratory prior authorization. You receive text extracted from multiple documents that form a PA submission package.

Your job is to:
1. Extract structured order data from all documents combined
2. Cross-reference data across documents — flag any inconsistencies (e.g., different ICD-10 codes in order summary vs physician notes, mismatched patient names or DOBs)
3. Note which documents were provided and what each contributes

Documents you may receive:
- ORDER_SUMMARY: The core lab order — patient info, test, insurance, ICD-10 codes, clinical indications
- PATIENT_DETAILS: Detailed demographics, insurance, diagnosis codes, clinical summary, family history
- PHYSICIAN_NOTES: Medical necessity justification, genetic counseling notes, attestation, prior auth status
- TEST_REPORTS: Pathology reports, somatic NGS results, prior genetic testing, QC metrics

Return valid JSON with two sections:

{
  "order": {
    "order_id": "",
    "test_code": "",
    "test_name": "",
    "patient": {
      "first_name": "",
      "last_name": "",
      "middle_name": null,
      "date_of_birth": "YYYY-MM-DD",
      "sex": "Male|Female",
      "ethnicity": [],
      "medical_record_number": "",
      "email": null,
      "phone": null,
      "address": null,
      "relatives": []
    },
    "insurance": {
      "payment_method": "INSURANCE",
      "insurance_type": "COMMERCIAL|MEDICARE|MEDICAID",
      "primary": {
        "company_name": "",
        "member_id": "",
        "group_id": "",
        "authorization_number": null,
        "relationship": "SELF",
        "type": "PRIMARY"
      },
      "secondary": null
    },
    "clinical_info": {
      "icd10_codes": [{"code": "", "description": ""}],
      "indications": [{"name": "", "category": "", "custom_value": null}],
      "genes_of_interest": [],
      "prior_genetic_testing": false,
      "prior_testing_details": null,
      "supplemental_notes": null,
      "is_inpatient": false,
      "family_history": null,
      "additional_info": null
    },
    "care_team": {
      "institution_name": "",
      "institution_code": "",
      "ordering_provider_first_name": "",
      "ordering_provider_last_name": ""
    },
    "sample": {
      "status": "",
      "sample_type": "",
      "collection_date": null
    },
    "documents": [{"title": "", "document_type": ""}]
  },
  "cross_reference": {
    "inconsistencies": [
      {"field": "field name", "source_a": "doc + value", "source_b": "doc + value", "severity": "WARNING|CRITICAL"}
    ],
    "documents_provided": ["ORDER_SUMMARY", "PHYSICIAN_NOTES"],
    "documents_missing": ["PATIENT_DETAILS", "TEST_REPORTS"],
    "key_findings": [
      "Physician notes confirm pre-test genetic counseling by certified CGC",
      "Test reports show prior somatic panel completed with actionable findings"
    ]
  }
}

IMPORTANT:
- Merge information from all documents into a single comprehensive order
- When documents have overlapping data, prefer the most specific/detailed source
- For ICD-10 codes, include ALL codes from ALL documents (deduplicated)
- For clinical info, combine supplemental notes from all sources
- Flag any inconsistencies between documents (different DOBs, conflicting diagnoses, etc.)
- Note what each document contributes that others don't"""

DOCUMENT_ANALYZER_USER = """Analyze the following documents from a PA submission package:

{documents_text}

Extract a unified order and cross-reference all documents."""


async def document_analyzer_node(state: AgentState) -> dict:
    """Analyze multiple uploaded documents and extract unified order data."""
    doc_texts = state.get("document_texts", {})

    if not doc_texts:
        return {"errors": state.get("errors", []) + ["No documents provided"]}

    # Format documents for the LLM
    formatted = ""
    for doc_type, text in doc_texts.items():
        formatted += f"\n\n===== {doc_type.upper()} =====\n{text}\n"

    logger.info("Analyzing %d documents (%d chars total)",
                len(doc_texts), len(formatted))

    try:
        result = await llm_call_json(
            system_prompt=DOCUMENT_ANALYZER_SYSTEM,
            user_prompt=DOCUMENT_ANALYZER_USER.format(documents_text=formatted),
        )

        order_data = result.get("order", {})
        cross_ref = result.get("cross_reference", {})

        # Add document metadata to the order
        docs_provided = cross_ref.get("documents_provided", list(doc_texts.keys()))
        docs_missing = cross_ref.get("documents_missing", [])
        for doc_name in docs_provided:
            if not any(d.get("document_type") == doc_name for d in order_data.get("documents", [])):
                order_data.setdefault("documents", []).append({
                    "title": f"{doc_name}.pdf",
                    "document_type": doc_name,
                })

        order = Order.model_validate(order_data)

        # Store cross-reference findings in clinical_info.additional_info
        findings = cross_ref.get("key_findings", [])
        inconsistencies = cross_ref.get("inconsistencies", [])

        extra_notes = []
        if findings:
            extra_notes.append("Cross-reference findings: " + "; ".join(findings))
        if inconsistencies:
            extra_notes.append("Inconsistencies found: " + "; ".join(
                f"{i['field']}: {i['source_a']} vs {i['source_b']}" for i in inconsistencies
            ))
        if docs_missing:
            extra_notes.append("Missing documents: " + ", ".join(docs_missing))

        if extra_notes:
            existing = order.clinical_info.additional_info or ""
            order.clinical_info.additional_info = (existing + "\n" + "\n".join(extra_notes)).strip()

        return {
            "order": order,
            "cross_reference": cross_ref,
        }
    except Exception as e:
        logger.error("Document analysis failed: %s", e)
        return {"errors": state.get("errors", []) + [f"Document analysis failed: {e}"]}
