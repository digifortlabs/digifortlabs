"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, User, Phone, ArrowRight, Loader2 } from "lucide-react";
import { API_URL } from "@/config/api";

export default function SelfRegisterPage() {
    const searchParams = useSearchParams();
    const hospital_id = searchParams.get("hospital_id");
    
    const [form, setForm] = useState({
        full_name: "",
        phone: "",
        gender: "Male",
        age: ""
    });
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const res = await fetch(`${API_URL}/self-registration`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hospital_id: Number(hospital_id),
                    full_name: form.full_name,
                    phone: form.phone,
                    gender: form.gender,
                    age: form.age ? Number(form.age) : null
                })
            });
            
            if (res.ok) {
                setSuccess(true);
            } else {
                alert("Failed to submit registration. Please try again at the reception desk.");
            }
        } catch (error) {
            alert("Network error.");
        }
        setLoading(false);
    };

    if (!hospital_id) {
        return <div className="p-8 text-center text-slate-500">Invalid QR Code. Please scan again.</div>;
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">You're in the queue!</h1>
                    <p className="text-slate-500 font-medium mb-6">Please look at the reception display for your token number.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
                        <User className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Express Check-in</h1>
                    <p className="text-slate-500 mt-2 font-medium">Register yourself in 30 seconds</p>
                </div>
                
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Full Name</label>
                        <input 
                            type="text" required
                            placeholder="e.g. Rahul Kumar"
                            value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})}
                            className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Phone Number</label>
                        <input 
                            type="tel" required
                            placeholder="e.g. 9876543210"
                            value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})}
                            className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Age</label>
                            <input 
                                type="text"
                                placeholder="Age"
                                value={form.age} onChange={(e) => setForm({...form, age: e.target.value})}
                                className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Gender</label>
                            <select 
                                value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})}
                                className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                            >
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                Register Now <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
