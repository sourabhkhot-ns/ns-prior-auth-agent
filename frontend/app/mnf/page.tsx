"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MnfFieldGroup } from "../components/mnf-field-group";
import { MnfLayersCard } from "../components/mnf-layers-card";
import { MnfGuidelines } from "../components/mnf-guidelines";
import { AgentPipeline } from "../components/agent-pipeline";
import type { AgentStatus, AgentUpdate } from "../page";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export interface MnfField {
  field_id: string;
  label: string;
  field_type: string;
  required: boolean;
  max_length: number | null;
  options: string[] | null;
  data_source_hint: string | null;
  section: string;
  help_text: string | null;
}

export interface MnfPopulatedField {
  field_id: string;
  value: string | boolean | string[] | null;
  confidence: "high" | "medium" | "low" | "manual";
  source: string;
  flag_reason: string | null;
}

export interface MnfTemplate {
  template_id: string;
  payor_id: string;
  payor_name: string;
  test_types: string[];
  version: string;
  effective_date: string;
  justification_field_id: string;
  fields: MnfField[];
}

export interface MnfGuidelineCitation {
  id: string;
  source: string;
  title: string;
  year: number;
  excerpt: string;
  key_points: string[];
}

export interface MnfLayers {
  patient: string;
  test: string;
  guideline: string;
  clinical_utility: string;
}

export interface MnfDraft {
  draft_id: string;
  order_id: string;
  evaluation_id: string | null;
  template: MnfTemplate;
  fields: MnfPopulatedField[];
  justification_text: string;
  justification_layers: MnfLayers;
  guidelines_cited: MnfGuidelineCitation[];
  validation_errors: string[];
  flags: string[];
  pending_entry: string[];
  status: string;
  created_at: string;
}

