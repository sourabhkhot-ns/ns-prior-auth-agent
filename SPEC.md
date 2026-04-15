# Prior Authorization Agent — Specification

## 1. Objective

Build a **generic, model-agnostic Prior Authorization (PA) evaluation agent** for genomics/diagnostic laboratories. The agent evaluates test orders against payor-specific rules at the point of order — before submission — to detect documentation gaps, code mismatches, and denial risks.

### Target Users
- Lab billing teams
- Genetic counselors
- Revenue cycle management (RCM) teams

### Core Value Proposition
Every gap caught at order time is a denial that doesn't happen. The agent moves PA evaluation upstream — from post-submission (reactive) to pre-submission (pre-emptive).

### Design Constraints
- **Lab-agnostic**: Any lab can configure their test catalog and payor rules. Not hardcoded to any specific lab.
- **Model-agnostic**: LLM provider is swappable via configuration (Claude, GPT, Gemini, Mistral, Llama, etc.).
- **Platform-agnostic**: Runs anywhere — local, AWS, GCP, Azure, on-prem. No cloud vendor lock-in.
- **Fully agentic**: Multi-agent architecture with defined roles, orchestrated via LangGraph.

---

## 2. Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Language | Python 3.11+ | Core runtime |
| API | FastAPI | REST API with OpenAPI docs |
| Agent Framework | LangGraph | Stateful agent workflow orchestration |
| LLM Abstraction | LiteLLM | Model-agnostic LLM calls (100+ providers) |
| Database | PostgreSQL (prod) / SQLite (dev) | Payor rules, test catalog, evaluation history |
| Async | asyncio | Non-blocking LLM calls and I/O |

### Agent Workflow (LangGraph State Machine)

```
                    ┌─────────────────┐
                    │   START         │
                    │   (Order Input) │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Order Parser   │  ← Extracts structured data from PDF
                    │  Agent          │    (skipped if JSON input)
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Enrichment     │  ← Resolves test code → CPT codes
                    │  Agent          │    from lab's test catalog
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
           ┌──────────────┐  ┌──────────────────┐
           │ Code          │  │ Criteria         │   ← Run in parallel
           │ Evaluator     │  │ Evaluator        │
           │ Agent         │  │ Agent            │
           └──────┬───────┘  └────────┬─────────┘
                  │                   │
                  └────────┬──────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Gap Detector   │  ← Finds missing documentation
                  │  Agent          │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Risk Scorer    │  ← Computes denial risk + final report
                  │  Agent          │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  PA Evaluation  │  ← Final output
                  │  (Output)       │
                  └─────────────────┘
```

### Agent Responsibilities

#### 1. Order Parser Agent
- **Input**: Raw PDF or unstructured order document
- **Output**: Structured order data (same schema as JSON input)
- **Uses LLM**: Yes — to extract fields from unstructured PDFs
- **Skipped**: When input is already structured JSON

#### 2. Enrichment Agent
- **Input**: Structured order data
- **Output**: Enriched order with CPT codes, payor rules context
- **Uses LLM**: No — pure lookup from test catalog and payor rules DB
- **Logic**:
  - Resolve test code → CPT codes from lab's test catalog
  - Resolve payor → applicable rules for this test type
  - Attach both to the order state for downstream agents

#### 3. Code Evaluator Agent
- **Input**: Order (with ICD-10 codes from order) + payor rules (accepted codes)
- **Output**: Code evaluation report
- **Uses LLM**: Yes — to reason about whether provided ICD-10 codes satisfy payor criteria
- **Logic**:
  - Check each ICD-10 code from the order against payor's accepted codes
  - Check CPT codes (from enrichment) against payor's accepted CPT list
  - Flag mismatches with specific reasons
- **Important**: Agent does NOT recommend alternative codes. It evaluates what was provided.

#### 4. Criteria Evaluator Agent
- **Input**: Order (clinical info, indications, patient demographics) + payor rules (medical necessity criteria)
- **Output**: Criteria evaluation report
- **Uses LLM**: Yes — to reason about whether clinical presentation meets payor's medical necessity criteria
- **Logic**:
  - Evaluate clinical indications against payor's required clinical criteria
  - Check ordering provider qualifications against payor requirements
  - Check if prior testing requirements are met
  - Check age/sex/ethnicity criteria if applicable

