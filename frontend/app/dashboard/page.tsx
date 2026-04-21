"use client";

import { useState, useRef } from "react";

/* ══════════════════════════════════════════════
   TOOLTIP
   ══════════════════════════════════════════════ */
function Tip({ text, children, pos = "top" }) {
  const [show, setShow] = useState(false);
  const ps = { top: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" }, bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" }, left: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }, right: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" } };
  return (<span onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} style={{ position: "relative", display: "inline-flex" }}>{children}{show && <span style={{ position: "absolute", ...ps[pos], background: "#1e293b", color: "#f1f5f9", padding: "6px 11px", borderRadius: 7, fontSize: 11, fontWeight: 500, whiteSpace: "pre-line", zIndex: 9999, pointerEvents: "none", boxShadow: "0 4px 20px rgba(0,0,0,.18)", lineHeight: 1.4, maxWidth: 300 }}>{text}</span>}</span>);
}

/* ══════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════ */
const PATIENTS = [
  {
    id: "TRQ-26-04187", accession: "ACC-260410-0187", name: "Margaret Chen", dob: "1958-03-14", age: 68, gender: "F", mrn: "MRN-2024-10481",
    insurance: "Aetna PPO", memberId: "AET-884571209", groupNumber: "GRP-77201", payorAddress: "Aetna Utilization Review, PO Box 14079, Lexington, KY 40512", payorFax: "(800) 367-6762", phone: "(415) 555-0142", email: "m.chen@email.com", address: "1247 Oak Valley Dr, San Francisco, CA 94110",
    orderingPhysician: "Dr. Sarah Patel", physicianNPI: "1234567890", physicianLicense: "CA-MD-A84721", physicianSpecialty: "Medical Genetics", physicianPhone: "(415) 555-8800", physicianFax: "(415) 555-8801", physicianEmail: "s.patel@ucsf.edu",
    referringPhysician: "Dr. James Liu", referringNPI: "2233445566", referringSpecialty: "Surgical Oncology",
    facilityName: "UCSF Medical Center", facilityNPI: "9876543210", facilityAddress: "505 Parnassus Ave, San Francisco, CA 94143", facilityCLIA: "05D0672675",
    testPanel: "BRCA1/BRCA2 Full Sequencing + Del/Dup", testCode: "GEN-BRCA-FS", methodology: "NGS — Illumina NovaSeq 6000", turnaroundDays: 14, specimenType: "Peripheral Blood (EDTA)", specimenId: "SPM-260410-A1",
    collectionDate: "2026-04-10", receivedDate: "2026-04-11", specimenStatus: "Adequate",
    diagnosis: "Hereditary Breast & Ovarian Cancer Syndrome", icd10: ["Z15.01", "Z80.3"], cptCodes: ["81162", "81163"],
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
    testPanel: "Comprehensive Cardiomyopathy Panel (54 genes)", testCode: "GEN-CARDIO-54", methodology: "NGS — Illumina NovaSeq 6000 + MLPA", turnaroundDays: 21, specimenType: "Peripheral Blood (EDTA)", specimenId: "SPM-260408-B3",
    collectionDate: "2026-04-07", receivedDate: "2026-04-08", specimenStatus: "Adequate",
    diagnosis: "Hypertrophic Cardiomyopathy", icd10: ["I42.1", "Z82.41"], cptCodes: ["81479", "81405"],
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
    testPanel: "PGx Comprehensive Panel (CYP2D6/2C19/3A4)", testCode: "GEN-PGX-COMP", methodology: "TaqMan Genotyping + NGS confirmation", turnaroundDays: 10, specimenType: "Buccal Swab", specimenId: "SPM-260405-C7",
    collectionDate: "2026-04-04", receivedDate: "2026-04-05", specimenStatus: "Adequate",
    diagnosis: "Pharmacogenomic Testing — Treatment-Resistant Depression", icd10: ["Z91.19", "F33.2"], cptCodes: ["81225", "81226", "81231"],
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

const DOC_LABELS = { requisitionForm: "Test Requisition", patientDemographics: "Patient Demographics", insuranceCardFrontBack: "Insurance Card (F/B)", physicianOrderForm: "Physician Order", clinicalNotes: "Clinical Notes", familyHistoryPedigree: "Family History / Pedigree", informedConsent: "Informed Consent", priorLabResults: "Prior Lab Results", referralLetter: "Referral Letter", abn: "ABN" };
const DOC_TIPS = { requisitionForm: "Lab test requisition with test selection and physician signature", patientDemographics: "Full name, DOB, address, contact info", insuranceCardFrontBack: "Scanned front and back of active insurance card", physicianOrderForm: "Signed physician order for genetic test", clinicalNotes: "Clinical notes supporting medical necessity", familyHistoryPedigree: "Three-generation family history or pedigree", informedConsent: "Patient consent for testing and results disclosure", priorLabResults: "Previous relevant lab or pathology results", referralLetter: "Specialist referral letter if applicable", abn: "Medicare ABN when coverage is uncertain" };
const STAGE_LABELS = { orderReceived: "Order Received", specimenAccessioned: "Specimen Accessioned", insuranceVerification: "Insurance Verification", priorAuthorization: "Prior Authorization", medicalNecessity: "Medical Necessity", labProcessing: "Lab Processing", reportGeneration: "Report Generation", reportDelivery: "Report Delivery" };
const STAGE_TIPS = { orderReceived: "Test order registered", specimenAccessioned: "Specimen logged, labeled, QC checked", insuranceVerification: "Eligibility and benefits check with payor", priorAuthorization: "PA submitted and determination received", medicalNecessity: "LOMN drafted, signed, and submitted", labProcessing: "DNA extraction, sequencing, bioinformatics", reportGeneration: "Variant interpretation and clinical report", reportDelivery: "Report delivered to ordering physician" };

/* ══════════════════════════════════════════════
   BADGES & COMPONENTS
   ══════════════════════════════════════════════ */
const StatusBadge = ({ status, size = "sm" }) => {
  const c = { complete: { bg: "#dcfce7", text: "#166534", label: "Complete", icon: "✓" }, received: { bg: "#dcfce7", text: "#166534", label: "Received", icon: "✓" }, in_progress: { bg: "#fef9c3", text: "#854d0e", label: "In Progress", icon: "◐" }, not_started: { bg: "#f1f5f9", text: "#64748b", label: "Not Started", icon: "○" }, missing: { bg: "#fee2e2", text: "#991b1b", label: "Missing", icon: "✕" }, not_required: { bg: "#f1f5f9", text: "#94a3b8", label: "N/A", icon: "—" }, draft: { bg: "#dbeafe", text: "#1e40af", label: "Draft", icon: "✎" }, pending_signature: { bg: "#fef9c3", text: "#854d0e", label: "Awaiting Signature", icon: "✍" }, pending_verification: { bg: "#fef9c3", text: "#854d0e", label: "Verifying", icon: "◐" }, pending_auth: { bg: "#fef3c7", text: "#92400e", label: "Pending PA", icon: "⏳" }, pa_submitted: { bg: "#fef9c3", text: "#854d0e", label: "PA Submitted", icon: "◐" }, pa_approved: { bg: "#dcfce7", text: "#166534", label: "PA Approved", icon: "✓" }, pa_denied: { bg: "#fee2e2", text: "#991b1b", label: "PA Denied", icon: "✕" }, claim_submitted: { bg: "#dbeafe", text: "#1e40af", label: "Claim Submitted", icon: "↗" } }[status] || { bg: "#f1f5f9", text: "#64748b", label: status, icon: "○" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: size === "xs" ? "1px 7px" : "2px 10px", borderRadius: 99, fontSize: size === "xs" ? 10 : 11, fontWeight: 600, background: c.bg, color: c.text, lineHeight: 1.5 }}><span style={{ fontSize: (size === "xs" ? 9 : 10) }}>{c.icon}</span> {c.label}</span>;
};

const ProgressRing = ({ completed, total, label }) => {
  const pct = total > 0 ? (completed / total) * 100 : 0; const r = 16, circ = 2 * Math.PI * r; const color = pct === 100 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";
  return <Tip text={`${completed}/${total} ${label}`}><div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}><svg width={40} height={40} viewBox="0 0 40 40"><circle cx={20} cy={20} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3.5} /><circle cx={20} cy={20} r={r} fill="none" stroke={color} strokeWidth={3.5} strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ} strokeLinecap="round" transform="rotate(-90 20 20)" style={{ transition: "stroke-dashoffset .5s ease" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color }}>{completed}/{total}</div></div></Tip>;
};

