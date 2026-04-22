"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ──────────────────────────────────────────────
   Hardcoded sample cases — kept as-is from the
   lab-ops mockup; we serialize each into an Order
   and hand off to the real PA + MNF pipeline.
   ────────────────────────────────────────────── */

type Stage =
  | "complete" | "received" | "in_progress"
  | "not_started" | "missing" | "not_required"
  | "draft" | "pending_auth" | "pa_submitted"
  | "pa_approved" | "pa_denied" | "claim_submitted";

interface Patient {
  id: string;
  accession: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  mrn: string;
  insurance: string;
  memberId: string;
  groupNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  orderingPhysician: string;
  physicianNPI: string;
  physicianSpecialty: string;
  physicianPhone?: string;
  physicianEmail?: string;
  facilityName: string;
  facilityAddress?: string;
  testPanel: string;
  testCode: string;
  cptCodes: string[];
  icd10: string[];
  diagnosis: string;
  clinicalIndication: string;
  familyHistory: string;
  priorTreatments?: string;
  specimenType: string;
  collectionDate: string;
  priority: string;
  orderDate: string;
  documents: Record<string, { status: Stage; date: string | null }>;
  stages: Record<string, { status: Stage; date: string | null; by: string | null }>;
}

const PATIENTS: Patient[] = [
  {
    id: "TRQ-26-04187", accession: "ACC-260410-0187", name: "Margaret Chen",
    dob: "1958-03-14", age: 68, gender: "F", mrn: "MRN-2024-10481",
    insurance: "Aetna", memberId: "AET-884571209", groupNumber: "GRP-77201",
    phone: "(415) 555-0142", email: "m.chen@email.com",
    address: "1247 Oak Valley Dr, San Francisco, CA 94110",
    orderingPhysician: "Dr. Sarah Patel", physicianNPI: "1234567890",
    physicianSpecialty: "Medical Genetics",
    physicianPhone: "(415) 555-8800", physicianEmail: "s.patel@ucsf.edu",
    facilityName: "UCSF Medical Center",
    facilityAddress: "505 Parnassus Ave, San Francisco, CA 94143",
    testPanel: "BRCA1/BRCA2 Full Sequencing + Del/Dup",
    testCode: "81162", cptCodes: ["81162", "81163"],
    icd10: ["Z15.01", "Z80.3"],
    diagnosis: "Hereditary Breast & Ovarian Cancer Syndrome",
    clinicalIndication: "Family history of breast cancer (mother dx age 42, maternal aunt dx age 39). Patient presents with palpable mass in left breast, identified on diagnostic mammogram and ultrasound. Genetic testing is clinically indicated for risk stratification, treatment planning, and cascade testing of at-risk family members.",
    familyHistory: "Mother: Breast cancer dx age 42, confirmed BRCA1 pathogenic variant. Maternal aunt: Breast cancer dx age 39, untested. Maternal grandmother: Ovarian cancer dx age 55, deceased. Paternal history: Non-contributory.",
    priorTreatments: "Diagnostic mammogram (04/02/2026): BI-RADS 4B. Breast ultrasound (04/05/2026): Solid hypoechoic mass, 2.3 x 1.8 cm. Core needle biopsy (04/08/2026): Pending. No prior genetic testing.",
    specimenType: "Peripheral Blood (EDTA)",
    collectionDate: "2026-04-10",
    priority: "STAT", orderDate: "2026-04-10",
    documents: {
      requisitionForm: { status: "received", date: "2026-04-10" },
      patientDemographics: { status: "received", date: "2026-04-10" },
      insuranceCardFrontBack: { status: "received", date: "2026-04-10" },
      physicianOrderForm: { status: "received", date: "2026-04-10" },
      clinicalNotes: { status: "received", date: "2026-04-11" },
      familyHistoryPedigree: { status: "received", date: "2026-04-10" },
      informedConsent: { status: "received", date: "2026-04-10" },
      priorLabResults: { status: "missing", date: null },
      referralLetter: { status: "received", date: "2026-04-09" },
    },
    stages: {
      orderReceived: { status: "complete", date: "2026-04-10", by: "L. Martinez" },
      specimenAccessioned: { status: "complete", date: "2026-04-11", by: "K. Nguyen" },
      insuranceVerification: { status: "complete", date: "2026-04-11", by: "System" },
      priorAuthorization: { status: "not_started", date: null, by: null },
      medicalNecessity: { status: "not_started", date: null, by: null },
      labProcessing: { status: "not_started", date: null, by: null },
      reportGeneration: { status: "not_started", date: null, by: null },
      reportDelivery: { status: "not_started", date: null, by: null },
    },
  },
  {
    id: "TRQ-26-04152", accession: "ACC-260408-0152", name: "Robert Williams",
    dob: "1971-08-22", age: 54, gender: "M", mrn: "MRN-2024-10482",
    insurance: "UnitedHealthcare", memberId: "UHC-339207841", groupNumber: "GRP-55108",
    phone: "(312) 555-0198", email: "r.williams@email.com",
    address: "892 Maple Ln, Chicago, IL 60614",
    orderingPhysician: "Dr. Michael Torres", physicianNPI: "0987654321",
    physicianSpecialty: "Cardiovascular Genetics",
    physicianPhone: "(312) 555-7700", physicianEmail: "m.torres@nm.org",
    facilityName: "Northwestern Memorial Hospital",
    facilityAddress: "251 E Huron St, Chicago, IL 60611",
    testPanel: "Comprehensive Cardiomyopathy Panel (54 genes)",
    testCode: "81479", cptCodes: ["81479", "81405"],
    icd10: ["I42.1", "Z82.41"],
    diagnosis: "Hypertrophic Cardiomyopathy",
    clinicalIndication: "Unexplained left ventricular hypertrophy on echocardiogram (septal wall thickness 16mm). No hypertension or aortic stenosis. Brother died suddenly at age 32 — suspected HCM. Genetic testing indicated for definitive diagnosis, risk stratification for sudden cardiac death, and cascade testing of first-degree relatives.",
    familyHistory: "Brother: Sudden cardiac death age 32, autopsy showed asymmetric septal hypertrophy. Father: Heart failure dx age 58, LVH on echo, untested. Paternal uncle: ICD implant age 45, clinical HCM diagnosis.",
    priorTreatments: "Echocardiogram (03/20/2026): Septal wall 16mm, LVEF 65%, SAM with resting LVOT gradient 35mmHg. 12-lead ECG: LVH voltage criteria. Cardiac MRI (03/28/2026): Asymmetric septal hypertrophy, late gadolinium enhancement in septum. 48-hour Holter (04/01/2026): 3 runs of NSVT (longest 8 beats). No prior genetic testing.",
    specimenType: "Peripheral Blood (EDTA)",
    collectionDate: "2026-04-07",
    priority: "Routine", orderDate: "2026-04-08",
    documents: {
      requisitionForm: { status: "received", date: "2026-04-08" },
      patientDemographics: { status: "received", date: "2026-04-08" },
      insuranceCardFrontBack: { status: "received", date: "2026-04-08" },
      physicianOrderForm: { status: "received", date: "2026-04-08" },
      clinicalNotes: { status: "received", date: "2026-04-09" },
      familyHistoryPedigree: { status: "received", date: "2026-04-08" },
      informedConsent: { status: "missing", date: null },
      priorLabResults: { status: "received", date: "2026-04-07" },
      referralLetter: { status: "missing", date: null },
    },
    stages: {
      orderReceived: { status: "complete", date: "2026-04-08", by: "A. Johnson" },
      specimenAccessioned: { status: "complete", date: "2026-04-08", by: "K. Nguyen" },
      insuranceVerification: { status: "complete", date: "2026-04-09", by: "System" },
      priorAuthorization: { status: "complete", date: "2026-04-12", by: "M. Davis" },
      medicalNecessity: { status: "not_started", date: null, by: null },
      labProcessing: { status: "not_started", date: null, by: null },
      reportGeneration: { status: "not_started", date: null, by: null },
      reportDelivery: { status: "not_started", date: null, by: null },
    },
  },
  {
    id: "TRQ-26-04098", accession: "ACC-260405-0098", name: "Diana Okafor",
    dob: "1985-11-03", age: 40, gender: "F", mrn: "MRN-2024-10483",
    insurance: "Blue Cross Blue Shield", memberId: "BCBS-771045632", groupNumber: "GRP-90334",
    phone: "(617) 555-0267", email: "d.okafor@email.com",
    address: "234 Beacon St, Boston, MA 02116",
    orderingPhysician: "Dr. Emily Nakamura", physicianNPI: "5678901234",
    physicianSpecialty: "Psychiatry / Pharmacogenomics",
    physicianPhone: "(617) 555-3300", physicianEmail: "e.nakamura@mgh.harvard.edu",
    facilityName: "Mass General Hospital",
    facilityAddress: "55 Fruit St, Boston, MA 02114",
    testPanel: "PGx Comprehensive Panel (CYP2D6/2C19/3A4)",
    testCode: "81225", cptCodes: ["81225", "81226", "81231"],
    icd10: ["Z91.19", "F33.2"],
    diagnosis: "Pharmacogenomic Testing — Treatment-Resistant Depression",
    clinicalIndication: "Treatment-resistant major depressive disorder. Failed adequate trials of sertraline (150mg x 8 wks), fluoxetine (40mg x 10 wks), and venlafaxine (225mg x 12 wks) over 18 months. Adverse reactions to multiple SSRIs suggest CYP metabolizer variant. PGx testing indicated to guide pharmacotherapy selection.",
    familyHistory: "Mother: Major depressive disorder, responded well to bupropion. Father: No psychiatric history. No known pharmacogenomic family history documented.",
    priorTreatments: "Sertraline 150mg x 8 weeks: Inadequate response, severe nausea. Fluoxetine 40mg x 10 weeks: Partial response, discontinued for agitation. Venlafaxine 225mg x 12 weeks: Modest improvement, discontinued for hypertension. PHQ-9 scores trended 22 → 14. Current: Bupropion 150mg with partial response.",
    specimenType: "Buccal Swab",
    collectionDate: "2026-04-04",
    priority: "Routine", orderDate: "2026-04-05",
    documents: {
      requisitionForm: { status: "received", date: "2026-04-05" },
      patientDemographics: { status: "received", date: "2026-04-05" },
      insuranceCardFrontBack: { status: "received", date: "2026-04-05" },
      physicianOrderForm: { status: "received", date: "2026-04-05" },
      clinicalNotes: { status: "received", date: "2026-04-06" },
      familyHistoryPedigree: { status: "received", date: "2026-04-05" },
      informedConsent: { status: "received", date: "2026-04-05" },
      priorLabResults: { status: "received", date: "2026-04-04" },
      referralLetter: { status: "received", date: "2026-04-03" },
    },
    stages: {
      orderReceived: { status: "complete", date: "2026-04-05", by: "L. Martinez" },
      specimenAccessioned: { status: "complete", date: "2026-04-05", by: "T. Park" },
      insuranceVerification: { status: "complete", date: "2026-04-06", by: "System" },
      priorAuthorization: { status: "complete", date: "2026-04-08", by: "M. Davis" },
      medicalNecessity: { status: "complete", date: "2026-04-10", by: "Dr. R. Shah" },
      labProcessing: { status: "in_progress", date: "2026-04-10", by: "Lab" },
      reportGeneration: { status: "not_started", date: null, by: null },
      reportDelivery: { status: "not_started", date: null, by: null },
    },
  },
];

