"use client";

import { useState } from "react";
import type { MnfLayers } from "../mnf/page";

const LAYERS: { key: keyof MnfLayers; label: string; hint: string }[] = [
  { key: "patient", label: "Patient", hint: "Why this patient needs testing" },
  { key: "test", label: "Test", hint: "Why this test is appropriate" },
  { key: "guideline", label: "Guideline", hint: "Guideline support for testing" },
  { key: "clinical_utility", label: "Clinical utility", hint: "How results change management" },
];

export function MnfLayersCard({ layers }: { layers: MnfLayers }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[var(--border)] bg-[var(--background)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-5 py-3 bg-[var(--surface)] border-b border-[var(--border)] text-left group"
      >
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`text-[var(--muted)] transition-transform ${open ? "rotate-90" : ""}`}
        >
          <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[10px] tracking-widest uppercase text-[var(--muted)] font-medium group-hover:text-[var(--foreground)] transition-colors">
          Justification layers (4)
        </span>
      </button>
      {open && (
        <div className="divide-y divide-[var(--border)] animate-fade-in">
          {LAYERS.map(({ key, label, hint }) => (
            <div key={key} className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] tracking-widest uppercase text-[var(--accent)] font-semibold">
                  {label}
                </span>
                <span className="text-[10px] text-[var(--muted-soft)]">
                  — {hint}
                </span>
                <span className="ml-auto text-[10px] text-[var(--muted)] font-mono">
                  {layers[key].split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <p className="text-[12px] text-[var(--foreground)]/80 leading-relaxed">
                {layers[key] || <span className="italic text-[var(--muted-soft)]">(not generated)</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
