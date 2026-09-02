"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Users, Building2, BedDouble, Pill, Receipt, Stethoscope, 
  Syringe, FileSpreadsheet, BarChart3, ShieldCheck, UserCheck, 
  CheckCircle2, ArrowRight, Layers, FileText, Database 
} from "lucide-react";

interface FRSChapter {
  id: number;
  code: string;
  title: string;
  icon: React.ReactNode;
  summary: string;
  deepDive?: string[];
  features: string[];
  dbEntities: string[];
  rbacRoles: string[];
}

const chapters: FRSChapter[] = [
  {
    id: 1,
    code: "CH-01",
    title: "Executive Summary & Patient Management (OPD)",
    icon: <Users className="w-5 h-5" />,
    summary: "Comprehensive outpatient registration, unique UHID allocation, walk-in QR self-check-in, and lobby Smart TV queue token management.",
    deepDive: [
      "When a patient arrives, their demographic data is tied to the local hospital branch via a 'hospital_id' for logical data isolation.",
      "Hospital groups can use a Group-Level Unique Health Identifier (UHID) to share patient medical records securely across branches while maintaining strict privacy.",
      "Advanced roadmap features include QR Code Self-Registration in the lobby to reduce data-entry loads, and Smart TV Token Displays synced with the doctor's digital queue."
    ],
    features: [
      "Auto-generated Unique UHID (e.g. DIGI-2026-84920)",
      "Lobby Smart TV Token Callout Display",
      "QR Code Walk-In Patient Self-Registration",
      "Thermal Wristband & Token Receipt Printing"
    ],
    dbEntities: ["Patient", "OPDVisit", "TokenQueue", "VitalsLog"],
    rbacRoles: ["Receptionist", "OPD Doctor", "Nurse", "Hospital Admin"]
  },
  {
    id: 2,
    code: "CH-02",
    title: "Hospital Admin & Group Multi-Branch Management",
    icon: <Building2 className="w-5 h-5" />,
    summary: "Hospital administration, multi-branch onboarding, automated subdomain provisioning, and X-Tenant-Slug logical data siloing.",
    deepDive: [
      "The SaaS architecture employs a Next.js, React, and TypeScript stack with Shared Database Multi-Tenancy.",
      "Hospital Group Admins manage the complete lifecycle of hospital branches, including automated subdomain provisioning and subscription enforcement.",
      "All configuration changes are logged via an immutable System Audit Trail, ensuring HIPAA/GDPR compliance across the multi-tenant architecture."
    ],
    features: [
      "Isolated Hospital Subdomain Provisioning (e.g. cityhospital.digifortlabs.com)",
      "Strict Database Multitenancy via hospital_id RBAC",
      "Subscription Tier & Storage Quota Enforcement",
      "Hospital Group Admin Audit Trail & License Renewal"
    ],
    dbEntities: ["Tenant", "HospitalConfig", "SubdomainMap", "PlatformQuota"],
    rbacRoles: ["Hospital Admin", "Group Admin"]
  },
  {
    id: 3,
    code: "CH-03",
    title: "Inpatient (IPD) Operations & Nursing MAR",
    icon: <BedDouble className="w-5 h-5" />,
    summary: "Visual bed matrix for ICU/General wards, ADT (Admission, Transfer, Discharge) workflows, and Medication Administration Records.",
    deepDive: [
      "The visual bed matrix provides real-time occupancy status for ICUs, General Wards, and Private Rooms.",
      "Nursing staff utilize the Medication Administration Record (MAR) to digitally sign off on drug delivery and log hourly patient vitals.",
      "The automated Admission, Transfer, and Discharge (ADT) engine instantly accrues bed charges to the patient's billing folio upon transfer."
    ],
    features: [
      "Visual Interactive Bed Grid Matrix (ICU, Private, Deluxe, Ward)",
      "ADT Transfer & Bed Charge Auto-Accrual Engine",
      "Nurse Shift Handover Notes & Hourly Vitals Log",
      "Medication Administration Record (MAR) Digital Signoff"
    ],
    dbEntities: ["IPDAdmission", "WardBed", "NurseShiftLog", "MedicationMAR"],
    rbacRoles: ["IPD Doctor", "Ward Nurse", "ADT Manager", "Hospital Admin"]
  },
  {
    id: 4,
    code: "CH-04",
    title: "Pharmacy, Inventory & FEFO Supply Chain",
    icon: <Pill className="w-5 h-5" />,
    summary: "First-Expiry-First-Out (FEFO) drug batch tracking, POS barcode billing, supplier purchase orders, and stock reorder alerts.",
    deepDive: [
      "The inventory engine enforces FEFO (First Expiry First Out) to minimize drug wastage and ensure patient safety.",
      "Pharmacists use POS barcode scanners for lightning-fast billing, automatically calculating complex GST/tax brackets.",
      "Automated stock level triggers immediately alert procurement managers and auto-generate Purchase Orders when supplies drop below minimum thresholds."
    ],
    features: [
      "FEFO (First Expiry First Out) Automatic Batch Selection",
      "POS Barcode Billing with Automated GST Tax Calculation",
      "Supplier Purchase Order (PO) & Goods Received Note (GRN)",
      "Low-Stock & Near-Expiry Instant Alert Triggers"
    ],
    dbEntities: ["PharmacyStock", "DrugBatch", "PurchaseOrder", "POSInvoice"],
    rbacRoles: ["Pharmacist", "Inventory Manager", "Accountant"]
  },
  {
    id: 5,
    code: "CH-05",
    title: "Financial Accounting, Billing & TPA Insurance",
    icon: <Receipt className="w-5 h-5" />,
    summary: "Patient billing, advance deposit ledger, GIPSA package rates, and TPA pre-authorization insurance claim tracking.",
    deepDive: [
      "A unified billing module consolidates OPD, IPD, Surgery, and Diagnostic charges into a single, comprehensive patient invoice.",
      "The TPA desk utilizes standard GIPSA insurance package rate cards to streamline pre-authorization requests and track claim approvals.",
      "Cashiers manage shift settlements, process partial refunds, and accept multi-mode advance deposits into the patient's virtual wallet."
    ],
    features: [
      "Unified OPD & IPD Final Invoice Generation",
      "TPA Pre-Authorization & Pre-Auth Claim Approval Tracker",
      "GIPSA Standard Insurance Package Rate Cards",
      "Refunds, Advance Deposits & Cashier Shift Settlement"
    ],
    dbEntities: ["BillingInvoice", "TPAClaim", "AdvanceLedger", "GipsaPackage"],
    rbacRoles: ["Billing Cashier", "TPA Desk", "Accountant", "Hospital Admin"]
  },
  {
    id: 6,
    code: "CH-06",
    title: "Laboratory & Diagnostics (LIS/RIS)",
    icon: <Stethoscope className="w-5 h-5" />,
    summary: "Barcode sample accessioning, automated lab machine interfacing, pathologist result verification, and instant PDF reports.",
    deepDive: [
      "Phlebotomists tag patient samples with unique barcodes, establishing a strict chain-of-custody through the accessioning workflow.",
      "Bi-directional APIs interface directly with modern lab analyzer machines, reducing manual data entry errors to zero.",
      "Pathologists provide a two-stage verification with digital signatures, instantly dispatching PDF reports to patients via WhatsApp."
    ],
    features: [
      "Sample Barcode Tagging & Accessioning Workflow",
      "Bi-Directional Lab Machine Analyzer Interfacing",
      "Two-Stage Pathologist Verification & Digital Signature",
      "Instant WhatsApp & SMS Lab Report PDF Dispatch"
    ],
    dbEntities: ["LabOrder", "SampleBarcode", "TestResult", "MachineLog"],
    rbacRoles: ["Lab Tech", "Pathologist", "Radiologist", "OPD Doctor"]
  },
  {
    id: 7,
    code: "CH-07",
    title: "Surgery & Operation Theatre (OT)",
    icon: <Syringe className="w-5 h-5" />,
    summary: "OT calendar scheduling, Pre-Anesthesia Clearance (PAC) digital checklists, surgical team fee splits, and implant inventory.",
    deepDive: [
      "The interactive OT Calendar prevents room double-booking and optimizes surgical schedules across multiple theatre blocks.",
      "Anesthetists must clear the mandatory digital Pre-Anesthesia Clearance (PAC) checklist before any major surgery can commence.",
      "The backend fee split engine automatically distributes surgery charges among the primary surgeon, anesthetist, and OT nursing staff."
    ],
    features: [
      "Interactive OT Calendar & Theatre Room Allocation",
      "Digital Pre-Anesthesia Clearance (PAC) Checklist",
      "Surgeon, Anesthetist & OT Nurse Fee Split Engine",
      "Surgical Implant Serial Number Tracking"
    ],
    dbEntities: ["OTSurgery", "PACChecklist", "SurgeonFeeSplit", "OTImplantLog"],
    rbacRoles: ["Surgeon", "Anesthetist", "OT Nurse", "Billing Cashier"]
  },
  {
    id: 8,
    code: "CH-08",
    title: "Medical Records (MRD), ICD Coding & Telemedicine",
    icon: <FileSpreadsheet className="w-5 h-5" />,
    summary: "ICD-10/11 diagnostic indexing, barcoded physical paper vault chain-of-custody, soft-delete bin, and video tele-consultations.",
    deepDive: [
      "Doctors can instantly map diagnoses to official ICD-10 and ICD-11 codes, ensuring global compliance and easing TPA insurance claims.",
      "Cloud storage automatically organizes patient scans and PDFs into hospital-specific discharge date folders ({Hospital}/MRD/YYYY/MM). Updating a patient's discharge date dynamically relocates S3 files to match the new discharge month and year in real-time.",
      "For legacy physical records, the MRD module tracks barcoded paper files to specific physical racks and boxes within the hospital vault.",
      "An integrated Telemedicine portal allows doctors to conduct encrypted video consultations and issue digital E-Rx prescriptions."
    ],
    features: [
      "ICD-10 & ICD-11 Diagnostic Code Search & Indexing",
      "Automated Discharge-Date S3 Storage Hierarchy ({Hospital}/MRD/YYYY/MM)",
      "Dynamic S3 File Relocation Engine on Patient Date Change",
      "Barcoded Physical Paper Document Rack & Box Tracking",
      "7-Year Retention Soft-Delete Bin & Restore Vault",
      "Integrated Tele-Consultation Video Portal & E-Rx"
    ],
    dbEntities: ["MRDArchive", "ICD10Code", "PaperRackBox", "TeleSession"],
    rbacRoles: ["MRD Officer", "OPD Doctor", "Hospital Admin"]
  },
  {
    id: 9,
    code: "CH-09",
    title: "Analytics, Reports & Business Intelligence",
    icon: <BarChart3 className="w-5 h-5" />,
    summary: "Executive dashboards for Average Length of Stay (ALOS), Bed Occupancy Rate (BOR), revenue analytics, and PDF/CSV exports.",
    deepDive: [
      "Hospital administrators have access to real-time executive dashboards highlighting critical KPIs like Bed Occupancy Rate (BOR).",
      "Advanced trend analytics calculate the Average Length of Stay (ALOS), helping optimize patient turnover and bed utilization.",
      "All financial and clinical reports can be exported to CSV, Excel, or PDF with a single click for stakeholder board meetings."
    ],
    features: [
      "Average Length of Stay (ALOS) Trend Analytics",
      "Bed Occupancy Rate (BOR) Real-time Percentage",
      "Departmental Revenue & Doctor OPD Footfall Analytics",
      "One-Click CSV, Excel & PDF Report Exporting"
    ],
    dbEntities: ["AnalyticsMetric", "DailyRevenue", "OccupancySnapshot"],
    rbacRoles: ["Hospital Admin", "Accountant", "Group Admin"]
  },
  {
    id: 10,
    code: "CH-10",
    title: "Configuration & Master Data Management",
    icon: <ShieldCheck className="w-5 h-5" />,
    summary: "Master tariff lists, doctor OPD schedules, system parameter settings, and secure audit trail logging.",
    deepDive: [
      "The Master Data module governs all overarching hospital parameters, including the comprehensive tariff catalog and room pricing.",
      "Hospital administrators can configure duty schedules and leave rosters for consulting doctors, immediately reflecting on the OPD booking screen.",
      "A secure Audit Trail logs activity and updates, attributing actions to specific staff members for total accountability."
    ],
    features: [
      "Master Tariff & Charge Catalogue Management",
      "Doctor Consultation Duty Schedules & Leave Roster",
      "System Audit Trail & Security Logs",
      "Patient Data Privacy & Legal Document Controls"
    ],
    dbEntities: ["MasterTariff", "DoctorSchedule", "AuditTrailLog", "SystemConfig"],
    rbacRoles: ["Hospital Admin", "IT Manager", "Group Admin"]
  },
  {
    id: 11,
    code: "CH-11",
    title: "Human Resources, Staff Management & Onboarding",
    icon: <UserCheck className="w-5 h-5" />,
    summary: "Staff profiles, biometric/RFID attendance, salary structure configurations, and automated staff onboarding workflows.",
    deepDive: [
      "The HR module acts as a digital repository for all staff credentials, employment contracts, and statutory documents.",
      "Biometric and RFID integration automates attendance logging, seamlessly mapping clock-ins to complex nursing shift schedules.",
      "The integrated payroll engine handles monthly pay slip generation, dynamically calculating allowances, deductions, and overtime."
    ],
    features: [
      "Staff Profile & Document Repository Management",
      "RFID / Biometric Attendance Logging & Shift Mapping",
      "Salary Pay Slip Generation & Allowance Calculations",
      "Staff Onboarding & Credentials Clearance Workflow"
    ],
    dbEntities: ["StaffProfile", "AttendanceLog", "PayrollSlip", "CredentialCheck"],
    rbacRoles: ["HR Manager", "Hospital Admin", "Accountant"]
  }
];

