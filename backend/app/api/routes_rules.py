"""Payor rules management routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models.rules import PayorRule
from app.services.rules_service import get_all_payor_rules

router = APIRouter(prefix="/api/v1/rules", tags=["rules"])


@router.get("/payors", response_model=list[PayorRule])
async def list_payor_rules(session: AsyncSession = Depends(get_session)):
    return await get_all_payor_rules(session)
