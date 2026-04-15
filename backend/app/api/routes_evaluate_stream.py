"""Streaming evaluation endpoint — SSE for real-time agent progress."""
from __future__ import annotations

import json
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.agents.state import AgentState
from app.core.pdf_parser import extract_text_from_pdf
from app.models.order import Order

from app.agents.order_parser import order_parser_node
from app.agents.enrichment import enrichment_node
from app.agents.code_evaluator import code_evaluator_node
from app.agents.criteria_evaluator import criteria_evaluator_node
from app.agents.gap_detector import gap_detector_node
from app.agents.risk_scorer import risk_scorer_node

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["evaluation-stream"])

MAX_PDF_SIZE = 20 * 1024 * 1024  # 20MB


class EvaluateRequest(BaseModel):
    order: Order


def _sse_event(event: str, data: dict) -> str:
    """Format a Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _build_pipeline(state: AgentState) -> list[tuple[str, str, object]]:
    """Build the agent pipeline with conditional routing matching graph.py logic."""
    has_order = state.get("order") is not None
    is_pdf = state.get("input_is_pdf", False)

    pipeline = []

    # 1. Order parser — skip if structured JSON input
    if is_pdf or not has_order:
        pipeline.append(("order_parser", "Parsing order from PDF", order_parser_node))

    # 2. Enrichment — always runs
    pipeline.append(("enrichment", "Looking up test catalog & payor rules", enrichment_node))

    # 3-4. Code + Criteria evaluation — only if we expect payor rules
    # (we don't know yet, so include them; they'll handle missing rules gracefully)
    pipeline.append(("code_evaluator", "Evaluating ICD-10 & CPT codes", code_evaluator_node))
    pipeline.append(("criteria_evaluator", "Checking medical necessity criteria", criteria_evaluator_node))

    # 5. Gap detector
    pipeline.append(("gap_detector", "Detecting documentation gaps", gap_detector_node))

    # 6. Risk scorer — always runs last
    pipeline.append(("risk_scorer", "Scoring denial risk", risk_scorer_node))

    return pipeline


async def _run_pipeline_streaming(state: AgentState):
    """Run the agent pipeline step by step, yielding SSE events."""
    pipeline = _build_pipeline(state)

    # Send initial pipeline state
    yield _sse_event("pipeline", {
        "agents": [{"id": a[0], "label": a[1], "status": "pending"} for a in pipeline],
    })

    for agent_id, label, agent_fn in pipeline:
        # Signal agent start
        yield _sse_event("agent_update", {
            "id": agent_id,
            "status": "running",
            "label": label,
        })

        try:
            result = await agent_fn(state)
            state.update(result)

            summary = _agent_summary(agent_id, state)

            yield _sse_event("agent_update", {
                "id": agent_id,
                "status": "completed",
                "label": label,
                "message": summary,
            })
        except Exception as e:
            logger.error("Agent %s failed: %s", agent_id, e)
            state.setdefault("errors", []).append(f"{agent_id}: {e}")

            yield _sse_event("agent_update", {
                "id": agent_id,
                "status": "error",
                "label": label,
                "message": str(e),
            })

            # Fatal agents — abort pipeline, jump to risk scorer
            if agent_id in ("order_parser", "enrichment"):
                # Mark remaining agents as skipped
                remaining = [a for a in pipeline if a[0] not in
                    ("order_parser", "enrichment", "risk_scorer", agent_id)]
                for skip_id, skip_label, _ in remaining:
                    yield _sse_event("agent_update", {
                        "id": skip_id,
                        "status": "skipped",
                        "label": skip_label,
                        "message": f"Skipped — {agent_id} failed",
                    })

                # Run risk scorer to produce error evaluation
                yield _sse_event("agent_update", {
                    "id": "risk_scorer",
                    "status": "running",
                    "label": "Scoring denial risk",
                })
                try:
                    result = await risk_scorer_node(state)
                    state.update(result)
                    yield _sse_event("agent_update", {
                        "id": "risk_scorer",
                        "status": "completed",
                        "label": "Scoring denial risk",
                        "message": _agent_summary("risk_scorer", state),
                    })
                except Exception as re:
                    yield _sse_event("agent_update", {
                        "id": "risk_scorer",
                        "status": "error",
                        "label": "Scoring denial risk",
                        "message": str(re),
                    })
                break

            # Non-fatal agents — continue but note the failure
            continue

    # Send final evaluation
    evaluation = state.get("evaluation")
    if evaluation:
        yield _sse_event("result", evaluation.model_dump(mode="json"))
    else:
        yield _sse_event("error", {
            "message": "Pipeline failed: " + "; ".join(state.get("errors", ["Unknown error"]))
        })


def _agent_summary(agent_id: str, state: AgentState) -> str:
    """Generate a brief summary of what an agent found."""
    if agent_id == "order_parser":
        order = state.get("order")
        if order:
            return f"Extracted order {order.order_id} — {order.test_name or order.test_code}"
        return "Failed to parse order"

    if agent_id == "enrichment":
        parts = []
        entry = state.get("test_catalog_entry")
        rule = state.get("payor_rule")
        if entry:
            parts.append(f"Test: {entry.test_name} (CPT: {', '.join(entry.cpt_codes)})")
        if rule:
            parts.append(f"Payor: {rule.payor_name} ({rule.policy_version})")
        return " | ".join(parts) if parts else "No catalog/rules match found"

    if agent_id == "code_evaluator":
        ce = state.get("code_evaluation")
        if ce:
            rejected = sum(1 for r in ce.icd10_results if r.status == "REJECTED")
            accepted = sum(1 for r in ce.cpt_results if r.status == "ACCEPTED")
            return f"ICD-10: {rejected} rejected | CPT: {accepted} accepted"
        return "No code evaluation"

    if agent_id == "criteria_evaluator":
        crit = state.get("criteria_evaluation")
        if crit:
            met = sum(1 for r in crit.criteria_results if r.met == "met")
            partial = sum(1 for r in crit.criteria_results if r.met == "partial")
            total = len(crit.criteria_results)
            parts = [f"{met}/{total} met"]
            if partial:
                parts.append(f"{partial} partial")
            return f"{'Met' if crit.overall_met else 'Not met'} — {', '.join(parts)}"
        return "No criteria evaluation"

    if agent_id == "gap_detector":
        gap = state.get("gap_report")
        if gap:
            missing_docs = sum(1 for g in gap.missing_documents if g.status == "MISSING")
            missing_info = sum(1 for g in gap.missing_clinical_info if g.status == "MISSING")
            return f"{missing_docs} missing documents | {missing_info} missing clinical info items"
        return "No gap report"

    if agent_id == "risk_scorer":
        ev = state.get("evaluation")
        if ev:
            return f"Risk: {ev.denial_risk} — {len(ev.issues)} issues found"
        return "No evaluation"

    return ""


@router.post("/evaluate/stream")
async def evaluate_order_stream(request: EvaluateRequest):
    """Evaluate an order with real-time SSE streaming of agent progress."""
    initial_state: AgentState = {
        "order": request.order,
        "input_is_pdf": False,
        "errors": [],
    }

    return StreamingResponse(
        _run_pipeline_streaming(initial_state),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/evaluate/pdf/stream")
async def evaluate_pdf_stream(file: UploadFile = File(...)):
    """Evaluate a PDF order with real-time SSE streaming."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    pdf_bytes = await file.read()

    if len(pdf_bytes) > MAX_PDF_SIZE:
        raise HTTPException(status_code=400, detail="PDF exceeds 20MB limit")

    pdf_text = extract_text_from_pdf(pdf_bytes)

    if not pdf_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    initial_state: AgentState = {
        "raw_pdf_text": pdf_text,
        "input_is_pdf": True,
        "errors": [],
    }

    return StreamingResponse(
        _run_pipeline_streaming(initial_state),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