#### 5. Gap Detector Agent
- **Input**: Full order + payor rules (required documentation) + code evaluation + criteria evaluation
- **Output**: Documentation gap report
- **Uses LLM**: Yes — to produce specific, actionable gap descriptions
- **Logic**:
  - Compare attached documents against payor's required documentation list
  - Identify missing items with specificity (not "additional documentation required" but "this payor requires a genetic counseling note for WES authorization; none is attached")
  - Flag incomplete clinical information

#### 6. Risk Scorer Agent
- **Input**: All upstream evaluations (code, criteria, gaps)
- **Output**: Final PA evaluation with denial risk score
- **Uses LLM**: Yes — to synthesize findings into a coherent report
- **Logic**:
  - Aggregate findings from all evaluators
  - Compute denial risk: HIGH / MEDIUM / LOW
  - Produce ordered list of issues to resolve before submission
  - Generate human-readable summary with reasoning

---

## 3. Data Models

### Order (Input)

```python
class Order:
    order_id: str
    test_code: str
    test_name: str | None

    patient: Patient
    insurance: Insurance
    clinical_info: ClinicalInfo
    care_team: CareTeam
    documents: list[Document]

class Patient:
    first_name: str
    last_name: str
    date_of_birth: date
    sex: str
    ethnicity: list[str]
    medical_record_number: str
    relatives: list[Relative]

class Insurance:
    payment_method: str          # INSURANCE, SELF_PAY
    insurance_type: str          # COMMERCIAL, MEDICARE, MEDICAID
    primary: InsuranceDetail
    secondary: InsuranceDetail | None

class InsuranceDetail:
    company_name: str
    company_code: str | None
    member_id: str
    group_id: str
    authorization_number: str | None

class ClinicalInfo:
    icd10_codes: list[ICD10Code]
    indications: list[Indication]
    genes_of_interest: list[str]
    prior_genetic_testing: bool
    prior_testing_details: str | None
    supplemental_notes: str | None
    is_inpatient: bool
    family_history: str | None

class ICD10Code:
    code: str
    description: str

class Indication:
    name: str
    category: str              # Cancer, Gastrointestinal, Neurological, etc.
    custom_value: str | None

class Document:
    title: str
    document_type: str         # Clinical Information, Insurance Card, ABN, Requisition, etc.
```

### Test Catalog (Configured Per Lab)

```python
class TestCatalogEntry:
    test_code: str
    test_name: str
    cpt_codes: list[str]       # e.g., ["81415x1", "81416x2"]
    description: str
    category: str              # WES, WGS, Panel, etc.
    price: float | None
    turnaround_time: str | None
```

### Payor Rules (Configured Per Lab)

```python
class PayorRule:
    payor_name: str
    payor_code: str
    test_category: str                    # WES, WGS, Hereditary Cancer Panel, etc.
    policy_version: str
    effective_date: date
    
    # What the payor requires
    accepted_cpt_codes: list[str]
    accepted_icd10_categories: list[str]  # Broad categories accepted
    
    medical_necessity_criteria: list[Criterion]
    required_documentation: list[str]
    ordering_provider_requirements: list[str]
    prior_testing_requirements: list[str]
    
    submission_channel: str               # FHIR_PAS, EDI_X12_278, PORTAL
    submission_notes: str | None
    
    # What the payor does NOT cover
    exclusions: list[str]

class Criterion:
    description: str
    category: str                         # CLINICAL_PRESENTATION, AGE, PROVIDER, etc.
    required: bool                        # Must meet vs. supporting
    group: str | None                     # For "meet X of Y" logic (e.g., "GROUP_A")
    group_min_required: int | None        # Minimum from this group
```

### PA Evaluation (Output)

```python
class PAEvaluation:
    order_id: str
    evaluation_id: str
    timestamp: datetime
    
    # Overall
    denial_risk: str                      # HIGH, MEDIUM, LOW
    summary: str                          # Human-readable summary
    
    # Detail sections
    code_evaluation: CodeEvaluation
    criteria_evaluation: CriteriaEvaluation
    gap_report: GapReport
    
    # Actionable
    issues: list[Issue]                   # Ordered by severity

class CodeEvaluation:
    icd10_results: list[CodeResult]
    cpt_results: list[CodeResult]

class CodeResult:
    code: str
    description: str
    status: str                           # ACCEPTED, REJECTED, UNCERTAIN
    reason: str

class CriteriaEvaluation:
    criteria_results: list[CriterionResult]
    overall_met: bool

class CriterionResult:
    criterion: str
    met: bool
    evidence: str                         # What in the order supports/contradicts this
    notes: str | None

class GapReport:
    missing_documents: list[GapItem]
    missing_clinical_info: list[GapItem]
    
class GapItem:
    requirement: str                      # What the payor requires
    status: str                           # MISSING, PRESENT, PARTIAL
    detail: str                           # Specific description of what's missing

class Issue:
    severity: str                         # CRITICAL, WARNING, INFO
    category: str                         # CODE_MISMATCH, MISSING_DOC, CRITERIA_NOT_MET, etc.
    description: str                      # Specific, actionable description
    resolution: str                       # What needs to happen to fix this
```

