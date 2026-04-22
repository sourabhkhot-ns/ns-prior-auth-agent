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
) -> tuple[list[str], list[str], list[str]]:
    """Return (validation_errors, flags, pending_entry).

    - errors: genuine problems — malformed formats, attestation checkboxes not
      confirmed, required data that was expected to auto-populate but came up
      empty (member ID, DOB, etc.).
    - flags: things the reviewer should double-check (low-confidence values,
      fallback-template usage).
    - pending_entry: required fields the pipeline intentionally doesn't fill
      (signatures, NPI, lab info, dates the reviewer stamps at sign-off) — these
      are expected to remain empty at draft time and the clinician fills them
      before signing. Not errors.
    """
    by_id = {p.field_id: p for p in populated}
    errors: list[str] = []
    flags: list[str] = []
    pending: list[str] = []

    for f in template.fields:
        pf = by_id.get(f.field_id)
        if pf is None:
            if f.required:
                errors.append(f"Field '{f.label}' is not populated")
            continue

        is_empty = _is_empty(pf.value)

        if f.required and is_empty and f.field_type != "checkbox":
            # confidence == "manual" means the pipeline knows this field has no
            # source in the Order and is expected to be filled in by the reviewer.
            # That's a pending-entry, not a validation error.
            if pf.confidence == "manual":
                pending.append(f"'{f.label}' — complete before signing")
            else:
                errors.append(f"Required field '{f.label}' is missing")
            continue

        # Required checkboxes that are False → error (attestations like
        # "informed consent on file" must be actively confirmed before signing).
        if f.required and f.field_type == "checkbox" and pf.value is False:
            errors.append(f"Required attestation '{f.label}' is not confirmed")
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

        # Low confidence (populated but uncertain) → flag
        if pf.confidence == "low" and not is_empty:
            flags.append(f"Low-confidence value for '{f.label}' — verify")
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

    return errors, unique_flags, pending
