"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import {
    Building2, User, Mail, Phone, Lock,
    ArrowRight, ArrowLeft, CheckCircle2,
    Activity, ShieldCheck, Globe
} from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        legal_name: '',
        organization_type: 'Hospital',
        specialty: 'General',
        phone: '',
        admin_first_name: '',
        admin_last_name: '',
        email: '',
        password: '',
        confirm_password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Remove confirm_password before sending to API
            const { confirm_password, ...payload } = formData;

            const res = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            // Registration successful!
            // Automatically log them in or redirect to login page with success message
            router.push('/login?message=Registration successful. Please log in.');

        } catch (err: any) {
            console.error('[Registration] Error:', err);
            setError(err.message || 'Failed to register organization. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Side - Visuals */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12 text-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3"></div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                            <Activity className="text-indigo-400" size={32} />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">DIGIFORT LABS</h1>
                    </div>

                    <h2 className="text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 py-1">
                        Join the platform mapping the future.
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed mb-10">
                        Create your organization's workspace and onboard your entire team in minutes. Secure, compliant, and scalable.
                    </p>

                    <div className="flex gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Enterprise Compliant</p>
                                <p className="text-xs text-slate-500">Bank-grade security</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Globe size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Cloud Access</p>
                                <p className="text-xs text-slate-500">24/7 Availability</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Wizard */}
            <div className="flex-1 flex flex-col justify-center p-4 sm:p-12 lg:p-24 relative overflow-y-auto">
                <div className="absolute top-8 left-8 lg:hidden">
                    <img src="/logo/longlogo.png" alt="Digifort" className="h-8" />
                </div>

                <div className="w-full max-w-md mx-auto">
                    {/* Stepper */}
                    <div className="flex items-center justify-between mb-8 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`}></div>

                        {[1, 2, 3].map((num) => (
                            <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${step >= num ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                                {step > num ? <CheckCircle2 size={16} /> : num}
                            </div>
                        ))}
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            {step === 1 ? 'Organization Details' : step === 2 ? 'Create Admin Account' : 'Review & Submit'}
                        </h2>
                        <p className="text-slate-500 mt-2 font-medium">
                            {step === 1 ? 'Tell us about your organization.' : step === 2 ? 'Set up the primary administrator.' : 'Please verify your information before submitting.'}
                        </p>
                    </div>

                    <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-6">

                        {/* STEP 1 */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Legal Name</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                        <input
                                            name="legal_name"
                                            required
                                            value={formData.legal_name}
                                            onChange={handleChange}
                                            className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                                            placeholder="Acme Corp / City Hospital"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                                        <select
                                            name="organization_type"
                                            value={formData.organization_type}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                                        >
                                            <option value="Hospital">Hospital</option>
                                            <option value="Clinic">Clinic</option>
                                            <option value="Law Firm">Law Firm</option>
                                            <option value="Business">Corporate Business</option>
                                            <option value="Pharmaceutical">Pharmaceutical</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specialty</label>
                                        <select
                                            name="specialty"
                                            value={formData.specialty}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                                        >
                                            <option value="General">General Medical</option>
                                            <option value="Dental">Dental Practice</option>
                                            <option value="ENT">ENT Specialist</option>
                                            <option value="Corporate">Corporate HR/Biz</option>
                                            <option value="Legal">Legal</option>
                                            <option value="Pharma">Manufacturing</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                        <input
                                            name="phone"
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2 */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                            <input
                                                name="admin_first_name"
                                                required
                                                value={formData.admin_first_name}
                                                onChange={handleChange}
                                                className="appearance-none block w-full pl-10 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                                                placeholder="Jane"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                                        <input
                                            name="admin_last_name"
                                            required
                                            value={formData.admin_last_name}
                                            onChange={handleChange}
                                            className="appearance-none block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Work Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                                            placeholder="jane@company.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                        <input
                                            name="password"
                                            type="password"
                                            required
                                            minLength={8}
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                        <input
                                            name="confirm_password"
                                            type="password"
                                            required
                                            minLength={8}
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3 */}
                        {step === 3 && (
                            <div className="space-y-4 animate-in zoom-in-95 duration-300">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Organization</h3>
                                        <p className="font-bold text-lg text-slate-900">{formData.legal_name}</p>
                                        <p className="text-slate-600 flex gap-2 text-sm">{formData.organization_type} • {formData.specialty}</p>
                                    </div>
                                    <div className="w-full h-px bg-slate-200"></div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Administrator</h3>
                                        <p className="font-bold text-slate-900">{formData.admin_first_name} {formData.admin_last_name}</p>
                                        <p className="text-slate-600 text-sm">{formData.email}</p>
                                        <p className="text-slate-600 text-sm">{formData.phone}</p>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-500 text-center px-4">
                                    By clicking complete registration, you agree to our Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 animate-in zoom-in-95">
                                <ShieldCheck size={16} /> {error}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-4 pt-4">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex-1 py-4 px-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={16} /> Back
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] relative flex items-center justify-center gap-2 py-4 px-4 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>Processing...</>
                                ) : step === 3 ? (
                                    <>Complete Registration <CheckCircle2 size={16} /></>
                                ) : (
                                    <>Continue <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center bg-slate-50 py-4 rounded-xl border border-slate-100">
                        <p className="text-sm font-medium text-slate-600">
                            Already have an account?{' '}
                            <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
