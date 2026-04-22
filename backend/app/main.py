"""FastAPI application entry point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.seed import init_db_and_seed
from app.api.routes_evaluate import router as evaluate_router
from app.api.routes_evaluate_stream import router as evaluate_stream_router
from app.api.routes_evaluate_documents import router as evaluate_documents_router
from app.api.routes_catalog import router as catalog_router
from app.api.routes_rules import router as rules_router
from app.api.routes_letter import router as letter_router
from app.api.routes_mnf import router as mnf_router

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Prior Auth Agent")
    logger.info("LLM Model: %s", settings.llm_model)

    result = await init_db_and_seed()
    logger.info("DB seeded: %s", result)

    yield

    logger.info("Shutting down")


app = FastAPI(
    title="Prior Authorization Agent",
    description="Generic prior authorization evaluation agent for genomics/diagnostic labs",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluate_router)
app.include_router(evaluate_stream_router)
app.include_router(evaluate_documents_router)
app.include_router(catalog_router)
app.include_router(rules_router)
app.include_router(letter_router)
app.include_router(mnf_router)


@app.get("/api/v1/health")
async def health():
    return {
        "status": "ok",
        "model": settings.llm_model,
        "version": "0.1.0",
    }
