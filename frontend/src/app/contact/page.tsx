"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        // Simple mock submission
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Navbar />

            {/* Header - Neo-Clean */}
            <div className="pt-40 pb-16 bg-white text-center px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60"></div>
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">Get in Touch</h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">Our team is ready to help you optimize your records.</p>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">

                    {/* Contact Info (Left) */}
                    <div className="bg-blue-600 p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-indigo-500 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                            <p className="text-blue-100 mb-12">
                                Fill out the form and our team will get back to you within 24 hours.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <span className="text-2xl mr-4">📞</span>
                                    <div>
                                        <p className="font-bold">Phone</p>
                                        <p className="text-blue-100">Rahul Chotai: +91 81416 69879</p>
                                        <p className="text-blue-100">Keval Kuvekar: +91 97257 90563</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-2xl mr-4">📧</span>
                                    <div>
                                        <p className="font-bold">Email</p>
                                        <p className="text-blue-100">info@digifortlabs.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-2xl mr-4">🏢</span>
                                    <div>
                                        <p className="font-bold">Headquarters</p>
                                        <p className="text-blue-100">
                                            Vapi, Valsad<br />
                                            Gujarat
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form (Right) */}
                    <div className="p-12 lg:p-16">
                        {submitted ? (
                            <div className="h-full flex flex-col justify-center items-center text-center animate-fade-in-up">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4">
                                    ✅
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Message Sent!</h3>
                                <p className="text-slate-500">Thank you for contacting us. We will be in touch shortly.</p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-8 text-blue-600 font-bold hover:underline"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        placeholder="Anandi Joshi"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Work Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        placeholder="anandi.joshi@bharathospital.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                        placeholder="Tell us about your requirements..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg transform active:scale-95"
                                >
                                    Send Message
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
