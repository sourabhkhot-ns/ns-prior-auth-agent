"use client";

import { useState } from "react";
import type { LetterData, LetterMode } from "../page";

interface LetterCardProps {
  letter: LetterData | null;
  refusalReason: string | null;
  canRegenerate: boolean;
  onRegenerate: (mode: LetterMode) => void;
  regenerating: boolean;
}

const MODE_LABEL: Record<LetterMode, string> = {
  draft: "Draft",
  placeholder: "Placeholder",
  override: "Override",
};

const MODE_TONE: Record<LetterMode, string> = {
  draft: "text-[var(--success)] border-[var(--success)]/30 bg-[var(--success)]/8",
  placeholder: "text-[var(--warning)] border-[var(--warning)]/30 bg-[var(--warning)]/8",
  override: "text-[var(--error)] border-[var(--error)]/30 bg-[var(--error)]/8",
};

/**
 * Minimal markdown → styled JSX. Only handles the subset our letter agent
 * actually emits: ## headings, paragraphs, - / * bullets, --- horizontal rule.
 * No raw HTML, no inline links — the input is produced by our own prompt.
 */
function renderMarkdown(md: string): React.ReactElement[] {
  const lines = md.split("\n");
  const out: React.ReactElement[] = [];
  let bulletBuffer: string[] = [];
  let paraBuffer: string[] = [];

  const flushPara = () => {
    if (paraBuffer.length > 0) {
      const text = paraBuffer.join(" ").trim();
      if (text) {
        out.push(
          <p
            key={`p-${out.length}`}
            className="text-sm text-[var(--foreground)]/90 leading-relaxed mb-3"
          >
            {renderInline(text)}
          </p>
        );
      }
      paraBuffer = [];
    }
  };

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      out.push(
        <ul
          key={`ul-${out.length}`}
          className="list-disc pl-5 space-y-1 mb-3 text-sm text-[var(--foreground)]/90 leading-relaxed"
        >
          {bulletBuffer.map((b, i) => (
            <li key={i}>{renderInline(b)}</li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushBullets();
      continue;
    }
    if (line.startsWith("## ")) {
      flushPara();
      flushBullets();
      out.push(
        <h3
          key={`h-${out.length}`}
          className="text-xs font-semibold tracking-widest uppercase text-[var(--muted)] mt-6 mb-3 first:mt-0"
        >
          {line.slice(3)}
        </h3>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      flushPara();
      flushBullets();
      out.push(
        <h2
          key={`h-${out.length}`}
          className="text-base font-semibold text-[var(--foreground)] mt-6 mb-3 first:mt-0"
        >
          {line.slice(2)}
        </h2>
      );
      continue;
    }
    if (line.trim() === "---") {
      flushPara();
      flushBullets();
      out.push(
        <hr
          key={`hr-${out.length}`}
          className="my-5 border-t border-dashed border-[var(--border)]"
        />
      );
      continue;
    }
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushPara();
      bulletBuffer.push(bulletMatch[1]);
      continue;
    }
    flushBullets();
    paraBuffer.push(line);
  }
  flushPara();
  flushBullets();
  return out;
}

/** Inline: **bold** and [EVIDENCE NEEDED: …] highlight. */
function renderInline(text: string): React.ReactNode[] {
  // First split on the [EVIDENCE NEEDED:] markers so they get highlighted.
  const nodes: React.ReactNode[] = [];
  const re = /\[EVIDENCE NEEDED:[^\]]*\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(...renderBold(text.slice(last, m.index), nodes.length));
    }
    nodes.push(
      <mark
        key={`ev-${nodes.length}`}
        className="bg-[var(--warning)]/15 text-[var(--warning)] px-1 rounded text-[11px] font-medium"
      >
        {m[0]}
      </mark>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(...renderBold(text.slice(last), nodes.length));
  }
  return nodes;
}

function renderBold(text: string, offset: number): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={`b-${offset}-${i}`} className="font-semibold text-[var(--foreground)]">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={`t-${offset}-${i}`}>{p}</span>
    )
  );
}

