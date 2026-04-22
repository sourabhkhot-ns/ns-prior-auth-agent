"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ══════════════════════════════════════════════
   TOOLTIP
   ══════════════════════════════════════════════ */
function Tip({ text, children, pos = "top" }: { text: string; children: ReactNode; pos?: "top" | "bottom" | "left" | "right" }) {
  const [show, setShow] = useState(false);
  const ps: Record<string, React.CSSProperties> = {
    top: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    left: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
    right: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
  };
  return (
    <span
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      className="relative inline-flex"
    >
      {children}
      {show && (
        <span
          style={{ position: "absolute", ...ps[pos] }}
          className="z-50 pointer-events-none bg-[var(--foreground)] text-[var(--background)] px-2.5 py-1.5 rounded text-[10px] font-medium leading-snug whitespace-pre-line shadow-lg max-w-[300px]"
        >
          {text}
        </span>
      )}
    </span>
  );
}

/* ══════════════════════════════════════════════
   DATA — unchanged from the mockup
   ══════════════════════════════════════════════ */
const PATIENTS: any[] = [
  {
    id: "TRQ-26-04187", accession: "ACC-260410-0187", name: "Margaret Chen", dob: "1958-03-14", age: 68, gender: "F", mrn: "MRN-2024-10481",
    insurance: "Aetna PPO", memberId: "AET-884571209", groupNumber: "GRP-77201", payorAddress: "Aetna Utilization Review, PO Box 14079, Lexington, KY 40512", payorFax: "(800) 367-6762", phone: "(415) 555-0142", email: "m.chen@email.com", address: "1247 Oak Valley Dr, San Francisco, CA 94110",
    orderingPhysician: "Dr. Sarah Patel", physicianNPI: "1234567890", physicianLicense: "CA-MD-A84721", physicianSpecialty: "Medical Genetics", physicianPhone: "(415) 555-8800", physicianFax: "(415) 555-8801", physicianEmail: "s.patel@ucsf.edu",
    referringPhysician: "Dr. James Liu", referringNPI: "2233445566", referringSpecialty: "Surgical Oncology",
    facilityName: "UCSF Medical Center", facilityNPI: "9876543210", facilityAddress: "505 Parnassus Ave, San Francisco, CA 94143", facilityCLIA: "05D0672675",
    testPanel: "BRCA1/BRCA2 Full Sequencing + Del/Dup", testCode: "81162", cptCodes: ["81162", "81163"], methodology: "NGS — Illumina NovaSeq 6000", turnaroundDays: 14, specimenType: "Peripheral Blood (EDTA)", specimenId: "SPM-260410-A1",
    collectionDate: "2026-04-10", receivedDate: "2026-04-11", specimenStatus: "Adequate",
    diagnosis: "Hereditary Breast & Ovarian Cancer Syndrome", icd10: ["Z15.01", "Z80.3"],
    clinicalIndication: "Family history of breast cancer (mother dx age 42, maternal aunt dx age 39). Patient presents with palpable mass in left breast, identified on diagnostic mammogram and ultrasound. Genetic testing is clinically indicated for risk stratification, treatment planning, and cascade testing of at-risk family members.",
    familyHistory: "Mother: Breast cancer dx age 42, confirmed BRCA1 pathogenic variant.\nMaternal aunt: Breast cancer dx age 39, untested.\nMaternal grandmother: Ovarian cancer dx age 55, deceased.\nPaternal history: Non-contributory.",
    priorTreatments: "Diagnostic mammogram (04/02/2026): BI-RADS 4B, 2.1cm irregular mass left breast.\nBreast ultrasound (04/05/2026): Solid hypoechoic mass, 2.3 x 1.8 cm.\nCore needle biopsy (04/08/2026): Pending pathology results.\nNo prior genetic testing performed.",
    medications: ["Tamoxifen 20mg daily", "Lisinopril 10mg daily", "Vitamin D3 2000IU"], allergies: ["Penicillin", "Sulfa drugs"],
    priority: "STAT", orderDate: "2026-04-10", estimatedReport: "2026-04-24",
    documents: {
      requisitionForm: { status: "received", date: "2026-04-10" }, patientDemographics: { status: "received", date: "2026-04-10" },
      insuranceCardFrontBack: { status: "received", date: "2026-04-10" }, physicianOrderForm: { status: "received", date: "2026-04-10" },
      clinicalNotes: { status: "received", date: "2026-04-11" }, familyHistoryPedigree: { status: "received", date: "2026-04-10" },
      informedConsent: { status: "received", date: "2026-04-10" }, priorLabResults: { status: "missing", date: null },
      referralLetter: { status: "received", date: "2026-04-09" }, abn: { status: "not_required", date: null },
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
    billingStatus: "pending_auth", billingNotes: "Awaiting PA before claim submission", claimId: null,
    labNotes: [
      { date: "2026-04-11", by: "K. Nguyen", note: "Specimen accessioned. DNA extraction queued." },
      { date: "2026-04-11", by: "L. Martinez", note: "Insurance verified — Aetna PPO active, genetic testing benefits confirmed." },
    ],
  },
  {
    id: "TRQ-26-04152", accession: "ACC-260408-0152", name: "Robert Williams", dob: "1971-08-22", age: 54, gender: "M", mrn: "MRN-2024-10482",
    insurance: "UnitedHealthcare", memberId: "UHC-339207841", groupNumber: "GRP-55108", payorAddress: "UHC Prior Auth, PO Box 30555, Salt Lake City, UT 84130", payorFax: "(800) 366-7925", phone: "(312) 555-0198", email: "r.williams@email.com", address: "892 Maple Ln, Chicago, IL 60614",
    orderingPhysician: "Dr. Michael Torres", physicianNPI: "0987654321", physicianLicense: "IL-MD-036.112847", physicianSpecialty: "Cardiovascular Genetics", physicianPhone: "(312) 555-7700", physicianFax: "(312) 555-7701", physicianEmail: "m.torres@nm.org",
    referringPhysician: "Dr. Angela Ross", referringNPI: "3344556677", referringSpecialty: "Cardiology",
    facilityName: "Northwestern Memorial Hospital", facilityNPI: "1122334455", facilityAddress: "251 E Huron St, Chicago, IL 60611", facilityCLIA: "14D0917166",
    testPanel: "Comprehensive Cardiomyopathy Panel (54 genes)", testCode: "81479", cptCodes: ["81479", "81405"], methodology: "NGS — Illumina NovaSeq 6000 + MLPA", turnaroundDays: 21, specimenType: "Peripheral Blood (EDTA)", specimenId: "SPM-260408-B3",
    collectionDate: "2026-04-07", receivedDate: "2026-04-08", specimenStatus: "Adequate",
    diagnosis: "Hypertrophic Cardiomyopathy", icd10: ["I42.1", "Z82.41"],
    clinicalIndication: "Unexplained left ventricular hypertrophy on echocardiogram (septal wall thickness 16mm). No hypertension or aortic stenosis. Brother died suddenly at age 32 — suspected HCM. Genetic testing indicated for definitive diagnosis, risk stratification for sudden cardiac death, and cascade testing of first-degree relatives.",
    familyHistory: "Brother: Sudden cardiac death age 32, autopsy showed asymmetric septal hypertrophy.\nFather: Heart failure dx age 58, LVH on echo, untested.\nPaternal uncle: ICD implant age 45, clinical HCM diagnosis.\nMother and siblings: No known cardiac disease.",
    priorTreatments: "Echocardiogram (03/20/2026): Septal wall 16mm, LVEF 65%, SAM with resting LVOT gradient 35mmHg.\n12-lead ECG: LVH voltage criteria, T-wave inversions V4-V6.\nCardiac MRI (03/28/2026): Asymmetric septal hypertrophy, late gadolinium enhancement in septum.\n48-hour Holter (04/01/2026): 3 runs of NSVT (longest 8 beats).\nNo prior genetic testing.",
    medications: ["Metoprolol 50mg BID", "Aspirin 81mg daily"], allergies: ["None known"],
    priority: "Routine", orderDate: "2026-04-08", estimatedReport: "2026-04-29",
    documents: {
      requisitionForm: { status: "received", date: "2026-04-08" }, patientDemographics: { status: "received", date: "2026-04-08" },
      insuranceCardFrontBack: { status: "received", date: "2026-04-08" }, physicianOrderForm: { status: "received", date: "2026-04-08" },
      clinicalNotes: { status: "received", date: "2026-04-09" }, familyHistoryPedigree: { status: "received", date: "2026-04-08" },
      informedConsent: { status: "missing", date: null }, priorLabResults: { status: "received", date: "2026-04-07" },
      referralLetter: { status: "missing", date: null }, abn: { status: "received", date: "2026-04-08" },
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
    billingStatus: "pa_approved", billingNotes: "PA approved — UHC Auth #UHC-PA-88412", claimId: null,
    labNotes: [
      { date: "2026-04-08", by: "K. Nguyen", note: "Specimen accessioned. Blood volume adequate (6mL EDTA)." },
      { date: "2026-04-09", by: "System", note: "Insurance eligibility verified — UHC active." },
      { date: "2026-04-12", by: "M. Davis", note: "PA approved by UHC. Auth# UHC-PA-88412, valid through 2026-07-12." },
    ],
  },
  {
    id: "TRQ-26-04098", accession: "ACC-260405-0098", name: "Diana Okafor", dob: "1985-11-03", age: 40, gender: "F", mrn: "MRN-2024-10483",
    insurance: "Blue Cross Blue Shield", memberId: "BCBS-771045632", groupNumber: "GRP-90334", payorAddress: "BCBS UR Dept, PO Box 105568, Atlanta, GA 30348", payorFax: "(800) 505-2227", phone: "(617) 555-0267", email: "d.okafor@email.com", address: "234 Beacon St, Boston, MA 02116",
    orderingPhysician: "Dr. Emily Nakamura", physicianNPI: "5678901234", physicianLicense: "MA-MD-272549", physicianSpecialty: "Psychiatry / Pharmacogenomics", physicianPhone: "(617) 555-3300", physicianFax: "(617) 555-3301", physicianEmail: "e.nakamura@mgh.harvard.edu",
    referringPhysician: "Dr. Robert Kim", referringNPI: "7788990011", referringSpecialty: "Psychiatry",
    facilityName: "Mass General Hospital", facilityNPI: "6677889900", facilityAddress: "55 Fruit St, Boston, MA 02114", facilityCLIA: "22D0684381",
    testPanel: "PGx Comprehensive Panel (CYP2D6/2C19/3A4)", testCode: "81225", cptCodes: ["81225", "81226", "81231"], methodology: "TaqMan Genotyping + NGS confirmation", turnaroundDays: 10, specimenType: "Buccal Swab", specimenId: "SPM-260405-C7",
    collectionDate: "2026-04-04", receivedDate: "2026-04-05", specimenStatus: "Adequate",
    diagnosis: "Pharmacogenomic Testing — Treatment-Resistant Depression", icd10: ["Z91.19", "F33.2"],
    clinicalIndication: "Treatment-resistant major depressive disorder. Failed adequate trials of sertraline (150mg x 8 wks), fluoxetine (40mg x 10 wks), and venlafaxine (225mg x 12 wks) over 18 months. Adverse reactions to multiple SSRIs (severe GI disturbance, serotonin-like symptoms) suggest CYP metabolizer variant. PGx testing indicated to guide pharmacotherapy selection.",
    familyHistory: "Mother: Major depressive disorder, responded well to bupropion.\nFather: No psychiatric history.\nNo known pharmacogenomic family history documented.",
    priorTreatments: "Sertraline 150mg x 8 weeks: Inadequate response, severe nausea.\nFluoxetine 40mg x 10 weeks: Partial response, discontinued for agitation and insomnia.\nVenlafaxine 225mg x 12 weeks: Modest improvement, discontinued for hypertension and diaphoresis.\nPHQ-9 scores: 22 (baseline) → 18 (post-sertraline) → 15 (post-fluoxetine) → 14 (post-venlafaxine).\nCurrent: Bupropion 150mg with partial response (PHQ-9: 12).",
    medications: ["Bupropion 150mg daily", "Trazodone 50mg PRN", "Lorazepam 0.5mg PRN"], allergies: ["Codeine (nausea/vomiting — possible poor metabolizer)"],
    priority: "Routine", orderDate: "2026-04-05", estimatedReport: "2026-04-15",
    documents: {
      requisitionForm: { status: "received", date: "2026-04-05" }, patientDemographics: { status: "received", date: "2026-04-05" },
      insuranceCardFrontBack: { status: "received", date: "2026-04-05" }, physicianOrderForm: { status: "received", date: "2026-04-05" },
      clinicalNotes: { status: "received", date: "2026-04-06" }, familyHistoryPedigree: { status: "received", date: "2026-04-05" },
      informedConsent: { status: "received", date: "2026-04-05" }, priorLabResults: { status: "received", date: "2026-04-04" },
      referralLetter: { status: "received", date: "2026-04-03" }, abn: { status: "not_required", date: null },
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
    billingStatus: "claim_submitted", billingNotes: "Claim #CLM-260410-0098 submitted to BCBS", claimId: "CLM-260410-0098",
    labNotes: [
      { date: "2026-04-05", by: "T. Park", note: "Buccal swab accessioned. QC pass." },
      { date: "2026-04-08", by: "M. Davis", note: "PA approved by BCBS. Auth# BCBS-PA-55021." },
      { date: "2026-04-10", by: "Dr. R. Shah", note: "LOMN signed and submitted to BCBS UR." },
      { date: "2026-04-13", by: "Lab", note: "CYP2D6 genotyping complete — *4/*41 (intermediate metabolizer)." },
    ],
  },
];

const DOC_LABELS: Record<string, string> = { requisitionForm: "Test Requisition", patientDemographics: "Patient Demographics", insuranceCardFrontBack: "Insurance Card (F/B)", physicianOrderForm: "Physician Order", clinicalNotes: "Clinical Notes", familyHistoryPedigree: "Family History / Pedigree", informedConsent: "Informed Consent", priorLabResults: "Prior Lab Results", referralLetter: "Referral Letter", abn: "ABN" };
const DOC_TIPS: Record<string, string> = { requisitionForm: "Lab test requisition with test selection and physician signature", patientDemographics: "Full name, DOB, address, contact info", insuranceCardFrontBack: "Scanned front and back of active insurance card", physicianOrderForm: "Signed physician order for genetic test", clinicalNotes: "Clinical notes supporting medical necessity", familyHistoryPedigree: "Three-generation family history or pedigree", informedConsent: "Patient consent for testing and results disclosure", priorLabResults: "Previous relevant lab or pathology results", referralLetter: "Specialist referral letter if applicable", abn: "Medicare ABN when coverage is uncertain" };
const STAGE_LABELS: Record<string, string> = { orderReceived: "Order Received", specimenAccessioned: "Specimen Accessioned", insuranceVerification: "Insurance Verification", priorAuthorization: "Prior Authorization", medicalNecessity: "Medical Necessity", labProcessing: "Lab Processing", reportGeneration: "Report Generation", reportDelivery: "Report Delivery" };
const STAGE_TIPS: Record<string, string> = { orderReceived: "Test order registered", specimenAccessioned: "Specimen logged, labeled, QC checked", insuranceVerification: "Eligibility and benefits check with payor", priorAuthorization: "PA submitted and determination received", medicalNecessity: "LOMN drafted, signed, and submitted", labProcessing: "DNA extraction, sequencing, bioinformatics", reportGeneration: "Variant interpretation and clinical report", reportDelivery: "Report delivered to ordering physician" };

const ICD_DESCRIPTIONS: Record<string, string> = {
  "Z15.01": "Genetic susceptibility to malignant neoplasm of breast",
  "Z80.3": "Family history of malignant neoplasm of breast",
  "I42.1": "Obstructive hypertrophic cardiomyopathy",
  "Z82.41": "Family history of sudden cardiac death",
  "Z91.19": "Patient's noncompliance with other medical treatment and regimen",
  "F33.2": "Major depressive disorder, recurrent severe without psychotic features",
};

/* ══════════════════════════════════════════════
   STATUS BADGE — colors via CSS vars
   ══════════════════════════════════════════════ */
const STATUS_CONFIG: Record<string, { tone: string; label: string; icon: string }> = {
  complete:            { tone: "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30", label: "Complete",          icon: "✓" },
  received:            { tone: "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30", label: "Received",          icon: "✓" },
  in_progress:         { tone: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30", label: "In Progress",       icon: "◐" },
  not_started:         { tone: "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]",          label: "Not Started",       icon: "○" },
  missing:             { tone: "text-[var(--error)] bg-[var(--error)]/10 border-[var(--error)]/30",       label: "Missing",           icon: "✕" },
  not_required:        { tone: "text-[var(--muted-soft)] bg-[var(--surface)] border-[var(--border)]",     label: "N/A",               icon: "—" },
  draft:               { tone: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/30",    label: "Draft",             icon: "✎" },
  pending_signature:   { tone: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30", label: "Awaiting Signature", icon: "✍" },
  pending_verification:{ tone: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30", label: "Verifying",         icon: "◐" },
  pending_auth:        { tone: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30", label: "Pending PA",        icon: "⏳" },
  pa_submitted:        { tone: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30", label: "PA Submitted",      icon: "◐" },
  pa_approved:         { tone: "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30", label: "PA Approved",       icon: "✓" },
  pa_denied:           { tone: "text-[var(--error)] bg-[var(--error)]/10 border-[var(--error)]/30",       label: "PA Denied",         icon: "✕" },
  claim_submitted:     { tone: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/30",    label: "Claim Submitted",   icon: "↗" },
};

function StatusBadge({ status, size = "sm" }: { status: string; size?: "xs" | "sm" }) {
  const c = STATUS_CONFIG[status] ?? { tone: "text-[var(--muted)] bg-[var(--surface)] border-[var(--border)]", label: status, icon: "○" };
  const padding = size === "xs" ? "px-1.5 py-px" : "px-2 py-0.5";
  const text = size === "xs" ? "text-[10px]" : "text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full font-semibold leading-none ${c.tone} ${padding} ${text}`}>
      <span className="text-[9px]">{c.icon}</span>{c.label}
    </span>
  );
}

function ProgressRing({ completed, total, label }: { completed: number; total: number; label: string }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const r = 16, circ = 2 * Math.PI * r;
  const color = pct === 100 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--error)";
  return (
    <Tip text={`${completed}/${total} ${label}`}>
      <div className="relative w-10 h-10 shrink-0">
        <svg width={40} height={40} viewBox="0 0 40 40">
          <circle cx={20} cy={20} r={r} fill="none" stroke="var(--border)" strokeWidth={3.5} />
          <circle cx={20} cy={20} r={r} fill="none" stroke={color} strokeWidth={3.5}
                  strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
                  strokeLinecap="round" transform="rotate(-90 20 20)"
                  style={{ transition: "stroke-dashoffset .5s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold font-mono" style={{ color }}>
          {completed}/{total}
        </div>
      </div>
    </Tip>
  );
}

function Spinner() {
  return <span className="inline-block w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin-slow" />;
}

/* ══════════════════════════════════════════════
   PRIOR AUTH MOCK GENERATOR (unchanged) +
   NEW: buildOrderFromPatient for the real-agent handoff
   ══════════════════════════════════════════════ */
const generatePriorAuth = (p: any) => ({
  authNumber: `PA-${Date.now().toString(36).toUpperCase()}`, determination: "Approved",
  submittedDate: new Date().toISOString().split("T")[0], validThrough: "2026-07-15", reviewType: "System Auto-Adjudication",
  summary: {
    patientName: p.name, memberId: p.memberId, insurance: p.insurance,
    requestingProvider: p.orderingPhysician, npi: p.physicianNPI, facility: p.facilityName,
    diagnosis: `${p.diagnosis} (${p.icd10.join(", ")})`, procedureCodes: p.cptCodes.join(", "),
    serviceRequested: p.testPanel, placeOfService: "Laboratory (POS 81)",
    clinicalRationale: `Testing meets ${p.insurance} medical policy criteria. ${p.clinicalIndication.substring(0, 120)}...`,
    estimatedCost: "$" + (2000 + Math.floor(Math.random() * 2000)).toLocaleString() + ".00",
  },
});

const generateMissingDocEmail = (patient: any, docKey: string) => {
  const docName = DOC_LABELS[docKey];
  const isPatient = ["informedConsent", "familyHistoryPedigree", "insuranceCardFrontBack"].includes(docKey);
  const rName = isPatient ? patient.name : (patient.referringPhysician || patient.orderingPhysician);
  return {
    to: isPatient ? patient.email : "orders@clinic.example.com",
    toName: rName,
    subject: `ACTION REQUIRED: ${docName} — ${patient.name} (${patient.id})`,
    body: `Dear ${rName},\n\nWe are processing genetic testing order ${patient.id} (Accession: ${patient.accession}) for ${isPatient ? "you" : patient.name + " (" + patient.mrn + ")"} and need the following document:\n\n  Missing: ${docName}\n\nThis is required before insurance authorization and testing can proceed. The ordered test is ${patient.testPanel}.\n\n${isPatient ? "Submit by replying to this email, patient portal, or bring to your next appointment." : "Submit via fax (800-555-0101), email reply, or provider portal."}\n\nReference order ${patient.id} with questions.\n\nThank you,\nClinical Operations\nLaboratory\n(800) 555-0100 | Fax: (800) 555-0101`,
  };
};

function buildOrderFromPatient(p: any) {
  const [firstName, ...rest] = p.name.split(" ");
  const lastName = rest.join(" ");
  const [providerFirst, ...providerRest] = p.orderingPhysician.replace(/^Dr\.\s*/i, "").split(" ");
  const providerLast = providerRest.join(" ");
  return {
    order_id: p.id,
    test_code: p.testCode,
    test_name: p.testPanel,
    patient: {
      first_name: firstName, last_name: lastName,
      date_of_birth: p.dob,
      sex: p.gender === "F" ? "Female" : p.gender === "M" ? "Male" : p.gender,
      medical_record_number: p.mrn,
      email: p.email ?? null, phone: p.phone ?? null, address: p.address ?? null,
      ethnicity: [], preferred_language: "ENGLISH", relatives: [],
    },
    insurance: {
      payment_method: "INSURANCE", insurance_type: "COMMERCIAL",
      primary: {
        company_name: p.insurance,
        company_code: p.insurance.toUpperCase().replace(/\s+/g, "_"),
        member_id: p.memberId, group_id: p.groupNumber,
        authorization_number: null, relationship: "SELF", type: "PRIMARY",
      },
      secondary: null,
    },
    clinical_info: {
      icd10_codes: p.icd10.map((code: string) => ({ code, description: ICD_DESCRIPTIONS[code] ?? "" })),
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
      institution_name: p.facilityName, institution_code: p.facilityCLIA ?? "",
      ordering_provider_first_name: providerFirst ?? "", ordering_provider_last_name: providerLast,
      ordering_provider_email: p.physicianEmail ?? null, ordering_provider_phone: p.physicianPhone ?? null,
      primary_contact_first_name: null, primary_contact_last_name: null,
    },
    sample: { status: p.specimenStatus ?? "", sample_type: p.specimenType, collection_date: p.collectionDate },
    documents: Object.entries(p.documents)
      .filter(([, v]: any) => v.status === "received")
      .map(([k]: any) => ({ title: DOC_LABELS[k] ?? k, document_type: k })),
    consents: [],
  };
}

/* ══════════════════════════════════════════════
   LOMN FORM — preserved, restyled
   ══════════════════════════════════════════════ */
function LOMNForm({ patient, onSendSignature, onDownload, signatureStatus }: any) {
  const [fields, setFields] = useState(() => ({
    clinicalIndication: patient.clinicalIndication,
    familyHistory: patient.familyHistory,
    priorTreatments: patient.priorTreatments || "",
    clinicalJustification: `1. ${patient.name}'s clinical presentation and family history meet established criteria per NCCN, ACMG, and AMP guidelines for ${patient.testPanel}.\n\n2. Test results will directly impact clinical management including treatment selection, risk stratification, and identification of at-risk family members for cascade genetic testing.\n\n3. Without this testing, the clinical team cannot make fully informed decisions regarding the patient's care plan, potentially leading to suboptimal outcomes, unnecessary invasive procedures, or missed opportunities for targeted therapy.\n\n4. This testing is supported by current peer-reviewed literature and professional society guidelines for patients meeting these clinical criteria.`,
    expectedImpact: `A positive (pathogenic/likely pathogenic) finding would:\n• Guide targeted treatment selection and therapy planning\n• Inform cascade genetic testing for at-risk first-degree relatives\n• Enable evidence-based surveillance and risk-reduction protocols\n• Potentially qualify the patient for targeted therapies or clinical trials\n\nA negative result would:\n• Appropriately de-escalate risk assessment\n• Avoid unnecessary invasive procedures or prophylactic interventions\n• Inform the need for alternative diagnostic workup if clinically indicated`,
    guidelineRefs: "• NCCN Clinical Practice Guidelines in Oncology — Genetic/Familial High-Risk Assessment (current version)\n• ACMG/AMP Standards and Guidelines for the Interpretation of Sequence Variants (Richards et al., 2015)\n• AMP Clinical Practice Guidelines for Next-Generation Sequencing-Based Multi-Gene Panel Testing",
    additionalNotes: "",
  }));
  const [supportingDocs, setSupportingDocs] = useState<Record<string, boolean>>(() => {
    const docs: Record<string, boolean> = {};
    Object.entries(patient.documents).forEach(([k, v]: any) => { docs[k] = v.status === "received"; });
    return docs;
  });

  const updateField = (key: string, val: string) => setFields(p => ({ ...p, [key]: val }));
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const ReadOnly = ({ label, value, mono, half }: any) => (
    <div className={`${half ? "flex-[1_1_48%] min-w-[180px]" : "flex-[1_1_100%]"} mb-2.5`}>
      <div className="text-[9px] font-semibold uppercase tracking-widest text-[var(--muted-soft)] mb-1">{label}</div>
      <div className={`px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--foreground)] leading-snug min-h-[28px] whitespace-pre-wrap ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );

  const Editable = ({ label, fieldKey, rows = 3, tip }: any) => (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="text-[9px] font-semibold uppercase tracking-widest text-[var(--accent)]">{label}</div>
        <span className="text-[8px] font-semibold px-1 py-px rounded bg-[var(--accent)]/10 text-[var(--accent)] tracking-widest">EDITABLE</span>
        {tip && <Tip text={tip}><span className="text-[10px] text-[var(--muted-soft)] cursor-help">ⓘ</span></Tip>}
      </div>
      <textarea
        value={(fields as any)[fieldKey]}
        onChange={e => updateField(fieldKey, e.target.value)}
        rows={rows}
        className="w-full px-2.5 py-1.5 rounded border border-[var(--accent)]/30 bg-[var(--accent)]/5 text-[11px] text-[var(--foreground)] leading-relaxed resize-y focus:outline-none focus:border-[var(--accent)]"
      />
    </div>
  );

  const Section = ({ title, number }: { title: string; number: string }) => (
    <div className="flex items-center gap-2 mt-5 mb-2.5 pb-1.5 border-b-2 border-[var(--border)]">
      <span className="w-[22px] h-[22px] rounded-full bg-[var(--accent)] text-[var(--background)] flex items-center justify-center text-[10px] font-bold">{number}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--foreground)]">{title}</span>
    </div>
  );

  const generatePlainText = () => {
    return `LETTER OF MEDICAL NECESSITY
${"═".repeat(60)}
Date: ${today}
Test Requisition: ${patient.id} | Accession: ${patient.accession}

TO: ${patient.insurance} — Utilization Review Department
${patient.payorAddress}
Fax: ${patient.payorFax}

RE: ${patient.name} | DOB: ${patient.dob} | Member ID: ${patient.memberId} | Group: ${patient.groupNumber}

Dear Medical Director,

I am writing to establish the medical necessity of ${patient.testPanel} (CPT: ${patient.cptCodes.join(", ")}) for my patient, ${patient.name} (MRN: ${patient.mrn}).

PATIENT INFORMATION
  Name: ${patient.name}
  DOB: ${patient.dob} (Age ${patient.age}, ${patient.gender === "F" ? "Female" : "Male"})
  MRN: ${patient.mrn}
  Address: ${patient.address}
  Insurance: ${patient.insurance} | Member: ${patient.memberId} | Group: ${patient.groupNumber}

ORDERING PROVIDER
  ${patient.orderingPhysician} | NPI: ${patient.physicianNPI}
  Specialty: ${patient.physicianSpecialty}
  ${patient.facilityName} | CLIA: ${patient.facilityCLIA}

DIAGNOSIS
  ${patient.diagnosis}
  ICD-10: ${patient.icd10.join(", ")}

REQUESTED TEST
  ${patient.testPanel} (${patient.testCode})
  CPT: ${patient.cptCodes.join(", ")}
  Methodology: ${patient.methodology}
  Specimen: ${patient.specimenType} | ID: ${patient.specimenId} | Collected: ${patient.collectionDate}

CLINICAL INDICATION
${fields.clinicalIndication}

RELEVANT FAMILY HISTORY
${fields.familyHistory}

PRIOR TREATMENTS & DIAGNOSTIC WORKUP
${fields.priorTreatments}

CLINICAL JUSTIFICATION
${fields.clinicalJustification}

EXPECTED CLINICAL IMPACT
${fields.expectedImpact}

GUIDELINE REFERENCES
${fields.guidelineRefs}

${fields.additionalNotes ? `ADDITIONAL NOTES\n${fields.additionalNotes}\n` : ""}
SUPPORTING DOCUMENTATION ENCLOSED
${Object.entries(supportingDocs).filter(([, v]) => v).map(([k]) => `  ✓ ${DOC_LABELS[k]}`).join("\n")}

I certify that this test is medically necessary for the diagnosis and treatment of this patient. I am available for peer-to-peer review if required.

Respectfully,

${patient.orderingPhysician}
NPI: ${patient.physicianNPI} | License: ${patient.physicianLicense}
${patient.facilityName}
Phone: ${patient.physicianPhone} | Fax: ${patient.physicianFax}
[SIGNATURE — Ordering Physician]

${"_".repeat(40)}
${patient.referringPhysician}
NPI: ${patient.referringNPI}
Specialty: ${patient.referringSpecialty}
[SIGNATURE — Referring Physician]`;
  };

  return (
    <div className="max-h-[calc(100vh-80px)] overflow-y-auto px-0.5">
      {/* Header */}
      <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/30 rounded-lg px-4 py-3.5 mb-4 text-center">
        <div className="text-sm font-bold text-[var(--accent)] tracking-wide">LETTER OF MEDICAL NECESSITY</div>
        <div className="text-[10px] text-[var(--accent)]/80 mt-0.5">For Genetic Testing — Prior Authorization Support</div>
        <div className="flex justify-center gap-6 mt-2 text-[10px] text-[var(--muted)]">
          <span>Date: <strong className="text-[var(--foreground)]">{today}</strong></span>
          <span>TRQ: <strong className="text-[var(--foreground)] font-mono">{patient.id}</strong></span>
          <span>Accession: <strong className="text-[var(--foreground)] font-mono">{patient.accession}</strong></span>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3 items-center">
        <StatusBadge status={signatureStatus ? "pending_signature" : "draft"} />
        <span className="text-[10px] text-[var(--muted-soft)]">
          {signatureStatus ? "Sent for physician signatures" : "AI-generated draft — review fields marked EDITABLE, then send for signature"}
        </span>
      </div>

      <Section title="Payor Information" number="1" />
      <div className="flex flex-wrap gap-x-3">
        <ReadOnly label="Insurance Carrier" value={patient.insurance} half />
        <ReadOnly label="Member ID" value={patient.memberId} mono half />
        <ReadOnly label="Group Number" value={patient.groupNumber} mono half />
        <ReadOnly label="Payor Fax" value={patient.payorFax} half />
        <ReadOnly label="Utilization Review Address" value={patient.payorAddress} />
      </div>

      <Section title="Patient Information" number="2" />
      <div className="flex flex-wrap gap-x-3">
        <ReadOnly label="Patient Name" value={patient.name} half />
        <ReadOnly label="Date of Birth / Age / Sex" value={`${patient.dob}  (${patient.age}, ${patient.gender === "F" ? "Female" : "Male"})`} half />
        <ReadOnly label="MRN" value={patient.mrn} mono half />
        <ReadOnly label="Phone" value={patient.phone} half />
        <ReadOnly label="Address" value={patient.address} />
      </div>

      <Section title="Provider Information" number="3" />
      <div className="grid grid-cols-2 gap-2.5 mb-1.5">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-2.5">
          <div className="text-[9px] font-bold text-[var(--accent)] mb-1.5 uppercase tracking-widest">Ordering Physician</div>
          {[patient.orderingPhysician, `NPI: ${patient.physicianNPI}`, `License: ${patient.physicianLicense}`, patient.physicianSpecialty, `Ph: ${patient.physicianPhone}`, `Fax: ${patient.physicianFax}`].map((v, i) => <div key={i} className="text-[11px] text-[var(--foreground)] leading-relaxed">{v}</div>)}
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-2.5">
          <div className="text-[9px] font-bold text-[var(--accent)] mb-1.5 uppercase tracking-widest">Referring Physician</div>
          {[patient.referringPhysician, `NPI: ${patient.referringNPI}`, patient.referringSpecialty].map((v, i) => <div key={i} className="text-[11px] text-[var(--foreground)] leading-relaxed">{v}</div>)}
        </div>
      </div>
      <ReadOnly label="Testing Facility" value={`${patient.facilityName} | NPI: ${patient.facilityNPI} | CLIA: ${patient.facilityCLIA}\n${patient.facilityAddress}`} />

      <Section title="Diagnosis & Requested Test" number="4" />
      <div className="flex flex-wrap gap-x-3">
        <ReadOnly label="Primary Diagnosis" value={patient.diagnosis} />
        <ReadOnly label="ICD-10 Code(s)" value={patient.icd10.join(", ")} mono half />
        <ReadOnly label="CPT Code(s)" value={patient.cptCodes.join(", ")} mono half />
        <ReadOnly label="Test Ordered" value={`${patient.testPanel} (${patient.testCode})`} />
        <ReadOnly label="Methodology" value={patient.methodology} half />
        <ReadOnly label="Specimen" value={`${patient.specimenType} | ${patient.specimenId} | Collected: ${patient.collectionDate}`} half />
      </div>

      <Section title="Clinical Information" number="5" />
      <Editable label="Clinical Indication & History of Present Illness" fieldKey="clinicalIndication" rows={4} tip="Describe the clinical presentation, symptoms, and reason testing is being ordered. Be specific — payors look for concrete clinical findings." />
      <Editable label="Relevant Family History" fieldKey="familyHistory" rows={4} tip="Include 3-generation pedigree summary. Specify cancer types, ages at dx, genetic test results for relatives." />
      <Editable label="Prior Treatments & Diagnostic Workup" fieldKey="priorTreatments" rows={5} tip="List prior labs, imaging, biopsies, medications tried and outcomes. This demonstrates that testing is the appropriate next step." />
      <ReadOnly label="Current Medications" value={patient.medications.join("; ")} />
      <ReadOnly label="Allergies" value={patient.allergies.join(", ")} />

      <Section title="Clinical Justification" number="6" />
      <Editable label="Medical Necessity Justification" fieldKey="clinicalJustification" rows={8} tip="Core argument. Why testing is necessary, how results change management, why it can't be deferred." />
      <Editable label="Expected Clinical Impact of Results" fieldKey="expectedImpact" rows={6} tip="How positive and negative results each affect the patient's care plan." />

      <Section title="Guideline & Literature References" number="7" />
      <Editable label="Supporting Guidelines & References" fieldKey="guidelineRefs" rows={3} tip="Cite NCCN, ACMG, AMP, or other society guidelines supporting testing for this indication." />
      <Editable label="Additional Notes (Optional)" fieldKey="additionalNotes" rows={2} tip="Any additional context for the medical director reviewer." />

      <Section title="Enclosed Supporting Documentation" number="8" />
      <div className="grid grid-cols-2 gap-1 mb-4">
        {Object.entries(patient.documents).filter(([, v]: any) => v.status !== "not_required").map(([key, doc]: any) => (
          <Tip key={key} text={DOC_TIPS[key]}>
            <label className={`flex items-center gap-2 px-2.5 py-1.5 rounded border cursor-pointer text-[11px] text-[var(--foreground)] ${supportingDocs[key] ? "bg-[var(--success)]/8 border-[var(--success)]/30" : "bg-[var(--surface)] border-[var(--border)]"}`}>
              <input type="checkbox" checked={supportingDocs[key] || false} onChange={e => setSupportingDocs(p => ({ ...p, [key]: e.target.checked }))} className="accent-[var(--accent)]" />
              <span>{DOC_LABELS[key]}</span>
              {doc.status === "missing" && <span className="text-[9px] text-[var(--error)] font-bold">(MISSING)</span>}
            </label>
          </Tip>
        ))}
      </div>

      <Section title="Physician Attestation & Signature" number="9" />
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-3.5 mb-4 text-[11px] text-[var(--foreground)] leading-relaxed">
        <p className="mb-2.5">I certify that the above genetic testing is medically necessary for the diagnosis and/or treatment of the above-named patient. The information provided is true and accurate to the best of my knowledge. I have provided genetic counseling to the patient and informed consent has been obtained. I am available for peer-to-peer review if required by the payor.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-t-2 border-[var(--muted)] pt-2">
            <div className="text-[11px] font-semibold text-[var(--foreground)]">{patient.orderingPhysician}</div>
            <div className="text-[9px] text-[var(--muted)]">NPI: {patient.physicianNPI} | {patient.physicianSpecialty}</div>
            <div className="text-[9px] text-[var(--muted)]">{patient.facilityName}</div>
            <div className={`mt-1.5 px-2.5 py-1 rounded text-[9px] font-semibold border ${signatureStatus?.orderingPhysician?.status === "signed" ? "bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]" : "bg-[var(--warning)]/10 border-[var(--warning)]/30 text-[var(--warning)]"}`}>
              {signatureStatus?.orderingPhysician?.status === "signed" ? "✓ Signed" : "☐ Signature Required"}
            </div>
          </div>
          <div className="border-t-2 border-[var(--muted)] pt-2">
            <div className="text-[11px] font-semibold text-[var(--foreground)]">{patient.referringPhysician}</div>
            <div className="text-[9px] text-[var(--muted)]">NPI: {patient.referringNPI} | {patient.referringSpecialty}</div>
            <div className={`mt-1.5 px-2.5 py-1 rounded text-[9px] font-semibold border ${signatureStatus?.referringPhysician?.status === "signed" ? "bg-[var(--success)]/10 border-[var(--success)]/30 text-[var(--success)]" : "bg-[var(--warning)]/10 border-[var(--warning)]/30 text-[var(--warning)]"}`}>
              {signatureStatus?.referringPhysician?.status === "signed" ? "✓ Signed" : "☐ Signature Required"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 sticky bottom-0 bg-[var(--background)] py-2.5 border-t border-[var(--border)]">
        <Tip text="Send the reviewed LOMN to ordering & referring physicians for digital signature">
          <button onClick={onSendSignature} className="flex-1 px-3 py-2.5 rounded bg-[var(--accent)] text-[var(--background)] text-xs font-bold hover:opacity-90 transition-opacity">✍ Send for Digital Signature</button>
        </Tip>
        <Tip text="Download the complete LOMN as a text file">
          <button onClick={() => onDownload(generatePlainText(), `LOMN-${patient.id}.txt`)} className="px-4 py-2.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-semibold hover:border-[var(--muted)] transition-colors">↓ Download</button>
        </Tip>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════ */
export default function Dashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>(PATIENTS);
  const [viewMode, setViewMode] = useState<Record<string, string>>({});
  const [activePanel, setActivePanel] = useState<any>(null);
  const [priorAuthResults, setPriorAuthResults] = useState<Record<string, any>>({});
  const [medNecessityDrafts, setMedNecessityDrafts] = useState<Record<string, boolean>>({});
  const [signatureStatus, setSignatureStatus] = useState<Record<string, any>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [paSubmissions, setPaSubmissions] = useState<Record<string, any>>({
    "TRQ-26-04152": { status: "approved", submittedDate: "2026-04-11", method: "Electronic (Payor Portal)", confirmationNumber: "CNF-UHC-260411-8841", payorResponse: "Approved — meets medical policy criteria", responseDate: "2026-04-12", authNumber: "UHC-PA-88412", validThrough: "2026-07-12" },
    "TRQ-26-04098": { status: "approved", submittedDate: "2026-04-07", method: "Electronic (Payor Portal)", confirmationNumber: "CNF-BCBS-260407-5502", payorResponse: "Approved", responseDate: "2026-04-08", authNumber: "BCBS-PA-55021", validThrough: "2026-07-08" },
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const getView = (id: string) => viewMode[id] || "compact";
  const cycleView = (id: string) => { const o = ["compact", "expanded", "detailed"]; setViewMode(p => ({ ...p, [id]: o[(o.indexOf(getView(id)) + 1) % 3] })); };
  const setView = (id: string, v: string) => setViewMode(p => ({ ...p, [id]: v }));

  const missingDocs = (p: any) => Object.entries(p.documents).filter(([, v]: any) => v.status === "missing").map(([k]) => k);
  const receivedDocs = (p: any) => Object.entries(p.documents).filter(([, v]: any) => v.status === "received").length;
  const totalReqDocs = (p: any) => Object.entries(p.documents).filter(([, v]: any) => v.status !== "not_required").length;
  const completedStages = (p: any) => Object.values(p.stages).filter((v: any) => v.status === "complete").length;

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.accession.toLowerCase().includes(q) || p.testPanel.toLowerCase().includes(q);
  });

  /* ── Actions ── */
  const handlePriorAuth = async (patient: any) => {
    setAiLoading(`pa-${patient.id}`); await new Promise(r => setTimeout(r, 1800));
    const result = generatePriorAuth(patient);
    setPriorAuthResults(p => ({ ...p, [patient.id]: result }));
    setPatients(prev => prev.map(pt => pt.id === patient.id ? { ...pt, stages: { ...pt.stages, priorAuthorization: { status: "in_progress", date: new Date().toISOString().split("T")[0], by: "AI Agent (Draft)" } } } : pt));
    setPaSubmissions(p => ({ ...p, [patient.id]: { status: "draft", submittedDate: null, method: null, confirmationNumber: null, payorResponse: null, responseDate: null, authNumber: result.authNumber, validThrough: result.validThrough } }));
    setActivePanel({ pid: patient.id, type: "priorAuth", data: result }); setAiLoading(null);
  };

  const handleRunInAgent = (patient: any) => {
    try {
      sessionStorage.setItem("dashboardHandoff", JSON.stringify({
        order: buildOrderFromPatient(patient),
        patientId: patient.id,
        autoSubmit: true,
      }));
    } catch { /* private mode — fall through */ }
    router.push("/");
  };

  const handleSubmitPA = async (patientId: string, method: string) => {
    setAiLoading(`pa-submit-${patientId}`); await new Promise(r => setTimeout(r, 1500));
    const today = new Date().toISOString().split("T")[0];
    const confNum = `CNF-${Date.now().toString(36).toUpperCase()}`;
    setPaSubmissions(p => ({ ...p, [patientId]: { ...p[patientId], status: "submitted", submittedDate: today, method, confirmationNumber: confNum } }));
    const pt = patients.find(p => p.id === patientId);
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, labNotes: [...p.labNotes, { date: today, by: "L. Martinez", note: `PA submitted to ${pt.insurance} via ${method}. Confirmation: ${confNum}. Awaiting payor determination.` }] } : p));
    setAiLoading(null);
    showToast(`PA submitted to ${pt.insurance} — Confirmation: ${confNum}`);
  };

  const handleSimulatePayorResponse = (patientId: string, approved: boolean) => {
    const today = new Date().toISOString().split("T")[0];
    const pt = patients.find(p => p.id === patientId);
    const sub = paSubmissions[patientId];
    if (approved) {
      setPaSubmissions(p => ({ ...p, [patientId]: { ...p[patientId], status: "approved", payorResponse: `Approved — meets ${pt.insurance} medical policy criteria for genetic testing`, responseDate: today } }));
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, stages: { ...p.stages, priorAuthorization: { status: "complete", date: today, by: `${pt.insurance}` } }, billingStatus: "pa_approved", billingNotes: `PA approved — Auth #${sub.authNumber}`, labNotes: [...p.labNotes, { date: today, by: pt.insurance, note: `PA approved. Auth# ${sub.authNumber}, valid through ${sub.validThrough}.` }] } : p));
      showToast(`PA approved by ${pt.insurance} — Auth #${sub.authNumber}`);
    } else {
      setPaSubmissions(p => ({ ...p, [patientId]: { ...p[patientId], status: "denied", payorResponse: "Denied — additional clinical documentation required. Peer-to-peer review available.", responseDate: today } }));
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, labNotes: [...p.labNotes, { date: today, by: pt.insurance, note: `PA denied. Reason: Additional clinical documentation required. Peer-to-peer review available.` }] } : p));
      showToast(`PA denied by ${pt.insurance} — see details`);
    }
  };

  const handleMedNecessity = async (patient: any) => {
    setAiLoading(`mn-${patient.id}`); await new Promise(r => setTimeout(r, 2200));
    setMedNecessityDrafts(p => ({ ...p, [patient.id]: true }));
    setActivePanel({ pid: patient.id, type: "medNecessity" }); setAiLoading(null);
  };

  const handleSendForSignature = (patient: any) => {
    setSignatureStatus(p => ({ ...p, [patient.id]: { orderingPhysician: { name: patient.orderingPhysician, status: "pending", email: patient.physicianEmail, role: "Ordering Physician" }, referringPhysician: { name: patient.referringPhysician, status: "pending", email: "referring@clinic.example.com", role: "Referring Physician" } } }));
    setPatients(prev => prev.map(pt => pt.id === patient.id ? { ...pt, stages: { ...pt.stages, medicalNecessity: { status: "in_progress", date: new Date().toISOString().split("T")[0], by: "Pending Signatures" } } } : pt));
    showToast("Digital signature requests sent to physicians");
  };

  const handleEmailDraft = (patient: any, docKey: string) => {
    setActivePanel({ pid: patient.id, type: "email", data: { docKey, email: generateMissingDocEmail(patient, docKey) } });
  };

  const handleDownload = (content: string, filename: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = filename; a.click();
    showToast(`Downloaded ${filename}`);
  };

  const totalMissing = patients.reduce((a, p) => a + missingDocs(p).length, 0);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-[1520px] mx-auto flex items-center justify-between px-7 h-14">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <h1 className="text-xs font-medium tracking-widest uppercase text-[var(--muted)]">Lab Dashboard</h1>
            <span className="text-[var(--muted-soft)]">·</span>
            <span className="text-[10px] text-[var(--muted)]">Test orders · Prior auth · Medical necessity</span>
          </div>
          <div className="flex items-center gap-3">
            <Tip text="Search by name, TRQ, accession, or test">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search orders…"
                className="w-52 px-3 py-1.5 rounded border border-[var(--border)] text-xs bg-[var(--surface)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:border-[var(--muted)]"
              />
            </Tip>
            <Link href="/" className="text-[10px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors px-3 py-1.5 rounded border border-[var(--border)] hover:border-[var(--accent)]/30">Agent</Link>
            <Tip text="Logged in as L. Martinez">
              <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">LM</div>
            </Tip>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-[1520px] mx-auto px-7 py-2 flex gap-2">
          {[
            { l: "Active",        v: patients.length,                                                                                                        tone: "var(--accent)" },
            { l: "Pending PA",    v: patients.filter(p => p.stages.priorAuthorization.status === "not_started" || paSubmissions[p.id]?.status === "draft").length, tone: "var(--warning)" },
            { l: "PA Awaiting",   v: Object.values(paSubmissions).filter((s: any) => s.status === "submitted").length,                                       tone: "var(--warning)" },
            { l: "Pending MN",    v: patients.filter(p => paSubmissions[p.id]?.status === "approved" && p.stages.medicalNecessity.status !== "complete").length, tone: "var(--accent)" },
            { l: "In Lab",        v: patients.filter(p => p.stages.labProcessing.status === "in_progress").length,                                           tone: "var(--success)" },
            { l: "Missing Docs",  v: totalMissing,                                                                                                            tone: totalMissing > 0 ? "var(--error)" : "var(--muted-soft)" },
          ].map(s => (
            <div key={s.l} className="flex-1 px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] flex items-center gap-2">
              <div className="text-lg font-bold font-mono tabular-nums" style={{ color: s.tone }}>{s.v}</div>
              <div className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-widest">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className="fixed top-3 right-3 z-50 bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30 px-4 py-2 rounded font-semibold text-xs shadow-lg">
          ✓ {toast}
        </div>
      )}

      <div className="max-w-[1520px] mx-auto px-7 py-3.5 flex gap-4">
        {/* Order list */}
        <div className="flex-1 min-w-0">
          {filtered.map(patient => {
            const view = getView(patient.id);
            const missing = missingDocs(patient);
            const docsOk = receivedDocs(patient);
            const docsTotal = totalReqDocs(patient);
            const stagesOk = completedStages(patient);
            const totalStages = Object.keys(patient.stages).length;

            return (
              <div key={patient.id} className="bg-[var(--background)] border border-[var(--border)] rounded-lg mb-2 overflow-hidden">
                {/* Compact row */}
                <div onClick={() => cycleView(patient.id)} className="flex items-center gap-3.5 px-4 py-2.5 cursor-pointer">
                  <Tip text={`${patient.gender === "F" ? "Female" : "Male"}, Age ${patient.age}`}>
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${patient.gender === "F" ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-[var(--accent)]/10 text-[var(--accent)]"}`}>
                      {patient.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                  </Tip>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-[13px] text-[var(--foreground)]">{patient.name}</span>
                      <Tip text={`TRQ: ${patient.id}\nAccession: ${patient.accession}`}>
                        <span className="font-mono text-[10px] text-[var(--muted)] bg-[var(--surface)] px-1.5 py-px rounded">{patient.id}</span>
                      </Tip>
                      <Tip text={patient.priority === "STAT" ? "Expedited processing" : "Standard TAT"}>
                        <span className={`px-1.5 py-px rounded text-[9px] font-bold border ${patient.priority === "STAT" ? "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/30" : "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30"}`}>
                          {patient.priority}
                        </span>
                      </Tip>
                      {missing.length > 0 && (
                        <Tip text={`Missing: ${missing.map(k => DOC_LABELS[k]).join(", ")}`}>
                          <span className="bg-[var(--error)]/10 text-[var(--error)] px-1.5 py-px rounded-full text-[9px] font-bold">⚠ {missing.length}</span>
                        </Tip>
                      )}
                    </div>
                    <div className="text-[var(--muted)] text-[11px] mt-0.5 flex gap-2 flex-wrap">
                      <Tip text={`${patient.testCode} | ${patient.methodology}`}>
                        <span className="text-[var(--foreground)] font-medium">{patient.testPanel}</span>
                      </Tip>
                      <span className="text-[var(--muted-soft)]">·</span>
                      <span>{patient.insurance}</span>
                      <span className="text-[var(--muted-soft)]">·</span>
                      <span>{patient.orderingPhysician}</span>
                    </div>
                  </div>
                  <Tip text={`${patient.specimenType}\n${patient.specimenId}\nCollected: ${patient.collectionDate}`}>
                    <div className="w-[70px] text-center"><StatusBadge status="received" size="xs" /></div>
                  </Tip>
                  <ProgressRing completed={docsOk} total={docsTotal} label="docs" />
                  <ProgressRing completed={stagesOk} total={totalStages} label="stages" />
                  <Tip text={patient.billingNotes}>
                    <div className="w-[95px] text-center"><StatusBadge status={patient.billingStatus} size="xs" /></div>
                  </Tip>
                  <div className="flex gap-0.5">
                    {[{ v: "compact", i: "━", t: "Compact" }, { v: "expanded", i: "☰", t: "Expanded" }, { v: "detailed", i: "▣", t: "Detailed" }].map(({ v, i, t }) => (
                      <Tip key={v} text={t}>
                        <button
                          onClick={e => { e.stopPropagation(); setView(patient.id, v); }}
                          className={`px-1.5 py-0.5 rounded border text-[11px] font-semibold transition-colors ${view === v ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] bg-[var(--background)] text-[var(--muted-soft)] hover:text-[var(--foreground)]"}`}
                        >
                          {i}
                        </button>
                      </Tip>
                    ))}
                  </div>
                </div>

                {/* Expanded */}
                {(view === "expanded" || view === "detailed") && (
                  <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--surface)]">
                    <div className="flex gap-4 mb-3 text-[11px] text-[var(--muted)] flex-wrap">
                      {[["Order", patient.orderDate], ["Accession", patient.accession], ["Specimen", patient.specimenId], ["TAT", `${patient.turnaroundDays}d`], ["Est. Report", patient.estimatedReport], ["Facility", patient.facilityName]].map(([l, v]) => (
                        <span key={l}>
                          <span className="text-[var(--muted-soft)]">{l}:</span>{" "}
                          <strong className="text-[var(--foreground)]">{v}</strong>
                        </span>
                      ))}
                    </div>

                    {/* Documents */}
                    <div className="mb-3">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-soft)] mb-1.5">Documents ({docsOk}/{docsTotal})</div>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-1">
                        {Object.entries(patient.documents).map(([key, doc]: any) => (
                          <Tip key={key} text={DOC_TIPS[key]} pos="bottom">
                            <div className={`flex items-center justify-between px-2 py-1 rounded-md border w-full ${doc.status === "missing" ? "bg-[var(--error)]/8 border-[var(--error)]/30" : doc.status === "not_required" ? "bg-[var(--surface)] border-[var(--border)]" : "bg-[var(--success)]/8 border-[var(--success)]/30"}`}>
                              <div className={`text-[11px] font-medium overflow-hidden text-ellipsis whitespace-nowrap ${doc.status === "not_required" ? "text-[var(--muted-soft)]" : "text-[var(--foreground)]"}`}>{DOC_LABELS[key]}</div>
                              <div className="flex items-center gap-1 shrink-0">
                                <StatusBadge status={doc.status} size="xs" />
                                {doc.status === "missing" && (
                                  <button onClick={e => { e.stopPropagation(); handleEmailDraft(patient, key); }} className="px-1 py-0.5 rounded border border-[var(--error)]/40 bg-[var(--error)]/8 text-[var(--error)] text-[9px] font-bold">✉</button>
                                )}
                              </div>
                            </div>
                          </Tip>
                        ))}
                      </div>
                    </div>

                    {/* Stages */}
                    <div className="mb-3">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-soft)] mb-1.5">Workflow ({stagesOk}/{totalStages})</div>
                      <div className="flex gap-0.5 flex-wrap">
                        {Object.entries(patient.stages).map(([key, stage]: any, i, arr) => (
                          <div key={key} className="flex items-stretch gap-0.5 flex-1 min-w-[95px]">
                            <Tip text={`${STAGE_TIPS[key]}${stage.by ? "\n" + stage.by : ""}`}>
                              <div className={`flex-1 px-1.5 py-1 rounded border ${stage.status === "complete" ? "bg-[var(--success)]/8 border-[var(--success)]/30" : stage.status === "in_progress" ? "bg-[var(--warning)]/8 border-[var(--warning)]/30" : "bg-[var(--background)] border-[var(--border)]"}`}>
                                <div className="text-[9px] font-semibold text-[var(--foreground)] mb-0.5">{STAGE_LABELS[key]}</div>
                                <StatusBadge status={stage.status} size="xs" />
                              </div>
                            </Tip>
                            {i < arr.length - 1 && <span className="text-[var(--muted-soft)] text-[10px] flex items-center">›</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lab notes */}
                    {patient.labNotes.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-soft)] mb-1.5">Activity Log</div>
                        <div className="bg-[var(--background)] border border-[var(--border)] rounded">
                          {patient.labNotes.map((n: any, i: number, arr: any[]) => (
                            <div key={i} className={`flex gap-2 px-2 py-1 text-[11px] ${i < arr.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
                              <span className="font-mono text-[10px] text-[var(--muted-soft)] min-w-[66px]">{n.date}</span>
                              <span className="font-semibold text-[var(--muted)] min-w-[68px]">{n.by}</span>
                              <span className="text-[var(--foreground)]">{n.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1.5 flex-wrap">
                      {/* Primary integration: real agent + MNF pipeline */}
                      <Tip text="Run the real prior-auth pipeline on this order — opens the agent with the order pre-filled and auto-submits">
                        <button
                          onClick={() => handleRunInAgent(patient)}
                          className="px-3.5 py-1.5 rounded-md bg-[var(--foreground)] text-[var(--background)] text-xs font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                        >
                          🧬 Run in Agent
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                      </Tip>

                      {patient.stages.priorAuthorization.status === "not_started" && (
                        <Tip text="Demo: mock PA adjudication in the side panel">
                          <button disabled={!!aiLoading} onClick={() => handlePriorAuth(patient)}
                                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${aiLoading === `pa-${patient.id}` ? "bg-[var(--muted-soft)] text-[var(--background)]" : "bg-[var(--accent)] text-[var(--background)] hover:opacity-90"} ${aiLoading ? "cursor-not-allowed" : "cursor-pointer"}`}>
                            {aiLoading === `pa-${patient.id}` ? <><Spinner /> Generating…</> : <>⚡ Generate Prior Auth (demo)</>}
                          </button>
                        </Tip>
                      )}

                      {priorAuthResults[patient.id] && paSubmissions[patient.id]?.status === "draft" && (
                        <Tip text="Review PA and submit to payor">
                          <button onClick={() => setActivePanel({ pid: patient.id, type: "priorAuth", data: priorAuthResults[patient.id] })}
                                  className="px-3.5 py-1.5 rounded-md bg-[var(--warning)] text-[var(--background)] text-xs font-bold inline-flex items-center gap-1.5">
                            📤 Review & Submit PA to Payor
                          </button>
                        </Tip>
                      )}

                      {paSubmissions[patient.id]?.status === "submitted" && (
                        <Tip text="PA submitted, awaiting payor response">
                          <span className="px-3.5 py-1.5 rounded-md bg-[var(--warning)]/10 border border-[var(--warning)]/30 text-[var(--warning)] text-xs font-semibold inline-flex items-center gap-1.5">⏳ PA Awaiting Payor Response</span>
                        </Tip>
                      )}

                      {paSubmissions[patient.id]?.status === "approved" && patient.stages.medicalNecessity.status === "not_started" && (
                        <Tip text="Demo: draft Letter of Medical Necessity with structured form (the in-dashboard LOMN)">
                          <button disabled={!!aiLoading} onClick={() => handleMedNecessity(patient)}
                                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${aiLoading === `mn-${patient.id}` ? "bg-[var(--muted-soft)] text-[var(--background)]" : "bg-[var(--success)] text-[var(--background)] hover:opacity-90"} ${aiLoading ? "cursor-not-allowed" : "cursor-pointer"}`}>
                            {aiLoading === `mn-${patient.id}` ? <><Spinner /> Drafting LOMN…</> : <>⚡ Generate Medical Necessity (demo)</>}
                          </button>
                        </Tip>
                      )}

                      {paSubmissions[patient.id]?.status === "denied" && (
                        <Tip text="PA was denied — click to view details and appeal options">
                          <button onClick={() => setActivePanel({ pid: patient.id, type: "priorAuth", data: priorAuthResults[patient.id] })}
                                  className="px-3.5 py-1.5 rounded-md border border-[var(--error)]/40 bg-[var(--error)]/8 text-[var(--error)] text-xs font-bold inline-flex items-center gap-1.5">
                            ⚠ PA Denied — View Details
                          </button>
                        </Tip>
                      )}

                      {priorAuthResults[patient.id] && paSubmissions[patient.id]?.status !== "draft" && (
                        <button onClick={() => setActivePanel({ pid: patient.id, type: "priorAuth", data: priorAuthResults[patient.id] })}
                                className="px-3.5 py-1.5 rounded-md border border-[var(--accent)]/40 bg-[var(--accent)]/8 text-[var(--accent)] text-xs font-semibold">View PA</button>
                      )}

                      {medNecessityDrafts[patient.id] && (
                        <button onClick={() => setActivePanel({ pid: patient.id, type: "medNecessity" })}
                                className="px-3.5 py-1.5 rounded-md border border-[var(--success)]/40 bg-[var(--success)]/8 text-[var(--success)] text-xs font-semibold">View LOMN</button>
                      )}
                    </div>
                  </div>
                )}

                {/* Detailed */}
                {view === "detailed" && (
                  <div className="border-t border-[var(--border)] px-4 py-3">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-soft)] mb-2">Full Details</div>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        ["Demographics", [["Name", patient.name], ["DOB", `${patient.dob} (${patient.age}${patient.gender})`], ["MRN", patient.mrn], ["Phone", patient.phone], ["Email", patient.email], ["Address", patient.address]]],
                        ["Insurance", [["Carrier", patient.insurance], ["Member", patient.memberId], ["Group", patient.groupNumber], ["Billing", patient.billingNotes]]],
                        ["Test", [["Panel", patient.testPanel], ["Code", patient.testCode], ["Method", patient.methodology], ["CPT", patient.cptCodes.join(", ")]]],
                        ["Clinical", [["Dx", patient.diagnosis], ["ICD-10", patient.icd10.join(", ")], ["Indication", patient.clinicalIndication]]],
                        ["Providers", [["Ordering", `${patient.orderingPhysician} (${patient.physicianNPI})`], ["Referring", `${patient.referringPhysician} (${patient.referringNPI})`], ["Facility", `${patient.facilityName} (CLIA: ${patient.facilityCLIA})`]]],
                        ["Family Hx", [["", patient.familyHistory]]],
                      ] as any[]).map(([title, rows]: any) => (
                        <div key={title} className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-2">
                          <div className="text-[9px] font-bold text-[var(--accent)] mb-1 uppercase tracking-widest">{title}</div>
                          {rows.map(([l, v]: any, i: number) => (
                            <div key={i} className="text-[11px] leading-snug mb-0.5">
                              {l && <span className="text-[var(--muted-soft)]">{l}: </span>}
                              <span className="text-[var(--foreground)] whitespace-pre-wrap">{v}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Side panel */}
        {activePanel && (
          <div className={`shrink-0 sticky top-3 self-start max-h-[calc(100vh-24px)] overflow-y-auto ${activePanel.type === "medNecessity" || activePanel.type === "priorAuth" ? "w-[560px]" : "w-[440px]"}`}>
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg">
              <div className="sticky top-0 z-10 bg-[var(--background)] rounded-t-lg flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
                <span className="font-bold text-[13px] text-[var(--foreground)]">
                  {activePanel.type === "priorAuth" && "Prior Authorization Result (demo)"}
                  {activePanel.type === "medNecessity" && "Letter of Medical Necessity (demo)"}
                  {activePanel.type === "email" && "Document Request Email"}
                </span>
                <button onClick={() => setActivePanel(null)} className="w-6 h-6 rounded bg-[var(--surface)] text-[var(--muted)] text-[13px] hover:text-[var(--foreground)] transition-colors flex items-center justify-center">✕</button>
              </div>
              <div className="px-4 py-3">
                {activePanel.type === "priorAuth" && (() => {
                  const s = activePanel.data.summary;
                  const sub = paSubmissions[activePanel.pid];
                  const pt = patients.find(p => p.id === activePanel.pid);
                  const tone =
                    sub?.status === "approved" ? "bg-[var(--success)]/10 text-[var(--success)]" :
                    sub?.status === "denied" ? "bg-[var(--error)]/10 text-[var(--error)]" :
                    sub?.status === "submitted" ? "bg-[var(--warning)]/10 text-[var(--warning)]" :
                    "bg-[var(--accent)]/10 text-[var(--accent)]";
                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-base ${tone}`}>
                          {sub?.status === "approved" ? "✓" : sub?.status === "denied" ? "✕" : sub?.status === "submitted" ? "◐" : "✎"}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--foreground)]">
                            {sub?.status === "approved" ? "PA Approved" : sub?.status === "denied" ? "PA Denied" : sub?.status === "submitted" ? "PA Submitted — Awaiting Determination" : "PA Draft — Ready for Review"}
                          </div>
                          <div className="text-[10px] text-[var(--muted)] font-mono">{activePanel.data.authNumber}</div>
                        </div>
                      </div>

                      {[["Patient", s.patientName], ["Member", s.memberId], ["Insurance", s.insurance], ["Provider", `${s.requestingProvider} (${s.npi})`], ["Facility", s.facility], ["Dx", s.diagnosis], ["CPT", s.procedureCodes], ["Service", s.serviceRequested], ["Cost", s.estimatedCost], ["Valid Through", activePanel.data.validThrough]].map(([l, v]) => (
                        <div key={l} className="flex justify-between py-1 border-b border-[var(--border)] text-[11px]">
                          <span className="text-[var(--muted-soft)]">{l}</span>
                          <span className="text-[var(--foreground)] font-medium text-right max-w-[58%]">{v}</span>
                        </div>
                      ))}
                      <div className="mt-2 p-2 rounded border border-[var(--success)]/30 bg-[var(--success)]/8 text-[11px] leading-relaxed text-[var(--foreground)]">
                        <strong>Rationale:</strong> {s.clinicalRationale}
                      </div>

                      {sub && (
                        <div className="mt-3.5">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-soft)] mb-2 pb-1 border-b-2 border-[var(--border)]">Submission Tracking</div>

                          <div className="flex gap-1 mb-3">
                            {[
                              { label: "Draft", done: true },
                              { label: "Submitted", done: sub.status !== "draft" },
                              { label: "Under Review", done: sub.status === "approved" || sub.status === "denied" },
                              { label: sub.status === "denied" ? "Denied" : "Approved", done: sub.status === "approved" || sub.status === "denied" },
                            ].map((step, i) => (
                              <div key={step.label} className="flex-1 text-center">
                                <div className="w-full h-1 rounded mb-1" style={{ background: step.done ? (sub.status === "denied" && i === 3 ? "var(--error)" : "var(--success)") : "var(--border)" }} />
                                <div className={`text-[9px] font-semibold ${step.done ? (sub.status === "denied" && i === 3 ? "text-[var(--error)]" : "text-[var(--success)]") : "text-[var(--muted-soft)]"}`}>{step.label}</div>
                              </div>
                            ))}
                          </div>

                          {sub.status !== "draft" && (
                            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-2.5 mb-2.5">
                              {[
                                ["Submitted", sub.submittedDate],
                                ["Method", sub.method],
                                ["Confirmation #", sub.confirmationNumber],
                                ...(sub.responseDate ? [["Response Date", sub.responseDate]] : []),
                                ...(sub.payorResponse ? [["Payor Response", sub.payorResponse]] : []),
                              ].map(([l, v]) => (
                                <div key={l} className="flex justify-between py-1 text-[11px]">
                                  <span className="text-[var(--muted-soft)]">{l}</span>
                                  <span className={`text-right max-w-[62%] font-medium ${sub.status === "denied" && l === "Payor Response" ? "text-[var(--error)]" : "text-[var(--foreground)]"}`}>{v}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {sub.status === "draft" && (
                            <div>
                              <div className="text-[11px] text-[var(--muted)] mb-2 leading-relaxed">
                                Review the PA details above, then choose a submission method to send to <strong>{pt.insurance}</strong>.
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Tip text={`Submit electronically via ${pt.insurance} payor portal — fastest method, typically 24-72hr response`}>
                                  <button disabled={!!aiLoading} onClick={() => handleSubmitPA(activePanel.pid, "Electronic (Payor Portal)")}
                                          className={`w-full px-3.5 py-2.5 rounded-md text-xs font-bold inline-flex items-center justify-center gap-1.5 ${aiLoading === `pa-submit-${activePanel.pid}` ? "bg-[var(--muted-soft)] text-[var(--background)]" : "bg-[var(--accent)] text-[var(--background)]"}`}>
                                    {aiLoading === `pa-submit-${activePanel.pid}` ? <><Spinner /> Submitting…</> : <>🌐 Submit via Payor Portal</>}
                                  </button>
                                </Tip>
                                <Tip text={`Fax PA request to ${pt.insurance} UR department at ${pt.payorFax}`}>
                                  <button disabled={!!aiLoading} onClick={() => handleSubmitPA(activePanel.pid, `Fax to ${pt.payorFax}`)}
                                          className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                                    📠 Fax to {pt.payorFax}
                                  </button>
                                </Tip>
                                <Tip text="Submit via phone call to payor PA department">
                                  <button disabled={!!aiLoading} onClick={() => handleSubmitPA(activePanel.pid, "Phone Call")}
                                          className="w-full px-3.5 py-2.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                                    📞 Phone Submission
                                  </button>
                                </Tip>
                              </div>
                            </div>
                          )}

                          {sub.status === "submitted" && (
                            <div>
                              <div className="p-2.5 rounded-md bg-[var(--warning)]/8 border border-[var(--warning)]/30 mb-2.5 text-[11px] text-[var(--warning)] leading-relaxed">
                                ⏳ Awaiting payor determination. Electronic submissions typically receive a response within 24–72 hours.
                              </div>
                              <div className="text-[9px] font-semibold text-[var(--muted-soft)] mb-1.5 uppercase tracking-widest">Demo: Simulate Payor Response</div>
                              <div className="flex gap-1.5">
                                <Tip text="Simulate the payor approving this PA request">
                                  <button onClick={() => handleSimulatePayorResponse(activePanel.pid, true)}
                                          className="flex-1 px-2 py-2 rounded-md border border-[var(--success)]/30 bg-[var(--success)]/8 text-[var(--success)] text-xs font-semibold">
                                    ✓ Simulate Approve
                                  </button>
                                </Tip>
                                <Tip text="Simulate the payor denying this PA request">
                                  <button onClick={() => handleSimulatePayorResponse(activePanel.pid, false)}
                                          className="flex-1 px-2 py-2 rounded-md border border-[var(--error)]/30 bg-[var(--error)]/8 text-[var(--error)] text-xs font-semibold">
                                    ✕ Simulate Deny
                                  </button>
                                </Tip>
                              </div>
                            </div>
                          )}

                          {sub.status === "denied" && (
                            <div className="p-2.5 rounded-md bg-[var(--error)]/8 border border-[var(--error)]/30 text-[11px] text-[var(--error)] leading-relaxed">
                              <strong>Denial — Next Steps:</strong>
                              <div className="mt-1 text-[var(--foreground)] whitespace-pre-line">
                                {"• Request peer-to-peer review with payor medical director\n• Submit additional clinical documentation\n• File formal appeal with updated Letter of Medical Necessity\n• Contact patient about alternative coverage options"}
                              </div>
                            </div>
                          )}

                          {sub.status === "approved" && (
                            <div className="p-2.5 rounded-md bg-[var(--success)]/8 border border-[var(--success)]/30 text-[11px] text-[var(--success)] leading-relaxed">
                              <strong>✓ Authorization Active</strong>
                              <div className="mt-1 text-[var(--foreground)]">Auth #{sub.authNumber} valid through {sub.validThrough}. Medical necessity form can now be generated.</div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-1.5 mt-2.5">
                        <button onClick={() => handleDownload(JSON.stringify(activePanel.data, null, 2), `PA-${activePanel.pid}.json`)}
                                className="flex-1 px-2 py-2 rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/8 text-[var(--accent)] text-xs font-semibold">↓ Download PA</button>
                      </div>
                    </div>
                  );
                })()}

                {activePanel.type === "medNecessity" && (() => {
                  const pt = patients.find(p => p.id === activePanel.pid);
                  return <LOMNForm patient={pt} onSendSignature={() => handleSendForSignature(pt)} onDownload={handleDownload} signatureStatus={signatureStatus[activePanel.pid]} />;
                })()}

                {activePanel.type === "email" && (() => {
                  const em = activePanel.data.email;
                  return (
                    <div>
                      <div className="mb-2">
                        <label className="text-[9px] text-[var(--muted-soft)] font-semibold uppercase tracking-widest">To</label>
                        <input value={`${em.toName} <${em.to}>`} readOnly className="w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[11px] mt-0.5" />
                      </div>
                      <div className="mb-2">
                        <label className="text-[9px] text-[var(--muted-soft)] font-semibold uppercase tracking-widest">Subject</label>
                        <input value={em.subject} onChange={e => setActivePanel((p: any) => ({ ...p, data: { ...p.data, email: { ...p.data.email, subject: e.target.value } } }))}
                               className="w-full px-2 py-1.5 rounded border border-[var(--border)] text-[11px] mt-0.5 focus:outline-none focus:border-[var(--muted)]" />
                      </div>
                      <div className="mb-2">
                        <label className="text-[9px] text-[var(--muted-soft)] font-semibold uppercase tracking-widest">Body</label>
                        <textarea value={em.body} onChange={e => setActivePanel((p: any) => ({ ...p, data: { ...p.data, email: { ...p.data.email, body: e.target.value } } }))}
                                  className="w-full min-h-[200px] p-2 rounded border border-[var(--border)] text-[11px] leading-relaxed resize-y mt-0.5 focus:outline-none focus:border-[var(--muted)]" />
                      </div>
                      <button onClick={() => { showToast(`Email sent to ${em.toName}`); setActivePanel(null); }}
                              className="w-full px-2 py-2 rounded-md bg-[var(--error)] text-[var(--background)] text-xs font-bold">
                        ✉ Send Email
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
