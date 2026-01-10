"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Phone, Mail, MapPin, Send, CheckCircle } from "lucide-react";

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // Simple mock submission
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col">
            <Navbar />

            {/* Header - Neo-Clean */}
            <div className="pt-40 pb-16 bg-slate-900 border-b border-slate-800 text-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-10 bg-grid-white pointer-events-none" />
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] opacity-40 animate-pulse pointer-events-none"></div>

                <div className="relative z-10">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Get in Touch</h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Our expert team is ready to optimize your records infrastructure.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800">

                    {/* Contact Info (Left) */}
                    <div className="bg-slate-800/50 p-12 text-white relative overflow-hidden border-r border-slate-700/50">
                        {/* Abstract Shape */}
                        <div className="absolute top-0 right-0 p-48 bg-blue-600/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-6 text-white">Contact Information</h2>
                            <p className="text-slate-400 mb-12">
                                Fill out the form and our team will get back to you within 24 hours.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-start group">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 mr-6 group-hover:bg-blue-500/20 transition">
                                        <Phone className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white mb-1">Phone</p>
                                        <a href="tel:+918141669879" className="block text-slate-400 hover:text-blue-400 transition cursor-pointer">Rahul Chotai: +91 81416 69879</a>
                                        <a href="tel:+919725790563" className="block text-slate-400 hover:text-blue-400 transition cursor-pointer">Keval Kuvekar: +91 97257 90563</a>
                                    </div>
                                </div>
                                <div className="flex items-start group">
                                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 mr-6 group-hover:bg-purple-500/20 transition">
                                        <Mail className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white mb-1">Email</p>
                                        <a href="mailto:info@digifortlabs.com" className="block text-slate-400 hover:text-purple-400 transition cursor-pointer">info@digifortlabs.com</a>
                                    </div>
                                </div>
                                <div className="flex items-start group">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 mr-6 group-hover:bg-emerald-500/20 transition">
                                        <MapPin className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white mb-1">Headquarters</p>
                                        <p className="text-slate-400">
                                            Vapi, Valsad<br />
                                            Gujarat, India
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form (Right) */}
                    <div className="p-12 lg:p-16 bg-slate-900">
                        {submitted ? (
                            <div className="h-full flex flex-col justify-center items-center text-center animate-fade-in-up">
                                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-3xl mb-6 border border-green-500/20">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                                <p className="text-slate-400 max-w-xs mx-auto">Thank you for contacting us. We will be in touch shortly.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-8 text-blue-400 font-bold hover:text-blue-300 transition"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition placeholder-slate-700"
                                        placeholder="Anandi Joshi"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">Work Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition placeholder-slate-700"
                                        placeholder="name@hospital.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-400 mb-2">Message</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition placeholder-slate-700"
                                        placeholder="Tell us about your requirements..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-900/40 transition transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    Send Message <Send className="w-4 h-4" />
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
