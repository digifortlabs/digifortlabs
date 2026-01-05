import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ServicesPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar />

            {/* Hero */}
            <div className="pt-32 pb-20 bg-slate-900 text-center px-4">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Core Product Modules</h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    A comprehensive suite for the Digital Personal Data Protection era.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-16">

                {/* 3.1 Digital MRD */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 border-l-4 border-blue-500 pl-4">Digital MRD (Cloud Archiving)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-2 text-blue-600">Patient-Wise Repository</h3>
                            <p className="text-slate-600 text-sm">
                                Digital folders indexed by Hospital UHID and linked to ABHA IDs for seamless interoperability.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-2 text-blue-600">Smart Compression</h3>
                            <p className="text-slate-600 text-sm">
                                Integrated Gzip engine compresses PDFs before AWS S3 upload, saving storage costs while maintaining quality.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-2 text-blue-600">Secure Viewer</h3>
                            <p className="text-slate-600 text-sm">
                                Browser-based access with dynamic watermarking to prevent unauthorized screen captures or printing.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3.2 Physical Warehouse */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 border-l-4 border-emerald-500 pl-4">Advanced Physical Warehouse</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-2 text-emerald-600">Interactive Heat Map</h3>
                            <p className="text-slate-600 text-sm">
                                Visual occupancy monitoring with Green/Orange/Red status indicators for instant capacity planning.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-2 text-emerald-600">Rack-Level Analytics</h3>
                            <p className="text-slate-600 text-sm">
                                "Deep-dive" into specific racks to view file lists, available slots, and audit history.
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-2 text-emerald-600">Real-Time Search</h3>
                            <p className="text-slate-600 text-sm">
                                Instant highlighting of exact Aisle and Rack locations for rapid physical file retrieval.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3.3 QR & Labeling */}
                <div className="mb-24">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8 border-l-4 border-purple-500 pl-4">QR & Labeling Engine</h2>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-2 text-purple-600">Thermal Label Generation</h3>
                            <p className="text-slate-600 text-sm">
                                Generate high-density QR codes for every physical folder automatically.
                            </p>
                        </div>
                        <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-lg mb-2 text-purple-600">Handheld Scanner Integration</h3>
                            <p className="text-slate-600 text-sm">
                                Seamless "Check-In" and "Check-Out" workflows to maintain a strict physical chain-of-custody.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 6. Indian Compliance Framework */}
                <div className="bg-slate-900 rounded-3xl p-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
                    <h2 className="text-3xl font-bold mb-8 text-center">Indian Compliance Framework</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-blue-400">DPDP Act 2023</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <span className="mr-3 text-green-400">✓</span>
                                    <div>
                                        <strong className="block text-white">Consent Architecture</strong>
                                        <span className="text-slate-400 text-sm">Built-in capabilities to capture digital consent for data processing.</span>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-3 text-green-400">✓</span>
                                    <div>
                                        <strong className="block text-white">Right to Erasure</strong>
                                        <span className="text-slate-400 text-sm">Automated "Purge Alerts" for records exceeding retention policies (7-10 years).</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-700 pt-8 md:pt-0 md:pl-12">
                            <p className="italic text-slate-300 text-lg mb-6">
                                "The platform is built to ensure hospitals exceed the requirements of the Digital Personal Data Protection (DPDP) Act 2023 and NABH/NABL accreditation."
                            </p>
                            <div className="flex gap-4 opacity-70">
                                <span className="px-3 py-1 border border-slate-500 rounded text-sm">ISO 27001</span>
                                <span className="px-3 py-1 border border-slate-500 rounded text-sm">HIPAA</span>
                                <span className="px-3 py-1 border border-slate-500 rounded text-sm">GDPR Ready</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <Footer />
        </div>
    );
}
