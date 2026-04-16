# Prior Auth Agent — Frontend

Next.js 15 + Tailwind UI for the Prior Auth Agent pipeline. Connects to the FastAPI backend via SSE.

## Run

```bash
npm install
npm run dev
```

App: `http://localhost:3000`. Backend expected at `http://localhost:8001` by default; override with:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://your-backend:8001
```

## Build

```bash
npm run build
npm run start
```

## What you see

- **Intake** — choose sample cases, paste a JSON order, or upload up to four PDFs (Order Summary, Patient Details, Physician Notes, Test Reports).
- **Activity view** — a persistent context card (test / patient / payor / order id) and the agent pipeline revealing each step as it runs.
- **Result** — a risk verdict card (low / medium / high), summary, then collapsible sections for issues, code evaluation, medical necessity criteria, and documentation gaps.

See `CLAUDE.md` for file layout and SSE protocol.
