"use client";

import { useState, useEffect, useRef } from "react";
import type { EvaluationData } from "../page";

interface EvaluationResultProps {
  data: EvaluationData;
}

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, string> = {
    HIGH: "bg-[var(--error)]/15 text-[var(--error)] border-[var(--error)]/30",
    MEDIUM: "bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30",
    LOW: "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30",
  };
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded border ${styles[risk] || styles.HIGH}`}>
      {risk} RISK
    </span>
  );
}

function SeverityTag({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    CRITICAL: "text-[var(--error)]",
    WARNING: "text-[var(--warning)]",
    INFO: "text-[var(--accent)]",
  };
  const icons: Record<string, string> = {
    CRITICAL: "!!",
    WARNING: "!",
    INFO: "i",
  };
  return (
    <span className={`text-[10px] font-bold ${styles[severity] || styles.INFO}`}>
      [{icons[severity] || "i"}]
    </span>
  );
}

function Section({
  title,
  count,
  defaultOpen,
  delay,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  delay?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay || 0);
    return () => clearTimeout(t);
  }, [delay]);

  if (!visible) return null;

  return (
    <div className="animate-slide-in">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-3 text-xs group"
      >
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-[var(--muted)]">({count})</span>
        )}
      </button>
      {open && (
        <div className="pl-5 pb-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

function CodeLine({ symbol, color, label, sublabel, detail }: {
  symbol: string;
  color: string;
  label: string;
  sublabel?: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className={`text-xs font-mono shrink-0 ${color}`}>{symbol}</span>
      <div className="min-w-0">
        <span className="text-xs">{label}</span>
        {sublabel && <span className="text-xs text-[var(--muted)] ml-1.5">{sublabel}</span>}
        {detail && <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">{detail}</p>}
      </div>
    </div>
  );
}

export function EvaluationResult({ data }: EvaluationResultProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div ref={containerRef} className="space-y-1 pt-2">
      {/* Risk + Summary */}
      <div className="animate-slide-in py-3">
        <RiskBadge risk={data.denial_risk} />
        <p className="text-xs text-[var(--foreground)]/90 mt-4 leading-relaxed max-w-2xl">
          {data.summary}
        </p>
      </div>

      {/* Issues */}
      {data.issues.length > 0 && (
        <Section title="Issues to resolve" count={data.issues.length} defaultOpen delay={100}>
          <div className="space-y-4">
            {data.issues.map((issue, i) => (
              <div key={i} className="animate-slide-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-start gap-2">
                  <SeverityTag severity={issue.severity} />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-[var(--muted)]">{issue.category}</span>
                    <p className="text-xs text-[var(--foreground)] mt-1 leading-relaxed">
                      {issue.description}
                    </p>
                    {issue.resolution && (
                      <p className="text-[11px] text-[var(--muted)] mt-2 leading-relaxed pl-3 border-l-2 border-[var(--border)]">
                        {issue.resolution}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Code Evaluation */}
      <Section title="Code evaluation" delay={200}>
        <div className="space-y-0.5">
          {data.code_evaluation.icd10_results.map((r, i) => (
            <CodeLine
              key={`icd-${i}`}
              symbol={r.status === "ACCEPTED" ? "+" : r.status === "REJECTED" ? "x" : "?"}
              color={
                r.status === "ACCEPTED" ? "text-[var(--success)]" :
                r.status === "REJECTED" ? "text-[var(--error)]" :
                "text-[var(--warning)]"
              }
              label={r.code}
              sublabel={r.description}
              detail={r.reason}
            />
          ))}
          {data.code_evaluation.cpt_results.map((r, i) => (
            <CodeLine
              key={`cpt-${i}`}
              symbol={r.status === "ACCEPTED" ? "+" : "x"}
              color={r.status === "ACCEPTED" ? "text-[var(--success)]" : "text-[var(--error)]"}
              label={`CPT ${r.code}`}
              sublabel={r.status}
            />
          ))}
        </div>
      </Section>

      {/* Criteria */}
      <Section
        title={`Medical necessity \u2014 ${data.criteria_evaluation.overall_met ? "met" : "not met"}`}
        delay={300}
      >
        <p className="text-[11px] text-[var(--muted)] mb-3 leading-relaxed">{data.criteria_evaluation.summary}</p>
        <div className="space-y-0.5">
          {data.criteria_evaluation.criteria_results.map((r, i) => (
            <CodeLine
              key={i}
              symbol={r.met === "met" ? "+" : r.met === "partial" ? "~" : "x"}
              color={
                r.met === "met" ? "text-[var(--success)]" :
                r.met === "partial" ? "text-[var(--warning)]" :
                "text-[var(--error)]"
              }
              label={r.criterion}
              detail={r.evidence}
            />
          ))}
        </div>
      </Section>

      {/* Gaps */}
      <Section
        title="Documentation gaps"
        count={
          [...data.gap_report.missing_documents, ...data.gap_report.missing_clinical_info]
            .filter(g => g.status === "MISSING").length
        }
        delay={400}
      >
        <div className="space-y-0.5">
          {[...data.gap_report.missing_documents, ...data.gap_report.missing_clinical_info].map((g, i) => (
            <CodeLine
              key={i}
              symbol={g.status === "PRESENT" ? "+" : g.status === "MISSING" ? "x" : "~"}
              color={
                g.status === "PRESENT" ? "text-[var(--success)]" :
                g.status === "MISSING" ? "text-[var(--error)]" :
                "text-[var(--warning)]"
              }
              label={g.requirement}
              detail={g.detail}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
