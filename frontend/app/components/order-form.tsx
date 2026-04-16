"use client";

import { useState, useRef } from "react";

interface OrderFormProps {
  onSubmitJson: (json: string) => void;
  onSubmitPdf: (file: File) => void;
  isRunning: boolean;
}

const SAMPLES = [
  {
    id: "01_perfect_uhc_trio_wes",
    label: "Low risk — Trio WES, UHC, complete docs",
    risk: "LOW",
  },
  {
    id: "02_high_risk_wrong_codes",
    label: "High risk — Wrong ICD-10 codes for WGS",
    risk: "HIGH",
  },
  {
    id: "03_medium_risk_missing_docs",
    label: "Medium risk — Epilepsy WES, missing counseling",
    risk: "MEDIUM",
  },
  {
    id: "04_nicu_rapid_wgs",
    label: "NICU — Rapid WGS, acutely ill neonate",
    risk: "LOW",
  },
  {
    id: "05_wrong_provider_no_counseling",
    label: "High risk — Pediatrician ordering, no geneticist",
    risk: "HIGH",
  },
  {
    id: "06_oncology_brca_panel",
    label: "Oncology — BRCA panel, breast cancer, Aetna",
    risk: "LOW",
  },
];

function RiskDot({ risk }: { risk: string }) {
  const color =
    risk === "LOW" ? "bg-[var(--success)]" :
    risk === "MEDIUM" ? "bg-[var(--warning)]" :
    "bg-[var(--error)]";
  return <div className={`w-1.5 h-1.5 rounded-full ${color} shrink-0 mt-[5px]`} />;
}

export function OrderForm({ onSubmitJson, onSubmitPdf, isRunning }: OrderFormProps) {
  const [mode, setMode] = useState<"samples" | "json" | "pdf">("samples");
  const [jsonInput, setJsonInput] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileObjRef = useRef<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      fileObjRef.current = file;
    }
  };

  const handleSubmit = () => {
    if ((mode === "json" || mode === "samples") && jsonInput.trim()) {
      onSubmitJson(jsonInput);
    } else if (mode === "pdf" && fileObjRef.current) {
      onSubmitPdf(fileObjRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const loadSample = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/samples/${id}.json`);
      const text = await res.text();
      setJsonInput(text);
      setMode("json");
    } catch {
      setJsonInput("// Could not load sample");
    } finally {
      setLoadingId(null);
    }
  };

  const runSampleDirectly = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/samples/${id}.json`);
      const text = await res.text();
      onSubmitJson(text);
    } catch {
      setLoadingId(null);
    }
  };

  const canSubmit =
    (mode === "json" || mode === "samples") ? jsonInput.trim().length > 0 : !!fileName;

  return (
    <div className="pt-6">
      <p className="text-sm text-[var(--foreground)] mb-6">
        Evaluate an order against payor rules.
      </p>

      {/* Mode tabs */}
      <div className="flex gap-4 mb-5">
        {([
          ["samples", "Samples"],
          ["json", "JSON"],
          ["pdf", "PDF"],
        ] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs pb-1 transition-colors ${
              mode === m
                ? "text-[var(--foreground)] border-b border-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "samples" && (
        <div className="space-y-1">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => runSampleDirectly(s.id)}
              disabled={isRunning || loadingId !== null}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[var(--surface)] transition-colors group disabled:opacity-50"
            >
              <RiskDot risk={s.risk} />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {s.label}
                </span>
              </div>
              {loadingId === s.id ? (
                <div className="w-3 h-3 border border-[var(--accent)] border-t-transparent rounded-full animate-spin-slow shrink-0 mt-0.5" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                  <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}

          <div className="pt-3 flex gap-3">
            {SAMPLES.map((s) => (
              <button
                key={`edit-${s.id}`}
                onClick={() => loadSample(s.id)}
                className="hidden"
              >
                edit
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "json" && (
        <>
          <div className="relative">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste order JSON..."
              className="w-full h-56 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)] placeholder:text-[var(--muted-soft)] resize-none focus:outline-none focus:border-[var(--muted)] p-4 transition-colors"
              spellCheck={false}
            />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-[10px] text-[var(--muted)]">Cmd+Enter to submit</span>
            <button
              onClick={handleSubmit}
              disabled={isRunning || !canSubmit}
              className="px-5 py-2 text-xs rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
            >
              Evaluate
            </button>
          </div>
        </>
      )}

      {mode === "pdf" && (
        <>
          <div
            onClick={() => fileRef.current?.click()}
            className="h-44 flex flex-col items-center justify-center cursor-pointer border border-dashed border-[var(--border)] rounded-lg hover:border-[var(--muted)] transition-colors bg-[var(--surface)]"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileName ? (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[var(--success)] mb-2">
                  <path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-xs text-[var(--foreground)]">{fileName}</p>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[var(--muted)] mb-2">
                  <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-xs text-[var(--muted)]">Upload order PDF</p>
              </>
            )}
          </div>
          <div className="flex items-center justify-end mt-4">
            <button
              onClick={handleSubmit}
              disabled={isRunning || !canSubmit}
              className="px-5 py-2 text-xs rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
            >
              Evaluate
            </button>
          </div>
        </>
      )}
    </div>
  );
}
