"use client";
import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ROICalculator from "@/components/ROICalculator";
import { CheckCircle2, Server, Cloud, ShieldCheck, Zap, ArrowRight, Building, ChevronDown, HelpCircle, Award } from "lucide-react";

export default function Pricing() {
    const [isAws, setIsAws] = useState(true);
    const [isAnnual, setIsAnnual] = useState(true);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    return (
        <main className="min-h-screen bg-slate-50 text-slate-600 font-sans selection:bg-blue-500/30">
            <Navbar />

            {/* Pricing Header */}
            <section className="pt-32 pb-12 bg-white border-b border-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40 bg-grid-slate-100 pointer-events-none" />
                
                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200 mb-4">
                        <Zap className="w-3.5 h-3.5" /> Customized for Vapi, Valsad & South Gujarat Healthcare Networks
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                        Hospital Plans & ROI Calculator
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
                        Choose the modular plan that fits your facility, or estimate your financial savings below.
                    </p>

                    {/* Deployment & Billing Cycle Toggles */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div className="inline-flex items-center p-1.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                            <button 
                                onClick={() => setIsAws(true)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${isAws ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
                            >
                                <Cloud className="w-4 h-4" />
                                Cloud Hospital Software
                            </button>
                            <button 
                                onClick={() => setIsAws(false)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${!isAws ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}
                            >
                                <Server className="w-4 h-4" />
                                Local On-Premise Server
                            </button>
                        </div>

                        {/* Annual Discount Toggle */}
                        {isAws && (
                            <div className="inline-flex items-center p-1.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                                <button 
                                    onClick={() => setIsAnnual(false)}
                                    className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${!isAnnual ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Monthly
                                </button>
                                <button 
                                    onClick={() => setIsAnnual(true)}
                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${isAnnual ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Annual <span className="text-[10px] bg-emerald-800 text-emerald-100 px-1.5 py-0.5 rounded-md uppercase">Save 17%</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Pricing Cards Section */}
            <section className="py-16 bg-white relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-blue-100/50 rounded-full blur-[120px] pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    
                    {isAws ? (
                        /* AWS Cloud Pricing */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch">
                            {/* Clinic */}
                            <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Clinic & Polyclinic</h3>
                                    <div className="mb-2 flex items-end gap-1">
                                        <span className="text-3xl font-extrabold text-slate-900">
                                            {isAnnual ? "₹2,499" : "₹2,999"}
                                        </span>
                                        <span className="text-slate-500 font-medium pb-1">/mo</span>
                                    </div>
                                    <div className="text-[11px] text-emerald-600 font-bold mb-4">
                                        {isAnnual ? "Billed annually (₹29,988/yr)" : "Billed monthly"}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-6 pb-6 border-b border-slate-100">Perfect for single doctors & small OPD clinics in Vapi/Valsad.</p>
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Zero Beds (OPD Consultation)
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Digital E-Prescriptions & Vitals
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Pharmacy Billing & Expiry Tracking
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Local WhatsApp E-Rx Dispatch
                                        </li>
                                    </ul>
                                </div>
                                <Link href="/contact" className="block w-full py-3 border border-slate-300 text-slate-700 font-bold text-center rounded-xl hover:bg-slate-50 transition">Get Started</Link>
                            </div>

                            {/* Starter */}
                            <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Starter Hospital</h3>
                                    <div className="mb-2 flex items-end gap-1">
                                        <span className="text-3xl font-extrabold text-slate-900">
                                            {isAnnual ? "₹4,999" : "₹6,000"}
                                        </span>
                                        <span className="text-slate-500 font-medium pb-1">/mo</span>
                                    </div>
                                    <div className="text-[11px] text-emerald-600 font-bold mb-4">
                                        {isAnnual ? "Billed annually (₹59,988/yr)" : "Billed monthly"}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-6 pb-6 border-b border-slate-100">For small nursing homes & care centers (10–50 beds).</p>
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Up to 50 IPD Beds
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Admission & Nursing Vitals
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> Unified Billing Folio
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" /> WhatsApp E-Prescription & Alerts
                                        </li>
                                    </ul>
                                </div>
                                <Link href="/contact" className="block w-full py-3 border border-slate-300 text-slate-700 font-bold text-center rounded-xl hover:bg-slate-50 transition">Get Started</Link>
                            </div>

                            {/* Standard */}
                            <div className="p-8 rounded-3xl bg-blue-50 border border-blue-200 relative transform xl:scale-105 z-10 shadow-xl shadow-blue-100 flex flex-col justify-between">
                                <div>
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-md">RECOMMENDED</div>
                                    <h3 className="text-xl font-bold text-blue-900 mb-2">Standard Hospital</h3>
                                    <div className="mb-2 flex items-end gap-1">
                                        <span className="text-4xl font-black text-blue-900">
                                            {isAnnual ? "₹12,499" : "₹15,000"}
                                        </span>
                                        <span className="text-blue-700 font-medium pb-1">/mo</span>
                                    </div>
                                    <div className="text-[11px] text-blue-700 font-bold mb-4">
                                        {isAnnual ? "Billed annually (₹1,49,988/yr)" : "Billed monthly"}
                                    </div>
                                    <p className="text-xs text-blue-800/80 mb-6 pb-6 border-b border-blue-200/60">For mid-sized hospitals upgrading from legacy software.</p>
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-center text-blue-900 font-medium text-sm">
                                            <CheckCircle2 className="w-5 h-5 text-blue-600 mr-3 shrink-0" /> Up to 100 IPD Beds
                                        </li>
                                        <li className="flex items-center text-blue-800 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-blue-500 mr-3 shrink-0" /> Advanced EMR & Nursing MAR
                                        </li>
                                        <li className="flex items-center text-blue-800 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-blue-500 mr-3 shrink-0" /> Health Insurance Pre-Auth Desk
                                        </li>
                                        <li className="flex items-center text-blue-800 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-blue-500 mr-3 shrink-0" /> Operation Theatre (OT) & PAC
                                        </li>
                                    </ul>
                                </div>
                                <Link href="/contact" className="block w-full py-4 bg-blue-600 text-white font-bold text-center rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200">Choose Standard</Link>
                            </div>

                            {/* Professional */}
                            <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Specialty</h3>
                                    <div className="mb-2 flex items-end gap-1">
                                        <span className="text-3xl font-extrabold text-slate-900">
                                            {isAnnual ? "₹29,999" : "₹35,000"}
                                        </span>
                                        <span className="text-slate-500 font-medium pb-1">/mo</span>
                                    </div>
                                    <div className="text-[11px] text-emerald-600 font-bold mb-4">
                                        {isAnnual ? "Billed annually (₹3,59,988/yr)" : "Billed monthly"}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-6 pb-6 border-b border-slate-100">For large institutions & multi-branch hospital chains.</p>
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-purple-600 mr-3 shrink-0" /> Up to 200 Beds & Multi-Branch
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-purple-600 mr-3 shrink-0" /> Bi-Directional Lab Analyzer APIs
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-purple-600 mr-3 shrink-0" /> Telemedicine & Executive BI
                                        </li>
                                    </ul>
                                </div>
                                <Link href="/contact" className="block w-full py-3 border border-slate-300 text-slate-700 font-bold text-center rounded-xl hover:bg-slate-50 transition">Choose Professional</Link>
                            </div>

                            {/* Custom Enterprise */}
                            <div className="p-6 rounded-3xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Custom Plan</h3>
                                    <div className="mb-2 flex items-end gap-1">
                                        <span className="text-3xl font-extrabold text-indigo-900">Custom</span>
                                        <span className="text-indigo-600 font-medium pb-1">Quote</span>
                                    </div>
                                    <div className="text-[11px] text-indigo-700 font-bold mb-4">
                                        Tailored module selection
                                    </div>
                                    <p className="text-xs text-slate-500 mb-6 pb-6 border-b border-indigo-100">Pick specific modules & custom bed capacities for your exact setup.</p>
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-3 shrink-0" /> Pay only for selected FRS modules
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-3 shrink-0" /> Flexible Bed & User limits
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-3 shrink-0" /> Dedicated Account Manager & SLA
                                        </li>
                                        <li className="flex items-center text-slate-700 text-sm">
                                            <CheckCircle2 className="w-4 h-4 text-indigo-600 mr-3 shrink-0" /> Custom Third-Party API Integrations
                                        </li>
                                    </ul>
                                </div>
                                <Link href="/contact" className="block w-full py-3 bg-indigo-600 text-white font-bold text-center rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-200">Request Custom Quote</Link>
                            </div>
                        </div>
                    ) : (
                        /* On-Premise Pricing */
                        <div className="max-w-5xl mx-auto">
                            <div className="bg-white border-2 border-teal-200 rounded-3xl p-8 md:p-12 shadow-2xl shadow-teal-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />
                                
                                <div className="flex flex-col lg:flex-row gap-10 relative z-10">
                                    <div className="flex-1 space-y-6">
                                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-200">
                                            <Server className="w-4 h-4 text-teal-600" /> Enterprise On-Premise Suite
                                        </div>
                                        <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Local Hospital Server Deployment</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            Engineered for multi-specialty hospitals demanding 100% data sovereignty, military-grade internal security, and zero internet dependency. The entire Digifort platform runs natively on local rack servers installed on your hospital premises.
                                        </p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                                <Building className="w-6 h-6 text-emerald-600 mb-2" />
                                                <div className="font-bold text-slate-900 text-sm">One-Time Server Setup</div>
                                                <div className="text-xs text-slate-500 mt-1">Custom quote based on server hardware specs & hospital bed count.</div>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                                <ShieldCheck className="w-6 h-6 text-blue-600 mb-2" />
                                                <div className="font-bold text-slate-900 text-sm">Standard 20% Annual AMC</div>
                                                <div className="text-xs text-slate-500 mt-1">Covers 24/7 technical support, database health monitoring & updates.</div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-lg shadow-teal-200">
                                                Contact Sales For Custom Quote <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="lg:w-80 lg:border-l border-slate-200 lg:pl-10 flex flex-col justify-center space-y-6">
                                        <h4 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">On-Premise Benefits</h4>
                                        <ul className="space-y-5">
                                            <li className="flex gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5"><Zap className="w-4 h-4 text-teal-600" /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">Zero Internet Dependency</div>
                                                    <div className="text-xs text-slate-500 mt-1">Core hospital operations (OPD, IPD, Billing) run at LAN speed even during external internet outages.</div>
                                                </div>
                                            </li>
                                            <li className="flex gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5"><ShieldCheck className="w-4 h-4 text-teal-600" /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">Data Sovereignty</div>
                                                    <div className="text-xs text-slate-500 mt-1">Absolute control over patient PHI. Data never leaves your physical premises without authorization.</div>
                                                </div>
                                            </li>
                                            <li className="flex gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 mt-0.5"><Server className="w-4 h-4 text-teal-600" /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">Turnkey Hardware</div>
                                                    <div className="text-xs text-slate-500 mt-1">We procure, install, and network the heavy-duty rack servers required to power your hospital.</div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="py-20 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Compare Features</h2>
                        <p className="text-slate-600">Deep dive into clinical modules and specifications.</p>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200">
                                    <th className="py-6 px-6 text-slate-600 font-medium w-1/5">Modules & Features</th>
                                    <th className="py-6 px-3 text-slate-900 font-bold text-base">Clinic</th>
                                    <th className="py-6 px-3 text-slate-900 font-bold text-base">Starter</th>
                                    <th className="py-6 px-3 text-blue-700 font-bold text-base">Standard</th>
                                    <th className="py-6 px-3 text-slate-900 font-bold text-base">Multi-Specialty</th>
                                    <th className="py-6 px-3 text-indigo-700 font-bold text-base">Custom Plan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {/* Core */}
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Bed Capacity</td>
                                    <td className="py-4 px-3 text-slate-500">0 (OPD Only)</td>
                                    <td className="py-4 px-3">Up to 50</td>
                                    <td className="py-4 px-3 text-blue-600 font-bold">Up to 100</td>
                                    <td className="py-4 px-3">Up to 200</td>
                                    <td className="py-4 px-3 text-indigo-600 font-bold">Custom Limit</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Patient Registration & EMR</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Pharmacy Billing & Expiry Tracking</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>
                                
                                 <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">WhatsApp Local Protocol E-Rx Dispatch</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Lobby Smart TV Token Callout</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>

                                {/* Advanced Modules */}
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Inpatient (IPD) Bed Matrix & ADT</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Maternity ANC & EDD Calculator</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Dental 32-Tooth Odontogram & RVG</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Health Insurance Pre-Auth & TPA Desk</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Operation Theatre (OT) & PAC Checklist</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Lab Analyzer Machine Integration API</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="py-4 px-6 font-medium text-slate-900">Telemedicine & Executive BI Analytics</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-slate-400">—</td>
                                    <td className="py-4 px-3 text-emerald-600 font-medium">Included</td>
                                    <td className="py-4 px-3 text-indigo-600 font-medium">Configurable</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* 🛡️ Trust Assurance Banner */}
            <section className="py-12 bg-blue-600 text-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500 rounded-full text-xs font-bold uppercase tracking-wider text-blue-100 border border-blue-400/30">
                            <Award className="w-4 h-4 text-amber-300" /> Trusted Healthcare Software
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black">Zero Hidden Migration Costs</h3>
                        <p className="text-blue-100 text-sm max-w-xl">
                            All cloud subscription plans include free legacy paper & Excel data migration, complete staff training in Gujarati/Hindi/English, and 24/7 dedicated support.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link href="/contact" className="px-6 py-3.5 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition">
                            Talk To Local Sales Team
                        </Link>
                        <Link href="/demo" className="px-6 py-3.5 bg-blue-700 text-white font-bold rounded-xl border border-blue-500 hover:bg-blue-800 transition">
                            Schedule Live Hospital Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* ❓ Interactive FAQ Section */}
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                            <HelpCircle className="w-4 h-4 text-blue-600" /> Frequently Asked Questions
                        </div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Hospital Pricing & Deployment FAQs</h2>
                        <p className="text-slate-500 text-sm mt-2">Everything you need to know about setting up Digifort HMS in your facility.</p>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "Can we upgrade our bed tier or add new modules as our hospital grows?",
                                a: "Yes! Digifort HMS is built on a modular SaaS architecture. You can instantly upgrade your bed capacity (e.g. from Starter 50-bed to Standard 100-bed) or toggle specialized modules (like OTPAC or LIS machine integration) anytime from your Hospital Group Admin portal."
                            },
                            {
                                q: "How does the WhatsApp Local E-Prescription dispatch work for patients?",
                                a: "Doctors can click 'Send WhatsApp E-Rx' immediately upon completing an OPD consultation. Digifort dispatches a formatted PDF prescription directly to the patient's WhatsApp phone number without requiring them to install any separate mobile app."
                            },
                            {
                                q: "Is there any additional charge for initial staff training or legacy data migration?",
                                a: "No. Initial data onboarding (importing doctor tariffs, patient registers, pharmacy stock lists) and staff training sessions (available in Gujarati, Hindi, and English) are completely included in all annual subscription packages."
                            },
                            {
                                q: "What hardware is required for On-Premise Local Server setup?",
                                a: "For local server deployment, Digifort provides a turnkey hardware specification guide. We install a localized Linux rack server inside your hospital network equipped with automated daily encrypted backups."
                            },
                            {
                                q: "How are Health Insurance Pre-Authorizations and TPA cashless claims tracked?",
                                a: "Chapter 05 includes dedicated TPA insurance desks using standardized GIPSA rate cards. It tracks initial pre-auth requests, interim approvals, claim settlement folios, and patient co-pay calculations."
                            }
                        ].map((item, idx) => (
                            <div 
                                key={idx} 
                                className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 hover:border-slate-300 transition"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full p-6 text-left font-bold text-slate-900 flex justify-between items-center gap-4 hover:bg-slate-50 transition"
                                >
                                    <span className="text-base">{item.q}</span>
                                    <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-300 ${openFaq === idx ? "rotate-180 text-blue-600" : ""}`} />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4 bg-white">
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
