"use client";

import type { AgentUpdate, AgentStatus } from "../page";

interface AgentPipelineProps {
  agents: AgentUpdate[];
}

function StatusIcon({ status }: { status: AgentStatus }) {
  if (status === "running") {
    return (
      <div className="w-4 h-4 flex items-center justify-center">
        <div className="w-3 h-3 border border-[var(--accent)] border-t-transparent rounded-full animate-spin-slow" />
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="w-4 h-4 flex items-center justify-center text-[var(--success)]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="w-4 h-4 flex items-center justify-center text-[var(--error)]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (status === "skipped") {
    return (
      <div className="w-4 h-4 flex items-center justify-center text-[var(--muted)]">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  // pending
  return (
    <div className="w-4 h-4 flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
    </div>
  );
}

function statusColor(status: AgentStatus): string {
  switch (status) {
    case "running": return "text-[var(--accent)]";
    case "completed": return "text-[var(--foreground)]";
    case "error": return "text-[var(--error)]";
    case "skipped": return "text-[var(--muted)]";
    default: return "text-[var(--muted)]";
  }
}

export function AgentPipeline({ agents }: AgentPipelineProps) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--border)]">
        <span className="text-xs text-[var(--muted)]">Agent Pipeline</span>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {agents.map((agent) => (
          <div key={agent.id} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <StatusIcon status={agent.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${statusColor(agent.status)}`}>
                    {agent.label}
                  </span>
                  {agent.status === "running" && (
                    <span className="text-xs text-[var(--accent)] animate-pulse-dot">
                      processing
                    </span>
                  )}
                </div>
                {agent.message && agent.status !== "pending" && (
                  <p className="text-xs text-[var(--muted)] mt-1 truncate">
                    {agent.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