export default function ModulesPage() {
  const [selectedCh, setSelectedCh] = useState<number>(1);

  const activeChapter = chapters.find((c) => c.id === selectedCh) || chapters[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 font-sans selection:bg-blue-500/30 flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 z-0 opacity-40 bg-grid-slate-100 pointer-events-none" />
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-100/60 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-6 text-blue-700 text-xs font-bold uppercase tracking-widest shadow-sm">
            <Layers className="w-4 h-4" /> Functional Requirement Specification (FRS)
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4 leading-tight">
            Explore 11 Integrated <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-600">
              Hospital Clinical Modules
            </span>
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto">
            Interactive chapter-by-chapter blueprint detailing clinical workflows, database entities, and RBAC rules based on Digifort's official documentation.
          </p>
        </div>
      </section>

      {/* Main Chapter Explorer Body */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Chapter List Navigation */}
        <div className="lg:col-span-4 space-y-2 bg-white border border-slate-200 p-4 rounded-3xl shadow-lg">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-3 block mb-2">Select FRS Chapter</span>
          {chapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setSelectedCh(ch.id)}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left font-bold text-xs md:text-sm transition-all border ${
                selectedCh === ch.id
                  ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-200"
                  : "bg-slate-50 text-slate-600 border-slate-100 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${selectedCh === ch.id ? "bg-white/20 border-white/30 text-white" : "bg-white border-slate-200 text-blue-600 shadow-sm"}`}>
                  {ch.icon}
                </div>
                <div>
                  <div className={`text-[10px] font-extrabold tracking-wider ${selectedCh === ch.id ? 'opacity-90' : 'opacity-60 text-slate-500'}`}>{ch.code}</div>
                  <div className="truncate max-w-[180px]">{ch.title.split("&")[0]}</div>
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 transition-transform ${selectedCh === ch.id ? "translate-x-1" : "opacity-30"}`} />
            </button>
          ))}
        </div>

        {/* Right Column: Active Chapter Blueprint Details */}
        <div className="lg:col-span-8 bg-white border border-slate-200 p-6 md:p-10 rounded-3xl shadow-xl space-y-8">
          
          {/* Chapter Header */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{activeChapter.code}</div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">{activeChapter.title}</h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              {activeChapter.icon}
            </div>
          </div>

          {/* Summary Box */}
          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
            {activeChapter.summary}
          </p>

          {/* Key Features List */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Core Functional Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeChapter.features.map((feat, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
          </div>

          {/* Technical Blueprint: Database Entities & RBAC Roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            
            {/* DB Entities */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-500" /> Database Schema Entities
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeChapter.dbEntities.map((ent, i) => (
                  <span key={i} className="text-xs font-mono font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                    {ent}
                  </span>
                ))}
              </div>
            </div>

            {/* RBAC Access Roles */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-500" /> Authorized RBAC Roles
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeChapter.rbacRoles.map((role, i) => (
                  <span key={i} className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Deep Dive Description Block */}
            {activeChapter.deepDive && (
              <div className="md:col-span-2 mt-4 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-500" /> Deep Dive: Architectural & Operational Blueprint
                </h4>
                <div className="space-y-4">
                  {activeChapter.deepDive.map((paragraph, i) => (
                    <p key={i} className="text-slate-600 text-sm leading-relaxed pl-4 border-l-2 border-emerald-400">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}
