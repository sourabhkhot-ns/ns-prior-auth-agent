"""Template registry — loads and selects payor form templates."""
from __future__ import annotations

import json
import logging
from pathlib import Path

from app.mnf.models import FormField, FormTemplate

logger = logging.getLogger(__name__)

_TEMPLATES_DIR = Path(__file__).resolve().parents[2] / "data" / "mnf" / "templates"


def _load_template_file(path: Path) -> FormTemplate:
    with path.open() as f:
        raw = json.load(f)
    # Tolerate camelCase JS-style keys in the seed JSON.
    fields = []
    for rf in raw["fields"]:
        fields.append(FormField(
            field_id=rf["fieldId"],
            label=rf["label"],
            field_type=rf.get("fieldType", "text"),
            required=rf.get("required", True),
            max_length=rf.get("maxLength"),
            options=rf.get("options"),
            data_source_hint=rf.get("dataSourceHint"),
            section=rf.get("section", ""),
            help_text=rf.get("helpText"),
        ))
    return FormTemplate(
        template_id=raw["templateId"],
        payor_id=raw["payorId"],
        payor_name=raw["payorName"],
        test_types=list(raw["testTypes"]),
        version=raw["version"],
        effective_date=raw["effectiveDate"],
        archived_date=raw.get("archivedDate"),
        fields=fields,
        justification_field_id=raw["justificationFieldId"],
    )


class TemplateRegistry:
    def __init__(self, directory: Path = _TEMPLATES_DIR) -> None:
        self._dir = directory
        self._loaded = False
        self._all: list[FormTemplate] = []

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        for path in sorted(self._dir.glob("*.json")):
            try:
                self._all.append(_load_template_file(path))
            except Exception as e:
                logger.error("Failed to load template %s: %s", path.name, e)
        self._loaded = True
        logger.debug("TemplateRegistry loaded %d templates", len(self._all))

    def list_all(self) -> list[FormTemplate]:
        self._ensure_loaded()
        return list(self._all)

    def find(self, payor_id: str, test_type: str) -> FormTemplate | None:
        """Find the current (non-archived) template for a payor + test type.

        Matching is generous: we also try without the _COMMERCIAL suffix and
        a case-insensitive payor id match so UHC / UHC_COMMERCIAL map to one
        template.
        """
        self._ensure_loaded()
        candidates = [t for t in self._all if t.archived_date is None]

        def payor_matches(t: FormTemplate) -> bool:
            a = t.payor_id.upper()
            b = payor_id.upper()
            if a == b:
                return True
            if a.split("_", 1)[0] == b.split("_", 1)[0]:
                return True
            return False

        for t in candidates:
            if test_type in t.test_types and payor_matches(t):
                return t
        return None

    def find_any_for_payor(self, payor_id: str) -> FormTemplate | None:
        """Fallback lookup: any non-archived template for this payor."""
        self._ensure_loaded()

        def payor_matches(t: FormTemplate) -> bool:
            a = t.payor_id.upper()
            b = payor_id.upper()
            return a == b or a.split("_", 1)[0] == b.split("_", 1)[0]

        for t in self._all:
            if t.archived_date is None and payor_matches(t):
                return t
        return None
