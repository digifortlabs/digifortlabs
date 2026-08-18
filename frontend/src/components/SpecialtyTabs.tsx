"use client";
import React, { useState } from "react";
import { Stethoscope, Eye, Baby, Bone, Building2, CheckCircle2, ArrowRight, Camera, FileText, Zap, Smile } from "lucide-react";

interface SpecialtyData {
  id: string;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  description: string;
  highlights: string[];
  graphicWidget: {
    title: string;
    metrics: { label: string; value: string }[];
    badge: string;
  };
}

const specialties: SpecialtyData[] = [
  {
    id: "general",
    name: "General Medicine & OPD",
    icon: <Stethoscope className="w-5 h-5" />,
    tagline: "General Outpatient Consultation & E-Prescriptions",
    description: "Standard primary care OPD EMR featuring chief complaints, physical exam templates, ICD-10 diagnostic indexing, and one-click WhatsApp E-Rx dispatch.",
    highlights: [
      "Rapid Chief Complaint & Clinical History Templates",
      "Vitals Logging (BP, Pulse, SpO2, Temp, BMI)",
      "Instant WhatsApp & Thermal Printed E-Prescriptions",
      "Follow-Up Reminders & Lab Test Requisition"
    ],
    graphicWidget: {
      title: "General Medicine OPD",
      metrics: [
        { label: "Consultation Speed", value: "< 2 Mins" },
        { label: "E-Rx Dispatch", value: "WhatsApp / Print" }
      ],
      badge: "General Practice"
    }
  },
  {
    id: "dental",
    name: "Dental Practice",
    icon: <Smile className="w-5 h-5" />,
    tagline: "Tooth Charting, Perio & Dental Chair EMR",
    description: "Interactive adult & pediatric 32-tooth dental chart, periapical X-ray attachment, treatment plan estimation, and chair appointment scheduling.",
    highlights: [
      "Interactive 32-Tooth Adult & Primary Dental Chart",
      "Periapical & RVG Digital X-Ray Image Attachment",
      "Multi-Sitting Treatment Plan & Estimate Generator",
      "Prophylaxis, Root Canal & Orthodontic Care Logs"
    ],
    graphicWidget: {
      title: "Dental Practice Module",
      metrics: [
        { label: "Odontogram Chart", value: "32-Tooth Grid" },
        { label: "RVG X-Ray Attachment", value: "HD DICOM/PNG" }
      ],
      badge: "Dental Specialty"
    }
  },
  {
    id: "ent",
    name: "ENT Specialty",
    icon: <Stethoscope className="w-5 h-5" />,
    tagline: "Endoscopy Attachment & Audiometry EMR",
    description: "Tailored EMR interface supporting otoscopy/endoscopy HD image capture, audiogram charting, and fast WhatsApp local treatment links.",
    highlights: [
      "HD Endoscopy Image & Video Attachment",
      "Audiometric Charting & Hearing Loss Staging",
      "Fast Prescriptions via WhatsApp Local Protocol",
      "Lobby Smart TV Token Callout System"
    ],
    graphicWidget: {
      title: "ENT Clinical Module",
      metrics: [
        { label: "Endoscopy Captures", value: "HD PNG/MP4" },
        { label: "Audiogram Sync", value: "Real-time" }
      ],
      badge: "ENT Optimized"
    }
  },
  {
    id: "pediatrics",
    name: "Pediatrics",
    icon: <Baby className="w-5 h-5" />,
    tagline: "Vaccination Rostering & Growth Curves",
    description: "Automated child immunization tracking, WHO percentile growth curve logging, and parent SMS/WhatsApp vaccine reminders.",
    highlights: [
      "WHO Percentile Height & Weight Growth Curves",
      "Automated Vaccine Dose & Booster Calendar",
      "Parent WhatsApp Booster Reminders",
      "Pediatric Dosage Calculator by Weight (kg)"
    ],
    graphicWidget: {
      title: "Pediatric Care Module",
      metrics: [
        { label: "Vaccine Reminders", value: "Auto WhatsApp" },
        { label: "Growth Charts", value: "WHO Standard" }
      ],
      badge: "Child Health"
    }
  },
  {
    id: "eye",
    name: "Ophthalmology",
    icon: <Eye className="w-5 h-5" />,
    tagline: "Vision Sph/Cyl Staging & Slit Lamp EMR",
    description: "Specialized eye-examination grid capturing Sph, Cyl, Axis, IOP intraocular pressure, and digital optical prescription slips.",
    highlights: [
      "Refraction Grid (OD / OS - Sph, Cyl, Axis, Add)",
      "Tonometry Intraocular Pressure (IOP) Tracking",
      "Optical Shop POS & Contact Lens Order Sync",
      "Digital Spectacle Prescription Generator"
    ],
    graphicWidget: {
      title: "Ophthalmic Vision Grid",
      metrics: [
        { label: "Refraction Index", value: "OD / OS Grid" },
        { label: "Optical POS", value: "Integrated" }
      ],
      badge: "Vision Care"
    }
  },
  {
    id: "ortho",
    name: "Orthopedics",
    icon: <Bone className="w-5 h-5" />,
    tagline: "Implant Inventory & OT PAC Workflow",
    description: "Track surgical implants, digital Pre-Anesthesia Clearance (PAC), OT scheduling, and post-op physiotherapy progress notes.",
    highlights: [
      "Surgical Implant Serial Number & Expiry Tracking",
      "Digital PAC (Pre-Anesthesia Clearance) Checklist",
      "Surgical Team Fee Splits & OT Log Sheet",
      "Physiotherapy Rehabilitation Schedules"
    ],
    graphicWidget: {
      title: "Ortho OT & Implant Suite",
      metrics: [
        { label: "Implant Vault", value: "Barcoded" },
        { label: "OT Clearance", value: "PAC Digital" }
      ],
      badge: "Surgical Suite"
    }
  },
  {
    id: "maternity",
    name: "Maternity & Obstetrics",
    icon: <Baby className="w-5 h-5" />,
    tagline: "Antenatal Care (ANC) & Delivery Tracking",
    description: "Comprehensive pregnant patient care, Expected Delivery Date (EDD) calculator, ANC visit schedules, high-risk pregnancy alerts, and newborn records.",
    highlights: [
      "LMP to EDD Automatic Gestational Age Calculator",
      "High-Risk Pregnancy Flagging & Emergency Alerts",
      "Antenatal Care (ANC) Visit Schedule & Vitals Tracker",
      "Newborn Birth Certificate & Immunization Records"
    ],
    graphicWidget: {
      title: "Maternity & OB/GYN Suite",
      metrics: [
        { label: "ANC Visit Schedule", value: "Trimester Tracked" },
        { label: "EDD Calculator", value: "Automatic" }
      ],
      badge: "Maternity Care"
    }
  },
  {
    id: "multi",
    name: "Multi-Specialty Network",
    icon: <Building2 className="w-5 h-5" />,
    tagline: "Group UHID & Multi-Branch Network",
    description: "Centralized SaaS architecture allowing multi-branch hospital chains to share patient UHIDs while keeping facility billing isolated.",
    highlights: [
      "Group-Level UHID Patient Lookup Across Network",
      "Isolated Subdomain & Tenant Billing Rules",
      "Visual Ward Bed Grid for 500+ IPD Beds",
      "Central GIPSA Tariff & TPA Claim Package Management"
    ],
    graphicWidget: {
      title: "Multi-Tenant Enterprise",
      metrics: [
        { label: "Branch Isolation", value: "X-Tenant-Slug" },
        { label: "Global UHID", value: "Cross-Network" }
      ],
      badge: "Enterprise Chain"
    }
  }
];

