# Frontend — Development Guidelines

## Setup

```bash
npm install
npm run dev
```

Opens at http://localhost:3000. Connects to backend at `NEXT_PUBLIC_API_URL` (default: `http://localhost:8001`).

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Main page — SSE handling, state, orchestration |
| `app/components/order-form.tsx` | JSON input / PDF upload form |
| `app/components/agent-pipeline.tsx` | Real-time agent progress UI |
| `app/components/evaluation-result.tsx` | Results display with collapsible sections |
| `app/globals.css` | CSS variables, animations |
| `public/sample_order.json` | Sample order for "load sample" button |

## Design Principles

- **Dark theme, monospace font** — terminal/agentic aesthetic
- **Minimalist** — no unnecessary chrome, every element earns its space
- **Real-time feedback** — SSE streaming shows each agent's status as it runs
- **Collapsible sections** — issues shown by default, details collapsed

## SSE Protocol

Backend streams events on `POST /api/v1/evaluate/stream`:

1. `event: pipeline` — Initial agent list with all statuses "pending"
2. `event: agent_update` — Per-agent status change (running → completed/error/skipped)
3. `event: result` — Final PAEvaluation JSON
4. `event: error` — Pipeline error

## Conventions

- All components in `app/components/`
- CSS variables for theming in `globals.css`
- No external UI library — Tailwind only
- Types defined in `page.tsx` (AgentUpdate, EvaluationData)

## API Connection

If backend runs on a different port/host, set:
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

@AGENTS.md
