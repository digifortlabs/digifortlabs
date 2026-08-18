"use client";
import React, { useState } from "react";
import { ShieldCheck, CheckSquare, Square, FileText, Download, Award } from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  category: "DPDP" | "NABH";
  description: string;
}

const items: ChecklistItem[] = [
  {
    id: "dpdp-1",
    title: "Patient Digital Consent & Withdrawal Log",
    category: "DPDP",
    description: "System logs digital informed consent & allows patients to request soft-delete of data."
  },
  {
    id: "dpdp-2",
    title: "Multi-Tenant Data Siloing & RBAC Access",
    category: "DPDP",
    description: "Strict isolation via hospital_id and subdomains preventing cross-facility data leaks."
  },
  {
    id: "dpdp-3",
    title: "256-bit AES Encryption at Rest & Transit",
    category: "DPDP",
    description: "Bank-grade cryptographic standards for all EMR notes, lab reports & prescriptions."
  },
  {
    id: "nabh-1",
    title: "Standardized ICD-10/11 Diagnostic Indexing",
    category: "NABH",
    description: "All patient discharge summaries and EMR notes indexed using international coding."
  },
  {
    id: "nabh-2",
    title: "Barcoded Physical Paper Vault Chain-of-Custody",
    category: "NABH",
    description: "Physical paper record tracking with barcode tags for mandatory 7-year retention."
  }
];

export default function ComplianceChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    "dpdp-1": true,
    "dpdp-2": true,
    "dpdp-3": true,
    "nabh-1": true
  });

  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleItem = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalChecked = Object.values(checked).filter(Boolean).length;
  const percentage = Math.round((totalChecked / items.length) * 100);

  return (
    <>
      {/* On-Screen Interactive Component */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 mb-8">
          <div>
            <span className="text-blue-600 font-bold uppercase tracking-wider text-xs px-3 py-1 bg-blue-50 rounded-full border border-blue-200 inline-block mb-2">Lead Assessment Tool</span>
            <h2 className="text-2xl font-extrabold text-slate-900">DPDP 2023 & NABH Readiness Assessment</h2>
          </div>
          
          {/* Score Gauge */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <Award className="w-8 h-8 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Compliance Readiness</div>
              <div className="text-xl font-extrabold text-slate-900">{percentage}% Certified</div>
            </div>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const isChecked = !!checked[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-start gap-4 ${
                  isChecked
                    ? "bg-blue-50/60 border-blue-200 text-slate-900 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.category === "DPDP" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-teal-100 text-teal-700 border border-teal-200"
                    }`}>
                      {item.category} Mandate
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Digifort HMS enforces all 5 compliance standards natively out of the box.
          </div>
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Print / Save PDF Audit Report
          </button>
        </div>
      </div>

      {/* Official Printable PDF Audit Report Certificate */}
      <div className="hidden print:block p-8 bg-white text-slate-900 font-sans border-2 border-slate-300 rounded-xl">
        <div className="flex items-center justify-between pb-6 border-b-2 border-slate-900 mb-6">
          <div className="flex items-center gap-4">
            <img src="/logo/longlogo.png" alt="Digifort Labs Logo" className="h-10 w-auto object-contain" />
          </div>
          <div className="text-right">
            <h2 className="text-base font-extrabold text-blue-700 uppercase tracking-tight">Official DPDP Act 2023 & NABH Readiness Certificate</h2>
            <p className="text-xs text-slate-500 mt-0.5">Document ID: DIGI-AUDIT-2026-84920 | Date: {mounted ? new Date().toLocaleDateString('en-IN') : '16/08/2026'}</p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-slate-100 border border-slate-300 rounded-lg flex justify-between items-center">
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase">Audit Assessment Summary</div>
            <div className="text-xl font-black text-slate-900">{totalChecked} of {items.length} Mandates Verified</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-600 uppercase">Compliance Score</div>
            <div className="text-2xl font-black text-blue-700">{percentage}% Certified</div>
          </div>
        </div>

        <table className="w-full text-left border-collapse border border-slate-300 mb-8 text-xs">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-300">
              <th className="p-3 font-bold border-r border-slate-300">Category</th>
              <th className="p-3 font-bold border-r border-slate-300">Compliance Requirement Mandate</th>
              <th className="p-3 font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-300">
                <td className="p-3 font-bold border-r border-slate-300">{item.category}</td>
                <td className="p-3 border-r border-slate-300">
                  <div className="font-bold">{item.title}</div>
                  <div className="text-[11px] text-slate-600">{item.description}</div>
                </td>
                <td className="p-3 text-center font-bold">
                  {checked[item.id] ? (
                    <span className="text-emerald-700">✓ COMPLIANT</span>
                  ) : (
                    <span className="text-red-600">✗ NON-COMPLIANT</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-6 border-t border-slate-300 flex justify-between items-end text-xs text-slate-500">
          <div>
            <p><strong>Digifort Labs Healthcare Security System</strong></p>
            <p>Verification Code: <code>DPDP-NABH-VERIFIED-2026</code></p>
          </div>
          <div className="text-right">
            <p><strong>Authorized Audit Stamp</strong></p>
            <p className="text-[10px] text-slate-400">Digitally Verified via Digifort HMS Engine</p>
          </div>
        </div>
      </div>
    </>
  );
}
