# Prior Authorization Agent

A generic, model-agnostic prior authorization evaluation agent for genomics/diagnostic laboratories. Evaluates test orders against payor-specific rules at the point of order to detect documentation gaps, code mismatches, and denial risks before submission.

## Architecture

```
prior-auth-agent/
├── backend/         Python FastAPI + LangGraph agent pipeline
├── frontend/        Next.js UI with real-time agent progress
├── SPEC.md          Full system specification
└── CLAUDE.md        Development guidelines
```

### Agent Pipeline (LangGraph)

```
Order → Parser → Enrichment → Code Evaluator → Criteria Evaluator → Gap Detector → Risk Scorer → PA Evaluation
```

6 agents, orchestrated sequentially. Code and criteria evaluation could run in parallel (supported by architecture).

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent Framework | LangGraph |
| LLM | LiteLLM (model-agnostic — Groq, Claude, GPT, Gemini, etc.) |
| Backend | Python, FastAPI |
| Frontend | Next.js, Tailwind CSS |
| Database | SQLite (dev) / PostgreSQL (prod) |

## Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
# Edit .env — set LLM_MODEL and API key
uvicorn app.main:app --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Configuration

All LLM config is in `backend/.env`:

```env
# Groq (fast, free tier)
LLM_MODEL=groq/llama-3.3-70b-versatile
GROQ_API_KEY=gsk_...

# Or Anthropic
LLM_MODEL=anthropic/claude-sonnet-4-20250514
ANTHROPIC_API_KEY=sk-ant-...

# Or OpenAI
LLM_MODEL=openai/gpt-4o
OPENAI_API_KEY=sk-...
```

One env var change to swap models. No code changes.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/evaluate` | Evaluate order (JSON body) |
| POST | `/api/v1/evaluate/pdf` | Evaluate order from PDF upload |
| POST | `/api/v1/evaluate/stream` | SSE streaming evaluation |
| POST | `/api/v1/evaluate/pdf/stream` | SSE streaming PDF evaluation |
| GET | `/api/v1/catalog/tests` | List test catalog |
| GET | `/api/v1/rules/payors` | List payor rules |
| GET | `/api/v1/health` | Health check |

## Seed Data

- **Payor rules**: UnitedHealthcare + Aetna WES/WGS policies (real, from public policy documents)
- **Test catalog**: 7 Baylor Genetics test codes with CPT mappings
- **Sample order**: Test order for end-to-end testing

## Key Design Decisions

- Agent evaluates codes as provided — never recommends alternatives
- Lab-agnostic: test catalog and payor rules are configurable
- Model-agnostic: swap LLM provider via config
- Streaming UI shows real-time agent progress
