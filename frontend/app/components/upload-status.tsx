"use client";

export interface UploadStatusData {
  uploaded: Array<{ type: string; label: string }>;
  missing: Array<{ type: string; label: string }>;
}

interface UploadStatusProps {
  data: UploadStatusData;
}

export function UploadStatus({ data }: UploadStatusProps) {
  return (
    <div className="space-y-1.5 mb-3 animate-slide-in">
      {data.uploaded.map((doc, i) => (
        <div key={doc.type} className="flex items-center gap-2.5 animate-slide-in" style={{ animationDelay: `${i * 100}ms` }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--success)] shrink-0">
            <path d="M2.5 7L5.5 10L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs text-[var(--foreground)]">{doc.label}</span>
          <span className="text-[10px] text-[var(--success)]">uploaded</span>
        </div>
      ))}
      {data.missing.map((doc, i) => (
        <div key={doc.type} className="flex items-center gap-2.5 animate-slide-in" style={{ animationDelay: `${(data.uploaded.length + i) * 100}ms` }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[var(--warning)] shrink-0">
            <path d="M7 4V8M7 10V10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-xs text-[var(--muted)]">{doc.label}</span>
          <span className="text-[10px] text-[var(--warning)]">not provided</span>
        </div>
      ))}
    </div>
  );
}
