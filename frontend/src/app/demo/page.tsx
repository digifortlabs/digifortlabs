"use client";

import { useState } from 'react';
// @ts-ignore
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
// @ts-ignore
import NextLink from 'next/link';
import { User, Mail, Phone, Building, ArrowRight, Home, Activity, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
const Link = NextLink as any;


import RolePreviewSandbox from '@/components/RolePreviewSandbox';

export default function DemoRegistration() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        organization_name: '',
        target_module: 'all'
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

            toast.error('Demo account created! Check your email for login credentials.');
            router.push('/login');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 py-16 relative overflow-x-hidden font-sans w-full text-slate-700">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-teal-100/50 rounded-full blur-[100px]"></div>
            </div>

            {/* Home Button */}
            <div className="absolute top-8 right-8 z-20">
                <Link href="/" className="flex items-center py-2.5 px-5 gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 shadow-xs transition-all duration-300 group">
                    <Home size={18} className="text-slate-500 group-hover:text-blue-600 transition-colors" /> Home
                </Link>
            </div>

            <div className="max-w-5xl w-full space-y-12 z-10">
                {/* Registration Form Box */}
                <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-12">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100">
                            <Activity size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Request HMS Demo Access</h1>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">
                            Experience Digifort HMS with <span className="text-blue-600 font-bold">all 11 clinical modules</span> enabled.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-medium transition"
                                />
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-medium transition"
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-medium transition"
                            />
                        </div>

                        <div className="relative group">
                            <Building className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Hospital / Clinic Name"
                                required
                                value={formData.organization_name}
                                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white text-sm font-medium transition"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition shadow-md shadow-blue-200 disabled:opacity-70 mt-4"
                        >
                            {loading ? 'Processing...' : (
                                <>Register for Demo <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>
                </div>

                {/* Role Sandbox Interactive Component */}
                <div>
                    <RolePreviewSandbox />
                </div>
            </div>
        </div>
    );
}