const DOC_LABELS: Record<string, string> = {
  requisitionForm: "Test Requisition",
  patientDemographics: "Patient Demographics",
  insuranceCardFrontBack: "Insurance Card",
  physicianOrderForm: "Physician Order",
  clinicalNotes: "Clinical Notes",
  familyHistoryPedigree: "Family History / Pedigree",
  informedConsent: "Informed Consent",
  priorLabResults: "Prior Lab Results",
  referralLetter: "Referral Letter",
};

const STAGE_LABELS: Record<string, string> = {
  orderReceived: "Order received",
  specimenAccessioned: "Specimen accessioned",
  insuranceVerification: "Insurance verified",
  priorAuthorization: "Prior authorization",
  medicalNecessity: "Medical necessity",
  labProcessing: "Lab processing",
  reportGeneration: "Report generation",
  reportDelivery: "Report delivered",
};

/* ──────────────────────────────────────────────
   Order builder — converts a mock patient into
   the Pydantic Order shape our backend expects.
   ────────────────────────────────────────────── */

function buildOrderFromPatient(p: Patient) {
  const [firstName, ...rest] = p.name.split(" ");
  const lastName = rest.join(" ");
  const icd10Descriptions: Record<string, string> = {
    "Z15.01": "Genetic susceptibility to malignant neoplasm of breast",
    "Z80.3": "Family history of malignant neoplasm of breast",
    "I42.1": "Obstructive hypertrophic cardiomyopathy",
    "Z82.41": "Family history of sudden cardiac death",
    "Z91.19": "Patient's noncompliance with other medical treatment and regimen",
    "F33.2": "Major depressive disorder, recurrent severe without psychotic features",
  };
  const [providerFirst, ...providerRest] = p.orderingPhysician.replace(/^Dr\.\s*/i, "").split(" ");
  const providerLast = providerRest.join(" ");

  return {
    order_id: p.id,
    test_code: p.testCode,
    test_name: p.testPanel,
    patient: {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: p.dob,
      sex: p.gender === "F" ? "Female" : p.gender === "M" ? "Male" : p.gender,
      medical_record_number: p.mrn,
      email: p.email ?? null,
      phone: p.phone ?? null,
      address: p.address ?? null,
      ethnicity: [],
      preferred_language: "ENGLISH",
      relatives: [],
    },
    insurance: {
      payment_method: "INSURANCE",
      insurance_type: "COMMERCIAL",
      primary: {
        company_name: p.insurance,
        company_code: p.insurance.toUpperCase().replace(/\s+/g, "_"),
        member_id: p.memberId,
        group_id: p.groupNumber,
        authorization_number: null,
        relationship: "SELF",
        type: "PRIMARY",
      },
      secondary: null,
    },
    clinical_info: {
      icd10_codes: p.icd10.map((code) => ({
        code,
        description: icd10Descriptions[code] ?? "",
      })),
      indications: [{ name: p.diagnosis, category: "" }],
      genes_of_interest: [],
      prior_genetic_testing: false,
      prior_testing_details: p.priorTreatments ?? null,
      supplemental_notes: p.clinicalIndication,
      is_inpatient: false,
      family_history: p.familyHistory,
      additional_info: null,
    },
    care_team: {
      institution_name: p.facilityName,
      institution_code: "",
      ordering_provider_first_name: providerFirst ?? "",
      ordering_provider_last_name: providerLast,
      ordering_provider_email: p.physicianEmail ?? null,
      ordering_provider_phone: p.physicianPhone ?? null,
      primary_contact_first_name: null,
      primary_contact_last_name: null,
    },
    sample: {
      status: "",
      sample_type: p.specimenType,
      collection_date: p.collectionDate,
    },
    documents: Object.entries(p.documents)
      .filter(([, v]) => v.status === "received")
      .map(([k]) => ({
        title: DOC_LABELS[k] ?? k,
        document_type: k,
      })),
    consents: [],
  };
}

