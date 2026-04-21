"use client";

import type { MnfField, MnfPopulatedField } from "../mnf/page";

interface Props {
  section: string;
  fields: MnfField[];
  populated: MnfPopulatedField[];
  onFieldChange: (fieldId: string, value: MnfPopulatedField["value"]) => void;
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "text-[var(--success)]",
  medium: "text-[var(--accent)]",
  low: "text-[var(--warning)]",
  manual: "text-[var(--muted-soft)]",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "auto",
  medium: "review",
  low: "low",
  manual: "manual",
};

function stringValue(v: MnfPopulatedField["value"]): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

export function MnfFieldGroup({ section, fields, populated, onFieldChange }: Props) {
  const byId = new Map(populated.map((p) => [p.field_id, p]));

  return (
    <div className="border border-[var(--border)] bg-[var(--background)] rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="text-[10px] tracking-widest uppercase text-[var(--muted)] font-medium">
          {section}
        </div>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {fields.map((f) => {
          const pf = byId.get(f.field_id);
          const value = pf?.value ?? null;
          const conf = pf?.confidence || "manual";

          return (
            <div key={f.field_id} className="grid grid-cols-[220px_1fr] gap-x-4 px-5 py-3 items-start">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[var(--muted)] leading-tight">
                    {f.label}
                  </span>
                  {f.required && (
                    <span className="text-[9px] text-[var(--error)] font-medium">*</span>
                  )}
                  <span className={`text-[9px] font-mono ${CONFIDENCE_STYLE[conf]}`}>
                    {CONFIDENCE_LABEL[conf]}
                  </span>
                </div>
                {f.help_text && (
                  <p className="text-[10px] text-[var(--muted-soft)] mt-0.5 leading-snug">
                    {f.help_text}
                  </p>
                )}
                {pf?.flag_reason && (
                  <p className="text-[10px] text-[var(--warning)] mt-0.5 leading-snug">
                    {pf.flag_reason}
                  </p>
                )}
              </div>

              <div>
                {f.field_type === "checkbox" ? (
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={value === true}
                      onChange={(e) => onFieldChange(f.field_id, e.target.checked)}
                      className="appearance-none w-3.5 h-3.5 border border-[var(--border)] rounded-sm checked:bg-[var(--accent)] checked:border-[var(--accent)] transition-colors relative after:content-[''] after:absolute after:inset-0 after:bg-no-repeat after:bg-center after:bg-[length:10px_10px] checked:after:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22white%22><path d=%22M5.5 10.5L3 8l-1 1 3.5 3.5L14 4l-1-1z%22/></svg>')]"
                    />
                    <span className="text-xs text-[var(--foreground)]">
                      {value === true ? "Confirmed" : "Not confirmed"}
                    </span>
                  </label>
                ) : f.field_type === "textarea" ? (
                  <textarea
                    value={stringValue(value)}
                    onChange={(e) => onFieldChange(f.field_id, e.target.value)}
                    rows={3}
                    className="w-full text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:border-[var(--muted)] resize-y leading-relaxed"
                    placeholder={f.help_text || "—"}
                  />
                ) : f.field_type === "multiselect" ? (
                  <input
                    type="text"
                    value={stringValue(value)}
                    onChange={(e) =>
                      onFieldChange(
                        f.field_id,
                        e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    className="w-full text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:border-[var(--muted)] font-mono"
                    placeholder="comma,separated,values"
                  />
                ) : f.field_type === "date" ? (
                  <input
                    type="date"
                    value={stringValue(value)}
                    onChange={(e) => onFieldChange(f.field_id, e.target.value)}
                    className="text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--muted)] font-mono"
                  />
                ) : (
                  <input
                    type="text"
                    value={stringValue(value)}
                    onChange={(e) => onFieldChange(f.field_id, e.target.value)}
                    className={`w-full text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:border-[var(--muted)] ${
                      f.field_type === "npi" || f.field_type === "phone" || f.field_type === "code"
                        ? "font-mono"
                        : ""
                    }`}
                    placeholder={
                      f.field_type === "npi" ? "10-digit NPI" :
                      f.field_type === "phone" ? "(000) 000-0000" :
                      f.help_text || "—"
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
