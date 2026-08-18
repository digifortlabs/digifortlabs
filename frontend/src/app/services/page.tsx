"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SpecialtyTabs from "@/components/SpecialtyTabs";
import { 
  Users, Building2, BedDouble, Pill, Receipt, Stethoscope, 
  Syringe, FileSpreadsheet, BarChart3, ShieldCheck, UserCheck, 
  Zap, CheckCircle2, ArrowRight, HeartPulse, Dna, Activity
} from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 font-sans selection:bg-blue-500/30 flex flex-col overflow-x-hidden">
      <Navbar />

      {/* 🚀 Hero Section with Background Healthcare Graphics */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-white border-b border-slate-200">
        
        {/* Background Cyber Grid & Medical Patterns */}
        <div className="absolute inset-0 z-0 bg-cyber-grid opacity-30 pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-medical-crosses opacity-20 pointer-events-none" />

        {/* Ambient Glows */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Animated ECG Pulse Wave SVG */}
        <div className="absolute top-1/2 left-0 w-full z-0 pointer-events-none opacity-20 transform -translate-y-1/2 overflow-hidden">
          <svg className="w-full h-32 text-indigo-400" viewBox="0 0 1200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 60 H400 L415 30 L430 90 L445 10 L460 110 L475 45 L490 75 L505 60 H1200"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-ecg"
            />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full mb-8">
            <HeartPulse className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Comprehensive HMS Ecosystem</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            Specialties & 11 Integrated <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">
              Healthcare Clinical Modules
            </span>
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            Detailed clinical specifications engineered directly from Digifort's Functional Requirement Specification (FRS) blueprint for clinics, multi-specialty hospitals, and healthcare networks.
          </p>

          <div className="pt-6">
            <Link
              href="/modules"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition"
            >
              Explore 11 FRS Blueprint Explorer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 🏥 Turnkey New Hospital Setup & Legal Accreditation Services */}
      <section className="py-16 bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="p-8 md:p-12 bg-white border-2 border-slate-200 text-slate-900 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-blue-200">
                <Building2 className="w-4 h-4 text-blue-600" /> Turnkey Hospital Consultancy
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Complete New Hospital Setup & Regulatory Licensing</h2>
              <p className="text-slate-600 text-sm md:text-base max-w-3xl leading-relaxed mb-8">
                We go beyond software. Digifort Labs provides end-to-end consultancy for establishing brand-new hospitals, nursing homes, and diagnostic centers—handling legal compliance, regulatory certificates, medical equipment procurement, and HMS deployment.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-300 transition">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold mb-4">1</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Legal & Regulatory Verification</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Assistance with Clinical Establishment Act registration, Fire NOC, Pollution Control Board (PPCB/GPCB) biomedical waste authorization, and AERB X-ray machine clearance.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-teal-300 transition">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 font-bold mb-4">2</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Medical Equipment & Machinery</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Vendor selection and calibration setup for ICU monitors, ventilator racks, lab analyzer machines, dental chairs, and DICOM RVG X-ray units.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-purple-300 transition">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold mb-4">3</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Turnkey HMS & Staff Training</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Complete setup of cloud/on-premise server, lobby Smart TV token displays, barcode printers, doctor EMR templates, and multi-lingual staff training.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link href="/contact" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center gap-2">
                  Consult With Hospital Setup Experts <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏥 Specialty Filter Tabs Section */}
      <section className="py-16 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <SpecialtyTabs />
        </div>
      </section>

      {/* 🔄 End-to-End Clinical Flow Diagram */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-full border border-blue-200 inline-block mb-3">Clinical Workflow</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Seamless End-to-End Data Pipeline</h2>
            <p className="text-slate-500 text-xs mt-1">Data flows smoothly between reception, doctor EMR, pharmacy, laboratory, and billing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-white border border-slate-200 shadow-xs rounded-2xl text-center relative group hover:border-blue-300 transition">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-2.5 font-bold text-xs">1</div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">Intake & UHID</h3>
              <p className="text-[11px] text-slate-500 leading-snug">QR check-in & lobby Smart TV queue token.</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 shadow-xs rounded-2xl text-center relative group hover:border-indigo-300 transition">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto mb-2.5 font-bold text-xs">2</div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">Doctor EMR</h3>
              <p className="text-[11px] text-slate-500 leading-snug">Vitals, diagnosis & WhatsApp E-Rx dispatch.</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 shadow-xs rounded-2xl text-center relative group hover:border-purple-300 transition">
              <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mx-auto mb-2.5 font-bold text-xs">3</div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">Lab Diagnostics</h3>
              <p className="text-[11px] text-slate-500 leading-snug">Barcode sample tagging & lab machine integration.</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 shadow-xs rounded-2xl text-center relative group hover:border-teal-300 transition">
              <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mx-auto mb-2.5 font-bold text-xs">4</div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">Pharmacy Dispensing</h3>
              <p className="text-[11px] text-slate-500 leading-snug">Smart drug expiry batching & POS billing.</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 shadow-xs rounded-2xl text-center relative group hover:border-amber-300 transition">
              <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto mb-2.5 font-bold text-xs">5</div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">IPD & OT Suite</h3>
              <p className="text-[11px] text-slate-500 leading-snug">ICU bed grid, PAC checklist & surgery schedule.</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 shadow-xs rounded-2xl text-center relative group hover:border-emerald-300 transition">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-2.5 font-bold text-xs">6</div>
              <h3 className="text-xs font-bold text-slate-900 mb-1">Insurance & Billing</h3>
              <p className="text-[11px] text-slate-500 leading-snug">Cashless claims, final folio & auto analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 📚 11 FRS Modules Detailed Breakdown Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20 space-y-16">

        {/* Ch 1 & Ch 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ch 1 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-indigo-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 text-indigo-600">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Chapter 1</span>
                  <h2 className="text-2xl font-bold text-slate-900">Patient Management & OPD</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Centralizes patient intake, appointment scheduling, and outpatient workflows. Generates unique health identifiers (UHID) and connects queue management to lobby Smart TV displays and local WhatsApp message delivery.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Unique UHID lookup & registration</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Walk-in QR Code Self-Registration & ticket printing</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Real-time Doctor Queue & Smart TV lobby display</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Local WhatsApp protocol for OPD e-prescriptions</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View FRS Chapter 01 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Ch 2 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-blue-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 text-blue-600">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Chapter 2</span>
                  <h2 className="text-2xl font-bold text-slate-900">Hospital Group & Multi-Branch Management</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Provides strict multi-branch data isolation, facility classification, dynamic feature toggles, and custom web portals for hospital networks and standalone centers.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Branch isolation & secure access controls</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Modular subscription toggles & module access</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Automated medical record storage metering</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-600" /> Platform invoicing & facility management</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View FRS Chapter 02 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Ch 3 & Ch 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ch 3 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-emerald-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 text-emerald-600">
                  <BedDouble className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Chapter 3</span>
                  <h2 className="text-2xl font-bold text-slate-900">Inpatient (IPD) Operations</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Manages admissions, bed transfers, bed inventory, nursing care plans, and discharge summaries across General Wards, Semi-Private, Deluxe, and Intensive Care Units (ICU).
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Visual bed grid matrix with real-time occupancy</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hourly vitals logging & digital medication administration</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automated bed charge accrual engine</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Digital discharge summaries with diagnosis coding</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View FRS Chapter 03 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Ch 4 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-teal-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100 text-teal-600">
                  <Pill className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Chapter 4</span>
                  <h2 className="text-2xl font-bold text-slate-900">Pharmacy, Inventory & Supply Chain</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Automates drug stock management, supplier purchasing, batch tracking, and retail/IPD drug dispensing using smart expiry rules.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Smart drug expiry batch selection engine</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Counter barcode billing with automated GST calculation</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Supplier Purchase Orders (PO) & GRN receipting</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Low-stock & near-expiry automated alert triggers</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              View FRS Chapter 04 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Ch 5 & Ch 6 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ch 5 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-amber-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 text-amber-600">
                  <Receipt className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Chapter 5</span>
                  <h2 className="text-2xl font-bold text-slate-900">Financial Accounting & Billing</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Patient billing, advance deposit ledger, insurance package rates, and cashless pre-authorization claim tracking.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Unified OPD & IPD Final Invoice Generation</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Health Insurance Pre-Authorization Tracker</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Standardized Insurance Package Rate Cards</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-amber-600" /> Refunds, Advance Deposits & Cashier Shift Settlement</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              View FRS Chapter 05 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Ch 6 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-purple-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100 text-purple-600">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Chapter 6</span>
                  <h2 className="text-2xl font-bold text-slate-900">Laboratory Diagnostics & Radiology</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Barcode sample accessioning, automated lab machine interfacing, pathologist result verification, and instant PDF reports.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Sample Barcode Tagging & Accessioning Workflow</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Bi-Directional Lab Machine Analyzer Interfacing</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Two-Stage Pathologist Verification & Digital Signature</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Instant WhatsApp & SMS Lab Report PDF Dispatch</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
              View FRS Chapter 06 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Ch 7 & Ch 8 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ch 7 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-rose-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100 text-rose-600">
                  <Syringe className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Chapter 7</span>
                  <h2 className="text-2xl font-bold text-slate-900">Surgery & Operation Theatre (OT)</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                OT calendar scheduling, Pre-Anesthesia Clearance (PAC) digital checklists, surgical team fee splits, and implant inventory tracking.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-rose-600" /> Interactive OT Calendar & Theatre Room Allocation</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-rose-600" /> Digital Pre-Anesthesia Clearance (PAC) Checklist</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-rose-600" /> Surgeon, Anesthetist & OT Nurse Fee Split Engine</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-rose-600" /> Surgical Implant Serial Number Tracking</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
              View FRS Chapter 07 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Ch 8 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-orange-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100 text-orange-600">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Chapter 8</span>
                  <h2 className="text-2xl font-bold text-slate-900">Medical Records (MRD) & Telemedicine</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                ICD-10/11 diagnostic indexing, barcoded physical paper vault chain-of-custody, soft-delete bin, and integrated video tele-consultations.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-orange-600" /> ICD-10 & ICD-11 Diagnostic Code Indexing</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-orange-600" /> Barcoded Physical Paper Rack & Box Tracking</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-orange-600" /> 7-Year Retention Soft-Delete Bin & Vault</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-orange-600" /> Integrated Tele-Consultation Video Portal & E-Rx</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
              View FRS Chapter 08 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Ch 9 & Ch 10 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ch 9 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-pink-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-pink-50 rounded-xl flex items-center justify-center border border-pink-100 text-pink-600">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">Chapter 9</span>
                  <h2 className="text-2xl font-bold text-slate-900">Analytics & Business Intelligence</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Executive dashboards for Average Length of Stay (ALOS), Bed Occupancy Rate (BOR), departmental revenue analytics, and one-click PDF/CSV exports.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-pink-600" /> Average Length of Stay (ALOS) Trend Analytics</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-pink-600" /> Bed Occupancy Rate (BOR) Real-time Monitor</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-pink-600" /> Departmental Revenue & OPD Footfall Analytics</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-pink-600" /> CSV, Excel & PDF Automated Report Exports</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1">
              View FRS Chapter 09 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Ch 10 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-fuchsia-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-fuchsia-50 rounded-xl flex items-center justify-center border border-fuchsia-100 text-fuchsia-600">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-fuchsia-600 uppercase tracking-wider">Chapter 10</span>
                  <h2 className="text-2xl font-bold text-slate-900">Configuration & Master Data</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Master tariff lists, doctor OPD schedules, system parameter settings, and comprehensive security audit logging.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-fuchsia-600" /> Master Tariff & Charge Catalogue Management</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-fuchsia-600" /> Doctor Consultation Duty Schedules & Leave Roster</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-fuchsia-600" /> System Audit Trail & Security Logs</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-fuchsia-600" /> Patient Data Privacy Policy & Legal Document Controls</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1">
              View FRS Chapter 10 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Ch 11 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ch 11 */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 hover:border-violet-300 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-violet-50 rounded-xl flex items-center justify-center border border-violet-100 text-violet-600">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Chapter 11</span>
                  <h2 className="text-2xl font-bold text-slate-900">Human Resources & Staff Onboarding</h2>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Staff profiles, biometric/RFID attendance tracking, salary structure configurations, and automated staff onboarding workflows.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 mb-6">
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-violet-600" /> Staff Profile & Document Repository Management</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-violet-600" /> RFID / Biometric Attendance Logging & Shift Mapping</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-violet-600" /> Salary Pay Slip Generation & Allowance Calculations</li>
                <li className="flex items-center gap-2.5"><CheckCircle2 className="w-4 h-4 text-violet-600" /> Staff Onboarding & Credentials Clearance Workflow</li>
              </ul>
            </div>
            <Link href="/modules" className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
              View FRS Chapter 11 Specs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
