import NextLink from "next/link";
const Link = NextLink as any;
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ComplianceChecklist from "@/components/ComplianceChecklist";
import { Flag, Shield, Activity, Users } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white text-slate-600 font-sans selection:bg-blue-500/30 flex flex-col">
            <Navbar />

            {/* Header - Neo-Clean */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-white border-b border-slate-200 print:hidden">
                <div className="absolute inset-0 z-0 opacity-40 bg-grid-slate-100 pointer-events-none" />

                {/* Glows */}
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-[120px] opacity-70 animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-100/60 rounded-full blur-[120px] opacity-50"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full mb-8 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-sm font-bold text-slate-700">Operational Since 2024</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">Executive Vision</h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Building the digital backbone for the Indian healthcare sector.
                        We don't just store paper; we engineer trust.
                    </p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-6 py-20 print:p-0">

                {/* Mission Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start mb-24 print:hidden">
                    <div>
                        <span className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-4 block">Our Mission</span>
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Exceeding Healthcare Digital Standards</h2>
                        <div className="prose prose-lg text-slate-600">
                            <p className="mb-4">
                                Digifort Labs is a comprehensive, enterprise-grade <strong>Hospital Management System (HMS) & Healthcare IT Ecosystem</strong> designed
                                specifically for modern hospitals, clinics, and multi-facility networks in India.
                            </p>
                            <p>
                                Across 11 integrated clinical and administrative modules—from OPD/IPD operations, Pharmacy Batching, and Diagnostic Test Labs to Insurance Billing and Barcoded Medical Records—our platform ensures full compliance with Indian <strong>Patient Data Protection Standards</strong> and NABH/NABL accreditation.
                            </p>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-blue-300 to-teal-300 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                        <div className="relative bg-white rounded-2xl p-8 border border-slate-200 shadow-xl h-full">
                            <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600" /> Infrastructure & Security
                            </h3>
                            <ul className="space-y-8">
                                <li>
                                    <div className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                                            <Flag className="w-4 h-4 text-blue-600" />
                                        </div>
                                        Indian Data Privacy & Protection
                                    </div>
                                    <p className="text-slate-500 text-sm mt-2 pl-11">
                                        Designed strictly around Indian healthcare data protection mandates and medical record privacy standards.
                                    </p>
                                </li>
                                <li>
                                    <div className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center border border-teal-100">
                                            <Users className="w-4 h-4 text-teal-600" />
                                        </div>
                                        Secure Multi-Branch Isolation
                                    </div>
                                    <p className="text-slate-500 text-sm mt-2 pl-11">
                                        Strict role-based privacy controls ensure each hospital branch's patient records remain isolated and safe.
                                    </p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Compliance Checklist Assessment Section */}
                <div className="mb-24 print:m-0 print:p-0">
                    <ComplianceChecklist />
                </div>

                {/* Competitive Landscape */}
                <div className="mb-24 print:hidden">
                    <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Why Digifort Labs?</h2>
                    <div className="overflow-hidden bg-white shadow-lg rounded-2xl border border-slate-200">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-6 font-bold text-slate-700">Feature</th>
                                    <th className="p-6 font-bold text-slate-500">Legacy / Others</th>
                                    <th className="p-6 font-bold text-blue-700 bg-blue-50/50 border-l border-slate-200">Digifort Labs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-600">
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="p-6 font-medium text-slate-800">Primary Focus</td>
                                    <td className="p-6 text-slate-500">General Enterprise Data</td>
                                    <td className="p-6 font-bold text-blue-700 bg-blue-50/50 border-l border-slate-200">Indian Hospital Records</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="p-6 font-medium text-slate-800">Warehouse View</td>
                                    <td className="p-6 text-slate-500">Manual / Excel Lists</td>
                                    <td className="p-6 font-bold text-blue-700 bg-blue-50/50 border-l border-slate-200">Interactive 2D Heat Maps</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="p-6 font-medium text-slate-800">Tech Stack</td>
                                    <td className="p-6 text-slate-500">Legacy / Proprietary</td>
                                    <td className="p-6 font-bold text-blue-700 bg-blue-50/50 border-l border-slate-200">Modern AWS Cloud (SaaS)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 transition">
                                    <td className="p-6 font-medium text-slate-800">Compliance</td>
                                    <td className="p-6 text-slate-500">Global Standards</td>
                                    <td className="p-6 font-bold text-blue-700 bg-blue-50/50 border-l border-slate-200">DPDP Act & ABHA Native</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CTA */}
                <div className="relative overflow-hidden rounded-3xl border border-blue-200 group print:hidden shadow-lg">
                    <div className="absolute inset-0 bg-blue-600"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-400/50 blur-3xl rounded-full group-hover:bg-blue-300/60 transition duration-700"></div>

                    <div className="relative p-12 text-center text-white z-10">
                        <Activity className="w-12 h-12 mx-auto mb-6 text-blue-100 animate-bounce" />
                        <h2 className="text-3xl font-bold mb-6">Secure Your Future Today</h2>
                        <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                            Join the platform that is defining the standard for hospital management in India.
                        </p>
                        <Link href="/contact" className="inline-block px-10 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-md hover:-translate-y-1">
                            Schedule a Demo
                        </Link>
                    </div>
                </div>

            </div>

            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}