---

## 4. API Endpoints

### V1 Endpoints

```
POST /api/v1/evaluate
  Body: { order: Order } or multipart with PDF upload
  Response: PAEvaluation

POST /api/v1/evaluate/pdf
  Body: multipart/form-data with PDF file
  Response: PAEvaluation

GET /api/v1/evaluations/{evaluation_id}
  Response: PAEvaluation

GET /api/v1/health
  Response: { status: "ok", model: "...", version: "..." }
```

### Configuration Endpoints (Admin)

```
GET    /api/v1/catalog/tests
POST   /api/v1/catalog/tests                  # Add/update test catalog entry
DELETE /api/v1/catalog/tests/{test_code}

GET    /api/v1/rules/payors
GET    /api/v1/rules/payors/{payor_code}
POST   /api/v1/rules/payors                   # Add/update payor rules
DELETE /api/v1/rules/payors/{payor_code}

POST   /api/v1/rules/extract                  # Feed payor policy PDF → extract rules via LLM
```

---

## 5. Project Structure

```
prior-auth-agent/
├── SPEC.md
├── README.md
├── pyproject.toml
├── .env.example
│
├── app/
│   ├── __init__.py
│   ├── main.py                        # FastAPI app entry point
│   ├── config.py                      # Settings (model, DB, feature flags)
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── graph.py                   # LangGraph workflow definition
│   │   ├── state.py                   # Shared agent state schema
│   │   ├── order_parser.py            # PDF → structured order
│   │   ├── enrichment.py              # Test catalog + payor rules lookup
│   │   ├── code_evaluator.py          # ICD-10/CPT evaluation
│   │   ├── criteria_evaluator.py      # Medical necessity evaluation
│   │   ├── gap_detector.py            # Documentation gap detection
│   │   └── risk_scorer.py             # Final risk score + report
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── llm.py                     # LiteLLM wrapper
│   │   ├── prompts.py                 # All LLM prompts (versioned)
│   │   └── pdf_parser.py              # PDF text extraction utility
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── order.py                   # Order input models (Pydantic)
│   │   ├── evaluation.py              # PA evaluation output models
│   │   ├── catalog.py                 # Test catalog models
│   │   └── rules.py                   # Payor rules models
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py                # DB connection (async SQLAlchemy)
│   │   ├── models.py                  # ORM models
│   │   └── seed.py                    # Seed payor rules + test catalog
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes_evaluate.py         # /evaluate endpoints
│   │   ├── routes_catalog.py          # /catalog endpoints
│   │   └── routes_rules.py            # /rules endpoints
│   │
│   └── services/
│       ├── __init__.py
│       ├── catalog_service.py         # Test catalog CRUD
│       └── rules_service.py           # Payor rules CRUD
│
├── seed_data/
│   ├── payors/
│   │   ├── uhc_wes_wgs.json           # UnitedHealthcare WES/WGS rules
│   │   └── aetna_wes_wgs.json         # Aetna WES/WGS rules
│   ├── catalogs/
│   │   └── sample_test_catalog.json   # Sample lab test catalog
│   └── orders/
│       └── sample_order.json          # Sample order for testing
│
├── tests/
│   ├── __init__.py
│   ├── test_agents/
│   │   ├── test_code_evaluator.py
│   │   ├── test_criteria_evaluator.py
│   │   ├── test_gap_detector.py
│   │   └── test_graph.py
│   ├── test_api/
│   │   └── test_evaluate.py
│   └── conftest.py
│
└── scripts/
    └── seed_db.py                     # Load seed data into DB
```

---

## 6. Testing Strategy

### Unit Tests
- Each agent tested independently with mocked LLM responses
- Payor rules engine tested with known inputs/outputs
- Data model serialization/deserialization

### Integration Tests
- Full LangGraph workflow with a test order against seeded payor rules
- API endpoint tests via FastAPI TestClient
- PDF parsing with sample order PDFs

### Evaluation Tests
- Run the sample Baylor order (test code 1601, ICD-10 A01.3/A01.00/A01.1, payor 1199 National Benefit Fund) through the agent
- Expected output: HIGH denial risk (infectious disease codes for WES)
- Run a well-formed order and verify LOW denial risk