export default function SpecialtyTabs() {
  const [activeTab, setActiveTab] = useState<string>("general");

  const currentSpecialty = specialties.find((s) => s.id === activeTab) || specialties[0];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-blue-600 font-bold uppercase tracking-wider text-xs px-3 py-1 bg-blue-50 rounded-full border border-blue-200 inline-block mb-3">Tailored EMR Templates</span>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Designed for Every Clinical Specialty</h2>
        <p className="text-slate-500 text-sm">Select your medical department to preview specialized workflows.</p>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        {specialties.map((spec) => (
          <button
            key={spec.id}
            onClick={() => setActiveTab(spec.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 border ${
              activeTab === spec.id
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {spec.icon}
            {spec.name}
          </button>
        ))}
      </div>

      {/* Tab Content Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8">
        
        {/* Left Column: Descriptions & Highlights */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-200 rounded-full text-xs font-bold text-blue-700 mb-3">
              <Zap className="w-3.5 h-3.5" /> {currentSpecialty.tagline}
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-3">{currentSpecialty.name} Capabilities</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{currentSpecialty.description}</p>
          </div>

          <div className="space-y-3 pt-2">
            {currentSpecialty.highlights.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Graphic Spec Widget */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> {currentSpecialty.graphicWidget.title}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {currentSpecialty.graphicWidget.badge}
              </span>
            </div>

            <div className="space-y-4">
              {currentSpecialty.graphicWidget.metrics.map((m, i) => (
                <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">{m.label}</span>
                  <span className="text-xs font-bold text-emerald-700">{m.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>Status: <strong className="text-slate-900">Active in Digifort HMS</strong></span>
              <span className="text-blue-600 font-bold flex items-center gap-1">Module Ready <ArrowRight className="w-3.5 h-3.5" /></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
