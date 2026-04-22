"""Render a DraftForm to PDF via ReportLab."""
from __future__ import annotations

from io import BytesIO

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)

from app.mnf.models import DraftForm, PopulatedField


def _stringify(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "☑ Yes" if value else "☐ No"
    if isinstance(value, list):
        return ", ".join(str(v) for v in value)
    return str(value)


def _fields_by_section(fields: list, populated: dict[str, PopulatedField]) -> dict[str, list]:
    sections: dict[str, list] = {}
    for f in fields:
        section = f.section or "Form"
        sections.setdefault(section, []).append(f)
    return sections


def render_pdf(draft: DraftForm) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=0.7 * inch,
        rightMargin=0.7 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        title=f"MNF — {draft.template.payor_name} — {draft.order_id}",
        author="Prior Auth Agent",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name="Title",
        parent=styles["Title"],
        fontSize=14,
        spaceAfter=6,
        textColor=colors.HexColor("#18181b"),
    )
    subtitle_style = ParagraphStyle(
        name="Subtitle",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#52525b"),
        spaceAfter=14,
    )
    section_style = ParagraphStyle(
        name="Section",
        parent=styles["Heading3"],
        fontSize=10,
        textColor=colors.HexColor("#2563eb"),
        spaceBefore=10,
        spaceAfter=4,
        uppercase=0,
    )
    body_style = ParagraphStyle(
        name="Body",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#18181b"),
    )
    narrative_style = ParagraphStyle(
        name="Narrative",
        parent=body_style,
        fontSize=10,
        leading=14,
        spaceBefore=4,
        spaceAfter=10,
    )

    story = []

    # Header
    story.append(Paragraph(
        f"Medical Necessity Form — {draft.template.payor_name}",
        title_style,
    ))
    story.append(Paragraph(
        f"Template {draft.template.template_id} v{draft.template.version} "
        f"(effective {draft.template.effective_date}) · Draft {draft.draft_id} · "
        f"Order {draft.order_id}",
        subtitle_style,
    ))

    populated_map = {p.field_id: p for p in draft.fields}

    for section, fields in _fields_by_section(draft.template.fields, populated_map).items():
        story.append(Paragraph(section, section_style))

        rows: list[list] = []
        for f in fields:
            if f.field_id == draft.template.justification_field_id:
                continue  # render narrative separately
            pf = populated_map.get(f.field_id)
            value = _stringify(pf.value) if pf else ""
            if not value and pf and pf.confidence == "manual":
                value = "— [MANUAL ENTRY REQUIRED] —"
            label = f.label + (" *" if f.required else "")
            rows.append([
                Paragraph(f"<font size=8 color='#52525b'>{label}</font>", body_style),
                Paragraph(value or "&nbsp;", body_style),
            ])

        if rows:
            t = Table(rows, colWidths=[2.0 * inch, 4.8 * inch])
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#e4e4e7")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(t)
            story.append(Spacer(1, 4))

    # Justification narrative
    story.append(PageBreak())
    story.append(Paragraph("Medical Necessity Justification", section_style))
    if draft.justification_text:
        story.append(Paragraph(draft.justification_text, narrative_style))
    else:
        story.append(Paragraph(
            "<i>Justification not yet generated.</i>", narrative_style,
        ))

    if draft.guidelines_cited:
        story.append(Paragraph("Guidelines Cited", section_style))
        for g in draft.guidelines_cited:
            story.append(Paragraph(
                f"<b>[{g.source} {g.year}]</b> {g.title}",
                body_style,
            ))
            if g.excerpt:
                story.append(Paragraph(
                    f"<font color='#52525b'>{g.excerpt}</font>",
                    body_style,
                ))
            story.append(Spacer(1, 6))

    if draft.validation_errors:
        story.append(Paragraph(
            "<font color='#dc2626'><b>Reviewer: resolve before submission</b></font>",
            section_style,
        ))
        for e in draft.validation_errors:
            story.append(Paragraph(f"• {e}", body_style))

    if draft.pending_entry:
        story.append(Paragraph(
            "<font color='#2563eb'><b>Reviewer: complete before signing</b></font>",
            section_style,
        ))
        for p in draft.pending_entry:
            story.append(Paragraph(f"• {p}", body_style))

    if draft.flags:
        story.append(Paragraph(
            "<font color='#ca8a04'><b>Reviewer: verify</b></font>",
            section_style,
        ))
        for fl in draft.flags:
            story.append(Paragraph(f"• {fl}", body_style))

    doc.build(story)
    return buf.getvalue()
