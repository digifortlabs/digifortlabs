"use client";
import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function PatientLogin() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            <Navbar />

            <div className="flex-1 flex items-center justify-center pt-20 pb-12 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl text-2xl mb-4">
                            🏥
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Patient Portal</h2>
                        <p className="text-slate-500 mt-2">Securely access your medical archives</p>
                    </div>

                    <form className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Health ID / Unique ID</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-900"
                                placeholder="PID-12345678"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date of Birth</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium text-slate-900"
                            />
                        </div>

                        <div className="flex items-start">
                            <input id="agree" type="checkbox" className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                            <label htmlFor="agree" className="ml-2 block text-xs text-slate-500 leading-relaxed">
                                I consent to the retrieval of my archived records for the purpose of personal healthcare management.
                            </label>
                        </div>

                        <button
                            type="button"
                            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition transform active:scale-95"
                        >
                            Access Records
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Protected by 256-bit AES Encryption
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
