"use client";
import { apiFetch, API_URL } from '@/config/api';
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Phone, Mail, MapPin, Send, CheckCircle, Building, BedDouble, MessageSquare, ChevronDown } from "lucide-react";


export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        hospitalName: "",
        bedCapacity: "",
        message: ""
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const bedOptions = [
        { value: "Clinic (No Beds)", label: "Clinic / Polyclinic (No Beds)" },
        { value: "1-50 Beds", label: "Small Hospital (1 - 50 Beds)" },
        { value: "51-100 Beds", label: "Medium Hospital (51 - 100 Beds)" },
        { value: "101-200 Beds", label: "Large Hospital (101 - 200 Beds)" },
        { value: "200+ Beds", label: "Enterprise (200+ Beds)" },
        { value: "New Hospital Setup", label: "🏥 Complete New Hospital Setup & Legal Verification" }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            setSubmitted(true);
            setFormData({ name: "", email: "", hospitalName: "", bedCapacity: "", message: "" });
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-600 font-sans selection:bg-blue-500/30 flex flex-col">
            <Navbar />

            {/* Header - Neo-Clean */}
            <div className="pt-32 pb-16 bg-white border-b border-slate-200 text-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-40 bg-grid-slate-100 pointer-events-none" />
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-[120px] opacity-70 animate-pulse pointer-events-none"></div>

                <div className="relative z-10">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">Let's Talk Digital</h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Ready to transform your hospital? Our HMS integration experts are here to architect your digital future.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-20 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">

                    {/* Contact Info (Left) */}
                    <div className="bg-blue-50/50 p-10 md:p-14 text-slate-900 relative overflow-hidden border-r border-slate-200">
                        {/* Abstract Shape */}
                        <div className="absolute top-0 right-0 p-48 bg-blue-200/40 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-4 text-slate-900">Contact Sales & Support</h2>
                            <p className="text-slate-600 mb-12 text-sm leading-relaxed">
                                Book a live 1-on-1 sandbox demo, request an On-Premise architecture quote, or get instant technical support.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-start group">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200 mr-6 group-hover:bg-emerald-200 transition">
                                        <MessageSquare className="w-5 h-5 text-emerald-700" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 mb-1">Direct WhatsApp</p>
                                        <a href="https://wa.me/918141669879" target="_blank" rel="noreferrer" className="block text-slate-600 hover:text-emerald-600 transition cursor-pointer text-sm">Rahul: +91 81416 69879</a>
                                        <a href="https://wa.me/919725790563" target="_blank" rel="noreferrer" className="block text-slate-600 hover:text-emerald-600 transition cursor-pointer text-sm mt-1">Keval: +91 97257 90563</a>
                                    </div>
                                </div>
                                <div className="flex items-start group">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200 mr-6 group-hover:bg-blue-200 transition">
                                        <Mail className="w-5 h-5 text-blue-700" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 mb-1">Email</p>
                                        <a href="mailto:info@digifortlabs.com" className="block text-slate-600 hover:text-blue-600 transition cursor-pointer text-sm">info@digifortlabs.com</a>
                                    </div>
                                </div>
                                <div className="flex items-start group">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center border border-purple-200 mr-6 group-hover:bg-purple-200 transition">
                                        <MapPin className="w-5 h-5 text-purple-700" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 mb-1">Headquarters</p>
                                        <p className="text-slate-600 text-sm">
                                            Vapi, Valsad<br />
                                            Gujarat, India
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form (Right) */}
                    <div className="p-10 md:p-14 bg-white">
                        {submitted ? (
                            <div className="h-full flex flex-col justify-center items-center text-center animate-fade-in-up">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-6 border border-emerald-200">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Inquiry Submitted!</h3>
                                <p className="text-slate-500 max-w-sm mx-auto text-sm">Thank you for reaching out. A Digifort HMS specialist will contact you within 24 hours.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-8 px-6 py-2 bg-white text-blue-600 font-bold rounded-xl hover:bg-slate-50 transition text-sm border border-slate-200 shadow-sm"
                                >
                                    Submit another request
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition placeholder-slate-400 text-sm"
                                            placeholder="e.g. Dr. Anandi Joshi"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Work Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition placeholder-slate-400 text-sm"
                                            placeholder="admin@hospital.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                                        <Building className="w-3.5 h-3.5" /> Hospital / Clinic Name
                                    </label>
                                    <input
                                        type="text"
                                        name="hospitalName"
                                        value={formData.hospitalName}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition placeholder-slate-400 text-sm"
                                        placeholder="City General Hospital"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                                        <BedDouble className="w-3.5 h-3.5" /> Facility Bed Capacity
                                    </label>
                                    <div className="relative">
                                        <div 
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none transition text-sm cursor-pointer flex justify-between items-center hover:border-slate-300"
                                        >
                                            <span className={formData.bedCapacity ? "text-slate-900" : "text-slate-400"}>
                                                {bedOptions.find(o => o.value === formData.bedCapacity)?.label || "Select Facility Size"}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                        
                                        {isDropdownOpen && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                                                {bedOptions.map((opt, i) => (
                                                    <div 
                                                        key={i}
                                                        onClick={() => {
                                                            setFormData({...formData, bedCapacity: opt.value});
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition border-b border-slate-100 last:border-0"
                                                    >
                                                        {opt.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">How can we help?</label>
                                    <textarea
                                        name="message"
                                        rows={4}
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition placeholder-slate-400 text-sm resize-none"
                                        placeholder="Tell us about your requirements (e.g. AWS Cloud vs On-Premise)..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 mt-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition transform active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {loading ? (
                                        <>Connecting...</>
                                    ) : (
                                        <>Request Call Back <Send className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}
