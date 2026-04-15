"use client";

import { useState } from "react";
import { OrderForm } from "./components/order-form";
import { AgentPipeline } from "./components/agent-pipeline";
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
    criteria_results: Array<{ criterion: string; met: boolean; evidence: string; notes?: string }>;
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
  const [agents, setAgents] = useState<AgentUpdate[]>([]);
  const [result, setResult] = useState<EvaluationData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSSEEvent = (event: string, data: unknown) => {
    if (event === "pipeline") {
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
            // skip malformed
          }
          eventType = "";
        }
      }
    }
  };

  const runEvaluation = async (orderJson: string) => {
    setIsRunning(true);
    setResult(null);
    setError(null);
    setAgents([]);

    try {
      const response = await fetch(`${API_URL}/api/v1/evaluate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: JSON.parse(orderJson) }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      await processStream(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  };

  const runPdfEvaluation = async (file: File) => {
    setIsRunning(true);
    setResult(null);
    setError(null);
    setAgents([]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_URL}/api/v1/evaluate/pdf/stream`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      await processStream(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  };

  const reset = () => {
    setAgents([]);
    setResult(null);
    setError(null);
    setIsRunning(false);
  };

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
      <header className="mb-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
          <h1 className="text-sm font-medium tracking-wide uppercase text-[var(--muted)]">
            Prior Auth Agent
          </h1>
        </div>
        <p className="text-xs text-[var(--muted)] mt-2 ml-4">
          Pre-submission PA evaluation for genomics labs
        </p>
      </header>

      <div className="space-y-6">
        {!isRunning && !result && (
          <OrderForm
            onSubmitJson={runEvaluation}
            onSubmitPdf={runPdfEvaluation}
            isRunning={isRunning}
          />
        )}

        {agents.length > 0 && <AgentPipeline agents={agents} />}

        {error && (
          <div className="border border-[var(--error)]/30 rounded px-4 py-3 bg-[var(--error)]/5">
            <p className="text-xs text-[var(--error)]">{error}</p>
          </div>
        )}

        {result && <EvaluationResult data={result} />}

        {(result || error) && !isRunning && (
          <button
            onClick={reset}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Run another evaluation
          </button>
        )}
      </div>
    </main>
  );
}
