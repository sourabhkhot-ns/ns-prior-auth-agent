"use client";

import { useState } from "react";
import type { MnfGuidelineCitation } from "../mnf/page";

export function MnfGuidelines({ guidelines }: { guidelines: MnfGuidelineCitation[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="border border-[var(--border)] bg-[var(--background)] rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
        <div className="text-[10px] tracking-widest uppercase text-[var(--muted)] font-medium">
          Guidelines cited ({guidelines.length})
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {guidelines.map((g) => {
          const open = openId === g.id;
          return (
            <div key={g.id} className="px-5 py-3">
              <button
                onClick={() => setOpenId(open ? null : g.id)}
                className="w-full flex items-start gap-3 text-left group"
              >
                <div className="shrink-0 text-[10px] font-semibold font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] mt-0.5">
                  {g.source} {g.year}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--foreground)] leading-snug group-hover:text-[var(--accent)] transition-colors">
                    {g.title}
                  </div>
                </div>
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  className={`shrink-0 mt-1 text-[var(--muted)] transition-transform ${open ? "rotate-90" : ""}`}
                >
                  <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {open && (
                <div className="mt-3 pl-[86px] animate-fade-in space-y-3">
                  {g.excerpt && (
                    <p className="text-[11px] text-[var(--foreground)]/80 leading-relaxed">
                      {g.excerpt}
                    </p>
                  )}
                  {g.key_points.length > 0 && (
                    <ul className="space-y-1">
                      {g.key_points.map((kp, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-[var(--muted)]">
                          <span className="text-[var(--accent)] font-mono shrink-0">·</span>
                          <span>{kp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