---

## 7. Seed Data (V1)

### Payor Rules to Seed

**UnitedHealthcare (Commercial) — WES/WGS:**
- Accepted CPT: 81415, 81416, 81417, 81425, 81426, 81427, 0094U, 0212U-0215U, 0260U, 0264U-0267U, plus others
- Medical necessity criteria:
  - Undiagnosed/unexplained disorder with suspected genetic cause
  - Test results must directly impact medical management
  - Doesn't fit a well-delineated genetic syndrome
  - Ordered by: medical geneticist, neonatologist, neurologist, immunologist, or developmental pediatrician
  - Clinical presentation: ONE of (multiple congenital anomalies 2+ organ systems, moderate+ intellectual disability dx by 18, global developmental delay, epileptic encephalopathy onset <3yr) OR TWO of (congenital anomaly, hearing/visual impairment, inborn error of metabolism, ASD, neuropsychiatric condition, hypotonia/hypertonia, movement disorder, unexplained regression, growth abnormality, immunologic/hematologic disorder, dysmorphic features, consanguinity, family member with similar dx)
- Required documentation: genetic counseling recommended prior to testing
- Exclusions: fetal demise evaluation, prenatal cell-free DNA, PGT, outpatient rapid WES/WGS

**Aetna (Commercial) — WES/WGS:**
- Medical necessity criteria:
  - Genetic etiology considered most likely
  - Board-certified geneticist consultation required
  - Pre- and post-test genetic counseling by independent provider
  - Alternate etiologies ruled out
  - Standard clinical workup completed
  - WES/WGS more efficient than separate tests
  - Clinical fit for specific categories (congenital anomalies, sensorineural hearing loss, ASD with syndromic features, intractable epilepsy <=21, or 2+ of: structural abnormality, global dev delay, intellectual disability, family history, regression, metabolic findings)
- Testing must guide prognosis, clinical decision-making, reduce diagnostic uncertainty, or inform reproductive counseling
- Exclusions: WGS after non-diagnostic WES (negligible yield), isolated transient neonatal conditions, uncomplicated infection/sepsis

### Test Catalog to Seed (Sample)

| Test Code | Name | CPT Codes |
|-----------|------|-----------|
| 1600 | Trio Whole Exome Sequencing | 81415x1, 81416x2 |
| 1601 | Sequential Trio WES | 81415x1, 81416x2 |
| 1800 | Trio Whole Genome Sequencing | 81425x1, 81426x2 |
| 1803 | Duo WGS | 81425x1, 81426x1 |
| 1804 | Quad WGS | 81425x1, 81426x3 |
| 1829 | Rapid Proband WGS | 81425x1 |

---

## 8. Boundaries

### Always Do
- Evaluate codes as provided — never recommend alternative codes
- Provide specific, actionable gap descriptions (not generic "more info needed")
- Include reasoning for every finding (why this code was flagged, why this criterion isn't met)
- Keep payor rules versioned with effective dates
- Log every evaluation for audit trail

### Ask First
- Before adding new payor rules (require human review of extracted rules)
- Before any action that would submit to a payor (out of scope for V1, but architecture should never auto-submit)

### Never Do
- Recommend or change ICD-10/CPT codes — agent evaluates, humans decide
- Auto-submit PA requests to payors
- Store or log actual patient PII beyond what's needed for evaluation (future: add data retention policy)
- Hardcode lab-specific logic — everything goes through configurable rules/catalog

---

## 9. Configuration

```env
# .env
LLM_MODEL=anthropic/claude-sonnet-4-20250514    # Any LiteLLM-supported model
LLM_TEMPERATURE=0.1                              # Low temp for deterministic evaluations
DATABASE_URL=sqlite:///./prior_auth.db           # Or postgresql://...
LOG_LEVEL=INFO
```

Model swap is a single env var change. No code changes required.

---

## 10. V1 Scope vs Future

### V1 (This Build)
- Order input via JSON or PDF upload
- LangGraph agent pipeline (6 agents)
- Payor rules engine with UHC + Aetna seed data
- Configurable test catalog
- REST API for evaluation
- PA evaluation output with denial risk score

### V2 (Future)
- FHIR R4 integration for clinical data pull
- Rules extraction agent (feed payor policy PDF → auto-extract rules)
- Denial feedback loop (learn from past denials)
- FHIR PAS / EDI X12 278 submission routing
- Status polling and tracking
- Frontend UI for human review
- Multi-lab tenant support
