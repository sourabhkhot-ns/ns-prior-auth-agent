from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PayorRuleDB
from app.models.rules import PayorRule, Criterion


async def find_payor_rule(
    session: AsyncSession,
    payor_name: str,
    test_category: str,
) -> PayorRule | None:
    """Find a payor rule by matching payor name (fuzzy) and test category."""
    # Try exact match on payor_code first
    result = await session.execute(select(PayorRuleDB))
    rows = result.scalars().all()

    payor_lower = payor_name.lower()
    for row in rows:
        # Match if the payor name or code contains the search term
        if (payor_lower in row.payor_name.lower()
                or payor_lower in row.payor_code.lower()
                or row.payor_name.lower() in payor_lower
                or row.payor_code.lower() in payor_lower):
            # Check test category match
            if test_category.upper() in row.test_category.upper() or row.test_category.upper() in test_category.upper():
                return _row_to_rule(row)

    # Fallback: return first rule matching test category
    for row in rows:
        if test_category.upper() in row.test_category.upper() or row.test_category.upper() in test_category.upper():
            return _row_to_rule(row)

    return None


async def get_all_payor_rules(session: AsyncSession) -> list[PayorRule]:
    result = await session.execute(select(PayorRuleDB))
    return [_row_to_rule(r) for r in result.scalars().all()]


def _row_to_rule(row: PayorRuleDB) -> PayorRule:
    return PayorRule(
        payor_name=row.payor_name,
        payor_code=row.payor_code,
        test_category=row.test_category,
        policy_version=row.policy_version or "",
        effective_date=row.effective_date,
        accepted_cpt_codes=row.accepted_cpt_codes or [],
        accepted_icd10_categories=row.accepted_icd10_categories or [],
        medical_necessity_criteria=[
            Criterion(**c) for c in (row.medical_necessity_criteria or [])
        ],
        required_documentation=row.required_documentation or [],
        ordering_provider_requirements=row.ordering_provider_requirements or [],
        prior_testing_requirements=row.prior_testing_requirements or [],
        submission_channel=row.submission_channel or "",
        submission_notes=row.submission_notes,
        exclusions=row.exclusions or [],
    )
