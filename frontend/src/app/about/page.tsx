import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            <Navbar />

            {/* Header - Neo-Clean */}
            <div className="pt-40 pb-20 bg-white text-center px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl opacity-60"></div>
                </div>

                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 relative z-10 tracking-tight">Executive Vision</h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto relative z-10 leading-relaxed">
                    Building the digital backbone for the Indian healthcare sector.
                </p>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-16">

                {/* Mission Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start mb-24">
                    <div>
                        <span className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-2 block">Our Mission</span>
                        <h2 className="text-3xl font-bold text-slate-900 mb-6">Exceeding Digital Standards</h2>
                        <div className="prose prose-lg text-slate-600">
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
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold mb-6 text-slate-900">Infrastructure & Compliance</h3>
                        <ul className="space-y-6">
                            <li>
                                <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span className="text-blue-500">🇮🇳</span> 100% Indian Data Residency
                                </p>
                                <p className="text-slate-500 text-sm mt-1">
                                    All resources are provisioned in <strong>AWS Mumbai (ap-south-1)</strong>.
                                    Your data never leaves Indian soil.
                                </p>
                            </li>
                            <li>
                                <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span className="text-blue-500">🔐</span> Multi-Tenant Siloing
                                </p>
                                <p className="text-slate-500 text-sm mt-1">
                                    Strict logical separation using <code>hospital_id</code> ensures complete data isolation.
                                </p>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Competitive Landscape */}
                <div className="mb-24">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Why Digifort Labs?</h2>
                    <div className="overflow-hidden bg-white shadow-lg rounded-2xl border border-slate-200">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="p-6 font-bold">Feature</th>
                                    <th className="p-6 font-bold opacity-70">Legacy / Others</th>
                                    <th className="p-6 font-bold text-blue-400 bg-slate-800">Digifort Labs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-6 font-medium">Primary Focus</td>
                                    <td className="p-6 text-slate-500">General Enterprise Data</td>
                                    <td className="p-6 font-bold text-blue-700 bg-blue-50/30">Indian Hospital Records</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-6 font-medium">Warehouse View</td>
                                    <td className="p-6 text-slate-500">Manual / Excel Lists</td>
                                    <td className="p-6 font-bold text-blue-700 bg-blue-50/30">Interactive 2D Heat Maps</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-6 font-medium">Tech Stack</td>
                                    <td className="p-6 text-slate-500">Legacy / Proprietary</td>
                                    <td className="p-6 font-bold text-blue-700 bg-blue-50/30">Modern AWS Cloud (SaaS)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-6 font-medium">Compliance</td>
                                    <td className="p-6 text-slate-500">Global Standards</td>
                                    <td className="p-6 font-bold text-blue-700 bg-blue-50/30">DPDP Act & ABHA Native</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-blue-600 rounded-2xl p-12 text-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <h2 className="text-3xl font-bold mb-6 relative z-10">Secure Your Future</h2>
                    <p className="text-blue-100 mb-8 max-w-xl mx-auto relative z-10">
                        Join the platform that is defining the standard for hospital archives in India.
                    </p>
                    <Link href="/contact" className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition shadow-lg relative z-10">
                        Schedule a Demo
                    </Link>
                </div>

            </div>

            <Footer />
        </div>
    );
}
