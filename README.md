# Prior Auth Agent

An agent that evaluates genomics lab orders against payor rules **before** a prior authorization is ever submitted — flagging code mismatches, documentation gaps, and medical necessity issues so orders are fixed upstream, not denied downstream.

Monorepo:
- **backend/** — FastAPI + LangGraph, 6-agent pipeline over LiteLLM
- **frontend/** — Next.js + Tailwind, real-time SSE agent pipeline UI

## Quickstart

```bash
# 1. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env            # set LLM_MODEL + the matching API key
uvicorn app.main:app --port 8001 --reload

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev

# 3. Open http://localhost:3000
```

## Pipeline

```
document_analyzer ─┐
order_parser ──────┼─► enrichment ─► ┌─► code_evaluator ─────┐
                                     └─► criteria_evaluator ─┴─► gap_detector ─► risk_scorer
```

`code_evaluator` and `criteria_evaluator` run concurrently — they don't depend on each other. Every LLM call is logged with token counts, cost, and latency; each evaluation ends with a summary line.

## LLM providers

Any LiteLLM-supported model works. Swap `LLM_MODEL` in `backend/.env`:

| Provider | `LLM_MODEL` | Notes |
|---|---|---|
| OpenAI | `openai/gpt-4o-mini` | Set `OPENAI_API_KEY` |
| Anthropic | `anthropic/claude-sonnet-4-5` | Set `ANTHROPIC_API_KEY` |
| Google | `gemini/gemini-1.5-flash` | Set `GOOGLE_API_KEY` |
| Groq | `groq/llama-3.3-70b-versatile` | Set `GROQ_API_KEY` (free tier has tight RPM) |
| Custom OpenAI-compatible (MLX / vLLM / Ollama) | `openai/<model>` | Also set `LLM_API_BASE`; set `OPENAI_API_KEY=dummy` |

Restart uvicorn after `.env` changes — the reloader doesn't watch it.

## Endpoints

- `POST /api/v1/evaluate` — non-streaming JSON order
- `POST /api/v1/evaluate/stream` — SSE streaming for a JSON order
- `POST /api/v1/evaluate/documents/stream` — SSE streaming for multi-PDF upload
- `GET /api/v1/catalog/tests` — list test catalog
- `GET /api/v1/rules/payors` — list payor rules
- `GET /api/v1/health` — health + current model

## Project docs

- `CLAUDE.md` — development guidelines, architecture detail, conventions
- `backend/CLAUDE.md` — backend-specific layout and conventions
- `frontend/CLAUDE.md` — frontend-specific layout and conventions
- `SPEC.md` — full system specification (if present)

## Boundaries

The agent **evaluates**; it does not submit PAs, generate alternate codes, or store patient PII beyond the evaluation scope.
