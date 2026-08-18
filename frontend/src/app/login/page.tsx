"use client";
import { getDomainUrl, getRootUrl } from '@/lib/utils';

// ... existing imports ...

// Inside completeLogin function replace router.push calls with getDomainUrl based redirect

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { apiFetch } from '@/config/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Lock, ArrowRight, ShieldCheck, Activity, Globe, Home, Stethoscope, HeartPulse, Microscope, Syringe, Building2, UserCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
    const [step, setStep] = useState<'email' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
 
    // MFA State
    const [mfaRequired, setMfaRequired] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [deviceId, setDeviceId] = useState('');
 
    const router = useRouter();
    const searchParams = useSearchParams();
 
    const getCurrentSubdomain = () => {
        const host = typeof window !== 'undefined' ? window.location.host : '';
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';
        const hostname = host.replace(/:\d+$/, '').replace('.localhost', `.${rootDomain}`);
        const parts = hostname.split('.');
        return parts.length > 2 ? parts[0] : '';
    };
 
    useEffect(() => {
        // Clear any stale auth tokens on login page load
        ['access_token','userRole','userEmail','userSpecialty','userModules',
         'userTerminology','loginTime','hospital_id','globalHospitalId',
         'mrd_hospital_id', 'dental_hospital_id', 'ent_hospital_id', 'clinic_hospital_id', 'hms_hospital_id', 'inventory_hospital_id',
         'userGroupId','sidebarCollapsed'].forEach(k => localStorage.removeItem(k));

        // Device ID Management
        let storedDeviceId = localStorage.getItem('device_id');
        if (!storedDeviceId) {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                storedDeviceId = crypto.randomUUID();
            } else {
                storedDeviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
            localStorage.setItem('device_id', storedDeviceId);
        }
        setDeviceId(storedDeviceId);
 
        const errorMsg = searchParams.get('error');
        const successMsg = searchParams.get('message') || searchParams.get('msg');
        const reason = searchParams.get('reason');
 
        if (reason === 'maintenance') {
            setError('🔧 System is currently under maintenance. Please try again later.');
        } else if (reason === 'inactivity') {
            setError('⏱️ You were logged out due to inactivity. Please log in again.');
        } else if (reason === 'session_expired') {
            setError('🔒 Your session has expired. Please log in again to continue.');
        } else if (errorMsg) {
            setError(errorMsg);
        }

        if (successMsg) {
            setSuccess(successMsg);
        }
 
        // Sync URL Email Query for redirection support
        const queryEmail = searchParams.get('email');
        if (queryEmail) {
            setEmail(queryEmail);
            setStep('password');
        }
    }, [searchParams]);
 
    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        setError('');
        setSuccess('');
 
        try {
            const data = await apiFetch(`/auth/check-email`, {
                method: 'POST',
                body: { email } as any,
            });

            const targetSubdomain = data.target_subdomain || 'dashboard';
            const currentSubdomain = getCurrentSubdomain();
 
            if (currentSubdomain === targetSubdomain) {
                setStep('password');
                setLoading(false);
            } else {
                // Redirect to matching subdomain
                const targetUrl = getDomainUrl(targetSubdomain, `/login?email=${encodeURIComponent(email)}`);
                setTimeout(() => {
                    if (targetUrl.startsWith('http')) {
                        try {
                            const parsed = new URL(targetUrl);
                            if (['http:', 'https:'].includes(parsed.protocol)) {
                                window.location.href = targetUrl;
                            } else {
                                console.error('Blocked unsafe redirect:', targetUrl);
                            }
                        } catch(e) {
                            console.error('Invalid redirect URL:', targetUrl);
                        }
                    } else {
                        router.push(targetUrl);
                    }
                }, 100);
            }
        } catch (err: any) {
            console.error('[Email Check] Error:', err);
            const msg = typeof err?.message === 'string' ? err.message : (err?.data?.detail || 'No account found with this email. Please check your spelling or register a new organization.');
            setError(msg);
            setLoading(false);
        }
    };
 
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (mfaRequired) {
                const data = await apiFetch(`/auth/mfa/verify-device`, {
                    method: 'POST',
                    body: { email, password, otp_code: otpCode, device_id: deviceId } as any,
                });
                completeLogin(data);
                return;
            }

            // Token endpoint requires form-encoded body — bypass apiFetch JSON defaults
            const { getCsrfToken } = await import('@/config/api');
            const csrf = await getCsrfToken();
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch('/api/auth/token', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Device-Id': deviceId,
                    ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
                },
                body: formData.toString(),
            });

            const data = await res.json();

            if (res.status === 202 && data.mfa_required) {
                setMfaRequired(true);
                setLoading(false);
                return;
            }

            if (!res.ok) {
                throw new Error(data.detail || 'Login failed');
            }

            completeLogin(data);

        } catch (err: any) {
            console.error('[Login] Error:', err);
            const msg = typeof err?.message === 'string' ? err.message : (err?.data?.detail || 'Invalid credentials or verification code.');
            setError(msg);
            setLoading(false);
        }
    };
 
    const completeLogin = (data: any) => {
        // Store locally for same-origin use
        localStorage.setItem('userEmail', email);
        localStorage.setItem('loginTime', Math.floor(Date.now() / 1000).toString());
        if (data.access_token) {
            sessionStorage.setItem('access_token', data.access_token);
            localStorage.setItem('access_token', data.access_token);
        }
        if (data.role) localStorage.setItem('userRole', data.role);
        if (data.specialty) localStorage.setItem('userSpecialty', data.specialty);
        if (data.pricing_tier) localStorage.setItem('userPricingTier', data.pricing_tier);
        if (data.group_id) localStorage.setItem('userGroupId', data.group_id.toString());
        if (data.enabled_modules) localStorage.setItem('userModules', JSON.stringify(data.enabled_modules));
        if (data.terminology) localStorage.setItem('userTerminology', JSON.stringify(data.terminology));
        if (data.hospital_id) localStorage.setItem('hospital_id', data.hospital_id.toString());

        // Determine target subdomain and path based on role
        const isSuperAdmin = data.role === 'superadmin' || data.role === 'superadmin_staff' || data.role === 'website_admin' || data.role === 'warehouse_manager';
        const isDoctor = data.role === 'doctor';
        const isHospitalUser = data.role === 'hospital_admin' || data.role === 'hospital_staff' || data.role === 'mrd_staff' || data.role === 'account_staff' || data.role === 'nurse_ipd' || data.role === 'doctor_ipd' || data.role === 'doctor_opd';

        // Robustly determine the hospital slug and target path
        const currentSubdomain = getCurrentSubdomain();
        
        let targetSubdomain = data.target_subdomain || 'admin';
        let targetPath = '/';

        if (targetSubdomain === 'demo') {
            targetPath = isDoctor ? '/' : (isHospitalUser ? '/' : '/admin');
        } else if (targetSubdomain === 'admin') {
            targetPath = '/admin';
        } else {
            targetPath = '/';
        }

        // getDomainUrl already appends #_auth= hash for cross-subdomain handoff
        const targetUrl = getDomainUrl(targetSubdomain, targetPath);

        setTimeout(() => {
            if (targetUrl.startsWith('http')) {
                window.location.href = targetUrl;
            } else {
                router.push(targetUrl);
            }
        }, 100);
    }
 
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 'email' && !mfaRequired) {
            handleContinue(e);
        } else {
            handleLogin(e);
        }
    };
 
    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-10 text-left">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {mfaRequired ? 'Verify Device' : step === 'email' ? 'Welcome Back' : 'Enter Password'}
                </h2>
                <p className="text-slate-500 mt-2 font-medium">
                    {mfaRequired
                        ? 'We noticed a new device. Enter the verification code sent to your email.'
                        : step === 'email'
                        ? 'Please enter your email to proceed to your secure portal.'
                        : 'Enter your password to sign in.'}
                </p>
            </div>
 
            <form className="space-y-6" onSubmit={handleSubmit}>
                {!mfaRequired ? (
                    <div className="space-y-4 animate-in slide-in-from-left-4">
                        {step === 'email' ? (
                            <div className="relative group animate-in fade-in duration-300">
                                <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError('');
                                        if (success) setSuccess('');
                                    }}
                                    className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all shadow-sm"
                                    placeholder="name@company.com"
                                />
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm border border-indigo-100">
                                            {email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account context</p>
                                            <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        disabled={loading}
                                        onClick={() => {
                                            setStep('email');
                                            setPassword('');
                                            router.push('/login');
                                        }} 
                                        className="text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                                    >
                                        Change
                                    </button>
                                </div>
 
                                <input type="text" name="username" value={email} readOnly className="hidden" autoComplete="username" />

                                <div className="relative group">
                                    <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all shadow-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-right-4">
                        <div className="relative group">
                            <ShieldCheck className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                maxLength={6}
                                required
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all text-center tracking-[0.5em] text-lg"
                                placeholder="000000"
                            />
                        </div>
                    </div>
                )}
 
                {step === 'password' && !mfaRequired && (
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                            <span className="text-sm font-medium text-slate-600">Remember me</span>
                        </label>
 
                        <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`} className={`text-sm font-bold text-indigo-600 hover:text-indigo-700 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
                            Forgot Password?
                        </Link>
                    </div>
                )}
 
                {success && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-xl text-sm font-medium animate-in zoom-in-95 flex items-center gap-2.5 shadow-sm">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <p className="font-bold">{success}</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50/90 border border-red-200/80 text-red-700 rounded-xl text-sm font-medium animate-in zoom-in-95 space-y-3 shadow-sm">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <div className="leading-snug">
                                <p className="font-bold text-red-900">{error}</p>
                                {error.toLowerCase().includes('not found') && (
                                    <p className="text-xs text-red-600 mt-1 font-normal">
                                        This email is not registered in our system. You can create a new organization account or explore our interactive demo.
                                    </p>
                                )}
                            </div>
                        </div>

                        {error.toLowerCase().includes('not found') && (
                            <div className="pt-2 border-t border-red-200/60 flex items-center gap-2">
                                <Link 
                                    href={`/register${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                                >
                                    <UserCheck size={14} /> Register Organization
                                </Link>
                                <Link 
                                    href="/demo"
                                    className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all active:scale-95"
                                >
                                    Try Demo <ArrowRight size={12} />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
 
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative flex items-center justify-center gap-2 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none shadow-md shadow-blue-200 active:scale-[0.98]"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {mfaRequired ? 'Verifying...' : step === 'email' ? 'Checking...' : 'Signing in...'}
                        </span>
                    ) : mfaRequired ? (
                        <>Verify Device <ArrowRight size={16} /></>
                    ) : step === 'email' ? (
                        <>Continue <ArrowRight size={16} /></>
                    ) : (
                        <>Sign In <ArrowRight size={16} /></>
                    )}
                </button>
 
                {mfaRequired && (
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => setMfaRequired(false)}
                        className="w-full text-center text-sm font-bold text-slate-500 hover:text-slate-700 mt-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                    >
                        Back to Login
                    </button>
                )}
 
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500 font-bold">New to Digifort Labs?</span>
                    </div>
                </div>
 
                <div className="grid grid-cols-3 gap-2">
                    <Link href={`/register${email ? `?email=${encodeURIComponent(email)}` : ''}`} className={`flex items-center justify-center gap-1.5 py-3 px-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm hover:shadow active:scale-95 ${loading ? 'pointer-events-none opacity-50' : ''}`}>
                        <UserCheck size={14} /> Register
                    </Link>
                    <Link href="/demo" className={`flex items-center justify-center gap-1 py-3 px-2 bg-white text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-all border border-indigo-200 shadow-sm hover:shadow ${loading ? 'pointer-events-none opacity-50' : ''}`}>
                        Try Demo
                    </Link>
                    <Link href="/contact" className={`flex items-center justify-center gap-1 py-3 px-2 bg-white text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all border border-slate-200 shadow-sm hover:shadow ${loading ? 'pointer-events-none opacity-50' : ''}`}>
                        Contact
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Side - Visuals */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 relative overflow-hidden items-center justify-center p-12 text-white">
                {/* Background Cyber Grid & Medical Patterns */}
                <div className="absolute inset-0 z-0 bg-cyber-grid opacity-20 pointer-events-none" />
                <div className="absolute inset-0 z-0 bg-medical-crosses opacity-15 pointer-events-none" />

                {/* Glow Orbs */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/25 rounded-full blur-[130px] translate-x-1/3 -translate-y-1/3 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3"></div>
                </div>

                {/* Animated Patient Care & Medical Equipment Diagnostic Hub Graphic (Subtle Background Backdrop) */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 z-0 pointer-events-none opacity-30">
                    <div className="relative w-[500px] h-[500px] flex items-center justify-center">
                        
                        {/* Orbit Ring 1 - Medical Equipment */}
                        <div className="absolute w-[440px] h-[440px] rounded-full border border-cyan-400/30 animate-spin [animation-duration:35s]">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 p-2.5 bg-slate-900 border border-cyan-400/50 text-cyan-300 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                <Stethoscope className="w-5 h-5" />
                            </div>
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 p-2.5 bg-slate-900 border border-blue-400/50 text-blue-300 rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                                <Microscope className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Orbit Ring 2 - Patient Care & OPD Diagnostics */}
                        <div className="absolute w-[320px] h-[320px] rounded-full border border-indigo-400/30 animate-spin [animation-duration:22s] [animation-direction:reverse]">
                            <div className="absolute top-1/2 -right-4 -translate-y-1/2 p-2.5 bg-slate-900 border border-emerald-400/50 text-emerald-300 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                <UserCheck className="w-5 h-5" />
                            </div>
                            <div className="absolute top-1/2 -left-4 -translate-y-1/2 p-2.5 bg-slate-900 border border-purple-400/50 text-purple-300 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                <Syringe className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Central Live Treatment Pulse Icon */}
                        <div className="absolute w-20 h-20 rounded-2xl bg-slate-900/90 border border-cyan-400/60 flex flex-col items-center justify-center text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] animate-pulse-glow">
                            <HeartPulse className="w-8 h-8 text-cyan-400 mb-0.5" />
                            <span className="text-[8px] font-black tracking-widest text-cyan-200 uppercase">CARE HUB</span>
                        </div>

                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    {/* Clear Wide Logo Display & Live Heartbeat Badge */}
                    <div className="mb-10 flex items-center gap-4">
                        <div className="inline-block bg-white/95 backdrop-blur-md rounded-2xl px-6 py-3.5 shadow-xl border border-white/20">
                            <img src="/logo/longlogo.png" alt="Digifort Labs Logo" className="h-10 w-auto object-contain" />
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 text-xs font-bold shadow-lg animate-pulse-glow">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                            <span>LIVE CLINICAL MONITOR</span>
                        </div>
                    </div>

                    <h2 className="text-4xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-200 leading-tight">
                        Next-Gen Hospital Management System.
                    </h2>
                    <p className="text-base text-slate-300 leading-relaxed mb-10">
                        Streamline OPD Queueing, IPD Bed Beds, Digital Pharmacy Expiry Batching, and Cashless Insurance Billing across 11 integrated FRS clinical modules.
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white">DPDP 2023 & NABH</p>
                                <p className="text-xs text-slate-400">ABHA & 256-bit AES Security</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                                <Globe size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white">Cloud & On-Premise</p>
                                <p className="text-xs text-slate-400">24/7 High Availability</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col justify-center p-4 sm:p-12 lg:p-24 relative bg-slate-50/50 lg:bg-white inset-0">
                <div className="absolute top-8 left-8 lg:hidden">
                    <img src="/logo/longlogo.png" alt="Digifort" className="h-8" />
                </div>

                <div className="absolute top-8 right-8 z-10">
                    <Link href={getRootUrl('/')} className="flex items-center py-2.5 px-5 gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 group">
                        <Home size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" /> Home
                    </Link>
                </div>

                <Suspense fallback={<div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
                    <LoginForm />
                </Suspense>

                <div className="absolute bottom-6 left-0 w-full text-center">
                    <p className="text-xs font-medium text-slate-400">
                        &copy; {new Date().getFullYear()} Digifort Labs. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
