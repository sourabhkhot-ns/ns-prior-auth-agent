# Frontend — Development Guidelines

See the root `CLAUDE.md` for cross-cutting principles.

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`. Connects to backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:8001`).

## Layout

| File | Purpose |
|---|---|
| `app/page.tsx` | Main page — SSE handling, state, order-context card, orchestration |
| `app/components/order-form.tsx` | Sample cases / JSON input / PDF upload |
| `app/components/document-upload.tsx` | 4-slot multi-PDF upload (Order Summary, Patient Details, Physician Notes, Test Reports) |
| `app/components/upload-status.tsx` | Provided/missing doc feed shown once the run starts |
| `app/components/agent-pipeline.tsx` | Real-time per-agent status — reveals agents one by one as they run |
| `app/components/evaluation-result.tsx` | Risk verdict card + collapsible sections for codes / criteria / gaps / issues |
| `app/globals.css` | CSS variables, animations |
| `public/samples/` | Sample order JSON fixtures |
| `public/sample_docs/` | Sample PDFs for the multi-upload flow |

## Design

- **Light theme, monospace font.** Agentic/terminal aesthetic in a paper-white palette.
- **Minimalist.** No unnecessary chrome. Every element earns its space.
- **Real-time feedback.** SSE streaming reveals each agent as it transitions.
- **Collapsible sections.** Results default to issues open, details collapsed.
- **Colors via CSS variables** in `globals.css` — `--foreground`, `--background`, `--surface`, `--border`, `--muted`, `--accent`, `--success`, `--warning`, `--error`. Touch variables, not hardcoded hex.

## SSE protocol

Backend streams events on `POST /api/v1/evaluate/stream` and `POST /api/v1/evaluate/documents/stream`:

| Event | Shape | When |
|---|---|---|
| `upload_status` | `{ uploaded: [{type, label}], missing: [{type, label}] }` | Once, at start of `/documents/stream` |
| `pipeline` | `{ agents: [{ id, label, status: "pending" }...] }` | Once, right after `upload_status` |
| `agent_update` | `{ id, label, status: "running" | "completed" | "error" | "skipped", message? }` | Multiple, as each agent transitions |
| `result` | full `PAEvaluation` JSON | Once, at the end on success |
| `error` | `{ message }` | Once, at the end on failure |

Parallel agents emit `running` near-simultaneously and may complete in any order — the UI keyed on `agent.id` handles that naturally.

## Order context

`page.tsx` maintains an `OrderContext` that persists through the pipeline view and the result view. For JSON input it extracts `{test_name, patient first name + last initial, payor, order_id}` from the submitted JSON. For PDF uploads it shows `N documents submitted` until the real order surfaces in the result.

## Conventions

- All components live under `app/components/`. No external UI library — Tailwind only.
- Types (`AgentUpdate`, `EvaluationData`, `OrderContext`) defined in `page.tsx`.
- Don't fetch client-side from arbitrary origins — the backend URL comes only from `NEXT_PUBLIC_API_URL`.
- Don't parse or transform backend data shapes in components; pass them through. Transformations belong in `page.tsx` or dedicated helpers.

## API connection

```env
# frontend/.env.local (optional)
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Build

```bash
npm run build
npm run start         # production
```
