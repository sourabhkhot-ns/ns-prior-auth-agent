# Prior Auth Agent — Development Guidelines

## Project Structure

Monorepo with two packages:
- `backend/` — Python FastAPI + LangGraph agents
- `frontend/` — Next.js + Tailwind UI

## Key Principles

1. **Generic, not lab-specific** — No hardcoded Baylor or any lab logic. All lab-specific config goes through test catalog and payor rules.
2. **Model-agnostic** — LLM provider is set via `LLM_MODEL` env var. LiteLLM handles the abstraction. Never import provider-specific SDKs directly.
3. **Evaluate, don't recommend** — The agent evaluates ICD-10/CPT codes as provided. It flags mismatches but never suggests alternative codes.
4. **Specific gap descriptions** — Never output "additional documentation required." Always say exactly what is missing and why the payor requires it.

## Backend

### Running

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --port 8001 --reload
```

### Architecture

- `app/agents/` — Individual agent nodes (order_parser, enrichment, code_evaluator, criteria_evaluator, gap_detector, risk_scorer)
- `app/agents/graph.py` — LangGraph workflow definition
- `app/agents/state.py` — Shared TypedDict state passed between agents
- `app/core/llm.py` — LiteLLM wrapper with retry logic and JSON extraction
- `app/core/prompts.py` — All LLM prompts (versioned, auditable)
- `app/models/` — Pydantic schemas for order, catalog, rules, evaluation
- `app/db/` — SQLAlchemy ORM + seed logic
- `app/api/` — FastAPI routes (evaluate, stream, catalog, rules)
- `seed_data/` — JSON files for payor rules and test catalog

### Adding a new payor

1. Create `seed_data/payors/<payor>_<test_type>.json` following the schema in existing files
2. Restart the server — it auto-seeds on startup
3. The agent will match orders to the new payor rules automatically

### Adding a new test to the catalog

1. Add entry to `seed_data/catalogs/sample_test_catalog.json`
2. Restart the server

### Prompts

All LLM prompts are in `app/core/prompts.py`. Each agent has a SYSTEM and USER prompt. Edit prompts there, not in agent files.

## Frontend

### Running

```bash
cd frontend
npm run dev
```

### Architecture

- `app/page.tsx` — Main page, SSE event handling, state management
- `app/components/order-form.tsx` — JSON input / PDF upload form
- `app/components/agent-pipeline.tsx` — Real-time agent progress display
- `app/components/evaluation-result.tsx` — Evaluation results with collapsible sections

### API Connection

Frontend connects to backend at `NEXT_PUBLIC_API_URL` (default: `http://localhost:8001`). Uses SSE streaming endpoint `/api/v1/evaluate/stream`.

## Testing

```bash
cd backend
source .venv/bin/activate
pytest
```

### Manual test

```bash
curl -X POST http://localhost:8001/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{"order": <order-json>}'
```

## Environment

- Python 3.11+ (venv in `backend/.venv/`)
- Node.js 18+ (for frontend)
- macOS SSL fix: `certifi` is patched in `app/core/llm.py` — do not remove

## Boundaries

### Always
- Keep payor rules versioned with effective dates
- Include reasoning in every evaluation finding
- Log evaluations for audit trail

### Never
- Auto-submit PA requests to payors
- Recommend alternative ICD-10/CPT codes
- Hardcode lab-specific logic
- Store patient PII beyond evaluation scope
