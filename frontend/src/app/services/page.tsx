import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Server, Scan, ShieldCheck, Database, Zap, FileJson, Search, BrainCircuit, FileText } from "lucide-react";

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
                        <span className="text-sm font-medium text-blue-300">All-In-One Data Processing</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                        Powering Multi-Industry <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Digital Transformation</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        A highly flexible, modular SaaS platform empowering organizations to securely digitize, manage, and extract value from their documents using cutting-edge AI.
                    </p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 py-20 space-y-24">

                {/* 1. Hybrid Storage Management */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-slate-900 rounded-xl p-8 md:p-12 border border-slate-800">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                    <Database className="w-8 h-8 text-blue-400" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-4">Digital and Physical Data File Management</h2>
                                <p className="text-slate-400 text-lg mb-8 max-w-3xl">
                                    A unified view of your entire organization's assets. Seamlessly manage physical warehouse boxes alongside secure cloud-based digital files in one unified interface.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition">
                                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-blue-400" /> Secure Cloud Integration
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            Enterprise-grade integration with AWS S3 provides highly durable and scalable storage for all your digitized assets.
                                        </p>
                                    </div>
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition">
                                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                            <Scan className="w-4 h-4 text-blue-400" /> Physical Asset Tracking
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            Track exact physical locations, manage box check-in/out status, and maintain a rigorous chain-of-custody for hardcopies.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Smart OCR & AI Search */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-slate-900 rounded-xl p-8 md:p-12 border border-slate-800">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                                    <BrainCircuit className="w-8 h-8 text-purple-400" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-4">Smart OCR & AI Search</h2>
                                <p className="text-slate-400 text-lg mb-8 max-w-3xl">
                                    Transform "dead" PDF archives into searchable, actionable knowledge bases. Our advanced AI integration extracts critical data on ingestion.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition">
                                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                            <Search className="w-4 h-4 text-purple-400" /> Deep Full-Text Search
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            Instantly query across millions of digitized documents. Find specific clauses, terms, or diagnoses instantly within scanned PDFs.
                                        </p>
                                    </div>
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 hover:border-purple-500/30 transition">
                                        <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-purple-400" /> Automated Data Extraction
                                        </h3>
                                        <p className="text-slate-500 text-sm">
                                            Powered by Google Gemini models to automatically interpret complex documents, extract specialized metadata, and generate summaries.
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
