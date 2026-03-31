import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, FileText, Eye } from "lucide-react";

export default function Legal() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-slate-900 border-b border-slate-800">
                <div className="absolute inset-0 z-0 opacity-10 bg-grid-white pointer-events-none" />
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-full mb-8 backdrop-blur-sm">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">Compliance & Security</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
                        Privacy Policy & <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Legal Compliance</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        At Digifort Labs, protection isn't just a feature—it's our foundation. We adhere to the strictest global and local standards to safeguard your medical archives.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6">

                    {/* DPDP Act 2023 */}
                    <div className="mb-16">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                                <FileText className="w-6 h-6 text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Digital Personal Data Protection (DPDP) Act, 2023</h2>
                        </div>
                        <div className="pl-0 md:pl-16 space-y-4 text-slate-400 leading-relaxed">
                            <p>
                                Digifort Labs is fully compliant with the DPDP Act 2023. We act as a <strong>Data Fiduciary</strong> for our direct clients and a <strong>Data Processor</strong> for the hospitals we serve.
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-400 marker:text-blue-500">
                                <li><strong>Consent:</strong> We process personal data only for lawful purposes with explicit consent.</li>
                                <li><strong>Data Minimization:</strong> We collect only the data necessary for archival and retrieval services.</li>
                                <li><strong>Rights of Data Principals:</strong> Patients and hospitals retain the right to access, correct, and erase their data.</li>
                                <li><strong>Grievance Redressal:</strong> Our dedicated Data Protection Officer (DPO) handles all compliance inquiries.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Security Measures */}
                    <div className="mb-16">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                                <Lock className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Security Infrastructure</h2>
                        </div>
                        <div className="pl-0 md:pl-16 space-y-4 text-slate-400 leading-relaxed">
                            <p>
                                Our defense-in-depth strategy ensures your data is immune to unauthorized access.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                    <h3 className="text-white font-semibold mb-2">Encryption at Rest</h3>
                                    <p className="text-sm">All files are encrypted using AES-256 before being stored in our S3-compatible vaults.</p>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                                    <h3 className="text-white font-semibold mb-2">Encryption in Transit</h3>
                                    <p className="text-sm">All data transfer occurs over TLS 1.3 encrypted channels.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transparency */}
                    <div className="mb-16">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                <Eye className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Transparency & Audits</h2>
                        </div>
                        <div className="pl-0 md:pl-16 space-y-4 text-slate-400 leading-relaxed">
                            <p>
                                Total visibility is key to trust. Every interaction with a record—whether physical movement or digital access—is logged in our immutable audit ledger.
                            </p>
                            <p>
                                These logs are available to hospital administrators at any time for compliance verification.
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 mt-12 text-center text-slate-500 text-sm">
                        <p>Last Updated: October 26, 2025</p>
                        <p className="mt-2 text-slate-400">
                            For legal inquiries, contact <a href="mailto:legal@digifortlabs.com" className="text-blue-400 hover:text-blue-300">legal@digifortlabs.com</a>
                        </p>
                    </div>

                </div>
            </section>

            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}