const Spinner = () => <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #fff5", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite" }} />;

/* ══════════════════════════════════════════════
   LOMN FORM — STRUCTURED TEMPLATE
   ══════════════════════════════════════════════ */
function LOMNForm({ patient, draft, onChange, onSendSignature, onDownload, signatureStatus }) {
  // Editable fields stored as object
  const [fields, setFields] = useState(() => ({
    clinicalIndication: patient.clinicalIndication,
    familyHistory: patient.familyHistory,
    priorTreatments: patient.priorTreatments || "",
    clinicalJustification: `1. ${patient.name}'s clinical presentation and family history meet established criteria per NCCN, ACMG, and AMP guidelines for ${patient.testPanel}.\n\n2. Test results will directly impact clinical management including treatment selection, risk stratification, and identification of at-risk family members for cascade genetic testing.\n\n3. Without this testing, the clinical team cannot make fully informed decisions regarding the patient's care plan, potentially leading to suboptimal outcomes, unnecessary invasive procedures, or missed opportunities for targeted therapy.\n\n4. This testing is supported by current peer-reviewed literature and professional society guidelines for patients meeting these clinical criteria.`,
    expectedImpact: `A positive (pathogenic/likely pathogenic) finding would:\n• Guide targeted treatment selection and therapy planning\n• Inform cascade genetic testing for at-risk first-degree relatives\n• Enable evidence-based surveillance and risk-reduction protocols\n• Potentially qualify the patient for targeted therapies or clinical trials\n\nA negative result would:\n• Appropriately de-escalate risk assessment\n• Avoid unnecessary invasive procedures or prophylactic interventions\n• Inform the need for alternative diagnostic workup if clinically indicated`,
    guidelineRefs: "• NCCN Clinical Practice Guidelines in Oncology — Genetic/Familial High-Risk Assessment (current version)\n• ACMG/AMP Standards and Guidelines for the Interpretation of Sequence Variants (Richards et al., 2015)\n• AMP Clinical Practice Guidelines for Next-Generation Sequencing-Based Multi-Gene Panel Testing",
    additionalNotes: "",
  }));
  const [supportingDocs, setSupportingDocs] = useState(() => {
    const docs = {};
    Object.entries(patient.documents).forEach(([k, v]) => { docs[k] = v.status === "received"; });
    return docs;
  });

  const updateField = (key, val) => setFields(p => ({ ...p, [key]: val }));
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const ReadOnlyField = ({ label, value, mono, half }) => (
    <div style={{ flex: half ? "1 1 48%" : "1 1 100%", minWidth: half ? 180 : undefined, marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>{label}</div>
      <div style={{ padding: "7px 10px", borderRadius: 6, background: "#f8fafc", border: "1px solid #e9ecf1", fontSize: 12, color: "#334155", fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit", lineHeight: 1.5, whiteSpace: "pre-wrap", minHeight: 32 }}>{value || "—"}</div>
    </div>
  );

  const EditableField = ({ label, fieldKey, rows = 3, tip }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "#0369a1", textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</div>
        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, background: "#e0f2fe", color: "#0369a1", fontWeight: 600 }}>EDITABLE</span>
        {tip && <Tip text={tip}><span style={{ fontSize: 11, color: "#94a3b8", cursor: "help" }}>ⓘ</span></Tip>}
      </div>
      <textarea value={fields[fieldKey]} onChange={e => updateField(fieldKey, e.target.value)} rows={rows} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #bae6fd", background: "#f0f9ff", fontSize: 12, color: "#1e293b", lineHeight: 1.6, resize: "vertical", fontFamily: "'Source Sans 3', system-ui, sans-serif" }} />
    </div>
  );

  const SectionHeader = ({ title, number }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid #e2e8f0" }}>
      <span style={{ width: 22, height: 22, borderRadius: 99, background: "#0ea5e9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{number}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", letterSpacing: ".04em" }}>{title}</span>
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
    <div style={{ maxHeight: "calc(100vh - 80px)", overflowY: "auto", padding: "0 2px" }}>
      {/* FORM HEADER */}
      <div style={{ background: "linear-gradient(135deg, #f0f9ff, #eff6ff)", border: "1px solid #bae6fd", borderRadius: 10, padding: "16px 18px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0c4a6e", letterSpacing: ".02em" }}>LETTER OF MEDICAL NECESSITY</div>
        <div style={{ fontSize: 11, color: "#0369a1", marginTop: 2 }}>For Genetic Testing — Prior Authorization Support</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8, fontSize: 11, color: "#64748b" }}>
          <span>Date: <strong style={{ color: "#0f172a" }}>{today}</strong></span>
          <span>TRQ: <strong style={{ color: "#0f172a" }}>{patient.id}</strong></span>
          <span>Accession: <strong style={{ color: "#0f172a" }}>{patient.accession}</strong></span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
        <StatusBadge status={signatureStatus ? "pending_signature" : "draft"} />
        <span style={{ fontSize: 10, color: "#94a3b8" }}>
          {signatureStatus ? "Sent for physician signatures" : "AI-generated draft — review fields marked EDITABLE, then send for signature"}
        </span>
      </div>

      {/* SECTION 1: PAYOR */}
      <SectionHeader title="Payor Information" number="1" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        <ReadOnlyField label="Insurance Carrier" value={patient.insurance} half />
        <ReadOnlyField label="Member ID" value={patient.memberId} mono half />
        <ReadOnlyField label="Group Number" value={patient.groupNumber} mono half />
        <ReadOnlyField label="Payor Fax" value={patient.payorFax} half />
        <ReadOnlyField label="Utilization Review Address" value={patient.payorAddress} />
      </div>

      {/* SECTION 2: PATIENT */}
      <SectionHeader title="Patient Information" number="2" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        <ReadOnlyField label="Patient Name" value={patient.name} half />
        <ReadOnlyField label="Date of Birth / Age / Sex" value={`${patient.dob}  (${patient.age}, ${patient.gender === "F" ? "Female" : "Male"})`} half />
        <ReadOnlyField label="MRN" value={patient.mrn} mono half />
        <ReadOnlyField label="Phone" value={patient.phone} half />
        <ReadOnlyField label="Address" value={patient.address} />
      </div>

      {/* SECTION 3: PROVIDERS */}
      <SectionHeader title="Provider Information" number="3" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 6 }}>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", marginBottom: 6, textTransform: "uppercase" }}>Ordering Physician</div>
          {[[patient.orderingPhysician], [`NPI: ${patient.physicianNPI}`], [`License: ${patient.physicianLicense}`], [patient.physicianSpecialty], [`Ph: ${patient.physicianPhone}`], [`Fax: ${patient.physicianFax}`]].map(([v], i) => <div key={i} style={{ fontSize: 11, color: "#334155", lineHeight: 1.6 }}>{v}</div>)}
        </div>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", marginBottom: 6, textTransform: "uppercase" }}>Referring Physician</div>
          {[[patient.referringPhysician], [`NPI: ${patient.referringNPI}`], [patient.referringSpecialty]].map(([v], i) => <div key={i} style={{ fontSize: 11, color: "#334155", lineHeight: 1.6 }}>{v}</div>)}
        </div>
      </div>
      <ReadOnlyField label="Testing Facility" value={`${patient.facilityName} | NPI: ${patient.facilityNPI} | CLIA: ${patient.facilityCLIA}\n${patient.facilityAddress}`} />

      {/* SECTION 4: DIAGNOSIS & TEST */}
      <SectionHeader title="Diagnosis & Requested Test" number="4" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        <ReadOnlyField label="Primary Diagnosis" value={patient.diagnosis} />
        <ReadOnlyField label="ICD-10 Code(s)" value={patient.icd10.join(", ")} mono half />
        <ReadOnlyField label="CPT Code(s)" value={patient.cptCodes.join(", ")} mono half />
        <ReadOnlyField label="Test Ordered" value={`${patient.testPanel} (${patient.testCode})`} />
        <ReadOnlyField label="Methodology" value={patient.methodology} half />
        <ReadOnlyField label="Specimen" value={`${patient.specimenType} | ${patient.specimenId} | Collected: ${patient.collectionDate}`} half />
      </div>

      {/* SECTION 5: CLINICAL (EDITABLE) */}
      <SectionHeader title="Clinical Information" number="5" />
      <EditableField label="Clinical Indication & History of Present Illness" fieldKey="clinicalIndication" rows={4} tip="Describe the clinical presentation, symptoms, and reason testing is being ordered. Be specific — payors look for concrete clinical findings." />
      <EditableField label="Relevant Family History" fieldKey="familyHistory" rows={4} tip="Include 3-generation pedigree summary. Specify cancer types, ages at dx, genetic test results for relatives." />
      <EditableField label="Prior Treatments & Diagnostic Workup" fieldKey="priorTreatments" rows={5} tip="List prior labs, imaging, biopsies, medications tried and outcomes. This demonstrates that testing is the appropriate next step." />
      <ReadOnlyField label="Current Medications" value={patient.medications.join("; ")} />
      <ReadOnlyField label="Allergies" value={patient.allergies.join(", ")} />

      {/* SECTION 6: JUSTIFICATION (EDITABLE) */}
      <SectionHeader title="Clinical Justification" number="6" />
      <EditableField label="Medical Necessity Justification" fieldKey="clinicalJustification" rows={8} tip="This is the core argument. Explain why testing is necessary, how results will change management, and why it cannot be deferred." />
      <EditableField label="Expected Clinical Impact of Results" fieldKey="expectedImpact" rows={6} tip="Describe how positive and negative results will each affect the patient's care plan." />

      {/* SECTION 7: GUIDELINES */}
      <SectionHeader title="Guideline & Literature References" number="7" />
      <EditableField label="Supporting Guidelines & References" fieldKey="guidelineRefs" rows={3} tip="Cite NCCN, ACMG, AMP, or other society guidelines supporting testing for this indication." />
      <EditableField label="Additional Notes (Optional)" fieldKey="additionalNotes" rows={2} tip="Any additional context for the medical director reviewer." />

      {/* SECTION 8: SUPPORTING DOCS */}
      <SectionHeader title="Enclosed Supporting Documentation" number="8" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 16 }}>
        {Object.entries(patient.documents).filter(([, v]) => v.status !== "not_required").map(([key, doc]) => (
          <Tip key={key} text={DOC_TIPS[key]}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6, background: supportingDocs[key] ? "#f0fdf4" : "#f8fafc", border: `1px solid ${supportingDocs[key] ? "#bbf7d0" : "#e2e8f0"}`, cursor: "pointer", fontSize: 11, color: "#334155" }}>
              <input type="checkbox" checked={supportingDocs[key] || false} onChange={e => setSupportingDocs(p => ({ ...p, [key]: e.target.checked }))} style={{ accentColor: "#0ea5e9" }} />
              <span>{DOC_LABELS[key]}</span>
              {doc.status === "missing" && <span style={{ fontSize: 9, color: "#dc2626", fontWeight: 700 }}>(MISSING)</span>}
            </label>
          </Tip>
        ))}
      </div>

      {/* SECTION 9: SIGNATURE */}
      <SectionHeader title="Physician Attestation & Signature" number="9" />
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
        <p style={{ marginBottom: 10 }}>I certify that the above genetic testing is medically necessary for the diagnosis and/or treatment of the above-named patient. The information provided is true and accurate to the best of my knowledge. I have provided genetic counseling to the patient and informed consent has been obtained. I am available for peer-to-peer review if required by the payor.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ borderTop: "2px solid #94a3b8", paddingTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{patient.orderingPhysician}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>NPI: {patient.physicianNPI} | {patient.physicianSpecialty}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{patient.facilityName}</div>
            <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 4, background: signatureStatus?.orderingPhysician?.status === "signed" ? "#dcfce7" : "#fef9c3", border: `1px solid ${signatureStatus?.orderingPhysician?.status === "signed" ? "#bbf7d0" : "#fde68a"}`, fontSize: 10, fontWeight: 600, color: signatureStatus?.orderingPhysician?.status === "signed" ? "#166534" : "#854d0e" }}>
              {signatureStatus?.orderingPhysician?.status === "signed" ? "✓ Signed" : "☐ Signature Required"}
            </div>
          </div>
          <div style={{ borderTop: "2px solid #94a3b8", paddingTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{patient.referringPhysician}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>NPI: {patient.referringNPI} | {patient.referringSpecialty}</div>
            <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 4, background: signatureStatus?.referringPhysician?.status === "signed" ? "#dcfce7" : "#fef9c3", border: `1px solid ${signatureStatus?.referringPhysician?.status === "signed" ? "#bbf7d0" : "#fde68a"}`, fontSize: 10, fontWeight: 600, color: signatureStatus?.referringPhysician?.status === "signed" ? "#166534" : "#854d0e" }}>
              {signatureStatus?.referringPhysician?.status === "signed" ? "✓ Signed" : "☐ Signature Required"}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div style={{ display: "flex", gap: 8, position: "sticky", bottom: 0, background: "#fff", padding: "10px 0", borderTop: "1px solid #e2e8f0" }}>
        <Tip text="Send the reviewed LOMN to ordering & referring physicians for digital signature">
          <button onClick={onSendSignature} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✍ Send for Digital Signature</button>
        </Tip>
        <Tip text="Download the complete LOMN as a text file">
          <button onClick={() => onDownload(generatePlainText(), `LOMN-${patient.id}.txt`)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#334155", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>↓ Download</button>
        </Tip>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PRIOR AUTH GENERATOR
   ══════════════════════════════════════════════ */
const generatePriorAuth = (p) => ({
  authNumber: `PA-${Date.now().toString(36).toUpperCase()}`, determination: "Approved",
  submittedDate: new Date().toISOString().split("T")[0], validThrough: "2026-07-15", reviewType: "System Auto-Adjudication",
  summary: { patientName: p.name, memberId: p.memberId, insurance: p.insurance, requestingProvider: p.orderingPhysician, npi: p.physicianNPI, facility: p.facilityName, diagnosis: `${p.diagnosis} (${p.icd10.join(", ")})`, procedureCodes: p.cptCodes.join(", "), serviceRequested: p.testPanel, placeOfService: "Laboratory (POS 81)", clinicalRationale: `Testing meets ${p.insurance} medical policy criteria. ${p.clinicalIndication.substring(0, 120)}...`, estimatedCost: "$" + (2000 + Math.floor(Math.random() * 2000)).toLocaleString() + ".00" },
});

const generateMissingDocEmail = (patient, docKey) => {
  const docName = DOC_LABELS[docKey]; const isPatient = ["informedConsent", "familyHistoryPedigree", "insuranceCardFrontBack"].includes(docKey);
  const rName = isPatient ? patient.name : (patient.referringPhysician || patient.orderingPhysician);
  return { to: isPatient ? patient.email : "orders@clinic.example.com", toName: rName, subject: `ACTION REQUIRED: ${docName} — ${patient.name} (${patient.id})`, body: `Dear ${rName},\n\nWe are processing genetic testing order ${patient.id} (Accession: ${patient.accession}) for ${isPatient ? "you" : patient.name + " (" + patient.mrn + ")"} and need the following document:\n\n  Missing: ${docName}\n\nThis is required before insurance authorization and testing can proceed. The ordered test is ${patient.testPanel}.\n\n${isPatient ? "Submit by replying to this email, patient portal, or bring to your next appointment." : "Submit via fax (800-555-0101), email reply, or provider portal."}\n\nReference order ${patient.id} with questions.\n\nThank you,\nClinical Operations\nLaboratory\n(800) 555-0100 | Fax: (800) 555-0101` };
};

/* ══════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════ */
export default function Dashboard() {
  const [patients, setPatients] = useState(PATIENTS);
  const [viewMode, setViewMode] = useState({});
  const [activePanel, setActivePanel] = useState(null);
  const [priorAuthResults, setPriorAuthResults] = useState({});
  const [medNecessityDrafts, setMedNecessityDrafts] = useState({});
  const [signatureStatus, setSignatureStatus] = useState({});
  const [aiLoading, setAiLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const getView = (id) => viewMode[id] || "compact";
  const cycleView = (id) => { const o = ["compact", "expanded", "detailed"]; setViewMode(p => ({ ...p, [id]: o[(o.indexOf(getView(id)) + 1) % 3] })); };
  const setView = (id, v) => setViewMode(p => ({ ...p, [id]: v }));

  const missingDocs = p => Object.entries(p.documents).filter(([, v]) => v.status === "missing").map(([k]) => k);
  const receivedDocs = p => Object.entries(p.documents).filter(([, v]) => v.status === "received").length;
  const totalReqDocs = p => Object.entries(p.documents).filter(([, v]) => v.status !== "not_required").length;
  const completedStages = p => Object.values(p.stages).filter(v => v.status === "complete").length;

  const filtered = patients.filter(p => { const q = search.toLowerCase(); return !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.accession.toLowerCase().includes(q) || p.testPanel.toLowerCase().includes(q); });

  // PA submission tracking: { [patientId]: { status: 'draft'|'submitted'|'approved'|'denied', submittedDate, method, confirmationNumber, payorResponse, responseDate } }
  const [paSubmissions, setPaSubmissions] = useState({
    // Robert Williams already has PA approved in seed data
    "TRQ-26-04152": { status: "approved", submittedDate: "2026-04-11", method: "Electronic (Payor Portal)", confirmationNumber: "CNF-UHC-260411-8841", payorResponse: "Approved — meets medical policy criteria", responseDate: "2026-04-12", authNumber: "UHC-PA-88412", validThrough: "2026-07-12" },
    "TRQ-26-04098": { status: "approved", submittedDate: "2026-04-07", method: "Electronic (Payor Portal)", confirmationNumber: "CNF-BCBS-260407-5502", payorResponse: "Approved", responseDate: "2026-04-08", authNumber: "BCBS-PA-55021", validThrough: "2026-07-08" },
  });

  const handlePriorAuth = async (patient) => {
    setAiLoading(`pa-${patient.id}`); await new Promise(r => setTimeout(r, 1800));
    const result = generatePriorAuth(patient);
    setPriorAuthResults(p => ({ ...p, [patient.id]: result }));
    // Stage goes to in_progress (draft generated, not submitted yet)
    setPatients(prev => prev.map(pt => pt.id === patient.id ? { ...pt, stages: { ...pt.stages, priorAuthorization: { status: "in_progress", date: new Date().toISOString().split("T")[0], by: "AI Agent (Draft)" } } } : pt));
    setPaSubmissions(p => ({ ...p, [patient.id]: { status: "draft", submittedDate: null, method: null, confirmationNumber: null, payorResponse: null, responseDate: null, authNumber: result.authNumber, validThrough: result.validThrough } }));
    setActivePanel({ pid: patient.id, type: "priorAuth", data: result }); setAiLoading(null);
  };

  const handleSubmitPA = async (patientId, method) => {
    setAiLoading(`pa-submit-${patientId}`); await new Promise(r => setTimeout(r, 1500));
    const today = new Date().toISOString().split("T")[0];
    const confNum = `CNF-${Date.now().toString(36).toUpperCase()}`;
    setPaSubmissions(p => ({ ...p, [patientId]: { ...p[patientId], status: "submitted", submittedDate: today, method, confirmationNumber: confNum } }));
    // Add to lab notes
    const pt = patients.find(p => p.id === patientId);
    setPatients(prev => prev.map(p => p.id === patientId ? { ...p, labNotes: [...p.labNotes, { date: today, by: "L. Martinez", note: `PA submitted to ${pt.insurance} via ${method}. Confirmation: ${confNum}. Awaiting payor determination.` }] } : p));
    setAiLoading(null);
    showToast(`PA submitted to ${pt.insurance} — Confirmation: ${confNum}`);
  };

  const handleSimulatePayorResponse = (patientId, approved) => {
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
  const handleMedNecessity = async (patient) => {
    setAiLoading(`mn-${patient.id}`); await new Promise(r => setTimeout(r, 2200));
    setMedNecessityDrafts(p => ({ ...p, [patient.id]: true }));
    setActivePanel({ pid: patient.id, type: "medNecessity" }); setAiLoading(null);
  };
  const handleSendForSignature = (patient) => {
    setSignatureStatus(p => ({ ...p, [patient.id]: { orderingPhysician: { name: patient.orderingPhysician, status: "pending", email: patient.physicianEmail, role: "Ordering Physician" }, referringPhysician: { name: patient.referringPhysician, status: "pending", email: "referring@clinic.example.com", role: "Referring Physician" } } }));
    setPatients(prev => prev.map(pt => pt.id === patient.id ? { ...pt, stages: { ...pt.stages, medicalNecessity: { status: "in_progress", date: new Date().toISOString().split("T")[0], by: "Pending Signatures" } } } : pt));
    showToast("Digital signature requests sent to physicians");
  };
  const handleEmailDraft = (patient, docKey) => { setActivePanel({ pid: patient.id, type: "email", data: { docKey, email: generateMissingDocEmail(patient, docKey) } }); };
  const handleDownload = (content, filename) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" })); a.download = filename; a.click(); showToast(`Downloaded ${filename}`); };

  const totalMissing = patients.reduce((a, p) => a + missingDocs(p).length, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Source Sans 3', system-ui, sans-serif", fontSize: 13, color: "#1e293b" }}>
      <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 28px" }}>
        <div style={{ maxWidth: 1520, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg, #0ea5e9, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>G</div>
            <div><div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.03em" }}>Dashboard</div><div style={{ fontSize: 9, color: "#94a3b8", marginTop: -1 }}>Test Order Management · Prior Auth · Medical Necessity</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Tip text="Search by name, TRQ, accession, or test"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." style={{ width: 200, padding: "6px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12, background: "#f8fafc" }} /></Tip>
            <Tip text="Logged in as L. Martinez"><div style={{ width: 28, height: 28, borderRadius: 99, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0369a1" }}>LM</div></Tip>
          </div>
        </div>
      </header>

      {/* STATS */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1520, margin: "0 auto", padding: "8px 28px", display: "flex", gap: 8 }}>
          {[{ l: "Active", v: patients.length, c: "#0ea5e9" }, { l: "Pending PA", v: patients.filter(p => p.stages.priorAuthorization.status === "not_started" || paSubmissions[p.id]?.status === "draft").length, c: "#f59e0b" }, { l: "PA Awaiting", v: Object.values(paSubmissions).filter(s => s.status === "submitted").length, c: "#d97706" }, { l: "Pending MN", v: patients.filter(p => paSubmissions[p.id]?.status === "approved" && p.stages.medicalNecessity.status !== "complete").length, c: "#8b5cf6" }, { l: "In Lab", v: patients.filter(p => p.stages.labProcessing.status === "in_progress").length, c: "#10b981" }, { l: "Missing Docs", v: totalMissing, c: totalMissing > 0 ? "#ef4444" : "#94a3b8" }].map(s => (
            <div key={s.l} style={{ flex: 1, padding: "7px 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {toast && <div style={{ position: "fixed", top: 12, right: 12, background: "#166534", color: "#dcfce7", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,.15)" }}>✓ {toast}</div>}

      <div style={{ maxWidth: 1520, margin: "0 auto", padding: "14px 28px", display: "flex", gap: 16 }}>
        {/* ORDER LIST */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.map(patient => {
            const view = getView(patient.id); const missing = missingDocs(patient);
            const docsOk = receivedDocs(patient); const docsTotal = totalReqDocs(patient);
            const stagesOk = completedStages(patient); const totalStages = Object.keys(patient.stages).length;
            return (
              <div key={patient.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 8, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.03)" }}>
                {/* COMPACT */}
                <div onClick={() => cycleView(patient.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", cursor: "pointer" }}>
                  <Tip text={`${patient.gender === "F" ? "Female" : "Male"}, Age ${patient.age}`}><div style={{ width: 38, height: 38, borderRadius: 8, background: patient.gender === "F" ? "#fce7f3" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: patient.gender === "F" ? "#be185d" : "#1d4ed8", flexShrink: 0 }}>{patient.name.split(" ").map(n => n[0]).join("")}</div></Tip>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{patient.name}</span>
                      <Tip text={`TRQ: ${patient.id}\nAccession: ${patient.accession}`}><span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#64748b", background: "#f1f5f9", padding: "1px 5px", borderRadius: 3 }}>{patient.id}</span></Tip>
                      <Tip text={patient.priority === "STAT" ? "Expedited processing" : "Standard TAT"}><span style={{ padding: "1px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: patient.priority === "STAT" ? "#fef2f2" : "#f0fdf4", color: patient.priority === "STAT" ? "#dc2626" : "#16a34a", border: `1px solid ${patient.priority === "STAT" ? "#fecaca" : "#bbf7d0"}` }}>{patient.priority}</span></Tip>
                      {missing.length > 0 && <Tip text={`Missing: ${missing.map(k => DOC_LABELS[k]).join(", ")}`}><span style={{ background: "#fee2e2", color: "#dc2626", padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700 }}>⚠ {missing.length}</span></Tip>}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 11, marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Tip text={`${patient.testCode} | ${patient.methodology}`}><span style={{ color: "#334155", fontWeight: 500 }}>{patient.testPanel}</span></Tip><span style={{ color: "#cbd5e1" }}>·</span><span>{patient.insurance}</span><span style={{ color: "#cbd5e1" }}>·</span><span>{patient.orderingPhysician}</span>
                    </div>
                  </div>
                  <Tip text={`${patient.specimenType}\n${patient.specimenId}\nCollected: ${patient.collectionDate}`}><div style={{ width: 65, textAlign: "center" }}><StatusBadge status="received" size="xs" /></div></Tip>
                  <ProgressRing completed={docsOk} total={docsTotal} label="docs" />
                  <ProgressRing completed={stagesOk} total={totalStages} label="stages" />
                  <Tip text={patient.billingNotes}><div style={{ width: 85, textAlign: "center" }}><StatusBadge status={patient.billingStatus} size="xs" /></div></Tip>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[{ v: "compact", i: "━", t: "Compact" }, { v: "expanded", i: "☰", t: "Expanded" }, { v: "detailed", i: "▣", t: "Detailed" }].map(({ v, i, t }) => (
                      <Tip key={v} text={t}><button onClick={e => { e.stopPropagation(); setView(patient.id, v); }} style={{ padding: "3px 7px", borderRadius: 4, border: `1px solid ${view === v ? "#0ea5e9" : "#e2e8f0"}`, background: view === v ? "#e0f2fe" : "#fff", color: view === v ? "#0369a1" : "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{i}</button></Tip>
                    ))}
                  </div>
                </div>

                {/* EXPANDED */}
                {(view === "expanded" || view === "detailed") && (
                  <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 16px", background: "#fafbfd" }}>
                    <div style={{ display: "flex", gap: 18, marginBottom: 12, fontSize: 11, color: "#64748b", flexWrap: "wrap" }}>
                      {[["Order", patient.orderDate], ["Accession", patient.accession], ["Specimen", patient.specimenId], ["TAT", `${patient.turnaroundDays}d`], ["Est. Report", patient.estimatedReport], ["Facility", patient.facilityName]].map(([l, v]) => <span key={l}><span style={{ color: "#94a3b8" }}>{l}:</span> <strong style={{ color: "#334155" }}>{v}</strong></span>)}
                    </div>
                    {/* DOCS */}
                    <div style={{ marginBottom: 12 }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8", marginBottom: 5 }}>Documents ({docsOk}/{docsTotal})</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 4 }}>
                        {Object.entries(patient.documents).map(([key, doc]) => (
                          <Tip key={key} text={DOC_TIPS[key]} pos="bottom"><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 9px", borderRadius: 6, background: doc.status === "missing" ? "#fef2f2" : doc.status === "not_required" ? "#f8fafc" : "#f0fdf4", border: `1px solid ${doc.status === "missing" ? "#fecaca" : doc.status === "not_required" ? "#e2e8f0" : "#bbf7d0"}`, width: "100%" }}>
                            <div style={{ fontSize: 11, fontWeight: 500, color: doc.status === "not_required" ? "#94a3b8" : "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{DOC_LABELS[key]}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                              <StatusBadge status={doc.status} size="xs" />
                              {doc.status === "missing" && <button onClick={e => { e.stopPropagation(); handleEmailDraft(patient, key); }} style={{ padding: "2px 5px", borderRadius: 3, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: 9, cursor: "pointer", fontWeight: 600 }}>✉</button>}
                            </div>
                          </div></Tip>
                        ))}
                      </div>
                    </div>
                    {/* STAGES */}
                    <div style={{ marginBottom: 12 }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8", marginBottom: 5 }}>Workflow ({stagesOk}/{totalStages})</div>
                      <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        {Object.entries(patient.stages).map(([key, stage], i, arr) => (
                          <div key={key} style={{ display: "flex", alignItems: "stretch", gap: 2, flex: 1, minWidth: 95 }}>
                            <Tip text={`${STAGE_TIPS[key]}${stage.by ? "\n" + stage.by : ""}`}><div style={{ flex: 1, padding: "5px 7px", borderRadius: 5, background: stage.status === "complete" ? "#f0fdf4" : stage.status === "in_progress" ? "#fffbeb" : "#f8fafc", border: `1px solid ${stage.status === "complete" ? "#bbf7d0" : stage.status === "in_progress" ? "#fde68a" : "#e2e8f0"}` }}>
                              <div style={{ fontSize: 9, fontWeight: 600, color: "#334155", marginBottom: 2 }}>{STAGE_LABELS[key]}</div>
                              <StatusBadge status={stage.status} size="xs" />
                            </div></Tip>
                            {i < arr.length - 1 && <span style={{ color: "#cbd5e1", fontSize: 10, display: "flex", alignItems: "center" }}>›</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* LAB NOTES */}
                    {patient.labNotes.length > 0 && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8", marginBottom: 5 }}>Activity Log</div><div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6 }}>{patient.labNotes.map((n, i) => <div key={i} style={{ display: "flex", gap: 8, padding: "5px 9px", borderBottom: i < patient.labNotes.length - 1 ? "1px solid #f1f5f9" : "none", fontSize: 11 }}><span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#94a3b8", minWidth: 66 }}>{n.date}</span><span style={{ fontWeight: 600, color: "#64748b", minWidth: 68 }}>{n.by}</span><span style={{ color: "#334155" }}>{n.note}</span></div>)}</div></div>}
                    {/* ACTIONS */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {patient.stages.priorAuthorization.status === "not_started" && <Tip text="AI generates prior authorization request"><button disabled={!!aiLoading} onClick={() => handlePriorAuth(patient)} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: aiLoading === `pa-${patient.id}` ? "#94a3b8" : "linear-gradient(135deg, #0ea5e9, #2563eb)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5 }}>{aiLoading === `pa-${patient.id}` ? <><Spinner /> Generating...</> : <>⚡ Generate Prior Auth</>}</button></Tip>}
                      {priorAuthResults[patient.id] && paSubmissions[patient.id]?.status === "draft" && <Tip text="Review PA and submit to payor"><button onClick={() => setActivePanel({ pid: patient.id, type: "priorAuth", data: priorAuthResults[patient.id] })} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>📤 Review & Submit PA to Payor</button></Tip>}
                      {paSubmissions[patient.id]?.status === "submitted" && <Tip text="PA submitted, awaiting payor response"><span style={{ padding: "7px 14px", borderRadius: 7, background: "#fef9c3", border: "1px solid #fde68a", color: "#854d0e", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>⏳ PA Awaiting Payor Response</span></Tip>}
                      {paSubmissions[patient.id]?.status === "approved" && patient.stages.medicalNecessity.status === "not_started" && <Tip text="AI drafts Letter of Medical Necessity with structured form"><button disabled={!!aiLoading} onClick={() => handleMedNecessity(patient)} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: aiLoading === `mn-${patient.id}` ? "#94a3b8" : "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5 }}>{aiLoading === `mn-${patient.id}` ? <><Spinner /> Drafting LOMN...</> : <>⚡ Generate Medical Necessity</>}</button></Tip>}
                      {paSubmissions[patient.id]?.status === "denied" && <Tip text="PA was denied — click to view details and appeal options"><button onClick={() => setActivePanel({ pid: patient.id, type: "priorAuth", data: priorAuthResults[patient.id] })} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>⚠ PA Denied — View Details</button></Tip>}
                      {priorAuthResults[patient.id] && paSubmissions[patient.id]?.status !== "draft" && <button onClick={() => setActivePanel({ pid: patient.id, type: "priorAuth", data: priorAuthResults[patient.id] })} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #bae6fd", background: "#e0f2fe", color: "#0369a1", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View PA</button>}
                      {medNecessityDrafts[patient.id] && <button onClick={() => setActivePanel({ pid: patient.id, type: "medNecessity" })} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #a7f3d0", background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View LOMN</button>}
                    </div>
                  </div>
                )}
                {/* DETAILED */}
                {view === "detailed" && (
                  <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8", marginBottom: 8 }}>Full Details</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[["Demographics", [["Name", patient.name], ["DOB", `${patient.dob} (${patient.age}${patient.gender})`], ["MRN", patient.mrn], ["Phone", patient.phone], ["Email", patient.email], ["Address", patient.address]]],
                        ["Insurance", [["Carrier", patient.insurance], ["Member", patient.memberId], ["Group", patient.groupNumber], ["Billing", patient.billingNotes]]],
                        ["Test", [["Panel", patient.testPanel], ["Code", patient.testCode], ["Method", patient.methodology], ["CPT", patient.cptCodes.join(", ")]]],
                        ["Clinical", [["Dx", patient.diagnosis], ["ICD-10", patient.icd10.join(", ")], ["Indication", patient.clinicalIndication]]],
                        ["Providers", [["Ordering", `${patient.orderingPhysician} (${patient.physicianNPI})`], ["Referring", `${patient.referringPhysician} (${patient.referringNPI})`], ["Facility", `${patient.facilityName} (CLIA: ${patient.facilityCLIA})`]]],
                        ["Family Hx", [["", patient.familyHistory]]],
                      ].map(([title, rows]) => <div key={title} style={{ background: "#f8fafc", borderRadius: 7, padding: 9, border: "1px solid #e2e8f0" }}><div style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", marginBottom: 4, textTransform: "uppercase" }}>{title}</div>{rows.map(([l, v], i) => <div key={i} style={{ fontSize: 11, lineHeight: 1.5, marginBottom: 2 }}>{l && <span style={{ color: "#94a3b8" }}>{l}: </span>}<span style={{ color: "#1e293b", whiteSpace: "pre-wrap" }}>{v}</span></div>)}</div>)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* SIDE PANEL */}
        {activePanel && (
          <div style={{ width: (activePanel.type === "medNecessity" || activePanel.type === "priorAuth") ? 560 : 440, flexShrink: 0, position: "sticky", top: 12, maxHeight: "calc(100vh - 24px)", overflowY: "auto" }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 4px 24px rgba(0,0,0,.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "#fff", zIndex: 10, borderRadius: "10px 10px 0 0" }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>
                  {activePanel.type === "priorAuth" && "Prior Authorization Result"}
                  {activePanel.type === "medNecessity" && "Letter of Medical Necessity"}
                  {activePanel.type === "email" && "Document Request Email"}
                  {activePanel.type === "signature" && "Signature Tracking"}
                </span>
                <button onClick={() => setActivePanel(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: 5, width: 26, height: 26, cursor: "pointer", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              <div style={{ padding: "12px 16px" }}>
                {activePanel.type === "priorAuth" && (() => { const s = activePanel.data.summary; const sub = paSubmissions[activePanel.pid]; const pt = patients.find(p => p.id === activePanel.pid); return <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: sub?.status === "approved" ? "#dcfce7" : sub?.status === "denied" ? "#fee2e2" : sub?.status === "submitted" ? "#fef9c3" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: sub?.status === "approved" ? "#16a34a" : sub?.status === "denied" ? "#dc2626" : sub?.status === "submitted" ? "#ca8a04" : "#2563eb" }}>
                      {sub?.status === "approved" ? "✓" : sub?.status === "denied" ? "✕" : sub?.status === "submitted" ? "◐" : "✎"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: sub?.status === "approved" ? "#166534" : sub?.status === "denied" ? "#991b1b" : sub?.status === "submitted" ? "#854d0e" : "#1e40af" }}>
                        {sub?.status === "approved" ? "PA Approved" : sub?.status === "denied" ? "PA Denied" : sub?.status === "submitted" ? "PA Submitted — Awaiting Determination" : "PA Draft — Ready for Review"}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono'" }}>{activePanel.data.authNumber}</div>
                    </div>
                  </div>

                  {/* PA Details */}
                  {[["Patient", s.patientName], ["Member", s.memberId], ["Insurance", s.insurance], ["Provider", `${s.requestingProvider} (${s.npi})`], ["Facility", s.facility], ["Dx", s.diagnosis], ["CPT", s.procedureCodes], ["Service", s.serviceRequested], ["Cost", s.estimatedCost], ["Valid Through", activePanel.data.validThrough]].map(([l, v]) => <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f1f5f9", fontSize: 11 }}><span style={{ color: "#94a3b8" }}>{l}</span><span style={{ fontWeight: 500, textAlign: "right", maxWidth: "58%", color: "#1e293b" }}>{v}</span></div>)}
                  <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 11, lineHeight: 1.5 }}><strong>Rationale:</strong> {s.clinicalRationale}</div>

                  {/* SUBMISSION TRACKING */}
                  {sub && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8", marginBottom: 8, paddingBottom: 4, borderBottom: "2px solid #e2e8f0" }}>Submission Tracking</div>

                      {/* Status timeline */}
                      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                        {[
                          { label: "Draft", done: true },
                          { label: "Submitted", done: sub.status !== "draft" },
                          { label: "Under Review", done: sub.status === "approved" || sub.status === "denied" },
                          { label: sub.status === "denied" ? "Denied" : "Approved", done: sub.status === "approved" || sub.status === "denied" },
                        ].map((step, i, arr) => (
                          <div key={step.label} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                            <div style={{ flex: 1, textAlign: "center" }}>
                              <div style={{ width: "100%", height: 4, borderRadius: 2, background: step.done ? (sub.status === "denied" && i === 3 ? "#fecaca" : "#bbf7d0") : "#e2e8f0", marginBottom: 4 }} />
                              <div style={{ fontSize: 9, fontWeight: 600, color: step.done ? (sub.status === "denied" && i === 3 ? "#dc2626" : "#166534") : "#94a3b8" }}>{step.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {sub.status !== "draft" && (
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                          {[
                            ["Submitted", sub.submittedDate],
                            ["Method", sub.method],
                            ["Confirmation #", sub.confirmationNumber],
                            ...(sub.responseDate ? [["Response Date", sub.responseDate]] : []),
                            ...(sub.payorResponse ? [["Payor Response", sub.payorResponse]] : []),
                          ].map(([l, v]) => (
                            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}>
                              <span style={{ color: "#94a3b8" }}>{l}</span>
                              <span style={{ fontWeight: 500, color: sub.status === "denied" && l === "Payor Response" ? "#dc2626" : "#1e293b", textAlign: "right", maxWidth: "62%" }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* DRAFT — show submit to payor */}
                      {sub.status === "draft" && (
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, lineHeight: 1.5 }}>
                            Review the PA details above, then choose a submission method to send to <strong>{pt.insurance}</strong>.
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <Tip text={`Submit electronically via ${pt.insurance} payor portal — fastest method, typically 24-72hr response`}>
                              <button disabled={!!aiLoading} onClick={() => handleSubmitPA(activePanel.pid, "Electronic (Payor Portal)")} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "none", background: aiLoading === `pa-submit-${activePanel.pid}` ? "#94a3b8" : "linear-gradient(135deg, #0ea5e9, #2563eb)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                                {aiLoading === `pa-submit-${activePanel.pid}` ? <><Spinner /> Submitting...</> : <>🌐 Submit via Payor Portal</>}
                              </button>
                            </Tip>
                            <Tip text={`Fax PA request to ${pt.insurance} UR department at ${pt.payorFax}`}>
                              <button disabled={!!aiLoading} onClick={() => handleSubmitPA(activePanel.pid, `Fax to ${pt.payorFax}`)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#334155", fontSize: 12, fontWeight: 600, cursor: aiLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                                📠 Fax to {pt.payorFax}
                              </button>
                            </Tip>
                            <Tip text="Submit via phone call to payor PA department">
                              <button disabled={!!aiLoading} onClick={() => handleSubmitPA(activePanel.pid, "Phone Call")} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#334155", fontSize: 12, fontWeight: 600, cursor: aiLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                                📞 Phone Submission
                              </button>
                            </Tip>
                          </div>
                        </div>
                      )}

                      {/* SUBMITTED — show pending + simulate response */}
                      {sub.status === "submitted" && (
                        <div>
                          <div style={{ padding: 10, borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 10, fontSize: 11, color: "#854d0e", lineHeight: 1.5 }}>
                            ⏳ Awaiting payor determination. Electronic submissions typically receive a response within 24–72 hours. You will be notified when the payor responds.
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", marginBottom: 6, textTransform: "uppercase" }}>Demo: Simulate Payor Response</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Tip text="Simulate the payor approving this PA request">
                              <button onClick={() => handleSimulatePayorResponse(activePanel.pid, true)} style={{ flex: 1, padding: "8px", borderRadius: 7, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#166534", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Simulate Approve</button>
                            </Tip>
                            <Tip text="Simulate the payor denying this PA request">
                              <button onClick={() => handleSimulatePayorResponse(activePanel.pid, false)} style={{ flex: 1, padding: "8px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✕ Simulate Deny</button>
                            </Tip>
                          </div>
                        </div>
                      )}

                      {/* DENIED — show appeal options */}
                      {sub.status === "denied" && (
                        <div style={{ padding: 10, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 11, color: "#991b1b", lineHeight: 1.5 }}>
                          <strong>Denial — Next Steps:</strong>
                          <div style={{ marginTop: 4, color: "#334155" }}>
                            • Request peer-to-peer review with payor medical director{"\n"}
                            • Submit additional clinical documentation{"\n"}
                            • File formal appeal with updated Letter of Medical Necessity{"\n"}
                            • Contact patient about alternative coverage options
                          </div>
                        </div>
                      )}

                      {/* APPROVED — show auth details prominently */}
                      {sub.status === "approved" && (
                        <div style={{ padding: 10, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 11, color: "#166534", lineHeight: 1.5 }}>
                          <strong>✓ Authorization Active</strong>
                          <div style={{ marginTop: 4, color: "#334155" }}>Auth #{sub.authNumber} valid through {sub.validThrough}. Medical necessity form can now be generated.</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Download */}
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button onClick={() => handleDownload(JSON.stringify(activePanel.data, null, 2), `PA-${activePanel.pid}.json`)} style={{ flex: 1, padding: "8px", borderRadius: 7, border: "1px solid #bae6fd", background: "#e0f2fe", color: "#0369a1", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>↓ Download PA</button>
                  </div>
                </div>; })()}

                {activePanel.type === "medNecessity" && (() => {
                  const pt = patients.find(p => p.id === activePanel.pid);
                  return <LOMNForm patient={pt} onSendSignature={() => handleSendForSignature(pt)} onDownload={handleDownload} signatureStatus={signatureStatus[activePanel.pid]} />;
                })()}

                {activePanel.type === "email" && (() => { const em = activePanel.data.email; return <div>
                  <div style={{ marginBottom: 8 }}><label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>To</label><input value={`${em.toName} <${em.to}>`} readOnly style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 11, marginTop: 2 }} /></div>
                  <div style={{ marginBottom: 8 }}><label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Subject</label><input value={em.subject} onChange={e => setActivePanel(p => ({ ...p, data: { ...p.data, email: { ...p.data.email, subject: e.target.value } } }))} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, marginTop: 2 }} /></div>
                  <div style={{ marginBottom: 8 }}><label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>Body</label><textarea value={em.body} onChange={e => setActivePanel(p => ({ ...p, data: { ...p.data, email: { ...p.data.email, body: e.target.value } } }))} style={{ width: "100%", minHeight: 200, padding: 8, borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, lineHeight: 1.6, resize: "vertical", marginTop: 2 }} /></div>
                  <button onClick={() => { showToast(`Email sent to ${em.toName}`); setActivePanel(null); }} style={{ width: "100%", padding: "8px", borderRadius: 7, border: "none", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✉ Send Email</button>
                </div>; })()}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; margin: 0; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; } textarea:focus, input:focus { outline: none; border-color: #0ea5e9 !important; }`}</style>
    </div>
  );
}
