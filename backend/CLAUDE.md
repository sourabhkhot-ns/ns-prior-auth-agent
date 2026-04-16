# Backend — Development Guidelines

See the root `CLAUDE.md` for principles and cross-cutting conventions. This file covers backend-specific detail.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env                    # set LLM_MODEL + matching API key
uvicorn app.main:app --port 8001 --reload
```

## Layout

| Path | Purpose |
|---|---|
| `app/main.py` | FastAPI app, startup/shutdown, DB seed |
| `app/config.py` | Pydantic `BaseSettings` from `.env` |
| `app/agents/` | Agent nodes + `graph.py` LangGraph workflow + `state.py` TypedDict |
| `app/core/llm.py` | LiteLLM wrapper: retry, timeout, JSON extraction, usage logging, Qwen3 `/no_think`, `max_tokens` ceiling |
| `app/core/prompts.py` | All LLM prompts (SYSTEM + USER per agent) — versioned |
| `app/core/pdf_parser.py` | PyMuPDF text extraction |
| `app/models/` | Pydantic schemas (order, catalog, rules, evaluation) |
| `app/db/` | SQLAlchemy async ORM + `seed.py` |
| `app/api/` | FastAPI routes split by domain |
| `seed_data/` | Payor rules, test catalog, sample orders, sample PDFs |

## Pipeline (streaming)

Six agents. The streaming endpoints group them so `code_evaluator` and `criteria_evaluator` run concurrently via `asyncio.as_completed`:

```
(document_analyzer | order_parser) → enrichment → [code_evaluator ∥ criteria_evaluator] → gap_detector → risk_scorer
```

`gap_detector` joins on both evaluators and uses their summaries as context. `risk_scorer` always runs last.

The LangGraph version in `app/agents/graph.py` encodes the same topology. Streaming endpoints bypass LangGraph so SSE events can be emitted at each transition.

### Adding a new agent

1. Create `app/agents/<name>.py` with an async node function `async def <name>_node(state: AgentState) -> dict`.
2. Add the node to `app/agents/graph.py` (wire it into the right place in the fan-out / fan-in).
3. Add any new state fields to `app/agents/state.py`.
4. Add an entry in both `routes_evaluate_stream.py::_build_pipeline` and `routes_evaluate_documents.py::_run_document_pipeline` if the agent should stream.
5. Add a summary branch in `_agent_summary()` in both route files.
6. Pass `tag="<name>"` to `llm_call_json` so usage logs are attributed.

## Routes

- `routes_evaluate.py` — non-streaming evaluation
- `routes_evaluate_stream.py` — SSE for a JSON order
- `routes_evaluate_documents.py` — SSE for multi-PDF uploads (accepts `order_summary`, `patient_details`, `physician_notes`, `test_reports`)
- `routes_catalog.py`, `routes_rules.py` — reference data

## Pydantic tolerance for LLM variance

`CareTeam`, `ClinicalInfo`, `Document`, `ICD10Code` use `mode="before"` field validators that coerce `None` (and for narrative strings, `dict`/`list`) into strings. This absorbs common LLM output drift without failing validation. When extending a model with a new narrative string field, either make it `Optional` or add it to the coercer.

## Observability

Every `llm_call` emits:

```
[code_evaluator] model=openai/gpt-4o-mini tokens=8100→640 (cached=0, total=8740) cost=$0.001599 latency=2150ms finish=stop
```

Each evaluation emits a summary + per-agent breakdown (prefix = first 8 chars of evaluation UUID):

```
[4096116d] SUMMARY calls=5 tokens=41200→5600 (cached=0) cost=$0.012180 wall_llm=14320ms
[4096116d]   └─ document_analyzer calls=1 tokens=12340→1820 cost=$0.003144 latency=4210ms
```

`cost=n/a` appears for local/custom endpoints that LiteLLM can't price.

The accumulator uses `contextvars`; it correctly aggregates parallel agent calls (`asyncio.create_task` copies the current context).

## Database

SQLite for dev (auto-created as `prior_auth.db`). Set `DATABASE_URL` in `.env` for PostgreSQL.

Tables auto-created on startup. Seed data auto-loaded if tables are empty; the seeder is idempotent (`0` in the startup log means "nothing new", not "empty DB").

## Seeds

### Add a payor rule
1. Create `seed_data/payors/<payor>_<test_type>.json` matching the schema in existing files.
2. Restart the server.

### Add a catalog test
1. Add entry to `seed_data/catalogs/sample_test_catalog.json`.
2. Restart the server.

## Testing

```bash
pytest
```

Manual check:
```bash
curl -X POST http://localhost:8001/api/v1/evaluate \
  -H "Content-Type: application/json" \
  -d '{"order": <order-json>}'
```

## Environment (.env)

```env
LLM_MODEL=openai/gpt-4o-mini              # any LiteLLM-supported id
LLM_API_BASE=                             # optional: custom OpenAI-compatible endpoint
LLM_TEMPERATURE=0.1

ANTHROPIC_API_KEY=
OPENAI_API_KEY=                           # "dummy" is fine when routing openai/* to a custom LLM_API_BASE
GOOGLE_API_KEY=
GROQ_API_KEY=

DATABASE_URL=sqlite+aiosqlite:///./prior_auth.db
LOG_LEVEL=INFO
```

The uvicorn reloader does not watch `.env` — restart after changes.

For Qwen3 models, `/no_think` is auto-prefixed to the system prompt in `llm.py` so reasoning tokens don't starve the response.
