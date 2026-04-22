"""Per-payor calibration — emphasis, target word count, preferred guideline sources."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

_CALIBRATION_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "mnf" / "calibration" / "default.json"
)


class CalibrationParams(BaseModel):
    detail_level: str = "standard"  # "concise" | "standard" | "detailed"
    emphasize_family_history: bool = True
    emphasize_prior_testing: bool = False
    preferred_guideline_sources: list[str] = Field(default_factory=lambda: ["ACMG", "NCCN"])
    target_word_count: int = 220
    notes: str = ""


def _from_js(raw: dict) -> CalibrationParams:
    """Map the JS-style camelCase keys used in the seed JSON."""
    return CalibrationParams(
        detail_level=raw.get("detailLevel", "standard"),
        emphasize_family_history=raw.get("emphasizeFamilyHistory", True),
        emphasize_prior_testing=raw.get("emphasizePriorTesting", False),
        preferred_guideline_sources=list(raw.get("preferredGuidelineSources", ["ACMG", "NCCN"])),
        target_word_count=int(raw.get("targetWordCount", 220)),
        notes=raw.get("notes", ""),
    )


class PayorCalibrator:
    def __init__(self, path: Path = _CALIBRATION_PATH) -> None:
        self._path = path
        self._loaded = False
        self._payors: dict[str, CalibrationParams] = {}
        self._default = CalibrationParams()

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        with self._path.open() as f:
            data = json.load(f)
        for payor_id, raw in data.get("payors", {}).items():
            self._payors[payor_id] = _from_js(raw)
        if "defaults" in data:
            self._default = _from_js(data["defaults"])
        self._loaded = True
        logger.debug("PayorCalibrator loaded %d payors", len(self._payors))

    def get(self, payor_id: str) -> CalibrationParams:
        self._ensure_loaded()
        if payor_id in self._payors:
            return self._payors[payor_id]
        # Try uppercased / with/without _COMMERCIAL suffix
        upper = payor_id.upper()
        if upper in self._payors:
            return self._payors[upper]
        bare = upper.split("_", 1)[0]
        if bare in self._payors:
            return self._payors[bare]
        logger.debug("No calibration found for %s — using defaults", payor_id)
        return self._default
