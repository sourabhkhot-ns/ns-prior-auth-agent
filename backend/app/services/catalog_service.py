from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import TestCatalogDB
from app.models.catalog import TestCatalogEntry


async def get_test_by_code(session: AsyncSession, test_code: str) -> TestCatalogEntry | None:
    result = await session.execute(
        select(TestCatalogDB).where(TestCatalogDB.test_code == test_code)
    )
    row = result.scalar_one_or_none()
    if not row:
        return None
    return TestCatalogEntry(
        test_code=row.test_code,
        test_name=row.test_name,
        cpt_codes=row.cpt_codes or [],
        description=row.description or "",
        category=row.category or "",
        price=row.price,
        turnaround_time=row.turnaround_time,
    )


async def get_all_tests(session: AsyncSession) -> list[TestCatalogEntry]:
    result = await session.execute(select(TestCatalogDB))
    rows = result.scalars().all()
    return [
        TestCatalogEntry(
            test_code=r.test_code,
            test_name=r.test_name,
            cpt_codes=r.cpt_codes or [],
            description=r.description or "",
            category=r.category or "",
            price=r.price,
            turnaround_time=r.turnaround_time,
        )
        for r in rows
    ]
