"use client";

import { useState } from "react";
import type { EvaluationData } from "../page";

interface EvaluationResultProps {
  data: EvaluationData;
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    HIGH: "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20",
    MEDIUM: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
    LOW: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[risk] || colors.HIGH}`}>
      {risk}
    </span>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    CRITICAL: "bg-[var(--error)]",
    WARNING: "bg-[var(--warning)]",
    INFO: "bg-[var(--accent)]",
  };
  return <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${colors[severity] || colors.INFO}`} />;
}

function Section({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-t border-[var(--border)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs hover:bg-[var(--surface)] transition-colors"
      >
        <span className="text-[var(--muted)]">{title}</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function EvaluationResult({ data }: EvaluationResultProps) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted)]">Denial Risk</span>
            <RiskBadge risk={data.denial_risk} />
          </div>
          <p className="text-xs text-[var(--foreground)] mt-3 leading-relaxed max-w-2xl">
            {data.summary}
          </p>
        </div>
      </div>

      {/* Issues */}
      {data.issues.length > 0 && (
        <Section title={`Issues (${data.issues.length})`} defaultOpen>
          <div className="space-y-3">
            {data.issues.map((issue, i) => (
              <div key={i} className="flex gap-2.5">
                <SeverityDot severity={issue.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--foreground)]">
                      {issue.severity}
                    </span>
                    <span className="text-xs text-[var(--muted)]">{issue.category}</span>
                  </div>
                  <p className="text-xs text-[var(--foreground)]/80 mt-1 leading-relaxed">
                    {issue.description}
                  </p>
                  {issue.resolution && (
                    <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                      {issue.resolution}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Code Evaluation */}
      <Section title="Code Evaluation">
        <div className="space-y-2">
          {data.code_evaluation.icd10_results.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`text-xs font-mono mt-0.5 ${
                r.status === "ACCEPTED" ? "text-[var(--success)]" :
                r.status === "REJECTED" ? "text-[var(--error)]" :
                "text-[var(--warning)]"
              }`}>
                {r.status === "ACCEPTED" ? "+" : r.status === "REJECTED" ? "x" : "?"}
              </span>
              <div>
                <span className="text-xs font-medium">{r.code}</span>
                <span className="text-xs text-[var(--muted)] ml-2">{r.description}</span>
                <p className="text-xs text-[var(--muted)] mt-0.5">{r.reason}</p>
              </div>
            </div>
          ))}
          {data.code_evaluation.cpt_results.map((r, i) => (
            <div key={`cpt-${i}`} className="flex items-start gap-2">
              <span className={`text-xs font-mono mt-0.5 ${
                r.status === "ACCEPTED" ? "text-[var(--success)]" : "text-[var(--error)]"
              }`}>
                {r.status === "ACCEPTED" ? "+" : "x"}
              </span>
              <div>
                <span className="text-xs font-medium">CPT {r.code}</span>
                <span className="text-xs text-[var(--muted)] ml-2">{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Criteria Evaluation */}
      <Section title={`Medical Necessity (${data.criteria_evaluation.overall_met ? "Met" : "Not Met"})`}>
        <p className="text-xs text-[var(--muted)] mb-3">{data.criteria_evaluation.summary}</p>
        <div className="space-y-1.5">
          {data.criteria_evaluation.criteria_results.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`text-xs font-mono mt-0.5 ${r.met ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                {r.met ? "+" : "x"}
              </span>
              <div>
                <span className="text-xs text-[var(--foreground)]/80">{r.criterion}</span>
                {r.evidence && (
                  <p className="text-xs text-[var(--muted)] mt-0.5">{r.evidence}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Gap Report */}
      <Section title="Documentation Gaps">
        <div className="space-y-2">
          {[...data.gap_report.missing_documents, ...data.gap_report.missing_clinical_info].map((g, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`text-xs font-mono mt-0.5 ${
                g.status === "PRESENT" ? "text-[var(--success)]" :
                g.status === "MISSING" ? "text-[var(--error)]" :
                "text-[var(--warning)]"
              }`}>
                {g.status === "PRESENT" ? "+" : g.status === "MISSING" ? "x" : "~"}
              </span>
              <div>
                <span className="text-xs font-medium">{g.requirement}</span>
                <p className="text-xs text-[var(--muted)] mt-0.5">{g.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
