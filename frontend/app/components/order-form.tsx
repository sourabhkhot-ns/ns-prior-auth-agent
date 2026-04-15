"use client";

import { useState, useRef } from "react";

interface OrderFormProps {
  onSubmitJson: (json: string) => void;
  onSubmitPdf: (file: File) => void;
  isRunning: boolean;
}

export function OrderForm({ onSubmitJson, onSubmitPdf, isRunning }: OrderFormProps) {
  const [mode, setMode] = useState<"json" | "pdf">("json");
  const [jsonInput, setJsonInput] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
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
    if (mode === "json" && jsonInput.trim()) {
      onSubmitJson(jsonInput);
    } else if (mode === "pdf" && fileObjRef.current) {
      onSubmitPdf(fileObjRef.current);
    }
  };

  const loadSample = async () => {
    try {
      const res = await fetch("/sample_order.json");
      const text = await res.text();
      setJsonInput(text);
    } catch {
      setJsonInput('// Could not load sample. Paste your order JSON here.');
    }
  };

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <div className="flex items-center border-b border-[var(--border)]">
        <button
          onClick={() => setMode("json")}
          className={`px-4 py-2.5 text-xs transition-colors ${
            mode === "json"
              ? "text-[var(--foreground)] bg-[var(--surface)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          JSON
        </button>
        <button
          onClick={() => setMode("pdf")}
          className={`px-4 py-2.5 text-xs transition-colors ${
            mode === "pdf"
              ? "text-[var(--foreground)] bg-[var(--surface)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          PDF Upload
        </button>
        <div className="flex-1" />
        {mode === "json" && (
          <button
            onClick={loadSample}
            className="px-3 py-2.5 text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            load sample
          </button>
        )}
      </div>

      <div className="p-4">
        {mode === "json" ? (
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='Paste order JSON here...'
            className="w-full h-48 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted)]/50 resize-none focus:outline-none"
            spellCheck={false}
          />
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="h-48 flex flex-col items-center justify-center cursor-pointer border border-dashed border-[var(--border)] rounded hover:border-[var(--muted)] transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileName ? (
              <p className="text-xs text-[var(--foreground)]">{fileName}</p>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                Drop or click to upload order PDF
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] px-4 py-3 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isRunning || (mode === "json" ? !jsonInput.trim() : !fileName)}
          className="px-4 py-1.5 text-xs rounded bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isRunning ? "Running..." : "Evaluate"}
        </button>
      </div>
    </div>
  );
}
