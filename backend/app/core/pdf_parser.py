from __future__ import annotations

import pymupdf


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text content from a PDF file."""
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page in doc:
        pages.append(page.get_text())
    doc.close()
    return "\n\n---PAGE BREAK---\n\n".join(pages)
