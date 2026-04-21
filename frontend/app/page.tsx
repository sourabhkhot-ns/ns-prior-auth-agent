"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { OrderForm } from "./components/order-form";
import { DocumentUpload } from "./components/document-upload";
import { AgentPipeline } from "./components/agent-pipeline";
import { UploadStatus, UploadStatusData } from "./components/upload-status";
import { EvaluationResult } from "./components/evaluation-result";
import { LetterCard } from "./components/letter-card";

export type AgentStatus = "pending" | "running" | "completed" | "skipped" | "error";

export interface AgentUpdate {
  id: string;
  label: string;
  status: AgentStatus;
  message?: string;
}

export interface EvaluationData {
  order_id: string;
  evaluation_id: string;
  denial_risk: string;
  summary: string;
  code_evaluation: {
    icd10_results: Array<{ code: string; description: string; status: string; reason: string }>;
    cpt_results: Array<{ code: string; description: string; status: string; reason: string }>;
    summary: string;
  };
  criteria_evaluation: {
    criteria_results: Array<{ criterion: string; met: string; evidence: string; notes?: string }>;
    overall_met: boolean;
    summary: string;
  };
  gap_report: {
    missing_documents: Array<{ requirement: string; status: string; detail: string }>;
    missing_clinical_info: Array<{ requirement: string; status: string; detail: string }>;
    summary: string;
  };
  issues: Array<{
    severity: string;
    category: string;
    description: string;
    resolution: string;
  }>;
}

export type LetterMode = "draft" | "placeholder" | "override";

