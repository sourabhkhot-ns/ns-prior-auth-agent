"""Evaluation API routes."""
from __future__ import annotations

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.agents.graph import pa_evaluation_graph
from app.agents.state import AgentState
from app.core.pdf_parser import extract_text_from_pdf
from app.models.order import Order
from app.models.evaluation import PAEvaluation

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["evaluation"])


class EvaluateRequest(BaseModel):
    order: Order


@router.post("/evaluate", response_model=PAEvaluation)
async def evaluate_order(request: EvaluateRequest):
    """Evaluate a structured order against payor rules."""
    initial_state: AgentState = {
        "order": request.order,
        "input_is_pdf": False,
        "errors": [],
    }

    result = await pa_evaluation_graph.ainvoke(initial_state)
    evaluation = result.get("evaluation")
    if not evaluation:
        raise HTTPException(status_code=500, detail="Evaluation failed to produce output")
    return evaluation


@router.post("/evaluate/pdf", response_model=PAEvaluation)
async def evaluate_order_pdf(file: UploadFile = File(...)):
    """Evaluate an order from an uploaded PDF."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    pdf_bytes = await file.read()
    pdf_text = extract_text_from_pdf(pdf_bytes)

    if not pdf_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    logger.info("Extracted %d chars from PDF %s", len(pdf_text), file.filename)

    initial_state: AgentState = {
        "raw_pdf_text": pdf_text,
        "input_is_pdf": True,
        "errors": [],
    }

    result = await pa_evaluation_graph.ainvoke(initial_state)
    evaluation = result.get("evaluation")
    if not evaluation:
        raise HTTPException(status_code=500, detail="Evaluation failed to produce output")
    return evaluation
