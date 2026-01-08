
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Pricing() {
    return (
        <main className="min-h-screen bg-slate-950">
            <Navbar />

            {/* Pricing Header */}
            <section className="pt-32 pb-12 bg-slate-900 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Choose the plan that fits your hospital's needs. No hidden fees. straightforward scaling.
                    </p>
                </div>
            </section>

            {/* Pricing Cards Section */}
            <section className="py-24 bg-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-center">

                        {/* Starter */}
                        <div className="p-6 rounded-3xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors duration-300">
                            <h3 className="text-lg font-bold text-slate-300 mb-2">Starter</h3>
                            <div className="mb-6">
                                <span className="text-3xl font-extrabold text-white">₹7,999</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center text-slate-400 text-sm">
                                    <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs mr-3 text-blue-400">✓</span> 1 Admin + 1 User
                                </li>
                                <li className="flex items-center text-slate-400 text-sm">
                                    <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs mr-3 text-blue-400">✓</span> 500 Records Storage
                                </li>
                                <li className="flex items-center text-slate-400 text-sm">
                                    <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs mr-3 text-blue-400">✓</span> 5 Years Retention
                                </li>
                            </ul>
                            <Link href="/contact" className="block w-full py-3 border border-slate-700 text-slate-300 font-bold text-center rounded-xl hover:bg-slate-700 transition">
                                Get Started
                            </Link>
                        </div>

                        {/* Standard */}
                        <div className="p-6 rounded-3xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors duration-300">
                            <h3 className="text-lg font-bold text-slate-300 mb-2">Standard</h3>
                            <div className="mb-6">
                                <span className="text-3xl font-extrabold text-white">₹16,999</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center text-slate-400 text-sm">
                                    <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs mr-3 text-blue-400">✓</span> 1 Admin + 5 Users
                                </li>
                                <li className="flex items-center text-slate-400 text-sm">
                                    <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs mr-3 text-blue-400">✓</span> 3,000 Records Storage
                                </li>
                                <li className="flex items-center text-slate-400 text-sm">
                                    <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs mr-3 text-blue-400">✓</span> NABH Compliant Vault
                                </li>
                            </ul>
                            <Link href="/contact" className="block w-full py-3 border border-slate-700 text-slate-300 font-bold text-center rounded-xl hover:bg-slate-700 transition">
                                Choose Standard
                            </Link>
                        </div>

                        {/* Professional - Highlighted */}
                        <div className="p-8 rounded-3xl bg-slate-800 text-white shadow-2xl shadow-blue-900/20 border border-blue-500/30 relative transform xl:scale-105 z-10">
                            <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-2xl shadow-lg">
                                POPULAR
                            </div>
                            <h3 className="text-xl font-bold mb-2">Professional</h3>
                            <div className="mb-8">
                                <span className="text-4xl font-extrabold">₹29,999</span>
                                <span className="text-slate-400">/mo</span>
                            </div>
                            <ul className="space-y-4 mb-10">
                                <li className="flex items-center text-slate-300 text-sm">
                                    <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">✓</span> 1 Admin + 10 Users
                                </li>
                                <li className="flex items-center text-slate-300 text-sm">
                                    <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">✓</span> 6,000 Records Storage
                                </li>
                                <li className="flex items-center text-slate-300 text-sm">
                                    <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">✓</span> Biometric Access Control
                                </li>
                                <li className="flex items-center text-slate-300 text-sm">
                                    <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">✓</span> Warehouse Heat Maps
                                </li>
                            </ul>
                            <Link href="/contact" className="block w-full py-4 bg-blue-600 text-white font-bold text-center rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-900/50">
                                Choose Professional
                            </Link>
                        </div>

                        {/* Enterprise */}
                        <div className="p-6 rounded-3xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors duration-300">
                            <h3 className="text-lg font-bold text-slate-300 mb-2">Enterprise</h3>
                            <div className="mb-6">
                                <span className="text-3xl font-extrabold text-white">Custom</span>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center text-slate-400 text-sm">
                                    <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs mr-3 text-blue-400">✓</span> Unlimited Services
                                </li>
                                <li className="flex items-center text-slate-400 text-sm">
                                    <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs mr-3 text-blue-400">✓</span> Multi-Branch Network
                                </li>
                                <li className="flex items-center text-slate-400 text-sm">
                                    <span className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center text-xs mr-3 text-blue-400">✓</span> Dedicated Manager
                                </li>
                            </ul>
                            <Link href="/contact" className="block w-full py-3 border border-slate-700 text-slate-300 font-bold text-center rounded-xl hover:bg-slate-700 transition">
                                Contact Sales
                            </Link>
                        </div>

                    </div>
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="py-20 bg-slate-900 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Compare Plans</h2>
                        <p className="text-slate-400">Deep dive into features and specifications.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="py-6 px-4 text-slate-400 font-medium w-1/4">Features</th>
                                    <th className="py-6 px-4 text-white font-bold text-lg">Starter</th>
                                    <th className="py-6 px-4 text-blue-400 font-bold text-lg">Standard</th>
                                    <th className="py-6 px-4 text-white font-bold text-lg">Professional</th>
                                    <th className="py-6 px-4 text-white font-bold text-lg">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                                {/* Core */}
                                <tr>
                                    <td className="py-4 px-4 font-medium text-white">Users Included</td>
                                    <td className="py-4 px-4">1 Admin + 1 User</td>
                                    <td className="py-4 px-4 text-blue-300">1 Admin + 5 Users</td>
                                    <td className="py-4 px-4">1 Admin + 10 Users</td>
                                    <td className="py-4 px-4">Unlimited</td>
                                </tr>
                                <tr>
                                    <td className="py-4 px-4 font-medium text-white">Storage Capacity</td>
                                    <td className="py-4 px-4">500 Files</td>
                                    <td className="py-4 px-4 text-blue-300">3,000 Files</td>
                                    <td className="py-4 px-4">6,000 Files</td>
                                    <td className="py-4 px-4">Unlimited</td>
                                </tr>
                                <tr>
                                    <td className="py-4 px-4 font-medium text-white">Retention Period</td>
                                    <td className="py-4 px-4">5 Years</td>
                                    <td className="py-4 px-4 text-blue-300">7 Years</td>
                                    <td className="py-4 px-4">10 Years</td>
                                    <td className="py-4 px-4">Lifetime (MLC)</td>
                                </tr>

                                {/* Allowances */}
                                <tr>
                                    <td className="py-4 px-4 font-medium text-white">Free Physical Pickups</td>
                                    <td className="py-4 px-4">Pay per use</td>
                                    <td className="py-4 px-4 text-blue-300">12 / Year</td>
                                    <td className="py-4 px-4">24 / Year</td>
                                    <td className="py-4 px-4">Weekly</td>
                                </tr>
                                <tr>
                                    <td className="py-4 px-4 font-medium text-white">Free e-Retrievals</td>
                                    <td className="py-4 px-4">Pay per use</td>
                                    <td className="py-4 px-4 text-blue-300">10 / Month</td>
                                    <td className="py-4 px-4">25 / Month</td>
                                    <td className="py-4 px-4">Unlimited</td>
                                </tr>

                                {/* Security */}
                                <tr>
                                    <td className="py-4 px-4 font-medium text-white">Security Specs</td>
                                    <td className="py-4 px-4 text-sm text-slate-500">Standard CCTV</td>
                                    <td className="py-4 px-4 text-blue-300 text-sm">24x7 CCTV, Fire/Flood Proof</td>
                                    <td className="py-4 px-4 text-sm">Biometric Access, Fire/Flood Proof</td>
                                    <td className="py-4 px-4 text-sm">Dedicated Vault</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Additional Costs - Transparency Section */}
            <section className="py-20 bg-slate-950">
                <div className="max-w-4xl mx-auto px-6">
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">Additional Service Rates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex justify-between items-center transitiion hover:border-blue-500/30">
                            <div>
                                <h4 className="text-white font-semibold">Ad-hoc Pickup</h4>
                                <p className="text-slate-400 text-sm">Beyond free limit</p>
                            </div>
                            <span className="text-xl font-bold text-blue-400">₹350 <span className="text-sm font-normal text-slate-500">/visit</span></span>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex justify-between items-center transitiion hover:border-blue-500/30">
                            <div>
                                <h4 className="text-white font-semibold">Additional e-Retrieval</h4>
                                <p className="text-slate-400 text-sm">Digitizing on demand</p>
                            </div>
                            <span className="text-xl font-bold text-blue-400">₹45 <span className="text-sm font-normal text-slate-500">/record</span></span>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex justify-between items-center transitiion hover:border-blue-500/30">
                            <div>
                                <h4 className="text-white font-semibold">Physical Retrieval</h4>
                                <p className="text-slate-400 text-sm">Original copy request</p>
                            </div>
                            <span className="text-xl font-bold text-blue-400">₹150 <span className="text-sm font-normal text-slate-500">+ courier</span></span>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex justify-between items-center transitiion hover:border-blue-500/30">
                            <div>
                                <h4 className="text-white font-semibold">New Storage Box</h4>
                                <p className="text-slate-400 text-sm">Standard Archive Box</p>
                            </div>
                            <span className="text-xl font-bold text-blue-400">₹120 <span className="text-sm font-normal text-slate-500">/box</span></span>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex justify-between items-center transitiion hover:border-blue-500/30">
                            <div>
                                <h4 className="text-white font-semibold">Secure Destruction</h4>
                                <p className="text-slate-400 text-sm">With Certificate</p>
                            </div>
                            <span className="text-xl font-bold text-blue-400">₹15 <span className="text-sm font-normal text-slate-500">/kg</span></span>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex justify-between items-center transitiion hover:border-blue-500/30">
                            <div>
                                <h4 className="text-white font-semibold">Additional User</h4>
                                <p className="text-slate-400 text-sm">Full access license</p>
                            </div>
                            <span className="text-xl font-bold text-blue-400">₹1,000 <span className="text-sm font-normal text-slate-500">/mo</span></span>
                        </div>
                    </div>
                    <p className="text-center text-slate-500 mt-8 text-sm">
                        * All new accounts require a one-time onboarding setup fee of ₹25,000 for server configuration, staff training, and initial workflow setup.
                    </p>
                </div>
            </section>

            <Footer />
        </main>
    );
}
