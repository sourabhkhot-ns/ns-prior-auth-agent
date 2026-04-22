"""Guideline store — loads ACMG/NCCN JSON and retrieves by test type + ICD-10."""
from __future__ import annotations

import json
import logging
from pathlib import Path

from app.mnf.models import GuidelineCitation

logger = logging.getLogger(__name__)

_GUIDELINES_DIR = Path(__file__).resolve().parents[2] / "data" / "mnf" / "guidelines"


class GuidelineStore:
    def __init__(self, directory: Path = _GUIDELINES_DIR) -> None:
        self._dir = directory
        self._entries: list[tuple[str, dict]] = []
        self._loaded = False

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        for path in sorted(self._dir.glob("*.json")):
            with path.open() as f:
                data = json.load(f)
            source = data.get("source", path.stem.upper())
            for entry in data.get("guidelines", []):
                self._entries.append((source, entry))
        self._loaded = True
        logger.debug("GuidelineStore loaded %d entries", len(self._entries))

    def find_relevant(
        self,
        test_type: str,
        icd10_codes: list[str],
        limit: int = 4,
    ) -> list[GuidelineCitation]:
        """Return guidelines matching on test_type AND at least one ICD-10 (prefix match)."""
        self._ensure_loaded()

        # Normalize our ICD codes: add prefixes (e.g. "Q21.1" → "Q21", "Q")
        normalized: set[str] = set()
        for code in icd10_codes:
            if not code:
                continue
            normalized.add(code.strip().upper())
            parts = code.strip().upper().split(".")
            normalized.add(parts[0])
            # Also letter prefix only (e.g. "Q21" → "Q")
            if len(parts[0]) >= 2:
                normalized.add(parts[0][:1])

        hits: list[GuidelineCitation] = []
        for source, entry in self._entries:
            if test_type not in entry.get("testTypes", []):
                continue
            indicator_codes = [c.upper() for c in entry.get("indications", [])]
            matched = False
            for ind in indicator_codes:
                if ind in normalized:
                    matched = True
                    break
                ind_prefix = ind.split(".")[0]
                if ind_prefix in normalized:
                    matched = True
                    break
            if not matched:
                continue
            hits.append(GuidelineCitation(
                id=entry["id"],
                source=source,
                title=entry["title"],
                year=entry.get("year", 0),
                excerpt=entry.get("excerpt", ""),
                key_points=entry.get("keyPoints", []),
            ))

        hits.sort(key=lambda g: (-g.year, g.source))
        return hits[:limit]
