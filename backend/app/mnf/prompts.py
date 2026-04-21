"""Medical necessity justification prompts — 4-layer narrative + weaving.

Ported from the `mnf` reference project (src/justification/prompts.ts) and
adapted to our Order data shape. All prompts produce continuous narrative
text — no JSON, no headers, no bullets.
"""
from __future__ import annotations


MNF_SYSTEM = """You are a clinical documentation specialist for a genetic testing laboratory. You write medical necessity justification narratives for insurance payor medical necessity forms. Your writing must be:

- Clinically accurate and specific to the patient
- Referenced to established clinical guidelines (ACMG, NCCN, etc.)
- Professional and appropriate for insurance review
- Factual — only include information provided to you, never fabricate clinical details
- Focused on connecting the patient's clinical presentation to testing criteria
- Explicit about how test results will change clinical management

Write in third person clinical narrative style. Do not include headers, bullet points, or formatting — write a continuous narrative paragraph."""


PATIENT_LAYER_USER = """Write a concise clinical summary (2-3 sentences) explaining why the following patient needs genetic testing. Focus on their specific clinical presentation and risk factors.

Patient: {patient_name}
Age: {age_str} (DOB: {dob})
Sex: {sex}
{ethnicity_line}

Clinical Indications:
{indications_block}

{family_history_block}
{prior_testing_block}
{provider_notes_block}

Write 2-3 sentences summarizing why this patient's clinical presentation and risk factors warrant genetic testing. Be specific to this patient — do not write generic statements."""


TEST_LAYER_USER = """Write a concise rationale (2-3 sentences) explaining why the following genetic test is appropriate for this clinical situation.

Test Ordered: {test_name}
Test Type: {test_type}
{genes_line}
CPT Codes: {cpt_codes_str}

Clinical Indications:
{indications_block}

Test Information: {test_context}

{prior_testing_note}

Write 2-3 sentences explaining what clinical questions this test answers and why this specific panel/tier is appropriate (not a narrower or broader test)."""


GUIDELINE_LAYER_USER = """Write a concise guideline reference (2-3 sentences) citing clinical guidelines that support genetic testing for this patient's indication.

Test Type: {test_type}
Clinical Indications: {indications_inline}

Relevant Clinical Guidelines:
{guidelines_block}

Write 2-3 sentences citing specific guidelines by name and year that support testing for this indication. Include specific criteria from the guidelines that the patient meets. Do not fabricate guideline references — only cite the guidelines provided above."""


UTILITY_LAYER_USER = """Write a concise clinical utility statement (2-3 sentences) explaining specifically how the results of this genetic test will change this patient's clinical management.

Test: {test_name}
Test Type: {test_type}
Patient Age: {age_str}
Sex: {sex}

Clinical Indications: {indications_inline}

Possible Clinical Actions Based on Results:
{utility_context}

Write 2-3 sentences explaining the SPECIFIC clinical actions that would change based on this test's results. Address:
  1. What changes if a pathogenic variant IS found (e.g., enhanced surveillance, risk-reducing surgery, targeted therapy, cascade testing for family)
  2. What changes if results are negative (e.g., return to average-risk screening, rule out hereditary etiology)
Insurance reviewers look for concrete management changes — vague statements like "results will be useful" are insufficient."""


WEAVING_USER = """Combine the following four components into a single cohesive medical necessity justification narrative.

=== PATIENT-SPECIFIC COMPONENT ===
{patient_layer}

=== TEST-SPECIFIC COMPONENT ===
{test_layer}

=== GUIDELINE REFERENCES ===
{guideline_layer}

=== CLINICAL UTILITY (HOW RESULTS CHANGE MANAGEMENT) ===
{utility_layer}

=== PAYOR INSTRUCTIONS ===
Payor: {payor_name}
Detail Level: {detail_level}
Target Length: approximately {target_word_count} words (content completeness is more important than exact word count)
Preferred Guideline Sources: {preferred_sources}

{emphasis_lines}{notes_line}

Write a single continuous narrative paragraph that naturally integrates all four components. The narrative should flow logically:
  1. Patient presentation and risk factors
  2. Why this specific test is appropriate
  3. Guideline support for testing
  4. How results will change clinical management
Do not use headers, bullet points, or section markers. The result should read as a professional clinical justification ready for insurance review."""


