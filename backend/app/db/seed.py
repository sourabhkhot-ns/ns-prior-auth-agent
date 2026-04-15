"""Seed the database with payor rules and test catalog from JSON files."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Base, TestCatalogDB, PayorRuleDB
from app.db.database import engine, async_session

SEED_DIR = Path(__file__).parent.parent.parent / "seed_data"


async def seed_test_catalog(session: AsyncSession) -> int:
    catalog_file = SEED_DIR / "catalogs" / "sample_test_catalog.json"
    if not catalog_file.exists():
        return 0

    with open(catalog_file) as f:
        entries = json.load(f)

    count = 0
    for entry in entries:
        existing = await session.execute(
            select(TestCatalogDB).where(TestCatalogDB.test_code == entry["test_code"])
        )
        if existing.scalar_one_or_none():
            continue

        session.add(TestCatalogDB(
            test_code=entry["test_code"],
            test_name=entry["test_name"],
            cpt_codes=entry.get("cpt_codes", []),
            description=entry.get("description", ""),
            category=entry.get("category", ""),
            price=entry.get("price"),
            turnaround_time=entry.get("turnaround_time"),
        ))
        count += 1

    await session.commit()
    return count


async def seed_payor_rules(session: AsyncSession) -> int:
    payors_dir = SEED_DIR / "payors"
    if not payors_dir.exists():
        return 0

    count = 0
    for rule_file in payors_dir.glob("*.json"):
        with open(rule_file) as f:
            rule = json.load(f)

        existing = await session.execute(
            select(PayorRuleDB).where(
                PayorRuleDB.payor_code == rule["payor_code"],
                PayorRuleDB.test_category == rule["test_category"],
            )
        )
        if existing.scalar_one_or_none():
            continue

        session.add(PayorRuleDB(
            payor_name=rule["payor_name"],
            payor_code=rule["payor_code"],
            test_category=rule["test_category"],
            policy_version=rule.get("policy_version", ""),
            effective_date=date.fromisoformat(rule["effective_date"]) if rule.get("effective_date") else None,
            accepted_cpt_codes=rule.get("accepted_cpt_codes", []),
            accepted_icd10_categories=rule.get("accepted_icd10_categories", []),
            medical_necessity_criteria=rule.get("medical_necessity_criteria", []),
            required_documentation=rule.get("required_documentation", []),
            ordering_provider_requirements=rule.get("ordering_provider_requirements", []),
            prior_testing_requirements=rule.get("prior_testing_requirements", []),
            submission_channel=rule.get("submission_channel", ""),
            submission_notes=rule.get("submission_notes"),
            exclusions=rule.get("exclusions", []),
        ))
        count += 1

    await session.commit()
    return count


async def init_db_and_seed():
    """Create tables and seed initial data."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        catalog_count = await seed_test_catalog(session)
        rules_count = await seed_payor_rules(session)
        return {"catalog_entries": catalog_count, "payor_rules": rules_count}