export interface LetterData {
  mode: LetterMode;
  generated_at: string;
  payor_name: string;
  policy_id: string;
  policy_version: string;
  patient_name: string;
  test_name: string;
  cpt_codes: string[];
  icd10_codes: string[];
  ordering_provider: string;
  institution: string;
  introduction: string;
  clinical_summary: string;
  medical_necessity_justification: string;
  supporting_documentation: string[];
  conclusion: string;
  known_issues: Array<{ severity: string; category: string; description: string }>;
  warnings: string[];
  body_markdown: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface OrderContext {
  label: string;         // primary — test name or doc count
  patient?: string;      // "Maya C."
  payor?: string;        // "UnitedHealthcare"
  orderId?: string;      // "PT-2025-…"
}

export default function Home() {
  const [mode, setMode] = useState<"documents" | "json">("documents");
  const [agents, setAgents] = useState<AgentUpdate[]>([]);
  const [result, setResult] = useState<EvaluationData | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatusData | null>(null);
  const [orderContext, setOrderContext] = useState<OrderContext | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generateLetter, setGenerateLetter] = useState(false);
  const [letter, setLetter] = useState<LetterData | null>(null);
  const [letterRefusal, setLetterRefusal] = useState<string | null>(null);
  const [lastOrderJson, setLastOrderJson] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [agents, result, uploadStatus]);

  const handleSSEEvent = (event: string, data: unknown) => {
    if (event === "upload_status") {
      setUploadStatus(data as UploadStatusData);
    } else if (event === "pipeline") {
      const pipelineData = data as { agents: AgentUpdate[] };
      setAgents(pipelineData.agents);
    } else if (event === "agent_update") {
      const update = data as AgentUpdate;
      setAgents((prev) =>
        prev.map((a) => (a.id === update.id ? { ...a, ...update } : a))
      );
    } else if (event === "result") {
      setResult(data as EvaluationData);
    } else if (event === "letter") {
      setLetter(data as LetterData);
      setLetterRefusal(null);
    } else if (event === "letter_refused") {
      setLetter(null);
      setLetterRefusal((data as { reason: string }).reason);
    } else if (event === "error") {
      setError((data as { message: string }).message);
    }
  };

  const processStream = async (response: Response) => {
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
            handleSSEEvent(eventType, data);
          } catch {
            // skip
          }
          eventType = "";
        }
      }
    }
  };

  const cancelEvaluation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
    setError("Evaluation cancelled");
  }, []);

  const runDocumentEvaluation = async (files: Record<string, File>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setResult(null);
    setError(null);
    setAgents([]);
    setUploadStatus(null);
    setLetter(null);
    setLetterRefusal(null);
    setLastOrderJson(null);
    setOrderContext({
      label: `${Object.keys(files).length} document${Object.keys(files).length === 1 ? "" : "s"} submitted`,
    });

    try {
      const formData = new FormData();
      for (const [key, file] of Object.entries(files)) {
        formData.append(key, file);
      }
      if (generateLetter) {
        formData.append("generate_letter", "true");
      }

      const response = await fetch(`${API_URL}/api/v1/evaluate/documents/stream`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      await processStream(response);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  };

  const runJsonEvaluation = async (orderJson: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsRunning(true);
    setResult(null);
    setError(null);
    setAgents([]);
    setUploadStatus(null);
    setLetter(null);
    setLetterRefusal(null);
    setLastOrderJson(orderJson);

    try {
      const parsed = JSON.parse(orderJson);
      const firstName = parsed.patient?.first_name || "";
      const lastName  = parsed.patient?.last_name || "";
      const patient = firstName
        ? `${firstName}${lastName ? " " + lastName.charAt(0) + "." : ""}`
        : undefined;
      setOrderContext({
        label:    parsed.test_name || (parsed.test_code ? `Test ${parsed.test_code}` : "Order"),
        patient,
        payor:    parsed.insurance?.primary?.company_name || undefined,
        orderId:  parsed.order_id || undefined,
      });
    } catch {
      setOrderContext({ label: "Order" });
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/evaluate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: JSON.parse(orderJson),
          generate_letter: generateLetter,
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      await processStream(response);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  };

  const runSampleJsonEvaluation = async (orderJson: string) => {
    await runJsonEvaluation(orderJson);
  };

  const regenerateLetter = async (targetMode: LetterMode) => {
    if (!result || !lastOrderJson) return;
    setRegenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: JSON.parse(lastOrderJson),
          evaluation: result,
          letter_mode: targetMode,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      if (body.letter) {
        setLetter(body.letter as LetterData);
        setLetterRefusal(null);
      } else {
        setLetterRefusal(body.refusal_reason || "Letter not generated");
      }
    } catch (err) {
      setError(`Letter regen failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setRegenerating(false);
    }
  };

  const reset = () => {
    setAgents([]);
    setResult(null);
    setError(null);
    setUploadStatus(null);
    setOrderContext(null);
    setIsRunning(false);
    setLetter(null);
    setLetterRefusal(null);
    setLastOrderJson(null);
  };

  const hasActivity = agents.length > 0 || result || error || uploadStatus;

  return (
    <main className="flex flex-col h-screen max-w-3xl mx-auto w-full">
      {/* Header */}
      <header className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <h1 className="text-xs font-medium tracking-widest uppercase text-[var(--muted)]">
              Prior Auth Agent
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

      {/* Content */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-6 pb-6">
        {!hasActivity && (
          <div className="animate-fade-in">
            {/* Mode toggle */}
            <div className="flex gap-4 pt-6 mb-2">
              <button
                onClick={() => setMode("documents")}
                className={`text-xs pb-1 transition-colors ${
                  mode === "documents"
                    ? "text-[var(--foreground)] border-b border-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Documents
              </button>
              <button
                onClick={() => setMode("json")}
                className={`text-xs pb-1 transition-colors ${
                  mode === "json"
                    ? "text-[var(--foreground)] border-b border-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                JSON / Samples
              </button>
            </div>

            {mode === "documents" ? (
              <DocumentUpload onSubmit={runDocumentEvaluation} isRunning={isRunning} />
            ) : (
              <OrderForm
                onSubmitJson={runSampleJsonEvaluation}
                onSubmitPdf={async () => {}}
                isRunning={isRunning}
              />
            )}

            <label className="flex items-center gap-2 mt-6 select-none cursor-pointer w-fit group">
              <input
                type="checkbox"
                checked={generateLetter}
                onChange={(e) => setGenerateLetter(e.target.checked)}
                className="appearance-none w-3.5 h-3.5 border border-[var(--border)] rounded-sm checked:bg-[var(--accent)] checked:border-[var(--accent)] transition-colors relative after:content-[''] after:absolute after:inset-0 after:bg-no-repeat after:bg-center after:bg-[length:10px_10px] checked:after:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22white%22><path d=%22M5.5 10.5L3 8l-1 1 3.5 3.5L14 4l-1-1z%22/></svg>')]"
              />
              <span className="text-[11px] text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors">
                Also draft a medical-necessity letter
              </span>
            </label>
          </div>
        )}

        {hasActivity && (
          <div className="space-y-2">
            {orderContext && (
              <div className="animate-fade-in border border-[var(--border)] bg-[var(--surface)] rounded-lg px-4 py-3 mb-4">
                <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-[var(--muted)] mb-1.5">
                  <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                  Order in Review
                </div>
                <div className="text-sm text-[var(--foreground)] font-medium leading-tight">
                  {orderContext.label}
                </div>
                {(orderContext.patient || orderContext.payor || orderContext.orderId) && (
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--muted)] flex-wrap">
                    {orderContext.patient && <span>{orderContext.patient}</span>}
                    {orderContext.patient && orderContext.payor && <span>·</span>}
                    {orderContext.payor && <span>{orderContext.payor}</span>}
                    {(orderContext.patient || orderContext.payor) && orderContext.orderId && <span>·</span>}
                    {orderContext.orderId && <span className="font-mono">{orderContext.orderId}</span>}
                  </div>
                )}
              </div>
            )}

            {uploadStatus && <UploadStatus data={uploadStatus} />}

            <AgentPipeline agents={agents} />

            {error && (
              <div className="animate-slide-in border-l-2 border-[var(--error)] pl-4 py-2">
                <p className="text-xs text-[var(--error)]">{error}</p>
              </div>
            )}

            {isRunning && (
              <div className="pt-2 animate-fade-in">
                <button
                  onClick={cancelEvaluation}
                  className="text-xs text-[var(--muted)] hover:text-[var(--error)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {result && <EvaluationResult data={result} />}

            {(letter || letterRefusal) && result && (
              <LetterCard
                letter={letter}
                refusalReason={letterRefusal}
                canRegenerate={!!lastOrderJson}
                onRegenerate={regenerateLetter}
                regenerating={regenerating}
              />
            )}

            {(result || error) && !isRunning && (
              <div className="pt-6 animate-fade-in">
                <button
                  onClick={reset}
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors border border-[var(--border)] rounded px-3 py-1.5 hover:border-[var(--muted)]"
                >
                  New evaluation
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
