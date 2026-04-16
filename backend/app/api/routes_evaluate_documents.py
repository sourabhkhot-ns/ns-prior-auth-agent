"""Multi-document PA evaluation endpoint — SSE streaming."""
from __future__ import annotations

import asyncio
import json
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse

from app.agents.state import AgentState
from app.core.pdf_parser import extract_text_from_pdf
from app.core.llm import start_usage_tracking, end_usage_tracking

from app.agents.document_analyzer import document_analyzer_node
from app.agents.enrichment import enrichment_node
from app.agents.code_evaluator import code_evaluator_node
from app.agents.criteria_evaluator import criteria_evaluator_node
from app.agents.gap_detector import gap_detector_node
from app.agents.risk_scorer import risk_scorer_node

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["evaluation-documents"])

MAX_PDF_SIZE = 20 * 1024 * 1024  # 20MB

DOC_TYPES = {
    "order_summary": "Order Summary",
    "patient_details": "Patient Details",
    "physician_notes": "Physician Notes",
    "test_reports": "Test Reports",
}


def _sse_event(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _run_document_pipeline(state: AgentState, uploaded_docs: list[str], missing_docs: list[str]):
    """Run the multi-document PA evaluation pipeline.

    Groups of agents that can run concurrently are declared as sub-lists.
    """
    start_usage_tracking()
    pipeline: list[list[tuple[str, str, object]]] = [
        [("document_analyzer", "Analyzing uploaded documents", document_analyzer_node)],
        [("enrichment", "Looking up test catalog & payor rules", enrichment_node)],
        [
            ("code_evaluator", "Evaluating ICD-10 & CPT codes", code_evaluator_node),
            ("criteria_evaluator", "Checking medical necessity criteria", criteria_evaluator_node),
        ],  # run in parallel — neither depends on the other
        [("gap_detector", "Detecting documentation gaps", gap_detector_node)],
        [("risk_scorer", "Scoring denial risk", risk_scorer_node)],
    ]
    flat = [agent for group in pipeline for agent in group]

    # Send upload events first
    yield _sse_event("upload_status", {
        "uploaded": [{"type": k, "label": DOC_TYPES.get(k, k)} for k in uploaded_docs],
        "missing":  [{"type": k, "label": DOC_TYPES.get(k, k)} for k in missing_docs],
    })

    # Send pipeline
    yield _sse_event("pipeline", {
        "agents": [{"id": a[0], "label": a[1], "status": "pending"} for a in flat],
    })

    aborted = False
    for group in pipeline:
        if aborted:
            break

        # Emit "running" for every agent in the group up-front
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

                # Fatal agents — abort and jump to risk scorer
                if agent_id in ("document_analyzer", "enrichment"):
                    remaining = [a for a in flat if a[0] not in
                        ("document_analyzer", "enrichment", "risk_scorer", agent_id)]
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
            # Parallel group — launch all, yield completion events as each finishes.
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
    eval_tag = evaluation.evaluation_id[:8] if evaluation else "failed"
    end_usage_tracking(eval_tag=eval_tag)

    if evaluation:
        yield _sse_event("result", evaluation.model_dump(mode="json"))
    else:
        yield _sse_event("error", {
            "message": "Pipeline failed: " + "; ".join(state.get("errors", ["Unknown error"]))
        })


def _agent_summary(agent_id: str, state: AgentState) -> str:
    if agent_id == "document_analyzer":
        order = state.get("order")
        cross_ref = state.get("cross_reference", {})
        parts = []
        if order:
            parts.append(f"{order.patient.first_name} {order.patient.last_name}")
            parts.append(order.test_name or order.test_code)
        inconsistencies = cross_ref.get("inconsistencies", [])
        if inconsistencies:
            parts.append(f"{len(inconsistencies)} inconsistencies found")
        findings = cross_ref.get("key_findings", [])
        if findings:
            parts.append(f"{len(findings)} key findings")
        return " | ".join(parts) if parts else "Documents analyzed"

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


@router.post("/evaluate/documents/stream")
async def evaluate_documents_stream(
    order_summary: UploadFile | None = File(None),
    patient_details: UploadFile | None = File(None),
    physician_notes: UploadFile | None = File(None),
    test_reports: UploadFile | None = File(None),
):
    """Evaluate a multi-document PA package with SSE streaming."""
    doc_map = {
        "order_summary": order_summary,
        "patient_details": patient_details,
        "physician_notes": physician_notes,
        "test_reports": test_reports,
    }

    document_texts = {}
    uploaded_docs = []
    missing_docs = []

    for doc_type, file in doc_map.items():
        if file and file.filename:
            pdf_bytes = await file.read()
            if len(pdf_bytes) > MAX_PDF_SIZE:
                raise HTTPException(400, f"{doc_type} exceeds 20MB limit")
            text = extract_text_from_pdf(pdf_bytes)
            if text.strip():
                document_texts[doc_type] = text
                uploaded_docs.append(doc_type)
            else:
                missing_docs.append(doc_type)
        else:
            missing_docs.append(doc_type)

    if not document_texts:
        raise HTTPException(400, "At least one document must be uploaded")

    initial_state: AgentState = {
        "document_texts": document_texts,
        "input_is_pdf": True,
        "errors": [],
    }

    return StreamingResponse(
        _run_document_pipeline(initial_state, uploaded_docs, missing_docs),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
