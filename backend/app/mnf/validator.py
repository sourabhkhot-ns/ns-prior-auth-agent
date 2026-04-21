"""Completeness + format validation for a populated MNF draft."""
from __future__ import annotations

import re

from app.mnf.models import FormTemplate, PopulatedField


_NPI_RE = re.compile(r"^\d{10}$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_PHONE_RE = re.compile(r"[\d]")


def _is_empty(value) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and not value.strip():
        return True
    if isinstance(value, list) and not value:
        return True
    if isinstance(value, bool) and value is False:
        return False  # False is a valid boolean value — don't treat as empty
    return False


def validate(
    template: FormTemplate,
    populated: list[PopulatedField],
    justification: str,
) -> tuple[list[str], list[str]]:
    """Return (validation_errors, flags).

    Errors = things a reviewer must fix before submission (missing required fields,
    malformed formats).
    Flags = things the reviewer should double-check (low-confidence values,
    checkbox defaults to false for critical attestations).
    """
    by_id = {p.field_id: p for p in populated}
    errors: list[str] = []
    flags: list[str] = []

    for f in template.fields:
        pf = by_id.get(f.field_id)
        if pf is None:
            if f.required:
                errors.append(f"Field '{f.label}' is not populated")
            continue

        if f.required and _is_empty(pf.value) and f.field_type != "checkbox":
            errors.append(f"Required field '{f.label}' is missing")
            continue

        # Required checkboxes that are False → error (for attestations)
        if f.required and f.field_type == "checkbox" and pf.value is False:
            errors.append(
                f"Required attestation '{f.label}' is not confirmed"
            )
            continue

        # Format checks on populated values
        if pf.value and isinstance(pf.value, str):
            if f.field_type == "npi" and not _NPI_RE.match(pf.value.strip()):
                errors.append(
                    f"Invalid NPI format for '{f.label}' — must be exactly 10 digits"
                )
            elif f.field_type == "date" and not _DATE_RE.match(pf.value.strip()):
                errors.append(
                    f"Invalid date format for '{f.label}' — expected YYYY-MM-DD"
                )
            elif f.field_type == "phone" and not _PHONE_RE.search(pf.value):
                errors.append(f"Invalid phone number for '{f.label}'")
            elif f.max_length and len(pf.value) > f.max_length:
                errors.append(
                    f"'{f.label}' exceeds max length ({len(pf.value)} > {f.max_length})"
                )

        # Low confidence → flag, not error
        if pf.confidence == "low" and not _is_empty(pf.value):
            flags.append(f"Low-confidence value for '{f.label}' — verify")
        if pf.confidence == "manual" and _is_empty(pf.value) and f.required:
            flags.append(f"'{f.label}' requires manual entry before submission")
        if pf.flag_reason:
            flags.append(pf.flag_reason)

    if not justification.strip():
        errors.append("Justification narrative is empty")
    elif len(justification.split()) < 80:
        flags.append(
            f"Justification is short ({len(justification.split())} words) — "
            "payor reviewers expect at least 150 words"
        )

    # Deduplicate flags
    seen: set[str] = set()
    unique_flags: list[str] = []
    for f in flags:
        if f not in seen:
            seen.add(f)
            unique_flags.append(f)

    return errors, unique_flags
