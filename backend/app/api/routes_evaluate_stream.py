"""Streaming evaluation endpoint — SSE for real-time agent progress."""
from __future__ import annotations

import asyncio
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


def _build_pipeline(state: AgentState) -> list[list[tuple[str, str, object]]]:
    """Build the agent pipeline as groups. Agents in the same group run concurrently."""
    has_order = state.get("order") is not None
    is_pdf = state.get("input_is_pdf", False)

    groups: list[list[tuple[str, str, object]]] = []

    if is_pdf or not has_order:
        groups.append([("order_parser", "Parsing order from PDF", order_parser_node)])

    groups.append([("enrichment", "Looking up test catalog & payor rules", enrichment_node)])

    # code_evaluator and criteria_evaluator are independent — run concurrently
    groups.append([
        ("code_evaluator", "Evaluating ICD-10 & CPT codes", code_evaluator_node),
        ("criteria_evaluator", "Checking medical necessity criteria", criteria_evaluator_node),
    ])

    groups.append([("gap_detector", "Detecting documentation gaps", gap_detector_node)])
    groups.append([("risk_scorer", "Scoring denial risk", risk_scorer_node)])

    return groups


async def _run_pipeline_streaming(state: AgentState):
    """Run the agent pipeline group by group, yielding SSE events."""
    groups = _build_pipeline(state)
    flat = [agent for g in groups for agent in g]

    # Send initial pipeline state
    yield _sse_event("pipeline", {
        "agents": [{"id": a[0], "label": a[1], "status": "pending"} for a in flat],
    })

    aborted = False
    for group in groups:
        if aborted:
            break

        for agent_id, label, _ in group:
            yield _sse_event("agent_update", {"id": agent_id, "status": "running", "label": label})

        if len(group) == 1:
            agent_id, label, agent_fn = group[0]
            try:
                result = await agent_fn(state)
                state.update(result)
                yield _sse_event("agent_update", {
                    "id": agent_id, "status": "completed", "label": label,
                    "message": _agent_summary(agent_id, state),
                })
            except Exception as e:
                logger.error("Agent %s failed: %s", agent_id, e)
                state.setdefault("errors", []).append(f"{agent_id}: {e}")
                yield _sse_event("agent_update", {
                    "id": agent_id, "status": "error", "label": label, "message": str(e),
                })

                # Fatal — abort pipeline, jump to risk scorer
                if agent_id in ("order_parser", "enrichment"):
                    remaining = [a for a in flat if a[0] not in
                        ("order_parser", "enrichment", "risk_scorer", agent_id)]
                    for skip_id, skip_label, _ in remaining:
                        yield _sse_event("agent_update", {
                            "id": skip_id, "status": "skipped", "label": skip_label,
                            "message": f"Skipped — {agent_id} failed",
                        })

                    yield _sse_event("agent_update", {
                        "id": "risk_scorer", "status": "running", "label": "Scoring denial risk",
                    })
                    try:
                        result = await risk_scorer_node(state)
                        state.update(result)
                        yield _sse_event("agent_update", {
                            "id": "risk_scorer", "status": "completed",
                            "label": "Scoring denial risk",
                            "message": _agent_summary("risk_scorer", state),
                        })
                    except Exception as re:
                        yield _sse_event("agent_update", {
                            "id": "risk_scorer", "status": "error",
                            "label": "Scoring denial risk", "message": str(re),
                        })
                    aborted = True
        else:
            async def _run_one(aid: str, alabel: str, afn):
                try:
                    r = await afn(state)
                    return aid, alabel, r, None
                except Exception as ex:
                    return aid, alabel, None, ex

            tasks = [asyncio.create_task(_run_one(a_id, a_label, a_fn)) for a_id, a_label, a_fn in group]
            for coro in asyncio.as_completed(tasks):
                agent_id, label, result, err = await coro
                if err:
                    logger.error("Agent %s failed: %s", agent_id, err)
                    state.setdefault("errors", []).append(f"{agent_id}: {err}")
                    yield _sse_event("agent_update", {
                        "id": agent_id, "status": "error", "label": label, "message": str(err),
                    })
                else:
                    state.update(result)
                    yield _sse_event("agent_update", {
                        "id": agent_id, "status": "completed", "label": label,
                        "message": _agent_summary(agent_id, state),
                    })

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
