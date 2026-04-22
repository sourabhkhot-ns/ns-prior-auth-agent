"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ──────────────────────────────────────────────
   Types + hardcoded sample data (lab ops mockup).
   Each row is serialized into an Order on demand
   and handed off to the real agent + MNF flow.
   ────────────────────────────────────────────── */

type Stage =
  | "complete" | "received" | "in_progress"
  | "not_started" | "missing" | "not_required"
  | "draft" | "pending_auth" | "pa_submitted"
  | "pa_approved" | "pa_denied" | "claim_submitted";

interface LabNote {
  date: string;
  by: string;
  note: string;
}

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
  payorAddress?: string;
  payorFax?: string;

  phone?: string;
  email?: string;
  address?: string;

  orderingPhysician: string;
  physicianNPI: string;
  physicianLicense?: string;
  physicianSpecialty: string;
  physicianPhone?: string;
  physicianFax?: string;
  physicianEmail?: string;
  referringPhysician?: string;
  referringNPI?: string;
  referringSpecialty?: string;

  facilityName: string;
  facilityNPI?: string;
  facilityAddress?: string;
  facilityCLIA?: string;

  testPanel: string;
  testCode: string;
  cptCodes: string[];
  icd10: string[];
  diagnosis: string;
  methodology?: string;
  turnaroundDays?: number;

  specimenType: string;
  specimenId?: string;
  collectionDate: string;
  receivedDate?: string;
  specimenStatus?: string;

  clinicalIndication: string;
  familyHistory: string;
  priorTreatments?: string;
  medications?: string[];
  allergies?: string[];

  priority: string;
  orderDate: string;
  estimatedReport?: string;

  documents: Record<string, { status: Stage; date: string | null }>;
  stages: Record<string, { status: Stage; date: string | null; by: string | null }>;

  billingStatus?: string;
  billingNotes?: string;
  claimId?: string | null;
  labNotes?: LabNote[];
}