export function LetterCard({
  letter,
  refusalReason,
  canRegenerate,
  onRegenerate,
  regenerating,
}: LetterCardProps) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!letter) return;
    navigator.clipboard.writeText(letter.body_markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };

  if (!letter && refusalReason) {
    return (
      <div className="animate-slide-in mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--muted)]">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 4v3.5M7 10v.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] tracking-widest uppercase text-[var(--muted)] font-medium">
            Medical necessity letter
          </span>
        </div>
        <p className="text-xs text-[var(--foreground)]/80 leading-relaxed mb-3">
          {refusalReason}
        </p>
        {canRegenerate && (
          <button
            onClick={() => onRegenerate("override")}
            disabled={regenerating}
            className="text-[11px] px-3 py-1.5 rounded border border-[var(--error)]/40 text-[var(--error)] hover:bg-[var(--error)]/8 transition-colors disabled:opacity-50"
          >
            {regenerating ? "Generating…" : "Generate anyway (override)"}
          </button>
        )}
      </div>
    );
  }

  if (!letter) return null;

  const issuedAt = new Date(letter.generated_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="animate-slide-in mt-6 rounded-lg border border-[var(--border)] bg-[var(--background)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 min-w-0 group"
        >
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            className={`text-[var(--muted)] transition-transform shrink-0 ${open ? "rotate-90" : ""}`}
          >
            <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] tracking-widest uppercase text-[var(--muted)] font-medium group-hover:text-[var(--foreground)] transition-colors">
            Medical necessity letter
          </span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${MODE_TONE[letter.mode]}`}
          >
            {MODE_LABEL[letter.mode]}
          </span>
        </button>
        <button
          onClick={handleCopy}
          className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors shrink-0"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {open && (
        <div className="animate-fade-in">
          {/* Meta */}
          <div className="px-5 pt-4 pb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--muted)] border-b border-[var(--border)]">
            <span>
              <span className="text-[var(--muted-soft)]">Payor </span>
              <span className="text-[var(--foreground)]">{letter.payor_name}</span>
            </span>
            <span>
              <span className="text-[var(--muted-soft)]">Policy </span>
              <span className="font-mono text-[var(--foreground)]">{letter.policy_id}</span>
              <span className="text-[var(--muted-soft)]"> v{letter.policy_version}</span>
            </span>
            <span>
              <span className="text-[var(--muted-soft)]">CPT </span>
              <span className="font-mono text-[var(--foreground)]">
                {letter.cpt_codes.join(", ") || "—"}
              </span>
            </span>
            <span className="text-[var(--muted-soft)]">{issuedAt}</span>
          </div>

          {/* Warnings */}
          {letter.warnings.length > 0 && (
            <div className="px-5 pt-3 space-y-1.5">
              {letter.warnings.map((w, i) => (
                <p
                  key={i}
                  className="text-[11px] text-[var(--warning)] leading-relaxed pl-2 border-l-2 border-[var(--warning)]/40"
                >
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Known issues (override) */}
          {letter.known_issues.length > 0 && (
            <div className="px-5 pt-4">
              <div className="rounded-md border border-[var(--error)]/30 bg-[var(--error)]/8 px-4 py-3">
                <div className="text-[10px] tracking-widest uppercase text-[var(--error)] font-semibold mb-2">
                  Known issues at time of submission
                </div>
                <ul className="space-y-1.5">
                  {letter.known_issues.map((i, idx) => (
                    <li key={idx} className="text-[11px] text-[var(--foreground)]/90">
                      <span className="font-mono text-[var(--error)] mr-2">
                        [{i.severity}]
                      </span>
                      {i.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-5 py-5">
            <div className="max-w-none">
              {renderMarkdown(letter.body_markdown)}
            </div>
          </div>

          {/* Footer actions */}
          {canRegenerate && (
            <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
              <span className="text-[10px] text-[var(--muted)]">Regenerate as</span>
              <div className="flex items-center gap-2">
                {(["draft", "placeholder", "override"] as LetterMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => onRegenerate(m)}
                    disabled={regenerating || m === letter.mode}
                    className={`text-[10px] px-2.5 py-1 rounded border transition-colors ${
                      m === letter.mode
                        ? "border-[var(--border)] text-[var(--muted-soft)] cursor-default"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                    }`}
                  >
                    {MODE_LABEL[m]}
                  </button>
                ))}
                {regenerating && (
                  <span className="text-[10px] text-[var(--muted)]">working…</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
