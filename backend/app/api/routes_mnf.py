"""Medical necessity form (MNF) endpoints."""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from app.core.llm import end_usage_tracking, start_usage_tracking
from app.mnf.models import DraftForm, FormTemplate, PopulatedField
from app.mnf.pdf_renderer import render_pdf
from app.mnf.pipeline import MNFError, generate_mnf_draft, generate_mnf_draft_streaming
from app.mnf.templates import TemplateRegistry
from app.models.evaluation import PAEvaluation
from app.models.order import Order

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/mnf", tags=["mnf"])

_registry = TemplateRegistry()


class MNFGenerateRequest(BaseModel):
    order: Order
    evaluation: PAEvaluation | None = None


class MNFPdfRequest(BaseModel):
    draft: DraftForm


class MNFFinalizeRequest(BaseModel):
    draft: DraftForm
    fields: list[PopulatedField] | None = None
    justification_text: str | None = None
    reviewed_by: str | None = None
    force: bool = False


@router.get("/templates", response_model=list[FormTemplate])
async def list_templates() -> list[FormTemplate]:
    return _registry.list_all()


@router.post("/generate", response_model=DraftForm)
async def generate_mnf(request: MNFGenerateRequest) -> DraftForm:
    """Produce an MNF draft from an Order + optional PAEvaluation (non-streaming)."""
    start_usage_tracking()
    try:
        draft = await generate_mnf_draft(request.order, request.evaluation)
    except MNFError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        eval_tag = (
            request.evaluation.evaluation_id[:8]
            if request.evaluation and request.evaluation.evaluation_id
            else "mnf"
        )
        end_usage_tracking(eval_tag=eval_tag)
    return draft


def _sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/generate/stream")
async def generate_mnf_stream(request: MNFGenerateRequest) -> StreamingResponse:
    """Produce an MNF draft with SSE streaming — each pipeline step emits an event.

    Event types:
      `pipeline`     — one-shot at start; shape `{agents: [{id, label, status}...]}`
      `agent_update` — many; shape `{id, label, status, message?}`
      `draft`        — one-shot on success; the full DraftForm as JSON
      `error`        — one-shot on failure; `{message}`
    """
    async def stream():
        start_usage_tracking()
        eval_tag = (
            request.evaluation.evaluation_id[:8]
            if request.evaluation and request.evaluation.evaluation_id
            else "mnf"
        )
        try:
            async for ev in generate_mnf_draft_streaming(request.order, request.evaluation):
                kind = ev.pop("type")
                if kind == "draft":
                    yield _sse_event("result", ev.get("data", {}))
                else:
                    yield _sse_event(kind, ev)
        finally:
            end_usage_tracking(eval_tag=eval_tag)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/finalize", response_model=DraftForm)
async def finalize_mnf(request: MNFFinalizeRequest) -> DraftForm:
    """Apply reviewer edits to a draft and mark it confirmed.

    Blocks finalize if validation_errors remain unless `force=true`.
    """
    if request.draft.validation_errors and not request.force:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot finalize draft with {len(request.draft.validation_errors)} "
                "validation error(s). Resolve the errors or pass force=true to override."
            ),
        )

    from datetime import datetime, timezone
    final = request.draft.model_copy(update={
        "fields": request.fields or request.draft.fields,
        "justification_text": (
            request.justification_text
            if request.justification_text is not None
            else request.draft.justification_text
        ),
        "status": "confirmed",
        "confirmed_at": datetime.now(timezone.utc),
        "reviewed_by": request.reviewed_by or request.draft.reviewed_by,
    })
    return final


@router.post("/pdf")
async def mnf_pdf(request: MNFPdfRequest) -> Response:
    """Render a draft as PDF."""
    pdf_bytes = render_pdf(request.draft)
    filename = f"MNF_{request.draft.template.payor_id}_{request.draft.order_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
