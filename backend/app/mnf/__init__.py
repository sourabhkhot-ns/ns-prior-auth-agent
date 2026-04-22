"""Medical Necessity Form (MNF) generation.

Produces payor-specific form drafts with:
- Field mapping from our Order → template fields
- 4-layer clinical narrative (patient / test / guideline / clinical utility) woven into a single justification paragraph
- ACMG / NCCN guideline citations
- Per-payor calibration
- PDF output

Separate from the letter_generator agent in app/agents/ — that one produces a
free-form markdown letter; this one produces a structured payor form.
"""