const PATIENTS: Patient[] = [
  {
    id: "TRQ-26-04187", accession: "ACC-260410-0187", name: "Margaret Chen",
    dob: "1958-03-14", age: 68, gender: "F", mrn: "MRN-2024-10481",

    insurance: "Aetna", memberId: "AET-884571209", groupNumber: "GRP-77201",
    payorAddress: "Aetna Utilization Review, PO Box 14079, Lexington, KY 40512",
    payorFax: "(800) 367-6762",

    phone: "(415) 555-0142", email: "m.chen@email.com",
    address: "1247 Oak Valley Dr, San Francisco, CA 94110",

    orderingPhysician: "Dr. Sarah Patel", physicianNPI: "1234567890",
    physicianLicense: "CA-MD-A84721", physicianSpecialty: "Medical Genetics",
    physicianPhone: "(415) 555-8800", physicianFax: "(415) 555-8801",
    physicianEmail: "s.patel@ucsf.edu",
    referringPhysician: "Dr. James Liu", referringNPI: "2233445566",
    referringSpecialty: "Surgical Oncology",

    facilityName: "UCSF Medical Center", facilityNPI: "9876543210",
    facilityAddress: "505 Parnassus Ave, San Francisco, CA 94143",
    facilityCLIA: "05D0672675",

    testPanel: "BRCA1/BRCA2 Full Sequencing + Del/Dup",
    testCode: "81162", cptCodes: ["81162", "81163"],
    icd10: ["Z15.01", "Z80.3"],
    diagnosis: "Hereditary Breast & Ovarian Cancer Syndrome",
    methodology: "NGS — Illumina NovaSeq 6000", turnaroundDays: 14,

    specimenType: "Peripheral Blood (EDTA)", specimenId: "SPM-260410-A1",
    collectionDate: "2026-04-10", receivedDate: "2026-04-11",
    specimenStatus: "Adequate",

    clinicalIndication: "Family history of breast cancer (mother dx age 42, maternal aunt dx age 39). Patient presents with palpable mass in left breast, identified on diagnostic mammogram and ultrasound. Genetic testing is clinically indicated for risk stratification, treatment planning, and cascade testing of at-risk family members.",
    familyHistory: "Mother: Breast cancer dx age 42, confirmed BRCA1 pathogenic variant.\nMaternal aunt: Breast cancer dx age 39, untested.\nMaternal grandmother: Ovarian cancer dx age 55, deceased.\nPaternal history: Non-contributory.",
    priorTreatments: "Diagnostic mammogram (04/02/2026): BI-RADS 4B, 2.1cm irregular mass left breast.\nBreast ultrasound (04/05/2026): Solid hypoechoic mass, 2.3 x 1.8 cm.\nCore needle biopsy (04/08/2026): Pending pathology results.\nNo prior genetic testing performed.",
    medications: ["Tamoxifen 20mg daily", "Lisinopril 10mg daily", "Vitamin D3 2000IU"],
    allergies: ["Penicillin", "Sulfa drugs"],

    priority: "STAT", orderDate: "2026-04-10", estimatedReport: "2026-04-24",

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
    billingStatus: "pending_auth",
    billingNotes: "Awaiting PA before claim submission",
    claimId: null,
    labNotes: [
      { date: "2026-04-11", by: "K. Nguyen", note: "Specimen accessioned. DNA extraction queued." },
      { date: "2026-04-11", by: "L. Martinez", note: "Insurance verified — Aetna PPO active, genetic testing benefits confirmed." },
    ],
  },
  {
    id: "TRQ-26-04152", accession: "ACC-260408-0152", name: "Robert Williams",
    dob: "1971-08-22", age: 54, gender: "M", mrn: "MRN-2024-10482",

    insurance: "UnitedHealthcare", memberId: "UHC-339207841", groupNumber: "GRP-55108",
    payorAddress: "UHC Prior Auth, PO Box 30555, Salt Lake City, UT 84130",
    payorFax: "(800) 366-7925",

    phone: "(312) 555-0198", email: "r.williams@email.com",
    address: "892 Maple Ln, Chicago, IL 60614",

    orderingPhysician: "Dr. Michael Torres", physicianNPI: "0987654321",
    physicianLicense: "IL-MD-036.112847", physicianSpecialty: "Cardiovascular Genetics",
    physicianPhone: "(312) 555-7700", physicianFax: "(312) 555-7701",
    physicianEmail: "m.torres@nm.org",
    referringPhysician: "Dr. Angela Ross", referringNPI: "3344556677",
    referringSpecialty: "Cardiology",

    facilityName: "Northwestern Memorial Hospital", facilityNPI: "1122334455",
    facilityAddress: "251 E Huron St, Chicago, IL 60611",
    facilityCLIA: "14D0917166",

    testPanel: "Comprehensive Cardiomyopathy Panel (54 genes)",
    testCode: "81479", cptCodes: ["81479", "81405"],
    icd10: ["I42.1", "Z82.41"],
    diagnosis: "Hypertrophic Cardiomyopathy",
    methodology: "NGS — Illumina NovaSeq 6000 + MLPA", turnaroundDays: 21,

    specimenType: "Peripheral Blood (EDTA)", specimenId: "SPM-260408-B3",
    collectionDate: "2026-04-07", receivedDate: "2026-04-08",
    specimenStatus: "Adequate",

    clinicalIndication: "Unexplained left ventricular hypertrophy on echocardiogram (septal wall thickness 16mm). No hypertension or aortic stenosis. Brother died suddenly at age 32 — suspected HCM. Genetic testing indicated for definitive diagnosis, risk stratification for sudden cardiac death, and cascade testing of first-degree relatives.",
    familyHistory: "Brother: Sudden cardiac death age 32, autopsy showed asymmetric septal hypertrophy.\nFather: Heart failure dx age 58, LVH on echo, untested.\nPaternal uncle: ICD implant age 45, clinical HCM diagnosis.\nMother and siblings: No known cardiac disease.",
    priorTreatments: "Echocardiogram (03/20/2026): Septal wall 16mm, LVEF 65%, SAM with resting LVOT gradient 35mmHg.\n12-lead ECG: LVH voltage criteria, T-wave inversions V4-V6.\nCardiac MRI (03/28/2026): Asymmetric septal hypertrophy, late gadolinium enhancement in septum.\n48-hour Holter (04/01/2026): 3 runs of NSVT (longest 8 beats).\nNo prior genetic testing.",
    medications: ["Metoprolol 50mg BID", "Aspirin 81mg daily"],
    allergies: ["None known"],

    priority: "Routine", orderDate: "2026-04-08", estimatedReport: "2026-04-29",

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
    billingStatus: "pa_approved",
    billingNotes: "PA approved — UHC Auth #UHC-PA-88412",
    claimId: null,
    labNotes: [
      { date: "2026-04-08", by: "K. Nguyen", note: "Specimen accessioned. Blood volume adequate (6mL EDTA)." },
      { date: "2026-04-09", by: "System", note: "Insurance eligibility verified — UHC active." },
      { date: "2026-04-12", by: "M. Davis", note: "PA approved by UHC. Auth# UHC-PA-88412, valid through 2026-07-12." },
    ],
  },
  {
    id: "TRQ-26-04098", accession: "ACC-260405-0098", name: "Diana Okafor",
    dob: "1985-11-03", age: 40, gender: "F", mrn: "MRN-2024-10483",

    insurance: "Blue Cross Blue Shield", memberId: "BCBS-771045632", groupNumber: "GRP-90334",
    payorAddress: "BCBS UR Dept, PO Box 105568, Atlanta, GA 30348",
    payorFax: "(800) 505-2227",

    phone: "(617) 555-0267", email: "d.okafor@email.com",
    address: "234 Beacon St, Boston, MA 02116",

    orderingPhysician: "Dr. Emily Nakamura", physicianNPI: "5678901234",
    physicianLicense: "MA-MD-272549", physicianSpecialty: "Psychiatry / Pharmacogenomics",
    physicianPhone: "(617) 555-3300", physicianFax: "(617) 555-3301",
    physicianEmail: "e.nakamura@mgh.harvard.edu",
    referringPhysician: "Dr. Robert Kim", referringNPI: "7788990011",
    referringSpecialty: "Psychiatry",

    facilityName: "Mass General Hospital", facilityNPI: "6677889900",
    facilityAddress: "55 Fruit St, Boston, MA 02114",
    facilityCLIA: "22D0684381",

    testPanel: "PGx Comprehensive Panel (CYP2D6/2C19/3A4)",
    testCode: "81225", cptCodes: ["81225", "81226", "81231"],
    icd10: ["Z91.19", "F33.2"],
    diagnosis: "Pharmacogenomic Testing — Treatment-Resistant Depression",
    methodology: "TaqMan Genotyping + NGS confirmation", turnaroundDays: 10,

    specimenType: "Buccal Swab", specimenId: "SPM-260405-C7",
    collectionDate: "2026-04-04", receivedDate: "2026-04-05",
    specimenStatus: "Adequate",

    clinicalIndication: "Treatment-resistant major depressive disorder. Failed adequate trials of sertraline (150mg x 8 wks), fluoxetine (40mg x 10 wks), and venlafaxine (225mg x 12 wks) over 18 months. Adverse reactions to multiple SSRIs (severe GI disturbance, serotonin-like symptoms) suggest CYP metabolizer variant. PGx testing indicated to guide pharmacotherapy selection.",
    familyHistory: "Mother: Major depressive disorder, responded well to bupropion.\nFather: No psychiatric history.\nNo known pharmacogenomic family history documented.",
    priorTreatments: "Sertraline 150mg x 8 weeks: Inadequate response, severe nausea.\nFluoxetine 40mg x 10 weeks: Partial response, discontinued for agitation and insomnia.\nVenlafaxine 225mg x 12 weeks: Modest improvement, discontinued for hypertension and diaphoresis.\nPHQ-9 scores: 22 (baseline) → 18 (post-sertraline) → 15 (post-fluoxetine) → 14 (post-venlafaxine).\nCurrent: Bupropion 150mg with partial response (PHQ-9: 12).",
    medications: ["Bupropion 150mg daily", "Trazodone 50mg PRN", "Lorazepam 0.5mg PRN"],
    allergies: ["Codeine (nausea/vomiting — possible poor metabolizer)"],

    priority: "Routine", orderDate: "2026-04-05", estimatedReport: "2026-04-15",

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
    billingStatus: "claim_submitted",
    billingNotes: "Claim #CLM-260410-0098 submitted to BCBS",
    claimId: "CLM-260410-0098",
    labNotes: [
      { date: "2026-04-05", by: "T. Park", note: "Buccal swab accessioned. QC pass." },
      { date: "2026-04-08", by: "M. Davis", note: "PA approved by BCBS. Auth# BCBS-PA-55021." },
      { date: "2026-04-10", by: "Dr. R. Shah", note: "LOMN signed and submitted to BCBS UR." },
      { date: "2026-04-13", by: "Lab", note: "CYP2D6 genotyping complete — *4/*41 (intermediate metabolizer)." },
    ],
  },
];

