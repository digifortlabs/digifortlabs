"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RolePreviewSandbox from "@/components/RolePreviewSandbox";
import ROICalculator from "@/components/ROICalculator";
import AiClaimPredictor from "@/components/AiClaimPredictor";
import IotIcuDashboard from "@/components/IotIcuDashboard";
import NextGenModules from "@/components/NextGenModules";
import { 
  Users, Building2, BedDouble, Pill, Receipt, Stethoscope, 
  Syringe, FileSpreadsheet, BarChart3, ShieldCheck, UserCheck, 
  Zap, CheckCircle2, ArrowRight, Activity, Search, Shield, Cpu, Lock, Layers,
  HeartPulse, Dna, FileText, Cross
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-blue-500/30 flex flex-col overflow-x-hidden">
      <Navbar />

      {/* 🚀 Split Hero Section with Live Clinical Status Console */}
      <section className="relative flex items-center pt-28 pb-16 overflow-hidden bg-white border-b border-slate-200">
        
        {/* 1. Animated Ambient Background (Replaced Grid) */}
        <div className="absolute inset-0 z-0 bg-slate-50/30 pointer-events-none" />
        <div className="absolute inset-0 z-0 bg-medical-crosses opacity-10 pointer-events-none" />

        {/* 2. Multi-Layered Soft Animated Orbs (Healthcare Blues/Teals) */}
        <div className="absolute top-[-20%] right-[-10%] w-[650px] h-[650px] bg-blue-100/60 rounded-full blur-[120px] pointer-events-none animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[550px] h-[550px] bg-teal-100/50 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-2000" />
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-emerald-100/40 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-4000" />

        {/* 3. Animated ECG Pulse Wave SVG */}
        <div className="absolute top-1/2 left-0 w-full z-0 pointer-events-none opacity-10 transform -translate-y-1/2 overflow-hidden">
          <svg className="w-full h-32 text-teal-600" viewBox="0 0 1200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        {/* 4. Floating Healthcare Graphic Badges */}
        <div className="absolute top-28 left-[8%] z-0 hidden xl:flex items-center gap-2 px-3 py-2 bg-white/90 border border-slate-200 rounded-2xl backdrop-blur-md shadow-sm animate-float-slow text-xs text-rose-600 font-bold">
          <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" /> Live ECG Vitals
        </div>

        <div className="absolute top-44 right-[5%] z-0 hidden xl:flex items-center gap-2 px-3 py-2 bg-white/90 border border-slate-200 rounded-2xl backdrop-blur-md shadow-sm animate-float-delayed text-xs text-blue-700 font-bold">
          <Dna className="w-4 h-4 text-blue-600" /> ABHA & LIS Genomics
        </div>

        <div className="absolute bottom-16 left-[12%] z-0 hidden xl:flex items-center gap-2 px-3 py-2 bg-white/90 border border-slate-200 rounded-2xl backdrop-blur-md shadow-sm animate-float-slow text-xs text-emerald-700 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> NABH Accredited
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50/80 border border-blue-200 rounded-full text-blue-700 text-xs font-bold uppercase tracking-widest shadow-sm">
              <HeartPulse className="w-4 h-4 text-blue-600 animate-pulse" /> 11 FRS Modules • NABH & Patient Privacy Compliant
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight">
              Hospital Operating System Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">Indian Healthcare</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed font-normal">
              Digifort HMS unifies Outpatient Queueing, Inpatient Ward Admissions, Pharmacy Batching, Barcode Diagnostics, Insurance Billing, and Medical Records in one seamless ecosystem.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/demo"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 flex items-center gap-2 transition hover:scale-105"
              >
                Experience Live Demo <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/modules"
                className="px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 transition"
              >
                <Layers className="w-4 h-4 text-teal-600" /> Explore 11 FRS Modules
              </Link>
            </div>
          </div>

          {/* Right Column: Live Clinical Status Console Mockup */}
          <div className="lg:col-span-5 relative">
            
            {/* Concentric Tech Rings Background Graphic */}
            <div className="absolute -inset-4 rounded-full border border-blue-200/50 animate-ping opacity-40 pointer-events-none" />
            <div className="absolute -inset-8 rounded-full border border-teal-200/30 pointer-events-none" />

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 space-y-4 relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" /> Live Hospital Console
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold animate-pulse">
                  System Active
                </span>
              </div>

              {/* OPD Queue Ticket Status Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">OPD Live Queue</div>
                  <div className="text-lg font-black text-slate-900">Token #A-105</div>
                  <div className="text-xs text-blue-600 font-medium">Room 3 • ENT Dr. Sharma</div>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg border border-blue-200 font-mono font-bold">
                    UHID #84920
                  </span>
                </div>
              </div>

              {/* IPD Ward Occupancy Matrix Preview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">IPD ICU & Ward Bed Grid</span>
                  <span className="text-[10px] text-emerald-600 font-bold">88% Occupancy</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-center text-[10px] font-bold text-rose-600">B-01</div>
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-center text-[10px] font-bold text-rose-600">B-02</div>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-[10px] font-bold text-emerald-700 shadow-sm">B-03 Avail</div>
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-center text-[10px] font-bold text-rose-600">B-04</div>
                </div>
              </div>

              {/* WhatsApp E-Rx Sync Badge */}
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between text-xs text-teal-800">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> WhatsApp E-Rx & Pharmacy Expiry Sync
                </span>
                <span className="font-mono text-[10px] text-teal-700 font-bold">INSTANT</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 🛠️ Interactive Role Preview Sandbox Section */}
      <section className="py-20 bg-slate-50 relative border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <RolePreviewSandbox />
        </div>
      </section>

      {/* 🏥 Turnkey New Hospital Setup & Legal Consultancy Section */}
      <section className="py-20 bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="p-8 md:p-12 bg-white border-2 border-slate-200 text-slate-900 rounded-3xl shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-blue-200">
                <Building2 className="w-4 h-4 text-blue-600" /> Turnkey Hospital Consultancy
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Setting Up A New Hospital or Clinic?</h2>
              <p className="text-slate-600 text-sm md:text-base max-w-3xl leading-relaxed mb-8">
                We go beyond software. Digifort Labs provides complete end-to-end consultancy to build, legally register, equip, and digitize your new hospital from day one.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-300 transition">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold mb-4">1</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Legal & Regulatory Verification</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Clinical Establishment Act registration, Fire NOC, Pollution Control Board (PPCB/GPCB) biomedical waste authorization, and AERB X-ray machine clearance.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-teal-300 transition">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 font-bold mb-4">2</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Medical Equipment & Machinery</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Vendor selection and serial gateway calibration setup for ICU monitors, ventilator racks, lab analyzer machines, dental chairs, and DICOM RVG X-ray units.
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
                <Link href="/services" className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition border border-slate-200">
                  Learn More About Turnkey Services
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📚 11 FRS Modules Matrix Grid */}
      <section className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest px-3 py-1 bg-blue-50 rounded-full border border-blue-200 inline-block mb-3">Complete Platform Blueprint</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">11 Core Hospital Clinical Modules</h2>
            <p className="text-slate-500 text-sm mt-2">Built directly from Digifort's Functional Requirement Specification (FRS) documentation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ch 1 */}
            <Link href="/modules" className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-blue-300 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-blue-500 mb-1">CH 01</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Patient OPD Management</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Unique UHID generation, Smart TV queue token display, walk-in QR self check-in.</p>
            </Link>

            {/* Ch 2 */}
            <Link href="/modules" className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-blue-300 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-blue-500 mb-1">CH 02</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Branch Group Network</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Dedicated hospital web portals, role-based security & centralized branch controls.</p>
            </Link>

            {/* Ch 3 */}
            <Link href="/modules" className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-emerald-300 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition">
                <BedDouble className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-emerald-500 mb-1">CH 03</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">IPD Ward & Nursing Care</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Visual ICU bed grid matrix, patient bed transfers, and digital medication administration logging.</p>
            </Link>

            {/* Ch 4 */}
            <Link href="/modules" className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-teal-300 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4 group-hover:scale-110 transition">
                <Pill className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-teal-500 mb-1">CH 04</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pharmacy & Batch Inventory</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Smart drug expiry batching, counter barcode billing & supplier purchase order management.</p>
            </Link>

            {/* Ch 5 */}
            <Link href="/modules" className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-amber-300 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-amber-500 mb-1">CH 05</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Billing & Health Insurance Desk</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Standard insurance package rates, cashless pre-authorization tracking & deposit ledgers.</p>
            </Link>

            {/* Ch 6 */}
            <Link href="/modules" className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-purple-300 hover:shadow-md transition group">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-purple-500 mb-1">CH 06</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Lab Diagnostics & Radiology</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Barcode sample accessioning, lab machine interfacing & pathologist digital signoff.</p>
            </Link>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/modules"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-300 text-blue-600 font-bold text-sm rounded-xl transition shadow-sm"
            >
              View All 11 FRS Chapters & Specs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 🧠 Next-Gen Features Showcase - Part 1 */}
      <section className="py-20 bg-slate-50 relative overflow-hidden border-t border-slate-200">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-amber-100/50 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 w-full space-y-8">
          <div className="text-center max-w-3xl mx-auto mb-4 relative z-10">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest px-3 py-1 bg-amber-50 rounded-full border border-amber-200 inline-block mb-3">AI Innovation</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Next-Generation Capabilities</h2>
            <p className="text-slate-500 text-sm mt-2">Discover the cutting-edge AI features powering the future of healthcare.</p>
          </div>
          <AiClaimPredictor />
        </div>
      </section>

      {/* 🧠 Next-Gen Features Showcase - Part 2 */}
      <section className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 w-full space-y-8">
          <div className="text-center max-w-3xl mx-auto mb-4 relative z-10">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 inline-block mb-3">IoT Integration</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Live Device Monitoring</h2>
            <p className="text-slate-500 text-sm mt-2">Direct live feeds from medical equipment straight into patient digital records.</p>
          </div>
          <IotIcuDashboard />
        </div>
      </section>

      {/* 🔮 Future Horizons (Next-Gen Modules) */}
      <section className="py-20 bg-white border-y border-slate-200 relative">
        <div className="max-w-7xl mx-auto px-6">
          <NextGenModules />
        </div>
      </section>

      {/* 🧮 Interactive ROI Calculator Section */}
      <section className="py-20 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <ROICalculator />
        </div>
      </section>

      {/* 🛡️ Compliance Badges & Footer */}
      <section className="bg-white border-t border-slate-200 relative">
        <div className="flex-1 flex flex-col justify-center max-w-6xl mx-auto px-6 w-full py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-900">Patient Data Privacy</div>
              <div className="text-xs text-slate-500 mt-1">Full Indian Privacy Compliance</div>
            </div>

            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
              <Lock className="w-8 h-8 text-teal-600 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-900">AES-256 Bit</div>
              <div className="text-xs text-slate-500 mt-1">Bank-Grade Encryption</div>
            </div>

            <div className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
              <Layers className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-900">NABH / NABL</div>
              <div className="text-xs text-slate-500 mt-1">Accreditation Blueprint</div>
            </div>
          </div>
        </div>
        <Footer />
      </section>
    </div>
  );
}
