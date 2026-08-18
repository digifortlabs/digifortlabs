"use client";
import React, { useState } from "react";
import { Stethoscope, Monitor, BedDouble, TestTube, CheckCircle2, User, Play, RefreshCw, Send } from "lucide-react";

export default function RolePreviewSandbox() {
  const [role, setRole] = useState<"doctor" | "reception" | "nursing" | "lab">("doctor");
  const [tokenNum, setTokenNum] = useState<number>(105);
  const [bedStatus, setBedStatus] = useState<"Occupied" | "Discharged" | "Available">("Occupied");
  const [labStatus, setLabStatus] = useState<"Pending Validation" | "Verified & Dispatched">("Pending Validation");
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden backdrop-blur-xl">
      <div className="text-center max-w-3xl mx-auto mb-8">
        <span className="text-blue-700 font-bold uppercase tracking-wider text-xs px-3 py-1 bg-blue-50 rounded-full border border-blue-200 inline-block mb-3">Interactive Sandbox</span>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Experience Digifort Roles Live</h2>
        <p className="text-slate-500 text-sm">Switch roles below to test how different hospital staff interact with the system.</p>
      </div>

      {/* Role Selector Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <button
          onClick={() => setRole("doctor")}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-xs md:text-sm border transition ${
            role === "doctor"
              ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-200"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Stethoscope className="w-4 h-4" /> Doctor View
        </button>

        <button
          onClick={() => setRole("reception")}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-xs md:text-sm border transition ${
            role === "reception"
              ? "bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-200"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Monitor className="w-4 h-4" /> Reception / Queue
        </button>

        <button
          onClick={() => setRole("nursing")}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-xs md:text-sm border transition ${
            role === "nursing"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-200"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <BedDouble className="w-4 h-4" /> IPD Nursing
        </button>

        <button
          onClick={() => setRole("lab")}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold text-xs md:text-sm border transition ${
            role === "lab"
              ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-200"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <TestTube className="w-4 h-4" /> Pathologist LIS
        </button>
      </div>

      {/* Role Screen Simulator Container */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 min-h-[320px] flex flex-col justify-between shadow-inner">
        
        {/* DOCTOR VIEW */}
        {role === "doctor" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                  DS
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Dr. Sharma, MD (ENT)</div>
                  <div className="text-xs text-slate-500">Consultation Room #3</div>
                </div>
              </div>
              <span className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-bold border border-blue-200">Active EMR</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500">Patient Name</span>
                <div className="text-sm font-bold text-slate-900 mt-1">Rajesh Kumar (UHID #84920)</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500">Vitals Recorded</span>
                <div className="text-sm font-bold text-emerald-600 mt-1">BP 120/80 | SpO2 99%</div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500">Diagnosis</span>
                <div className="text-sm font-bold text-blue-600 mt-1">Acute Otitis Media (ICD-10 H66.0)</div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <span className="text-xs text-slate-500">Action: Issue Digital Prescription to Patient's Phone</span>
              <button
                onClick={() => triggerToast("📲 WhatsApp Prescription PDF dispatched to Rajesh Kumar (+91 98XXX XXX20)")}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Send E-Rx via WhatsApp
              </button>
            </div>

            {statusToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusToast}</span>
              </div>
            )}
          </div>
        )}

        {/* RECEPTION VIEW */}
        {role === "reception" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
                  FD
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Front Desk Registration</div>
                  <div className="text-xs text-slate-500">Lobby Smart TV Queue Bridge</div>
                </div>
              </div>
              <span className="text-xs px-3 py-1 bg-teal-50 text-teal-600 rounded-full font-bold border border-teal-200">Queue Live</span>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-teal-200 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-slate-500">Current Next OPD Token</span>
                <div className="text-3xl font-black text-slate-900">Token #{tokenNum}</div>
              </div>
              <button
                onClick={() => setTokenNum((prev) => prev + 1)}
                className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-md shadow-teal-200"
              >
                <Play className="w-4 h-4" /> Call Next Token to TV
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Walk-in QR Code Self-Registration: <strong className="text-emerald-600">Active</strong></span>
              <span>Printer: <strong className="text-blue-600">Thermal OPD Ready</strong></span>
            </div>
          </div>
        )}

        {/* NURSING VIEW */}
        {role === "nursing" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                  NS
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Inpatient Ward Station</div>
                  <div className="text-xs text-slate-500">Ward A - Bed #102 Visual MAR</div>
                </div>
              </div>
              <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full font-bold border border-emerald-200">IPD Live</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs text-slate-500">Bed Status (#102)</div>
                <div className={`text-lg font-bold ${bedStatus === "Occupied" ? "text-rose-600" : "text-emerald-600"}`}>
                  {bedStatus}
                </div>
              </div>
              <button
                onClick={() => setBedStatus(bedStatus === "Occupied" ? "Available" : "Occupied")}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition"
              >
                Toggle ADT Status
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>MAR Medication Admin: <strong className="text-teal-600">Dose Given at 08:00 AM</strong></span>
              <span>Shift Log: <strong className="text-slate-900 font-mono">Handover Signed</strong></span>
            </div>
          </div>
        )}

        {/* LAB VIEW */}
        {role === "lab" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold">
                  PL
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Pathology LIS Analyzer Bridge</div>
                  <div className="text-xs text-slate-500">Sample Barcode #LAB-90412</div>
                </div>
              </div>
              <span className="text-xs px-3 py-1 bg-purple-50 text-purple-600 rounded-full font-bold border border-purple-200">LIS Accession</span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs text-slate-500">CBC Machine Result Staging</div>
                <div className="text-base font-bold text-purple-700">Hemoglobin: 14.2 g/dL (Normal)</div>
              </div>
              <button
                onClick={() => setLabStatus(labStatus === "Pending Validation" ? "Verified & Dispatched" : "Pending Validation")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition shadow"
              >
                {labStatus === "Pending Validation" ? "Pathologist Approve" : "Reset Verification"}
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Report Status: <strong className="text-emerald-600">{labStatus}</strong></span>
              <span>Machine Interfacing: <strong className="text-purple-600">Sysmex Auto-Captured</strong></span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