export default function MnfPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<MnfDraft | null>(null);
  const [agents, setAgents] = useState<AgentUpdate[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, MnfPopulatedField["value"]>>({});
  const [editedNarrative, setEditedNarrative] = useState<string | null>(null);
  const startedRef = useRef(false);

  const processStream = useCallback(async (response: Response) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error("No response body");

    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let eventType = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith("data: ") && eventType) {
          try {
            const data = JSON.parse(line.slice(6));
            handleSSE(eventType, data);
          } catch {
            /* malformed line — skip */
          }
          eventType = "";
        }
      }
    }
  }, []);

  const handleSSE = (event: string, data: unknown) => {
    if (event === "pipeline") {
      const payload = data as { agents: AgentUpdate[] };
      setAgents(payload.agents);
    } else if (event === "agent_update") {
      const u = data as { id: string; label: string; status: AgentStatus; message?: string };
      setAgents((prev) => prev.map((a) => (a.id === u.id ? { ...a, ...u } : a)));
    } else if (event === "result") {
      setDraft(data as MnfDraft);
    } else if (event === "error") {
      setError((data as { message?: string }).message || "Unknown error");
    }
  };

  const generate = useCallback(async () => {
    let payload: { order: unknown; evaluation: unknown } | null = null;
    try {
      const raw = sessionStorage.getItem("mnfHandoff");
      if (!raw) {
        setError("No order handoff found. Run an evaluation first, then click Generate.");
        return;
      }
      payload = JSON.parse(raw);
    } catch (err) {
      setError(`Handoff payload could not be parsed: ${err instanceof Error ? err.message : "unknown"}`);
      return;
    }

    setIsRunning(true);
    setError(null);
    setDraft(null);
    setAgents([]);
    setEditedFields({});
    setEditedNarrative(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/mnf/generate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      await processStream(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  }, [processStream]);

  // Auto-start on mount, guard against StrictMode double-invocation.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void generate();
  }, [generate]);

  const mergedDraft = useMemo<MnfDraft | null>(() => {
    if (!draft) return null;
    return {
      ...draft,
      fields: draft.fields.map((f) =>
        f.field_id in editedFields ? { ...f, value: editedFields[f.field_id] } : f
      ),
      justification_text: editedNarrative ?? draft.justification_text,
    };
  }, [draft, editedFields, editedNarrative]);

  const onFieldChange = useCallback(
    (fieldId: string, value: MnfPopulatedField["value"]) => {
      setEditedFields((prev) => ({ ...prev, [fieldId]: value }));
    },
    []
  );

  const downloadPdf = async () => {
    if (!mergedDraft) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/mnf/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: mergedDraft }),
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MNF_${mergedDraft.template.payor_id}_${mergedDraft.order_id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`PDF download failed: ${err instanceof Error ? err.message : "unknown"}`);
    }
  };

  const sectionsOrder = useMemo(() => {
    if (!draft) return [];
    const seen = new Set<string>();
    const order: string[] = [];
    for (const f of draft.template.fields) {
      const s = f.section || "Form";
      if (!seen.has(s)) {
        seen.add(s);
        order.push(s);
      }
    }
    return order;
  }, [draft]);

  const justificationFieldId = draft?.template.justification_field_id;

  return (
    <main className="flex flex-col min-h-screen max-w-4xl mx-auto w-full">
      {/* Header */}
      <header className="shrink-0 px-6 pt-6 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-xs inline-flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to evaluation
            </button>
            <span className="text-[var(--muted)]">·</span>
            <h1 className="text-xs font-medium tracking-widest uppercase text-[var(--muted)]">
              Medical Necessity Form
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--accent)]/30"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="flex-1 px-6 py-6 space-y-5">
        {/* Pipeline view — visible while agents are streaming */}
        {(isRunning || agents.length > 0) && !mergedDraft && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-[10px] tracking-widest uppercase text-[var(--muted)] font-medium">
                MNF pipeline
              </span>
            </div>
            <AgentPipeline agents={agents} />
          </div>
        )}

        {!isRunning && error && (
          <div className="border-l-2 border-[var(--error)] pl-4 py-2 animate-slide-in">
            <p className="text-xs text-[var(--error)] mb-2">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="text-[10px] px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--muted)] transition-colors"
            >
              Return to evaluation
            </button>
          </div>
        )}

        {mergedDraft && (
          <>
            {/* Summary bar */}
            <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2 animate-slide-in">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Payor</div>
                <div className="text-sm text-[var(--foreground)]">{mergedDraft.template.payor_name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Template</div>
                <div className="text-sm font-mono text-[var(--foreground)]">
                  {mergedDraft.template.template_id} v{mergedDraft.template.version}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Order</div>
                <div className="text-sm font-mono text-[var(--foreground)]">{mergedDraft.order_id}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Draft</div>
                <div className="text-sm font-mono text-[var(--foreground)]">{mergedDraft.draft_id}</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={generate}
                  disabled={isRunning}
                  className="text-[10px] px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--muted)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
                >
                  {isRunning ? "Regenerating…" : "Regenerate"}
                </button>
                <button
                  onClick={downloadPdf}
                  className="text-[10px] px-3 py-1.5 rounded bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 font-medium"
                >
                  Download PDF
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1V7M5 7L2.5 4.5M5 7L7.5 4.5M1.5 8.5H8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Validation errors — actual problems to fix */}
            {mergedDraft.validation_errors.length > 0 && (
              <div className="border border-[var(--error)]/30 bg-[var(--error)]/8 rounded-lg px-5 py-4 animate-slide-in">
                <div className="text-[10px] tracking-widest uppercase text-[var(--error)] font-semibold mb-2">
                  Resolve before submission ({mergedDraft.validation_errors.length})
                </div>
                <ul className="space-y-1 text-[12px] text-[var(--foreground)]/90">
                  {mergedDraft.validation_errors.map((e, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[var(--error)] font-mono shrink-0">×</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pending entry — fields the reviewer is expected to fill in */}
            {mergedDraft.pending_entry && mergedDraft.pending_entry.length > 0 && (
              <div className="border border-[var(--accent)]/30 bg-[var(--accent)]/8 rounded-lg px-5 py-4 animate-slide-in">
                <div className="text-[10px] tracking-widest uppercase text-[var(--accent)] font-semibold mb-2">
                  Complete before signing ({mergedDraft.pending_entry.length})
                </div>
                <p className="text-[11px] text-[var(--muted)] mb-2 leading-relaxed">
                  These fields intentionally aren&apos;t auto-populated — the clinician fills them at signing.
                </p>
                <ul className="space-y-1 text-[12px] text-[var(--foreground)]/90">
                  {mergedDraft.pending_entry.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[var(--accent)] font-mono shrink-0">·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Flags — things to double-check */}
            {mergedDraft.flags.length > 0 && (
              <div className="border border-[var(--warning)]/30 bg-[var(--warning)]/8 rounded-lg px-5 py-4 animate-slide-in">
                <div className="text-[10px] tracking-widest uppercase text-[var(--warning)] font-semibold mb-2">
                  Verify ({mergedDraft.flags.length})
                </div>
                <ul className="space-y-1 text-[12px] text-[var(--foreground)]/85">
                  {mergedDraft.flags.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[var(--warning)] font-mono shrink-0">~</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fields grouped by section */}
            {sectionsOrder.map((section) => (
              <MnfFieldGroup
                key={section}
                section={section}
                fields={mergedDraft.template.fields.filter(
                  (f) => (f.section || "Form") === section && f.field_id !== justificationFieldId
                )}
                populated={mergedDraft.fields}
                onFieldChange={onFieldChange}
              />
            ))}

            {/* Narrative */}
            <div className="border border-[var(--border)] bg-[var(--background)] rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
                <div className="text-[10px] tracking-widest uppercase text-[var(--muted)] font-medium">
                  Medical Necessity Justification
                </div>
                <div className="text-[10px] text-[var(--muted)]">
                  {mergedDraft.justification_text.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
              <textarea
                value={mergedDraft.justification_text}
                onChange={(e) => setEditedNarrative(e.target.value)}
                className="w-full min-h-[260px] p-5 text-sm leading-relaxed bg-transparent text-[var(--foreground)] resize-y focus:outline-none"
                spellCheck
              />
            </div>

            {mergedDraft.justification_layers && (
              <MnfLayersCard layers={mergedDraft.justification_layers} />
            )}

            {mergedDraft.guidelines_cited.length > 0 && (
              <MnfGuidelines guidelines={mergedDraft.guidelines_cited} />
            )}

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                onClick={downloadPdf}
                className="text-xs bg-[var(--foreground)] text-[var(--background)] font-medium rounded px-4 py-2 hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                Download PDF
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1V8M6 8L3 5.5M6 8L9 5.5M2 10H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => router.push("/")}
                className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors border border-[var(--border)] rounded px-3 py-2 hover:border-[var(--muted)]"
              >
                Back to evaluation
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
