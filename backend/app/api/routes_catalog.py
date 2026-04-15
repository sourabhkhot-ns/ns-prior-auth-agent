"""Test catalog management routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models.catalog import TestCatalogEntry
from app.services.catalog_service import get_all_tests, get_test_by_code

router = APIRouter(prefix="/api/v1/catalog", tags=["catalog"])


@router.get("/tests", response_model=list[TestCatalogEntry])
async def list_tests(session: AsyncSession = Depends(get_session)):
    return await get_all_tests(session)


@router.get("/tests/{test_code}", response_model=TestCatalogEntry)
async def get_test(test_code: str, session: AsyncSession = Depends(get_session)):
    entry = await get_test_by_code(session, test_code)
    if not entry:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Test code {test_code} not found")
    return entry