/* ──────────────────────────────────────────────
   Visual primitives — all Tailwind + CSS vars
   ────────────────────────────────────────────── */

function StatusChip({ status, size = "sm" }: { status: Stage | string; size?: "xs" | "sm" }) {
  const config: Record<string, { label: string; tone: string }> = {
    complete: { label: "complete", tone: "text-[var(--success)] bg-[var(--success)]/8 border-[var(--success)]/30" },
    received: { label: "received", tone: "text-[var(--success)] bg-[var(--success)]/8 border-[var(--success)]/30" },
    in_progress: { label: "in progress", tone: "text-[var(--warning)] bg-[var(--warning)]/8 border-[var(--warning)]/30" },
    not_started: { label: "not started", tone: "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]" },
    missing: { label: "missing", tone: "text-[var(--error)] bg-[var(--error)]/8 border-[var(--error)]/30" },
    not_required: { label: "n/a", tone: "text-[var(--muted-soft)] bg-[var(--surface)] border-[var(--border)]" },
    draft: { label: "draft", tone: "text-[var(--accent)] bg-[var(--accent)]/8 border-[var(--accent)]/30" },
    pa_approved: { label: "PA approved", tone: "text-[var(--success)] bg-[var(--success)]/8 border-[var(--success)]/30" },
    pa_denied: { label: "PA denied", tone: "text-[var(--error)] bg-[var(--error)]/8 border-[var(--error)]/30" },
    pa_submitted: { label: "PA submitted", tone: "text-[var(--warning)] bg-[var(--warning)]/8 border-[var(--warning)]/30" },
  };
  const c = config[status] ?? { label: status, tone: "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]" };
  return (
    <span className={`inline-flex items-center gap-1 border rounded px-1.5 py-0.5 font-medium tracking-wide ${c.tone} ${size === "xs" ? "text-[9px]" : "text-[10px]"}`}>
      {c.label}
    </span>
  );
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const color =
    pct === 100 ? "var(--success)" :
    pct >= 50 ? "var(--warning)" :
    pct > 0 ? "var(--accent)" :
    "var(--muted-soft)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-20 rounded-full bg-[var(--surface)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono text-[var(--muted)] tabular-nums shrink-0">
        {completed}/{total}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────── */

export default function Dashboard() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PATIENTS;
    return PATIENTS.filter((p) =>
      [p.name, p.id, p.accession, p.testPanel, p.insurance]
        .some((s) => s.toLowerCase().includes(q))
    );
  }, [search]);

  const selected = useMemo(
    () => PATIENTS.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  );

  const runPriorAuth = (patient: Patient) => {
    const order = buildOrderFromPatient(patient);
    try {
      sessionStorage.setItem(
        "dashboardHandoff",
        JSON.stringify({ order, patientId: patient.id, autoSubmit: true }),
      );
    } catch {
      // sessionStorage can fail in private browsing — fall through.
    }
    router.push("/");
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <h1 className="text-xs font-medium tracking-widest uppercase text-[var(--muted)]">
              Lab Dashboard
            </h1>
            <span className="text-[var(--muted-soft)]">·</span>
            <span className="text-[10px] text-[var(--muted)]">
              Test orders · Prior auth · Medical necessity
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, TRQ, test…"
              className="w-56 text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-3 py-1.5 placeholder:text-[var(--muted-soft)] focus:outline-none focus:border-[var(--muted)]"
            />
            <Link
              href="/"
              className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--accent)]/30"
            >
              Agent
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-6 py-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard label="Active" value={PATIENTS.length} />
          <StatCard
            label="Pending PA"
            value={PATIENTS.filter((p) => p.stages.priorAuthorization.status === "not_started").length}
          />
          <StatCard
            label="PA approved"
            value={PATIENTS.filter((p) => p.stages.priorAuthorization.status === "complete").length}
          />
          <StatCard
            label="In lab"
            value={PATIENTS.filter((p) => p.stages.labProcessing.status === "in_progress").length}
          />
          <StatCard
            label="Missing docs"
            value={PATIENTS.reduce(
              (acc, p) => acc + Object.values(p.documents).filter((d) => d.status === "missing").length,
              0,
            )}
            tone="warning"
          />
          <StatCard
            label="Reports due"
            value={PATIENTS.filter((p) => p.stages.reportDelivery.status === "not_started").length}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
        {/* Patient list */}
        <div className="space-y-3">
          {filtered.map((p) => {
            const docsOk = Object.values(p.documents).filter((d) => d.status === "received").length;
            const docsTotal = Object.values(p.documents).filter((d) => d.status !== "not_required").length;
            const stagesOk = Object.values(p.stages).filter((s) => s.status === "complete").length;
            const isSelected = selectedId === p.id;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(isSelected ? null : p.id)}
                className={`w-full text-left border rounded-lg px-4 py-3 transition-colors ${
                  isSelected
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/4"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--muted)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--foreground)]">{p.name}</span>
                      <span className="text-[10px] font-mono text-[var(--muted)]">{p.id}</span>
                      {p.priority === "STAT" && (
                        <span className="text-[9px] font-semibold text-[var(--error)] border border-[var(--error)]/30 bg-[var(--error)]/8 rounded px-1.5 py-0.5 tracking-widest uppercase">
                          STAT
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--muted)] truncate">
                      {p.testPanel}
                      <span className="mx-1.5 text-[var(--muted-soft)]">·</span>
                      {p.insurance}
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] tracking-widest uppercase text-[var(--muted-soft)]">Docs</span>
                        <ProgressBar completed={docsOk} total={docsTotal} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] tracking-widest uppercase text-[var(--muted-soft)]">Stages</span>
                        <ProgressBar completed={stagesOk} total={Object.keys(p.stages).length} />
                      </div>
                      <StatusChip status={p.stages.priorAuthorization.status} size="xs" />
                    </div>
                  </div>
                  <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                    className={`mt-1 text-[var(--muted)] transition-transform shrink-0 ${isSelected ? "rotate-90" : ""}`}
                  >
                    <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-[var(--muted)] py-10 text-center">
              No orders match &ldquo;{search}&rdquo;.
            </p>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          {!selected ? (
            <div className="border border-dashed border-[var(--border)] rounded-lg p-6 text-center">
              <p className="text-xs text-[var(--muted)]">
                Select an order to see details and run the prior auth pipeline.
              </p>
            </div>
          ) : (
            <DetailPanel patient={selected} onRun={runPriorAuth} />
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "warning" }) {
  const valueColor =
    tone === "warning" && value > 0 ? "text-[var(--warning)]" : "text-[var(--foreground)]";
  return (
    <div className="border border-[var(--border)] bg-[var(--background)] rounded px-3 py-2">
      <div className="text-[9px] tracking-widest uppercase text-[var(--muted)]">{label}</div>
      <div className={`text-lg font-semibold font-mono tabular-nums mt-0.5 ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}

function DetailPanel({ patient, onRun }: { patient: Patient; onRun: (p: Patient) => void }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--background)] rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-widest uppercase text-[var(--muted)] font-medium">
            Order detail
          </div>
          <div className="text-sm font-medium text-[var(--foreground)] mt-0.5">
            {patient.name}
          </div>
        </div>
        <button
          onClick={() => onRun(patient)}
          className="text-xs px-3 py-1.5 rounded bg-[var(--foreground)] text-[var(--background)] font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
        >
          Run prior auth
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="divide-y divide-[var(--border)]">
        <DetailSection title="Patient">
          <DetailRow label="DOB" value={`${patient.dob} (${patient.age}y)`} mono />
          <DetailRow label="Sex" value={patient.gender} />
          <DetailRow label="MRN" value={patient.mrn} mono />
          <DetailRow label="Payor" value={`${patient.insurance} · ${patient.memberId}`} />
        </DetailSection>

        <DetailSection title="Provider">
          <DetailRow label="Ordering" value={`${patient.orderingPhysician} (${patient.physicianSpecialty})`} />
          <DetailRow label="NPI" value={patient.physicianNPI} mono />
          <DetailRow label="Facility" value={patient.facilityName} />
        </DetailSection>

        <DetailSection title="Test">
          <DetailRow label="Panel" value={patient.testPanel} />
          <DetailRow label="CPT" value={patient.cptCodes.join(", ")} mono />
          <DetailRow label="ICD-10" value={patient.icd10.join(", ")} mono />
          <DetailRow label="Indication" value={patient.diagnosis} />
        </DetailSection>

        <DetailSection title="Clinical">
          <p className="text-[11px] text-[var(--foreground)]/85 leading-relaxed">
            {patient.clinicalIndication}
          </p>
          {patient.familyHistory && (
            <p className="text-[11px] text-[var(--muted)] leading-relaxed mt-2">
              <span className="uppercase tracking-widest text-[9px] text-[var(--muted-soft)] mr-2">Family history</span>
              {patient.familyHistory}
            </p>
          )}
        </DetailSection>

        <DetailSection title="Documents">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(patient.documents).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-[11px] py-0.5">
                <span className="text-[var(--muted)]">{DOC_LABELS[k] ?? k}</span>
                <StatusChip status={v.status} size="xs" />
              </div>
            ))}
          </div>
        </DetailSection>

        <DetailSection title="Pipeline">
          <ol className="space-y-1.5 list-none">
            {Object.entries(patient.stages).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--muted)]">{STAGE_LABELS[k] ?? k}</span>
                <div className="flex items-center gap-2">
                  {v.date && <span className="text-[10px] font-mono text-[var(--muted-soft)]">{v.date}</span>}
                  <StatusChip status={v.status} size="xs" />
                </div>
              </li>
            ))}
          </ol>
        </DetailSection>

        <div className="px-5 py-4 bg-[var(--surface)]">
          <p className="text-[10px] text-[var(--muted)] leading-relaxed mb-3">
            Running prior auth will open the agent with this order pre-filled and start the pipeline.
            Once the verdict arrives, use the &quot;Generate medical necessity form&quot; button on the
            result for the MNF.
          </p>
          <button
            onClick={() => onRun(patient)}
            className="w-full text-xs px-4 py-2 rounded bg-[var(--foreground)] text-[var(--background)] font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5"
          >
            Run prior auth
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3">
      <div className="text-[9px] tracking-widest uppercase text-[var(--muted)] font-medium mb-2">
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-0.5">
      <span className="text-[10px] tracking-widest uppercase text-[var(--muted-soft)] shrink-0">
        {label}
      </span>
      <span className={`text-[11px] text-[var(--foreground)] text-right ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
