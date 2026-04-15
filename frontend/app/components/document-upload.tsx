"use client";

import { useState, useRef } from "react";

export interface DocSlot {
  key: string;
  label: string;
  description: string;
  required: boolean;
  file: File | null;
}

interface DocumentUploadProps {
  onSubmit: (files: Record<string, File>) => void;
  isRunning: boolean;
}

const INITIAL_SLOTS: DocSlot[] = [
  {
    key: "order_summary",
    label: "Order Summary",
    description: "Lab order with patient, test, insurance, ICD-10 codes",
    required: true,
    file: null,
  },
  {
    key: "physician_notes",
    label: "Physician Notes",
    description: "Medical necessity justification, genetic counseling, attestation",
    required: false,
    file: null,
  },
  {
    key: "test_reports",
    label: "Test Reports",
    description: "Pathology, somatic NGS, prior genetic testing results",
    required: false,
    file: null,
  },
  {
    key: "patient_details",
    label: "Patient Details",
    description: "Demographics, clinical summary, family history",
    required: false,
    file: null,
  },
];

function SlotIcon({ hasFile }: { hasFile: boolean }) {
  if (hasFile) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--success)]">
        <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--muted)]">
      <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function DocumentUpload({ onSubmit, isRunning }: DocumentUploadProps) {
  const [slots, setSlots] = useState<DocSlot[]>(INITIAL_SLOTS);
  const [loadingSample, setLoadingSample] = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (key: string, file: File) => {
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, file } : s))
    );
  };

  const removeFile = (key: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, file: null } : s))
    );
  };

  const loadSampleDocs = async () => {
    setLoadingSample(true);
    try {
      const sampleFiles: Record<string, string> = {
        order_summary: "/sample_docs/order_summary.pdf",
        patient_details: "/sample_docs/patient_details.pdf",
        physician_notes: "/sample_docs/physician_notes.pdf",
        test_reports: "/sample_docs/test_reports.pdf",
      };

      const newSlots = [...slots];
      for (const slot of newSlots) {
        const url = sampleFiles[slot.key];
        if (url) {
          const res = await fetch(url);
          const blob = await res.blob();
          slot.file = new File([blob], `${slot.key}.pdf`, { type: "application/pdf" });
        }
      }
      setSlots(newSlots);
    } catch (e) {
      console.error("Failed to load sample docs:", e);
    } finally {
      setLoadingSample(false);
    }
  };

  const handleSubmit = () => {
    const files: Record<string, File> = {};
    for (const slot of slots) {
      if (slot.file) {
        files[slot.key] = slot.file;
      }
    }
    if (Object.keys(files).length > 0) {
      onSubmit(files);
    }
  };

  const uploadedCount = slots.filter((s) => s.file).length;
  const hasRequired = slots.filter((s) => s.required).every((s) => s.file);

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[var(--foreground)]">
          Upload PA documents for evaluation
        </p>
        <button
          onClick={loadSampleDocs}
          disabled={loadingSample}
          className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors px-2 py-1 rounded border border-[var(--border)] hover:border-[var(--accent)]/30"
        >
          {loadingSample ? "Loading..." : "Load sample docs"}
        </button>
      </div>

      <div className="space-y-2">
        {slots.map((slot) => (
          <div
            key={slot.key}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer group ${
              slot.file
                ? "border-[var(--success)]/20 bg-[var(--success)]/5"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--muted)]"
            }`}
            onClick={() => {
              if (!slot.file) fileRefs.current[slot.key]?.click();
            }}
          >
            <input
              ref={(el) => { fileRefs.current[slot.key] = el; }}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(slot.key, file);
              }}
            />

            <SlotIcon hasFile={!!slot.file} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${
                  slot.file ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                }`}>
                  {slot.label}
                </span>
                {slot.required && !slot.file && (
                  <span className="text-[9px] text-[var(--error)] font-medium">REQUIRED</span>
                )}
              </div>
              {slot.file ? (
                <p className="text-[11px] text-[var(--success)] mt-0.5">{slot.file.name}</p>
              ) : (
                <p className="text-[11px] text-[var(--muted)]/60 mt-0.5">{slot.description}</p>
              )}
            </div>

            {slot.file && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(slot.key);
                }}
                className="text-[var(--muted)] hover:text-[var(--error)] transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-5">
        <span className="text-[10px] text-[var(--muted)]">
          {uploadedCount}/4 documents attached
        </span>
        <button
          onClick={handleSubmit}
          disabled={isRunning || !hasRequired || uploadedCount === 0}
          className="px-5 py-2 text-xs rounded-lg bg-[var(--foreground)] text-[var(--background)] font-medium hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed"
        >
          Evaluate
        </button>
      </div>
    </div>
  );
}
