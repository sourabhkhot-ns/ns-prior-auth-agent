# Prior Auth Agent — Development Guidelines

## Project Structure

Monorepo with two packages:
- `backend/` — Python FastAPI + LangGraph agents
- `frontend/` — Next.js + Tailwind UI

## Key Principles

1. **Generic, not lab-specific** — No hardcoded lab logic. All lab-specific config goes through the test catalog and payor rules.
2. **Model-agnostic** — LLM provider is set via `LLM_MODEL` env var; LiteLLM handles the abstraction. Never import provider-specific SDKs directly.
3. **Evaluate, don't recommend** — The agent evaluates ICD-10/CPT codes as provided. It flags mismatches but never suggests alternative codes.
4. **Specific gap descriptions** — Never output "additional documentation required." Always say exactly what is missing and why the payor requires it.

## Backend

### Running

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --port 8001 --reload
```

### Pipeline

Six agents. `code_evaluator` and `criteria_evaluator` run **in parallel** (fanned out from `enrichment`, joined at `gap_detector`):

```
document_analyzer ─┐
order_parser ──────┼─► enrichment ─► ┌─► code_evaluator ─────┐
                                     └─► criteria_evaluator ─┴─► gap_detector ─► risk_scorer
```

- `document_analyzer` — parses multi-PDF uploads into a unified `Order` + cross-reference findings
- `order_parser` — parses a single PDF into `Order` (legacy path)
- `enrichment` — looks up test catalog entry + payor rule
- `code_evaluator` — evaluates ICD-10 / CPT codes against payor acceptance lists
- `criteria_evaluator` — checks medical necessity criteria (tri-state: met / partial / not_met)
- `gap_detector` — identifies missing documents and clinical info (uses code + criteria summaries)
- `risk_scorer` — rolls everything up into a final `PAEvaluation` with a denial risk verdict

The LangGraph version (`app/agents/graph.py`) encodes the same topology. Streaming endpoints hand-roll the pipeline so SSE events can be emitted at each transition.

### Architecture

- `app/agents/` — agent nodes + `graph.py` LangGraph workflow + `state.py` TypedDict
- `app/core/llm.py` — LiteLLM wrapper: retry, timeout, JSON extraction, per-call usage logging, per-evaluation usage summary, Qwen3 `/no_think` handling, `max_tokens` ceiling
- `app/core/prompts.py` — all LLM prompts, versioned
- `app/models/` — Pydantic schemas for order, catalog, rules, evaluation
- `app/db/` — SQLAlchemy ORM + seed logic
- `app/api/` — FastAPI routes:
  - `routes_evaluate.py` — non-streaming POST `/api/v1/evaluate`
  - `routes_evaluate_stream.py` — SSE POST `/api/v1/evaluate/stream` (single JSON order)
  - `routes_evaluate_documents.py` — SSE POST `/api/v1/evaluate/documents/stream` (multi-PDF upload)
  - `routes_catalog.py`, `routes_rules.py` — reference data reads
- `seed_data/` — JSON seed for payor rules, test catalog, sample orders, sample PDFs

### Pydantic tolerance for LLM variance

Several models (`CareTeam`, `ClinicalInfo`, `Document`, `ICD10Code`) use `mode="before"` field validators that coerce `None` and, where relevant, `dict`/`list` into strings. This lets the pipeline absorb typical LLM output drift (e.g. `family_history: {…structured…}` returned when a string is expected) without failing Pydantic validation.

When extending a model with a new narrative string field that the LLM fills in, either make it `Optional` or add it to the coercer.

### Adding a new payor

1. Create `seed_data/payors/<payor>_<test_type>.json` following the schema in existing files.
2. Restart the server — it auto-seeds on startup.

### Adding a new test to the catalog

1. Add entry to `seed_data/catalogs/sample_test_catalog.json`.
2. Restart the server.

### Prompts

All LLM prompts live in `app/core/prompts.py`. Each agent has a SYSTEM and USER prompt. Edit prompts there, not in agent files.

### Observability

Every LLM call logs a structured line:

```
[code_evaluator] model=openai/gpt-4o-mini tokens=8100→640 (cached=0, total=8740) cost=$0.001599 latency=2150ms finish=stop
```

At the end of each evaluation, a summary line plus per-agent breakdown is emitted with the first 8 chars of the evaluation UUID as a prefix:

```
[4096116d] SUMMARY calls=5 tokens=41200→5600 (cached=0) cost=$0.012180 wall_llm=14320ms
[4096116d]   └─ document_analyzer  calls=1 tokens=12340→1820 cost=$0.003144 latency=4210ms
...
```

`cost` falls back to `n/a` for local/custom endpoints LiteLLM can't price.

## Frontend

### Running

```bash
cd frontend
npm run dev
```

### Architecture

- `app/page.tsx` — SSE handling, state, order-context card
- `app/components/order-form.tsx` — sample cases / JSON / PDF input
- `app/components/document-upload.tsx` — 4-slot multi-PDF upload
- `app/components/upload-status.tsx` — provided/missing doc feed
- `app/components/agent-pipeline.tsx` — real-time per-agent status
- `app/components/evaluation-result.tsx` — risk verdict + collapsible sections

### API Connection

Set `NEXT_PUBLIC_API_URL` (default `http://localhost:8001`). Streaming endpoints:
- `/api/v1/evaluate/stream` — JSON order
- `/api/v1/evaluate/documents/stream` — multipart PDF upload

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

## Environment (backend/.env)

```env
LLM_MODEL=openai/gpt-4o-mini              # any LiteLLM-supported model id
LLM_API_BASE=                             # optional: custom OpenAI-compatible endpoint (MLX, vLLM, Ollama…)
LLM_TEMPERATURE=0.1

ANTHROPIC_API_KEY=
OPENAI_API_KEY=                           # use "dummy" when routing openai/* to a custom LLM_API_BASE
GOOGLE_API_KEY=
GROQ_API_KEY=

DATABASE_URL=sqlite+aiosqlite:///./prior_auth.db
LOG_LEVEL=INFO
APP_HOST=0.0.0.0
APP_PORT=8000
```

Switching providers is always `.env` edits + uvicorn restart (the reloader doesn't watch `.env`).

### Tooling notes
- Python 3.11+, venv in `backend/.venv/`
- Node 18+
- Qwen3 models: `/no_think` is auto-prefixed in `llm.py` so reasoning tokens don't starve the response.

## Boundaries

### Always
- Keep payor rules versioned with effective dates
- Include reasoning in every evaluation finding
- Log evaluations for audit trail

### Never
- Auto-submit PA requests to payors
- Recommend alternative ICD-10 / CPT codes
- Hardcode lab-specific logic
- Store patient PII beyond evaluation scope

## Keeping this doc current

Update this file whenever you:
- Add/remove an agent, endpoint, or env var
- Change the pipeline topology (sequential ↔ parallel)
- Change an LLM provider-specific behavior (e.g. the Qwen3 handling)
- Change an observability shape that someone might grep logs for

Small, concurrent edits — not big periodic rewrites.
