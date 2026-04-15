"use client";

import { useEffect, useRef } from "react";
import type { AgentUpdate, AgentStatus } from "../page";

interface AgentPipelineProps {
  agents: AgentUpdate[];
}

function StatusIcon({ status }: { status: AgentStatus }) {
  if (status === "running") {
    return (
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin-slow" />
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="w-5 h-5 flex items-center justify-center shrink-0 text-[var(--success)]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7L5.5 10L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="w-5 h-5 flex items-center justify-center shrink-0 text-[var(--error)]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (status === "skipped") {
    return (
      <div className="w-5 h-5 flex items-center justify-center shrink-0 text-[var(--muted)]/50">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  // pending — hidden, won't render
  return null;
}

// Only show agents that are NOT pending
function isVisible(agent: AgentUpdate): boolean {
  return agent.status !== "pending";
}

export function AgentPipeline({ agents }: AgentPipelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const visibleAgents = agents.filter(isVisible);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visibleAgents.length]);

  if (visibleAgents.length === 0) {
    return (
      <div className="flex items-center gap-3 py-4 animate-fade-in">
        <div className="w-5 h-5 flex items-center justify-center">
          <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin-slow" />
        </div>
        <span className="text-xs text-[var(--muted)]">Starting evaluation...</span>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {visibleAgents.map((agent, idx) => {
        const isLast = idx === visibleAgents.length - 1;
        const isActive = agent.status === "running";

        return (
          <div
            key={agent.id}
            className="animate-slide-in"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Connector line */}
            {idx > 0 && (
              <div className="ml-[9px] h-3 border-l border-[var(--border)]" />
            )}

            <div className={`flex items-start gap-3 py-1.5 ${isActive ? "" : ""}`}>
              <StatusIcon status={agent.status} />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${
                    isActive ? "text-[var(--accent)] font-medium" :
                    agent.status === "completed" ? "text-[var(--foreground)]" :
                    agent.status === "error" ? "text-[var(--error)]" :
                    "text-[var(--muted)]"
                  }`}>
                    {agent.label}
                  </span>
                  {isActive && (
                    <span className="animate-pulse-dot text-[10px] text-[var(--accent)]">
                      ...
                    </span>
                  )}
                </div>

                {agent.message && (
                  <p className={`text-[11px] mt-1 leading-relaxed ${
                    agent.status === "error"
                      ? "text-[var(--error)]/70"
                      : "text-[var(--muted)]"
                  }`}>
                    {agent.message}
                  </p>
                )}
              </div>
            </div>

            {/* Spacer after last active item */}
            {isLast && isActive && (
              <div className="ml-[9px] h-3 border-l border-[var(--border)] border-dashed" />
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
