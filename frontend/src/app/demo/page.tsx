"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { User, Mail, Phone, Building, ArrowRight, Home, Activity } from 'lucide-react';


export default function DemoRegistration() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        organization_name: '',
        target_module: 'mrd'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await apiFetch('/auth/register-demo', {
                method: 'POST',
                body: formData as any
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Registration failed');
            }

            alert('Demo account created! Check your email for login credentials.');
            router.push('/login');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans w-full">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Home Button */}
            <div className="absolute top-8 right-8 z-20">
                <Link href="/" className="flex items-center py-2.5 px-5 gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 group">
                    <Home size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" /> Home
                </Link>
            </div>

            <div className="absolute top-8 left-8 z-20 hidden sm:block">
                <img src="/logo/longlogo.png" alt="Digifort" className="h-8" />
            </div>

            <div className="max-w-xl w-full bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-white p-8 sm:p-12 z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mb-6 shadow-sm border border-indigo-100">
                        <Activity size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Try Demo Account</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Experience DIGIFORT LABS instantly with a fully-featured, limited-time trial <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">(100MB storage, 2 users)</span>.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Full Name"
                                required
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all shadow-sm"
                            />
                        </div>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input
                                type="email"
                                placeholder="Email Address"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="relative group">
                        <Phone className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all shadow-sm"
                        />
                    </div>

                    <div className="relative group">
                        <Building className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Organization / Hospital / Clinic Name"
                            required
                            value={formData.organization_name}
                            onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                            className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all shadow-sm"
                        />
                    </div>

                    <div className="relative group">
                        <select
                            value={formData.target_module}
                            onChange={(e) => setFormData({ ...formData, target_module: e.target.value })}
                            className="appearance-none block w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold transition-all shadow-sm cursor-pointer"
                            required
                        >
                            <option value="mrd">Medical Record Digitization (MRD)</option>
                            <option value="hms">Hospital Management System (HMS)</option>
                            <option value="clinic">Clinic OPD Management</option>
                            <option value="dental">Dental OPD Module</option>
                            <option value="ent">ENT OPD Module</option>
                            <option value="pharma">Pharma & Medical Store</option>
                            <option value="legal">Law Firm Management</option>
                            <option value="corporate">Corporate Management</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold animate-in zoom-in-95">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full relative flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-bold text-sm hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-[0.98] mt-4"
                    >
                        {loading ? 'Processing...' : (
                            <>Create Demo Account <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm font-medium text-slate-500">
                        Already have an account?{' '}
                        <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-all">
                            Sign In to Portal
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
