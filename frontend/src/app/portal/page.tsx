"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PatientDashboard() {
    // Mock Data - In real app, fetch from API /patients/{id}/files
    const files = [
        { name: "Blood_Work_2024.pdf", date: "2024-12-01", size: "1.2 MB" },
        { name: "MRI_Report_Knee.pdf", date: "2024-11-15", size: "15.0 MB" },
        { name: "Discharge_Summary.pdf", date: "2024-08-20", size: "0.8 MB" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar />

            <div className="max-w-6xl mx-auto px-6 py-12 pt-28">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Health Records</h1>
                        <p className="text-slate-500 mt-1">Securely view and download your archived medical history.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-sm font-semibold text-slate-700">John Doe (PT-10001)</span>
                        <div className="h-4 w-px bg-slate-300"></div>
                        <Link href="/portal/login" className="text-sm font-medium text-red-600 hover:text-red-700">Logout</Link>
                    </div>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Document Name</th>
                                <th className="px-6 py-4">Date Archive</th>
                                <th className="px-6 py-4">Size</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {files.map((file, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/50 transition duration-150">
                                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center">
                                            📄
                                        </div>
                                        {file.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{file.date}</td>
                                    <td className="px-6 py-4 text-slate-500">{file.size}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {files.length === 0 && (
                        <div className="p-12 text-center text-slate-400">No records found.</div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
