# Prior Auth Agent — System Specification

A comprehensive document covering the domain, the problem, and our end-to-end implementation.

---

## 1. Domain: Prior Authorization for Genomic Testing

### 1.1 What is Prior Authorization?

Prior Authorization (PA) is a utilization management process where a health insurance payor must approve a medical service before it is performed. For genomic/genetic testing:

1. A **clinician** orders a genetic test (WES, WGS, gene panel, etc.)
2. The **lab** receives the order and determines whether PA is required based on the patient's insurance
3. A **PA request** is assembled: clinical documentation, ICD-10 codes, CPT codes, medical necessity justification, genetic counseling notes, provider credentials
4. The request is **submitted** to the payor (fax, portal, or electronic)
5. The payor **reviews** against their coverage policy
6. The payor issues a **determination**: approved, denied, or pend for additional information
7. If denied, the lab may **appeal** with additional documentation

### 1.2 Why It Matters

- **Denial rates for genetic testing are 15–30%** depending on payor and test type
- Each denial costs the lab $50–200 in administrative rework (appeals, resubmission, staff time)
- Turnaround time for PA decisions: 2–15 business days; denials add weeks
- **Most denials are preventable** — they stem from documentation gaps, wrong codes, or missing clinical info that could have been caught before submission

### 1.3 The Upstream Opportunity

Traditional approach: submit the PA, wait, fix problems reactively (appeals, peer-to-peer reviews).

Our approach: **evaluate the order against payor rules at the point of order**, before the PA is ever submitted. Flag mismatches, missing documentation, and medical necessity gaps so the ordering provider can fix them upfront.

This is the "embedded agent" model — the evaluation agent lives in the ordering workflow, not the PA submission workflow.

---

## 2. Payor Landscape

### 2.1 Major US Payors