const DOC_LABELS: Record<string, string> = {
  requisitionForm: "Test Requisition",
  patientDemographics: "Patient Demographics",
  insuranceCardFrontBack: "Insurance Card (F/B)",
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

const ICD_DESCRIPTIONS: Record<string, string> = {
  "Z15.01": "Genetic susceptibility to malignant neoplasm of breast",
  "Z80.3": "Family history of malignant neoplasm of breast",
  "I42.1": "Obstructive hypertrophic cardiomyopathy",
  "Z82.41": "Family history of sudden cardiac death",
  "Z91.19": "Patient's noncompliance with other medical treatment and regimen",
  "F33.2": "Major depressive disorder, recurrent severe without psychotic features",
};

/* ──────────────────────────────────────────────
   Serialize a hardcoded patient into the backend's
   Order shape so the real pipeline can run on it.
   ────────────────────────────────────────────── */

function buildOrderFromPatient(p: Patient) {
  const [firstName, ...rest] = p.name.split(" ");
  const lastName = rest.join(" ");
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
        description: ICD_DESCRIPTIONS[code] ?? "",
      })),
      indications: [{ name: p.diagnosis, category: "" }],
      genes_of_interest: [],
      prior_genetic_testing: Boolean(p.priorTreatments),
      prior_testing_details: p.priorTreatments ?? null,
      supplemental_notes: p.clinicalIndication,
      is_inpatient: false,
      family_history: p.familyHistory,
      additional_info: (p.medications?.length || p.allergies?.length)
        ? `Medications: ${(p.medications ?? []).join("; ") || "(none)"} | Allergies: ${(p.allergies ?? []).join("; ") || "(none)"}`
        : null,
    },
    care_team: {
      institution_name: p.facilityName,
      institution_code: p.facilityCLIA ?? "",
      ordering_provider_first_name: providerFirst ?? "",
      ordering_provider_last_name: providerLast,
      ordering_provider_email: p.physicianEmail ?? null,
      ordering_provider_phone: p.physicianPhone ?? null,
      primary_contact_first_name: null,
      primary_contact_last_name: null,
    },
    sample: {
      status: p.specimenStatus ?? "",
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
   Visual primitives
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
    pending_auth: { label: "pending PA", tone: "text-[var(--warning)] bg-[var(--warning)]/8 border-[var(--warning)]/30" },
    pa_approved: { label: "PA approved", tone: "text-[var(--success)] bg-[var(--success)]/8 border-[var(--success)]/30" },
    pa_denied: { label: "PA denied", tone: "text-[var(--error)] bg-[var(--error)]/8 border-[var(--error)]/30" },
    pa_submitted: { label: "PA submitted", tone: "text-[var(--warning)] bg-[var(--warning)]/8 border-[var(--warning)]/30" },
    claim_submitted: { label: "claim submitted", tone: "text-[var(--accent)] bg-[var(--accent)]/8 border-[var(--accent)]/30" },
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
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-[var(--muted)] tabular-nums shrink-0">{completed}/{total}</span>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "warning" | "error" }) {
  const valueColor =
    tone === "warning" && value > 0 ? "text-[var(--warning)]" :
    tone === "error" && value > 0 ? "text-[var(--error)]" :
    "text-[var(--foreground)]";
  return (
    <div className="border border-[var(--border)] bg-[var(--background)] rounded px-3 py-2">
      <div className="text-[9px] tracking-widest uppercase text-[var(--muted)]">{label}</div>
      <div className={`text-lg font-semibold font-mono tabular-nums mt-0.5 ${valueColor}`}>{value}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────── */

export default function Dashboard() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(PATIENTS[0]?.id ?? null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PATIENTS;
    return PATIENTS.filter((p) =>
      [p.name, p.id, p.accession, p.testPanel, p.insurance, p.diagnosis]
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
      // private browsing — fall through.
    }
    router.push("/");
  };

  const missingDocCount = PATIENTS.reduce(
    (acc, p) => acc + Object.values(p.documents).filter((d) => d.status === "missing").length, 0,
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 h-14">
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

      {/* Stats row */}
      <div className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-[1400px] mx-auto px-6 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Active orders" value={PATIENTS.length} />
          <StatCard label="Pending PA" value={PATIENTS.filter((p) => p.stages.priorAuthorization.status === "not_started").length} tone="warning" />
          <StatCard label="PA approved" value={PATIENTS.filter((p) => p.stages.priorAuthorization.status === "complete").length} />
          <StatCard label="MN pending" value={PATIENTS.filter((p) => p.stages.medicalNecessity.status === "not_started" && p.stages.priorAuthorization.status === "complete").length} />
          <StatCard label="In lab" value={PATIENTS.filter((p) => p.stages.labProcessing.status === "in_progress").length} />
          <StatCard label="Missing docs" value={missingDocCount} tone="error" />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-5 grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-5">
        {/* Left: patient list */}
        <div className="space-y-2">
          {filtered.map((p) => {
            const docsOk = Object.values(p.documents).filter((d) => d.status === "received").length;
            const docsTotal = Object.values(p.documents).filter((d) => d.status !== "not_required").length;
            const stagesOk = Object.values(p.stages).filter((s) => s.status === "complete").length;
            const isSelected = selectedId === p.id;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
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
                      {p.priority === "STAT" && (
                        <span className="text-[9px] font-semibold text-[var(--error)] border border-[var(--error)]/30 bg-[var(--error)]/8 rounded px-1.5 py-0.5 tracking-widest uppercase">
                          STAT
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[10px] font-mono text-[var(--muted)]">{p.id} · {p.accession}</div>
                    <div className="mt-1.5 text-[11px] text-[var(--foreground)]/80 truncate">
                      {p.testPanel}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--muted)] truncate">
                      {p.insurance}
                      <span className="mx-1.5 text-[var(--muted-soft)]">·</span>
                      {p.age}yo {p.gender}
                      <span className="mx-1.5 text-[var(--muted-soft)]">·</span>
                      TAT {p.turnaroundDays ?? "—"}d
                    </div>
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] tracking-widest uppercase text-[var(--muted-soft)]">Docs</span>
                        <ProgressBar completed={docsOk} total={docsTotal} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] tracking-widest uppercase text-[var(--muted-soft)]">Pipeline</span>
                        <ProgressBar completed={stagesOk} total={Object.keys(p.stages).length} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <StatusChip status={p.stages.priorAuthorization.status} size="xs" />
                      <StatusChip status={p.stages.medicalNecessity.status} size="xs" />
                      {p.billingStatus && <StatusChip status={p.billingStatus} size="xs" />}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-[var(--muted)] py-10 text-center">No orders match &ldquo;{search}&rdquo;.</p>
          )}
        </div>

        {/* Right: detail */}
        <div>
          {!selected ? (
            <div className="border border-dashed border-[var(--border)] rounded-lg p-10 text-center">
              <p className="text-xs text-[var(--muted)]">Select an order to see details.</p>
            </div>
          ) : (
            <DetailPanel patient={selected} onRun={runPriorAuth} />
          )}
        </div>
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────
   Detail panel — rich patient view
   ────────────────────────────────────────────── */

function DetailPanel({ patient, onRun }: { patient: Patient; onRun: (p: Patient) => void }) {
  return (
    <div className="space-y-4">
      {/* Top bar: name + CTA */}
      <div className="border border-[var(--border)] bg-[var(--background)] rounded-lg px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-[var(--foreground)]">{patient.name}</h2>
            {patient.priority === "STAT" && (
              <span className="text-[9px] font-semibold text-[var(--error)] border border-[var(--error)]/30 bg-[var(--error)]/8 rounded px-1.5 py-0.5 tracking-widest uppercase">
                STAT
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-[var(--muted)] flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="font-mono">{patient.id}</span>
            <span className="text-[var(--muted-soft)]">·</span>
            <span className="font-mono">{patient.accession}</span>
            <span className="text-[var(--muted-soft)]">·</span>
            <span>{patient.dob} ({patient.age}y, {patient.gender})</span>
            <span className="text-[var(--muted-soft)]">·</span>
            <span className="font-mono">{patient.mrn}</span>
          </div>
        </div>
        <button
          onClick={() => onRun(patient)}
          className="text-xs px-4 py-2 rounded bg-[var(--foreground)] text-[var(--background)] font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 shrink-0"
        >
          Run prior auth
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Facts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Insurance / Billing">
          <Row label="Payor" value={patient.insurance} />
          <Row label="Member ID" value={patient.memberId} mono />
          <Row label="Group" value={patient.groupNumber} mono />
          {patient.payorAddress && <Row label="PA address" value={patient.payorAddress} />}
          {patient.payorFax && <Row label="PA fax" value={patient.payorFax} mono />}
          {patient.billingStatus && (
            <div className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-[10px] tracking-widest uppercase text-[var(--muted-soft)] shrink-0">Billing</span>
              <StatusChip status={patient.billingStatus} size="xs" />
            </div>
          )}
          {patient.billingNotes && <Row label="Notes" value={patient.billingNotes} />}
          {patient.claimId && <Row label="Claim ID" value={patient.claimId} mono />}
        </Card>

        <Card title="Ordering provider">
          <Row label="Name" value={`${patient.orderingPhysician} · ${patient.physicianSpecialty}`} />
          <Row label="NPI" value={patient.physicianNPI} mono />
          {patient.physicianLicense && <Row label="License" value={patient.physicianLicense} mono />}
          {patient.physicianPhone && <Row label="Phone" value={patient.physicianPhone} mono />}
          {patient.physicianFax && <Row label="Fax" value={patient.physicianFax} mono />}
          {patient.physicianEmail && <Row label="Email" value={patient.physicianEmail} />}
          {patient.referringPhysician && (
            <Row
              label="Referring"
              value={`${patient.referringPhysician}${patient.referringSpecialty ? " · " + patient.referringSpecialty : ""}${patient.referringNPI ? " · NPI " + patient.referringNPI : ""}`}
            />
          )}
          <Row label="Facility" value={patient.facilityName} />
          {patient.facilityCLIA && <Row label="CLIA" value={patient.facilityCLIA} mono />}
        </Card>

        <Card title="Test + specimen">
          <Row label="Panel" value={patient.testPanel} />
          <Row label="CPT" value={patient.cptCodes.join(", ")} mono />
          <Row label="ICD-10" value={patient.icd10.join(", ")} mono />
          <Row label="Indication" value={patient.diagnosis} />
          {patient.methodology && <Row label="Methodology" value={patient.methodology} />}
          <Row label="Priority" value={patient.priority} />
          {patient.turnaroundDays !== undefined && <Row label="TAT" value={`${patient.turnaroundDays} days`} />}
          {patient.estimatedReport && <Row label="Estimated report" value={patient.estimatedReport} mono />}
          <Row label="Specimen" value={patient.specimenType} />
          {patient.specimenId && <Row label="Specimen ID" value={patient.specimenId} mono />}
          <Row label="Collected" value={patient.collectionDate} mono />
          {patient.receivedDate && <Row label="Received" value={patient.receivedDate} mono />}
          {patient.specimenStatus && <Row label="QC" value={patient.specimenStatus} />}
        </Card>

        <Card title="Patient contact">
          {patient.phone && <Row label="Phone" value={patient.phone} mono />}
          {patient.email && <Row label="Email" value={patient.email} />}
          {patient.address && <Row label="Address" value={patient.address} />}
          {patient.medications && patient.medications.length > 0 && (
            <div className="pt-1">
              <span className="text-[10px] tracking-widest uppercase text-[var(--muted-soft)]">Medications</span>
              <ul className="mt-1 space-y-0.5">
                {patient.medications.map((m, i) => (
                  <li key={i} className="text-[11px] text-[var(--foreground)] flex items-start gap-1.5">
                    <span className="text-[var(--muted-soft)] font-mono">·</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] tracking-widest uppercase text-[var(--muted-soft)]">Allergies</span>
              <ul className="mt-1 space-y-0.5">
                {patient.allergies.map((a, i) => (
                  <li key={i} className="text-[11px] text-[var(--foreground)] flex items-start gap-1.5">
                    <span className="text-[var(--warning)] font-mono">·</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Clinical narratives */}
      <Card title="Clinical">
        <Block label="Indication" value={patient.clinicalIndication} />
        <Block label="Family history" value={patient.familyHistory} />
        {patient.priorTreatments && <Block label="Prior workup / treatments" value={patient.priorTreatments} />}
      </Card>

      {/* Pipeline + docs side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Pipeline">
          <Timeline stages={patient.stages} />
        </Card>

        <Card title="Documents">
          <ul className="space-y-1">
            {Object.entries(patient.documents).map(([k, v]) => (
              <li key={k} className="flex items-center justify-between text-[11px] py-0.5">
                <span className="text-[var(--muted)]">{DOC_LABELS[k] ?? k}</span>
                <div className="flex items-center gap-2">
                  {v.date && <span className="text-[10px] font-mono text-[var(--muted-soft)]">{v.date}</span>}
                  <StatusChip status={v.status} size="xs" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Lab notes / audit trail */}
      {patient.labNotes && patient.labNotes.length > 0 && (
        <Card title="Activity">
          <ul className="space-y-3">
            {patient.labNotes.map((n, i) => (
              <li key={i} className="flex gap-3">
                <div className="shrink-0 flex flex-col items-center pt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  {i < (patient.labNotes?.length ?? 0) - 1 && (
                    <div className="w-px flex-1 bg-[var(--border)] mt-1" />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-baseline gap-2 text-[11px]">
                    <span className="font-mono text-[var(--muted)]">{n.date}</span>
                    <span className="text-[var(--muted-soft)]">·</span>
                    <span className="text-[var(--muted)]">{n.by}</span>
                  </div>
                  <p className="text-[11px] text-[var(--foreground)]/90 mt-0.5 leading-relaxed">
                    {n.note}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Bottom CTA */}
      <div className="border border-[var(--border)] bg-[var(--surface)] rounded-lg px-5 py-4">
        <p className="text-[11px] text-[var(--muted)] leading-relaxed mb-3">
          Run prior auth opens the agent with this order pre-filled and starts the pipeline.
          When the verdict arrives, use the &quot;Generate medical necessity form&quot; button on
          the result to draft the MNF.
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
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[var(--border)] bg-[var(--background)] rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="text-[10px] tracking-widest uppercase text-[var(--muted)] font-medium">
          {title}
        </div>
      </div>
      <div className="px-4 py-3 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-3 items-start py-0.5">
      <span className="text-[10px] tracking-widest uppercase text-[var(--muted-soft)] leading-tight pt-0.5">
        {label}
      </span>
      <span className={`text-[11px] text-[var(--foreground)] break-words ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <div className="text-[9px] tracking-widest uppercase text-[var(--muted-soft)] mb-1">{label}</div>
      <p className="text-[11px] text-[var(--foreground)]/90 leading-relaxed whitespace-pre-line">{value}</p>
    </div>
  );
}

function Timeline({ stages }: { stages: Record<string, { status: Stage; date: string | null; by: string | null }> }) {
  const entries = Object.entries(stages);
  return (
    <ul className="space-y-3">
      {entries.map(([k, v], i) => {
        const color =
          v.status === "complete" ? "var(--success)" :
          v.status === "in_progress" ? "var(--warning)" :
          "var(--muted-soft)";
        return (
          <li key={k} className="flex gap-3">
            <div className="shrink-0 flex flex-col items-center pt-1">
              <div
                className="w-2 h-2 rounded-full border-2"
                style={{
                  background: v.status === "complete" ? color : "var(--background)",
                  borderColor: color,
                }}
              />
              {i < entries.length - 1 && (
                <div className="w-px flex-1 mt-1" style={{ background: "var(--border)" }} />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--foreground)]">{STAGE_LABELS[k] ?? k}</span>
                <StatusChip status={v.status} size="xs" />
              </div>
              {(v.date || v.by) && (
                <div className="mt-0.5 text-[10px] text-[var(--muted)] flex items-center gap-2">
                  {v.date && <span className="font-mono">{v.date}</span>}
                  {v.date && v.by && <span className="text-[var(--muted-soft)]">·</span>}
                  {v.by && <span>{v.by}</span>}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
