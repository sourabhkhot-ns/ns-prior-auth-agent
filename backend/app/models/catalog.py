from __future__ import annotations

from pydantic import BaseModel, Field


class TestCatalogEntry(BaseModel):
    test_code: str
    test_name: str
    cpt_codes: list[str] = Field(default_factory=list)  # e.g., ["81415x1", "81416x2"]
    description: str = ""
    category: str = ""  # WES, WGS, Panel, etc.
    price: float | None = None
    turnaround_time: str | None = None
