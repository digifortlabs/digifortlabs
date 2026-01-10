import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Server, Scan, ShieldCheck, Database, Zap, FileJson } from "lucide-react";

export default function ServicesPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-slate-900 border-b border-slate-800">
                <div className="absolute inset-0 z-0 opacity-10 bg-grid-white pointer-events-none" />

                {/* Glow Effects */}
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] opacity-40 animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-full mb-8 backdrop-blur-sm animate-fade-in-up">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">Next-Gen Infrastructure</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                        Core Product <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Architecture</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        A comprehensive, DPDP-compliant suite designed for the future of Indian healthcare.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-20 space-y-24">

                {/* 1. Digital MRD */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-slate-900 rounded-2xl p-8 md:p-12 border border-slate-800">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                    <Database className="w-8 h-8 text-blue-400" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-4">Digital MRD (Cloud Archiving)</h2>
                                <p className="text-slate-400 text-lg mb-8 max-w-3xl">
                                    Our flagship module transforms physical chaos into digital order. Indexed by Hospital UHID and linked to ABHA IDs for seamless interoperability.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition">
                                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                            <FileJson className="w-4 h-4 text-blue-400" /> Patient-Wise Repo
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            Smart folders that organize records by patient interaction rather than just episode dates.
                                        </p>
                                    </div>
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition">
                                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                            <Server className="w-4 h-4 text-blue-400" /> Smart Compression
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            Proprietary engine compresses PDFs by 60% before S3 upload, drastically reducing cloud costs.
                                        </p>
                                    </div>
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition">
                                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-blue-400" /> Secure Viewer
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            Browser-based streaming with dynamic watermarking to prevent data leakage.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. QR & Labeling */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-slate-900 rounded-2xl p-8 md:p-12 border border-slate-800">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                                    <Scan className="w-8 h-8 text-purple-400" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-4">QR & Labeling Engine</h2>
                                <p className="text-slate-400 text-lg mb-8 max-w-3xl">
                                    Bridge the physical-digital divide. Track the exact location of every paper file in your warehouse with millimeter scale precision.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition">
                                        <h3 className="font-bold text-white mb-2">High-Density Thermal Generation</h3>
                                        <p className="text-slate-500 text-sm">
                                            Print industrial-grade QR codes for file spines that survive 10+ years of storage.
                                        </p>
                                    </div>
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition">
                                        <h3 className="font-bold text-white mb-2">Chain-of-Custody</h3>
                                        <p className="text-slate-500 text-sm">
                                            Mandatory "Check-In" and "Check-Out" scans create an immutable audit trail for every physical movement.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}