| Payor | Policy Identifier | Public Source | Scope |
|---|---|---|---|
| **UnitedHealthcare** | 2026T0589Z | [UHC Policy PDF](https://www.uhcprovider.com/content/dam/provider/docs/public/policies/comm-medical-drug/whole-exome-and-whole-genome-sequencing.pdf) | WES/WGS for non-oncology |
| **Aetna** | CPB 0140 | [Aetna CPB 0140](https://www.aetna.com/cpb/medical/data/100_199/0140.html) | Genetic testing (broad) |
| Cigna | Various coverage policies | cigna.com | Similar structure to Aetna |
| BCBS | Varies by state plan | State-specific portals | Each state plan has own policy |
| Humana | Coverage policies | humana.com | Smaller genetic testing footprint |
| Medicare/Medicaid | NCD/LCD determinations | cms.gov | MolDX program for molecular Dx |

### 2.2 Policy Document Structure

Every payor genetic testing policy contains:

- **Accepted CPT codes** — which billing codes are covered
- **Accepted ICD-10 categories** — which diagnoses justify the test
- **Medical necessity criteria** — clinical conditions that must be met
- **Required documentation** — what must accompany the PA request
- **Ordering provider requirements** — who is qualified to order
- **Prior testing requirements** — what tests must have been done first
- **Exclusions** — what is explicitly not covered
- **Effective date and policy version** — policies change; version tracking is essential

### 2.3 UnitedHealthcare — Policy 2026T0589Z

**Scope**: Whole Exome and Whole Genome Sequencing (Non-Oncology Conditions)

**Accepted CPT Codes**:
- 81415, 81416, 81417 (WES — proband, comparison, re-evaluation)
- 81425, 81426, 81427 (WGS — proband, comparison, re-evaluation)
- PLA codes: 0094U, 0212U–0215U, 0260U, 0264U–0267U, 0318U, 0335U, 0336U, 0425U, 0426U, 0454U, 0469U, 0532U, 0567U, 0582U, 0583U

**Medical Necessity Criteria** (must satisfy all):
1. Patient has a suspected genetic condition with clinical features
2. Conventional diagnostic workup (including CMA/karyotype where indicated) has not yielded a diagnosis
3. Test results will directly impact clinical management
4. Genetic counseling has been provided (pre-test)
5. Ordering provider is a clinical geneticist, genetic counselor, or specialist with genetics expertise

**Clinical Presentation Requirements** (ONE of Group A, OR TWO of Group B):

Group A (any one):
- Multiple congenital anomalies affecting 2+ unrelated organ systems
- Moderate-to-severe intellectual disability diagnosed by age 18
- Global developmental delay
- Epileptic encephalopathy with onset before age 3

Group B (any two):
- Congenital anomaly
- Hearing or visual impairment
- Inborn error of metabolism
- Autism spectrum disorder
- Neuropsychiatric condition
- Hypotonia or hypertonia
- Movement disorder
- Unexplained developmental regression
- Growth abnormality (failure to thrive, short stature, macrocephaly)
- Immunologic or hematologic disorder
- Dysmorphic features
- Consanguinity or shared ancestry
- Family member with similar undiagnosed condition

**Required Documentation**:
- Completed requisition form
- Clinical notes documenting the indication
- Genetic counseling note (pre-test)
- Prior testing results (CMA, single-gene, panel — if applicable)
- Insurance verification
- Signed informed consent

**Key Exclusions**:
- Rapid WGS/WES in outpatient settings (unproven)
- Whole transcriptome sequencing
- Optical genome mapping (OGM)
- Reanalysis of WES before 18 months from initial analysis
- Fetal demise evaluation, prenatal cell-free DNA, PGT

### 2.4 Aetna — CPB 0140

**Scope**: Genetic Testing (broad — includes WES, panels, single-gene)

**Accepted CPT Codes** (WES/WGS subset):
- 81415, 81416, 81417 (WES)
- 81425, 81426, 81427 (WGS)
- 0214U, 0215U

**Medical Necessity Criteria**:
1. Clinical features are present, OR the member is at direct risk of inheriting a known mutation
2. Test results will directly impact treatment
3. History, physical exam, pedigree analysis, genetic counseling, and conventional diagnostic studies completed — definitive diagnosis remains uncertain
4. One of the listed diagnoses is suspected
5. Board-certified geneticist consultation required
6. Pre- and post-test genetic counseling by independent provider
7. Alternate etiologies ruled out
8. WES/WGS more efficient than separate targeted tests

**Accepted Clinical Categories**:
- Congenital anomalies affecting unrelated organ systems
- Bilateral sensorineural hearing loss (nonsyndromic)
- Autism spectrum disorder with syndromic features
- Epilepsy — intractable/early-onset, age 21 or under
- Structural/functional abnormality
- Global developmental delay
- Intellectual disability
- Family history suggesting genetic etiology

**Key Differences from UHC**:
- Narrower PLA code acceptance
- More emphasis on pedigree analysis
- Explicit age restrictions for some conditions (epilepsy ≤21)
- Requires board-certified geneticist (stricter than UHC)
- Post-test counseling also required (UHC only requires pre-test)

---

## 3. Code Systems

### 3.1 CPT Codes for Genomic Testing

CPT (Current Procedural Terminology) codes describe the test performed.

| Range | Category | Examples |
|---|---|---|
| 81400–81408 | Molecular pathology Tier 1–2 | Single-gene tests |
| 81410–81411 | Aortic dysfunction panel | Gene panels |
| 81412 | Ashkenazi Jewish carrier panel | Carrier screening |
| 81415–81417 | **Whole Exome Sequencing** | 81415=proband, 81416=comparison (parent), 81417=re-eval |
| 81425–81427 | **Whole Genome Sequencing** | 81425=proband, 81426=comparison, 81427=re-eval |
| 81432–81433 | **Hereditary cancer panels** | 81432=panel sequencing, 81433=dup/del |
| 81435–81436 | Hereditary colon cancer panel | Lynch syndrome |
| 81440 | Nuclear gene panel (mitochondrial) | Mitochondrial disorders |
| 81443 | Genetic testing for severe inherited conditions | Multi-gene panels |
| 81455 | Somatic tumor NGS panel | Oncology (FoundationOne, etc.) |
| 81162 | BRCA1/2 full sequence + del/dup | Breast/ovarian cancer |
| 0094U–0583U | **PLA codes** (Proprietary Lab Analyses) | Lab-specific registered tests |

**PLA codes** are assigned to specific lab/test combinations (e.g., 0094U = a specific lab's WES). Payors map these to generic coverage policies.

### 3.2 ICD-10 Codes

ICD-10-CM codes describe the clinical indication — the "why."

| Range | Category | Use in Genetic Testing |
|---|---|---|
| F70–F79 | Intellectual disability | F79 (unspecified) — WES/WGS indication |
| F80–F89 | Developmental disorders | F84.0 (autism), F88 (other) |
| G40.x | Epilepsy | G40.419 (intractable) — WES indication |
| Q00–Q99 | **Congenital anomalies** | Q21.x (cardiac), Q89.7 (multiple) |
| R62.50 | Failure to thrive | Pediatric WES indication |
| Z13.71 | Genetic screening | Carrier screening |
| Z14.x | Genetic carrier status | CF carrier, sickle cell |
| Z15.01 | Genetic susceptibility to breast cancer | BRCA testing |
| Z80–Z84 | Family history | Z80.3 (breast cancer), Z84.81 (carrier of genetic disease) |
| C50.x | Breast cancer | Oncology panels |
| D80–D89 | Immunodeficiency | Immunologic gene panels |

### 3.3 The Code-Test-Indication Triangle

Every PA request sits at the intersection of three things:

```
         CPT Code (what test)
              ▲
             / \
            /   \
           /     \
ICD-10 Code ──── Clinical Indication
(why this test)     (supporting evidence)
```

If any leg is mismatched — wrong CPT for the lab test, ICD-10 that doesn't justify the CPT, clinical evidence that doesn't support the indication — the PA will be denied.

---

## 4. Common Denial Reasons

Ranked by frequency in genomic testing:

| Rank | Reason | % of Denials | Example |
|---|---|---|---|
| 1 | **Wrong or insufficient ICD-10 codes** | ~30% | Pneumonia codes submitted for WES (developmental delay) |
| 2 | **Missing documentation** | ~25% | No genetic counseling note, no prior testing results |
| 3 | **Medical necessity not met** | ~20% | Clinical presentation doesn't satisfy payor criteria |
| 4 | **Ordering provider not qualified** | ~10% | Pediatrician ordered instead of geneticist/CGC |
| 5 | **Prior testing not completed** | ~8% | Payor requires CMA before WES; not done |
| 6 | **Duplicate/redundant testing** | ~5% | Same gene region already tested |
| 7 | **Experimental/investigational** | ~2% | Whole transcriptome, OGM — not yet accepted |

---

## 5. Regulatory Context

- **GINA (Genetic Information Nondiscrimination Act)** — prohibits health insurers from using genetic information for coverage/premium decisions. Does not apply to life/disability/LTC insurance.
- **State parity laws** — several states mandate coverage of genetic testing for certain conditions (e.g., hereditary cancer). Requirements vary by state.
- **CMS NCD/LCD** — Medicare coverage rules for genetic testing. MolDX program manages molecular diagnostic coverage for several Medicare Administrative Contractors.
- **21st Century Cures Act** — requires interoperability and patient access to health data; affects how PA data flows between systems.
- **AMA Prior Auth Reform** — ongoing advocacy to reduce PA burden. Some states have "gold card" laws exempting high-approval-rate providers from PA.

---

## 6. Industry Context

### 6.1 How Labs Handle PA Today

Labs like Invitae, GeneDx, Ambry Genetics, and Baylor Genetics maintain dedicated PA teams that:
- Review each incoming order against payor policies
- Manually check ICD-10/CPT alignment
- Gather missing documentation from ordering providers
- Submit PA requests via payor portals or fax
- Track status and manage appeals

This is labor-intensive: a single PA can require 30–60 minutes of staff time across multiple touchpoints.

### 6.2 The Numbers

- ~60–80% of genomic test orders require PA (varies by payor and test)
- PA turnaround: 2–15 business days for initial decisions
- Appeal success rate: 40–60% (meaning many initial denials are overturnable with better documentation)
- Average cost per denial: $50–200 in direct administrative cost; $500–2000+ in delayed patient care and lost revenue

### 6.3 The AI Opportunity

Most denials are pattern-matchable: wrong code for this test, missing document that this payor always requires, provider type that doesn't meet this payor's threshold. An agent that knows the rules can catch these before submission — turning a 15% denial rate into a <5% rate.

---

## 7. Our Implementation

### 7.1 Design Principles

| Principle | Rationale |
|---|---|
| **Generic, not lab-specific** | Test catalog and payor rules are configurable seed data. No hardcoded lab logic. |
| **Model-agnostic** | LLM provider set via env var. Swap OpenAI ↔ Groq ↔ Anthropic ↔ local MLX without code changes. |
| **Evaluate, don't recommend** | Flags mismatches in the codes as submitted. Never suggests alternative ICD-10/CPT codes. |
| **Specific gap descriptions** | Never "additional documentation required." Always: what's missing, why the payor requires it, and what would satisfy it. |
| **Upstream, not downstream** | Evaluate at order time, before the PA is filed. Prevent denials, don't appeal them. |

### 7.2 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Language | Python 3.11+ | Core runtime |
| API | FastAPI | REST + SSE streaming |
| Agent Framework | LangGraph | Stateful agent workflow |
| LLM Abstraction | LiteLLM | Model-agnostic (100+ providers) |
| Database | SQLite (dev) / PostgreSQL (prod) | Rules, catalog, evaluation history |
| Frontend | Next.js 15 + Tailwind | Real-time agent pipeline UI |
| PDF Parsing | PyMuPDF | Extract text from uploaded PDFs |
| Async | asyncio | Non-blocking LLM calls, parallel agents |

### 7.3 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend (Next.js + Tailwind)                               │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Intake   │  │  Agent       │  │  Evaluation Result      │ │
│  │  Form     │  │  Pipeline    │  │  (verdict + details)    │ │
│  └──────────┘  └──────────────┘  └─────────────────────────┘ │
│         │              ▲  SSE events        ▲                │
└─────────┼──────────────┼────────────────────┼────────────────┘
          ▼              │                    │
┌──────────────────────────────────────────────────────────────┐
│  Backend (FastAPI + LangGraph)                               │
│                                                              │
│  document_analyzer ─┐                                        │
│  order_parser ──────┼─► enrichment ─► ┌─ code_evaluator ──┐ │
│                     │    (DB lookup)  └─ criteria_evaluator─┤ │
│                     │                                       │ │
│                     │              gap_detector ◄───────────┘ │
│                     │                   │                     │
│                     │              risk_scorer                │
│                     │                   │                     │
│                     │              PAEvaluation               │
│                                                              │
│  ┌────────────┐  ┌──────────┐  ┌───────────────────────┐    │
│  │ SQLite DB   │  │ Seed Data│  │ LiteLLM → any provider│    │
│  └────────────┘  └──────────┘  └───────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 7.4 Agent Pipeline

Six agents. `code_evaluator` and `criteria_evaluator` run **in parallel**.

#### Agent 1: Document Analyzer / Order Parser

- **Input**: 1–4 PDFs (Order Summary, Patient Details, Physician Notes, Test Reports) or a single PDF
- **LLM call**: Yes — largest call (~15–25K input tokens). Extracts a unified `Order` + cross-reference findings from multi-document text
- **Output**: `Order` (Pydantic) + `cross_reference` (inconsistencies, key findings)
- **Why it matters**: This is where model quality matters most. The entire downstream pipeline depends on accurate extraction.

#### Agent 2: Enrichment

- **Input**: `Order.test_code` + `Order.insurance.primary.company_code`
- **LLM call**: No — pure database lookup
- **Output**: `TestCatalogEntry` (CPT mappings) + `PayorRule` (or null)
- **Graceful degradation**: If no rule matches, code/criteria evaluation is skipped; gap detector and risk scorer still run.

#### Agent 3: Code Evaluator (parallel)

- **Input**: Order's ICD-10 + CPT codes + payor's accepted code lists
- **LLM call**: Yes
- **Output**: `CodeEvaluation` — per-code ACCEPTED/REJECTED/REVIEW with reasoning
- **Rule**: Never recommends alternative codes.

#### Agent 4: Criteria Evaluator (parallel)

- **Input**: Full clinical info + payor's medical necessity criteria
- **LLM call**: Yes
- **Output**: `CriteriaEvaluation` — per-criterion **tri-state** (met / partial / not_met) with evidence
- **Why tri-state**: Binary loses nuance. "Partial" = evidence exists but documentation is incomplete — a fixable problem.

#### Agent 5: Gap Detector

- **Input**: Order documents + payor's required doc list + code/criteria summaries
- **LLM call**: Yes
- **Output**: `GapReport` — missing documents and missing clinical info, each with specific detail
- **Depends on 3+4**: Uses their summaries as context (e.g., if a code was rejected, flags the related clinical justification gap).

#### Agent 6: Risk Scorer

- **Input**: All upstream outputs
- **LLM call**: Yes
- **Output**: `PAEvaluation` — denial risk (HIGH/MEDIUM/LOW), summary, prioritized issues with severity/category/description/resolution

### 7.5 Parallel Execution

`code_evaluator` and `criteria_evaluator` are independent — neither reads the other's output. Both fan out from `enrichment`. `gap_detector` joins on both.

Implementation: streaming endpoints use `asyncio.as_completed` to run both concurrently and emit SSE events as each finishes. On Groq (~2s/call) saves ~2s. On local MLX (~30s/call) saves ~30s.

### 7.6 Streaming Protocol (SSE)

| Event | When | Shape |
|---|---|---|
| `upload_status` | Start (docs path) | `{ uploaded: [{type, label}], missing: [{type, label}] }` |
| `pipeline` | Start | `{ agents: [{ id, label, status: "pending" }] }` |
| `agent_update` | Each transition | `{ id, label, status, message? }` |
| `result` | End (success) | Full `PAEvaluation` JSON |
| `error` | End (failure) | `{ message }` |

### 7.7 LLM Tolerance Stack

1. `response_format={"type":"json_object"}` — provider-level JSON mode
2. System prompt suffix: "You MUST respond with valid JSON only."
3. Multi-strategy JSON extraction: direct parse → markdown block → first `{` to last `}`
4. Pydantic `mode="before"` validators: coerce `None` → `""`, `dict` → formatted string, `list` → joined string
5. Qwen3 `/no_think` prefix: prevents reasoning tokens from starving the response
6. Retry with escalating backoff: 3 attempts, 20s/40s/60s delays for rate limits

### 7.8 Observability

Every LLM call logs:
```
[code_evaluator] model=openai/gpt-4o-mini tokens=8100→640 (cached=0, total=8740) cost=$0.001599 latency=2150ms finish=stop
```

Each evaluation emits a summary:
```
[4096116d] SUMMARY calls=5 tokens=41200→5600 (cached=0) cost=$0.012180 wall_llm=14320ms
[4096116d]   └─ document_analyzer    calls=1 tokens=12340→1820 cost=$0.003144 latency=4210ms
[4096116d]   └─ code_evaluator       calls=1 tokens=8100→640  cost=$0.001599 latency=2150ms
...
```

Uses `contextvars` for per-evaluation accumulation across parallel agents.

### 7.9 Model-Agnostic Configuration

```env
LLM_MODEL=openai/gpt-4o-mini              # any LiteLLM-supported model
LLM_API_BASE=                             # optional: OpenAI-compatible endpoint (MLX, vLLM, Ollama)
LLM_TEMPERATURE=0.1
OPENAI_API_KEY=...                        # set the key matching your provider
```

Tested with: OpenAI (gpt-4o, gpt-4o-mini), Groq (llama-3.3-70b, llama-3.1-8b), local MLX (Qwen3-8B).

---

## 8. Data Models

### Order (Input)

```
Order
├── order_id, test_code, test_name
├── Patient (name, DOB, sex, ethnicity, MRN, relatives)
├── Insurance (company, member_id, group_id, auth_number)
├── ClinicalInfo
│   ├── icd10_codes: [{code, description}]
│   ├── indications: [{name, category, custom_value}]
│   ├── genes_of_interest: [str]
│   ├── prior_genetic_testing: bool + details
│   ├── family_history: str
│   └── supplemental_notes, additional_info
├── CareTeam (institution, ordering provider, primary contact)
├── Sample (status, type, collection_date)
└── Documents: [{title, document_type}]
```

### PAEvaluation (Output)

```
PAEvaluation
├── order_id, evaluation_id, timestamp
├── denial_risk: HIGH | MEDIUM | LOW
├── summary: str
├── CodeEvaluation
│   ├── icd10_results: [{code, description, status, reason}]
│   ├── cpt_results: [{code, description, status, reason}]
│   └── summary
├── CriteriaEvaluation
│   ├── criteria_results: [{criterion, met: met|partial|not_met, evidence, notes}]
│   ├── overall_met: bool
│   └── summary
├── GapReport
│   ├── missing_documents: [{requirement, status, detail}]
│   ├── missing_clinical_info: [{requirement, status, detail}]
│   └── summary
└── issues: [{severity, category, description, resolution}]
```

### PayorRule (Configuration)

```
PayorRule
├── payor_name, payor_code, test_category
├── policy_version, effective_date
├── accepted_cpt_codes: [str]
├── accepted_icd10_categories: [str]
├── medical_necessity_criteria: [{description, category, required, group, group_min}]
├── required_documentation: [str]
├── ordering_provider_requirements: [str]
├── prior_testing_requirements: [str]
├── submission_channel, submission_notes
└── exclusions: [str]
```

---

## 9. Seed Data

### Payor Rules (2 seeded)

| File | Payor | Policy | Source |
|---|---|---|---|
| `uhc_wes_wgs.json` | UnitedHealthcare | 2026T0589Z | [PDF](https://www.uhcprovider.com/content/dam/provider/docs/public/policies/comm-medical-drug/whole-exome-and-whole-genome-sequencing.pdf) |
| `aetna_wes_wgs.json` | Aetna | CPB 0140 | [HTML](https://www.aetna.com/cpb/medical/data/100_199/0140.html) |

### Test Catalog (7 entries)

WES (proband, duo, trio), WGS (proband, rapid), panel tests with CPT code mappings.

### Sample Orders (6 cases)

| # | Scenario | Expected Risk | Key Feature |
|---|---|---|---|
| 01 | Trio WES, UHC, complete docs | LOW | Happy path |
| 02 | WGS with pneumonia ICD-10s | HIGH | Wrong codes |
| 03 | Epilepsy WES, missing counseling | MEDIUM | Documentation gap |
| 04 | NICU rapid WGS, acutely ill neonate | LOW | Urgent inpatient |
| 05 | ASD panel, pediatrician ordering | HIGH | Provider not qualified |
| 06 | Hereditary cancer panel (BRCA), Aetna | LOW | Oncology case |

### Sample PDFs (4 documents)

Order Summary, Patient Details, Physician Notes, Test Reports — for the multi-document upload flow.

---

## 10. Frontend

### Intake

Two paths:
- **Documents** — upload 1–4 PDFs. "Load sample dossier" for demo.
- **JSON / Samples** — pick from 6 sample cases, paste JSON, or upload a single PDF.

### Activity View

- **Order context card** — persistent strip: test name, patient initial, payor, order ID
- **Agent pipeline** — agents appear as they start. Parallel agents show "running" simultaneously. Status: spinner → check → error → skip, with summary messages.

### Result View

- **Risk verdict** — bordered card in risk color with headline + summary
- **Issues** — severity-tagged, numbered, with resolutions. Open by default.
- **Code evaluation** — per-code pass/fail
- **Medical necessity** — per-criterion met/partial/not_met
- **Documentation gaps** — per-item present/missing

Light-mode aesthetic. Colors via CSS variables. Monospace for data, sans-serif for UI.

---

## 11. Cost Profile

| Provider | Model | Est. Cost/Eval | Speed |
|---|---|---|---|
| OpenAI | gpt-4o-mini | $0.01–0.02 | ~10–15s |
| OpenAI | gpt-4o | $0.15–0.25 | ~15–25s |
| Groq | llama-3.3-70b | Free (rate-limited) | ~8–12s |
| Groq | llama-3.1-8b | Free (higher RPM) | ~6–10s |
| Local MLX | Qwen3-8B | $0 | ~2–4 min |
| Anthropic | claude-haiku-4-5 | ~$0.01–0.02 | ~10–15s |

---

## 12. Boundaries

### Always
- Evaluate codes as provided — never recommend alternatives
- Provide specific, actionable gap descriptions
- Include reasoning for every finding
- Keep payor rules versioned with effective dates
- Log every evaluation for audit trail

### Never
- Auto-submit PA requests to payors
- Recommend or change ICD-10/CPT codes
- Store patient PII beyond evaluation scope
- Hardcode lab-specific logic

### What This Agent Is Not
- Not a PA submission tool — it evaluates; submission is a separate system
- Not a clinical decision-maker — it's decision support
- Not a guarantee of approval — it checks documented policy requirements

---

## 13. Extending the System

### Add a new payor
1. Obtain the payor's public genetic testing coverage policy
2. Extract: accepted CPT, ICD-10 categories, criteria, required docs, provider requirements, exclusions
3. Create `seed_data/payors/<payor>_<category>.json`
4. Restart server

### Add a new test category
1. Add to `seed_data/catalogs/sample_test_catalog.json` with CPT mappings
2. Create payor rules for the new category
3. Restart server

### Add a new agent
1. Create `app/agents/<name>.py`
2. Add prompts to `app/core/prompts.py`
3. Wire into `graph.py` and both streaming route files
4. Pass `tag="<name>"` to `llm_call_json`
5. Update docs

---

## 14. V1 vs Future

### V1 (This Build)
- Multi-document PDF upload + JSON order input
- 6-agent pipeline with parallel code + criteria evaluation
- UHC + Aetna payor rules seeded
- SSE streaming UI with real-time agent progress
- Per-call and per-evaluation cost/token logging
- Model-agnostic (OpenAI, Groq, Anthropic, local MLX)

### Future Possibilities
- FHIR R4 integration for clinical data pull
- Rules extraction agent (feed payor policy PDF → auto-extract rules as JSON)
- Denial feedback loop (learn from past denials to improve evaluation)
- FHIR PAS / EDI X12 278 electronic submission
- Multi-lab tenant support
- Per-agent model selection (expensive model for document_analyzer, cheap for code_evaluator)
- Prometheus metrics export for cost dashboards
