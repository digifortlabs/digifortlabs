import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Flag, Shield, Activity, Users } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col">
            <Navbar />

            {/* Header - Neo-Clean */}
            <section className="relative pt-40 pb-20 overflow-hidden bg-slate-900 border-b border-slate-800">
                <div className="absolute inset-0 z-0 opacity-10 bg-grid-white pointer-events-none" />

                {/* Glows */}
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] opacity-30"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        <span className="text-sm font-medium text-slate-300">Operational Since 2024</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Executive Vision</h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Building the digital backbone for the Indian healthcare sector.
                        We don't just store paper; we engineer trust.
                    </p>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-6 py-20">

                {/* Mission Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start mb-24">
                    <div>
                        <span className="text-blue-400 font-bold uppercase tracking-wider text-sm mb-4 block">Our Mission</span>
                        <h2 className="text-3xl font-bold text-white mb-6">Exceeding Digital Standards</h2>
                        <div className="prose prose-lg text-slate-400">
                            <p className="mb-4">
                                Digifort Labs is an enterprise-grade <strong>Medical Records Department (MRD) ecosystem</strong> designed
                                specifically for India.
                            </p>
                            <p>
                                We provide a seamless hybrid solution that manages massive physical paper archives alongside a
                                secure, digital-first PDF repository. Our platform is built to ensure you don't just meet
                                but exceed the requirements of the <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> and NABH/NABL accreditation.
                            </p>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-slate-900 rounded-2xl p-8 border border-slate-800 h-full">
                            <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-400" /> Infrastructure & Compliance
                            </h3>
                            <ul className="space-y-8">
                                <li>
                                    <div className="text-lg font-bold text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                            <Flag className="w-4 h-4 text-blue-400" />
                                        </div>
                                        100% Indian Data Residency
                                    </div>
                                    <p className="text-slate-500 text-sm mt-2 pl-11">
                                        All resources are provisioned in <strong>AWS Mumbai (ap-south-1)</strong>.
                                        Your data never leaves Indian soil.
                                    </p>
                                </li>
                                <li>
                                    <div className="text-lg font-bold text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                            <Users className="w-4 h-4 text-purple-400" />
                                        </div>
                                        Multi-Tenant Siloing
                                    </div>
                                    <p className="text-slate-500 text-sm mt-2 pl-11">
                                        Strict logical separation using <code>hospital_id</code> (RBAC) ensures complete data isolation.
                                    </p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Competitive Landscape */}
                <div className="mb-24">
                    <h2 className="text-3xl font-bold text-white mb-10 text-center">Why Digifort Labs?</h2>
                    <div className="overflow-hidden bg-slate-900 shadow-xl rounded-2xl border border-slate-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-slate-800">
                                    <th className="p-6 font-bold text-slate-300">Feature</th>
                                    <th className="p-6 font-bold text-slate-500">Legacy / Others</th>
                                    <th className="p-6 font-bold text-blue-400 bg-blue-900/10 border-l border-slate-800">Digifort Labs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-400">
                                <tr className="hover:bg-slate-800/50 transition">
                                    <td className="p-6 font-medium text-slate-300">Primary Focus</td>
                                    <td className="p-6 text-slate-600">General Enterprise Data</td>
                                    <td className="p-6 font-bold text-blue-300 bg-blue-900/10 border-l border-slate-800">Indian Hospital Records</td>
                                </tr>
                                <tr className="hover:bg-slate-800/50 transition">
                                    <td className="p-6 font-medium text-slate-300">Warehouse View</td>
                                    <td className="p-6 text-slate-600">Manual / Excel Lists</td>
                                    <td className="p-6 font-bold text-blue-300 bg-blue-900/10 border-l border-slate-800">Interactive 2D Heat Maps</td>
                                </tr>
                                <tr className="hover:bg-slate-800/50 transition">
                                    <td className="p-6 font-medium text-slate-300">Tech Stack</td>
                                    <td className="p-6 text-slate-600">Legacy / Proprietary</td>
                                    <td className="p-6 font-bold text-blue-300 bg-blue-900/10 border-l border-slate-800">Modern AWS Cloud (SaaS)</td>
                                </tr>
                                <tr className="hover:bg-slate-800/50 transition">
                                    <td className="p-6 font-medium text-slate-300">Compliance</td>
                                    <td className="p-6 text-slate-600">Global Standards</td>
                                    <td className="p-6 font-bold text-blue-300 bg-blue-900/10 border-l border-slate-800">DPDP Act & ABHA Native</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CTA */}
                <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 group">
                    <div className="absolute inset-0 bg-blue-600"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-400/30 blur-3xl rounded-full group-hover:bg-blue-300/40 transition duration-700"></div>

                    <div className="relative p-12 text-center text-white z-10">
                        <Activity className="w-12 h-12 mx-auto mb-6 text-blue-200 animate-bounce" />
                        <h2 className="text-3xl font-bold mb-6">Secure Your Future Today</h2>
                        <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                            Join the platform that is defining the standard for hospital archives in India.
                        </p>
                        <Link href="/contact" className="inline-block px-10 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-slate-100 transition shadow-xl hover:-translate-y-1">
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