# Test-type context strings injected into the test layer prompt.
TEST_CONTEXTS: dict[str, str] = {
    "wes_wgs": (
        "Whole exome sequencing (WES) and whole genome sequencing (WGS) analyze thousands of "
        "protein-coding genes (WES) or the full genome (WGS) in a single test, enabling diagnosis "
        "of genetic conditions where the clinical presentation is not pathognomonic for a single "
        "syndrome. Diagnostic yield is 25–40% in pediatric populations with congenital anomalies, "
        "developmental delay, intellectual disability, or seizures of unknown etiology. Trio testing "
        "(proband + parents) improves yield and variant interpretation."
    ),
    "WES_WGS": (
        "Whole exome sequencing (WES) and whole genome sequencing (WGS) analyze thousands of "
        "protein-coding genes (WES) or the full genome (WGS) in a single test, enabling diagnosis "
        "of genetic conditions where the clinical presentation is not pathognomonic for a single "
        "syndrome. Diagnostic yield is 25–40% in pediatric populations with congenital anomalies, "
        "developmental delay, intellectual disability, or seizures of unknown etiology. Trio testing "
        "(proband + parents) improves yield and variant interpretation."
    ),
    "hereditary_cancer_panel": (
        "A multi-gene hereditary cancer panel simultaneously analyzes multiple genes associated with "
        "hereditary cancer predisposition syndromes, including hereditary breast and ovarian cancer "
        "(HBOC), Lynch syndrome, and other hereditary cancer syndromes. Results can identify pathogenic "
        "variants that inform cancer surveillance strategies, risk-reducing surgical options, targeted "
        "therapy eligibility, and family cascade testing."
    ),
    "HEREDITARY_CANCER_PANEL": (
        "A multi-gene hereditary cancer panel simultaneously analyzes multiple genes associated with "
        "hereditary cancer predisposition syndromes, including hereditary breast and ovarian cancer "
        "(HBOC), Lynch syndrome, and other hereditary cancer syndromes. Results can identify pathogenic "
        "variants that inform cancer surveillance strategies, risk-reducing surgical options, targeted "
        "therapy eligibility, and family cascade testing."
    ),
}


UTILITY_CONTEXTS: dict[str, str] = {
    "wes_wgs": (
        "  - If pathogenic variant found: targeted therapy (where available), prevention of "
        "the diagnostic odyssey, accurate recurrence-risk counseling for the family, potential for "
        "enrollment in gene-specific clinical trials, discontinuation of empiric workup\n"
        "  - If negative: broader differential including copy-number variants, mitochondrial "
        "disease, and non-genetic etiologies; continued clinical surveillance\n"
        "  - Results directly inform long-term management, family planning, and anticipatory guidance"
    ),
    "WES_WGS": (
        "  - If pathogenic variant found: targeted therapy (where available), prevention of "
        "the diagnostic odyssey, accurate recurrence-risk counseling for the family, potential for "
        "enrollment in gene-specific clinical trials, discontinuation of empiric workup\n"
        "  - If negative: broader differential including copy-number variants, mitochondrial "
        "disease, and non-genetic etiologies; continued clinical surveillance\n"
        "  - Results directly inform long-term management, family planning, and anticipatory guidance"
    ),
    "hereditary_cancer_panel": (
        "  - If pathogenic variant found: enhanced cancer surveillance (e.g., breast MRI, "
        "colonoscopy), risk-reducing surgery options (mastectomy, oophorectomy, colectomy), "
        "targeted therapy eligibility (PARP inhibitors for BRCA+), cascade genetic testing for "
        "at-risk family members\n"
        "  - If negative: may return to average-risk screening protocols, rule out hereditary "
        "cancer predisposition, provide reassurance regarding familial risk\n"
        "  - If VUS found: follow up with variant reclassification over time, no immediate "
        "clinical action change"
    ),
    "HEREDITARY_CANCER_PANEL": (
        "  - If pathogenic variant found: enhanced cancer surveillance (e.g., breast MRI, "
        "colonoscopy), risk-reducing surgery options (mastectomy, oophorectomy, colectomy), "
        "targeted therapy eligibility (PARP inhibitors for BRCA+), cascade genetic testing for "
        "at-risk family members\n"
        "  - If negative: may return to average-risk screening protocols, rule out hereditary "
        "cancer predisposition, provide reassurance regarding familial risk\n"
        "  - If VUS found: follow up with variant reclassification over time, no immediate "
        "clinical action change"
    ),
}
