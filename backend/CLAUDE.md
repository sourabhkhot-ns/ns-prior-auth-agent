# Backend — Development Guidelines

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# Set LLM_MODEL and API key in .env
uvicorn app.main:app --port 8001 --reload
```

## Key Files

| File | Purpose |
|------|---------|
| `app/agents/graph.py` | LangGraph workflow — the agent pipeline |
| `app/agents/state.py` | Shared state TypedDict between agents |
| `app/core/llm.py` | LiteLLM wrapper, SSL fix, retry logic, JSON extraction |
| `app/core/prompts.py` | All LLM prompts — edit prompts here, not in agents |
| `app/config.py` | Pydantic settings from .env |
| `app/db/seed.py` | Auto-seeds DB on startup from seed_data/ |
| `seed_data/payors/` | Payor rule JSON files (UHC, Aetna) |
| `seed_data/catalogs/` | Test catalog JSON |
| `seed_data/orders/` | Sample orders for testing |

## Conventions

- All Pydantic models in `app/models/`
- All DB ORM models in `app/db/models.py`
- All prompts in `app/core/prompts.py` — keep them versioned
- API routes split by domain: `routes_evaluate.py`, `routes_evaluate_stream.py`, `routes_catalog.py`, `routes_rules.py`
- Agent nodes are async functions: `async def agent_node(state: AgentState) -> dict`
- Agents return a dict that merges into AgentState

## Adding a New Agent

1. Create `app/agents/new_agent.py` with an async node function
2. Add the node to `app/agents/graph.py`
3. Add any new state fields to `app/agents/state.py`
4. Add SSE event in `app/api/routes_evaluate_stream.py`

## Database

SQLite for dev (auto-created as `prior_auth.db`). Set `DATABASE_URL` in `.env` for PostgreSQL.

Tables auto-created on startup. Seed data auto-loaded if tables are empty.

## SSL on macOS

Python 3.14 on macOS has SSL cert issues. Fixed in `app/core/llm.py` by patching `ssl._create_default_https_context` with certifi certs. Do not remove this.
