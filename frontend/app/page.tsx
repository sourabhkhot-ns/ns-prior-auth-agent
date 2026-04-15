"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { OrderForm } from "./components/order-form";
import { DocumentUpload } from "./components/document-upload";
import { AgentPipeline } from "./components/agent-pipeline";
import { UploadStatus, UploadStatusData } from "./components/upload-status";
import { EvaluationResult } from "./components/evaluation-result";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function Home() {
  const [mode, setMode] = useState<"documents" | "json">("documents");
  const [agents, setAgents] = useState<AgentUpdate[]>([]);
  const [result, setResult] = useState<EvaluationData | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatusData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    try {
      const formData = new FormData();
      for (const [key, file] of Object.entries(files)) {
        formData.append(key, file);
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

    try {
      const response = await fetch(`${API_URL}/api/v1/evaluate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: JSON.parse(orderJson) }),
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

  const reset = () => {
    setAgents([]);
    setResult(null);
    setError(null);
    setUploadStatus(null);
    setIsRunning(false);
  };

  const hasActivity = agents.length > 0 || result || error || uploadStatus;

  return (
    <main className="flex flex-col h-screen max-w-3xl mx-auto w-full">
      {/* Header */}
      <header className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          <h1 className="text-xs font-medium tracking-widest uppercase text-[var(--muted)]">
            Prior Auth Agent
          </h1>
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
          </div>
        )}

        {hasActivity && (
          <div className="space-y-2">
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
