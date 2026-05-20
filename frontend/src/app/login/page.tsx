"use client";
import { getDomainUrl } from '@/lib/utils';

// ... existing imports ...

// Inside completeLogin function replace router.push calls with getDomainUrl based redirect

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { API_URL } from '../../config/api';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Lock, ArrowRight, ShieldCheck, Activity, Globe, Home } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
    const [step, setStep] = useState<'email' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
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
 
        try {
            const res = await apiFetch(`/auth/check-email`, {
                method: 'POST',
                body: { email } as any,
            });
 
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Email address not registered.');
            }
 
            const data = await res.json();
            const targetSubdomain = data.target_subdomain || 'dashboard';
            const currentSubdomain = getCurrentSubdomain();
 
            if (currentSubdomain === targetSubdomain) {
                setStep('password');
            } else {
                // Redirect to matching subdomain
                const targetUrl = getDomainUrl(targetSubdomain, `/login?email=${encodeURIComponent(email)}`);
                if (targetUrl.startsWith('http')) {
                    window.location.href = targetUrl;
                } else {
                    router.push(targetUrl);
                }
            }
        } catch (err: any) {
            console.error('[Email Check] Error:', err);
            setError(err.message || 'Email address not found in our registry.');
        } finally {
            setLoading(false);
        }
    };
 
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
 
        try {
            if (mfaRequired) {
                // Submit OTP Verification
                const res = await apiFetch(`/auth/mfa/verify-device`, {
                    method: 'POST',
                    body: {
                        email,
                        password,
                        otp_code: otpCode,
                        device_id: deviceId
                    } as any,
                });
 
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.detail || 'Verification failed');
                }
 
                const data = await res.json();
                completeLogin(data);
                return;
            }
 
            // Initial Password Submit
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);
 
            const res = await apiFetch(`/auth/token`, {
                method: 'POST',
                headers: {
                    'X-Device-Id': deviceId
                },
                body: formData,
            });
 
            if (res.status === 202) {
                const data = await res.json();
                if (data.mfa_required) {
                    setMfaRequired(true);
                    setLoading(false);
                    return;
                }
            }
 
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Login failed');
            }
 
            const data = await res.json();
            completeLogin(data);
 
        } catch (err: any) {
            console.error('[Login] Error:', err);
            setError(err.message || 'Invalid credentials or verification code.');
        } finally {
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

        // Determine target subdomain based on role and hospital_slug
        let targetSubdomain = 'dashboard';
        if (data.role && (data.role === 'superadmin' || data.role === 'superadmin_staff' || data.role === 'website_admin' || data.role === 'warehouse_manager')) {
            targetSubdomain = 'admin';
        } else if (data.hospital_slug) {
            targetSubdomain = data.hospital_slug;
        }

        const targetUrl = getDomainUrl(targetSubdomain, '/dashboard');

        // Cross-subdomain handoff: localStorage is origin-scoped (admin.localhost ≠ localhost).
        // Encode the auth payload in the URL hash so the target page can bootstrap itself.
        // The hash is never sent to the server and is wiped immediately after consumption.
        if (targetUrl.startsWith('http') && data.access_token) {
            const handoff = btoa(JSON.stringify({
                access_token: data.access_token,
                userRole: data.role || '',
                userEmail: email,
                userSpecialty: data.specialty || '',
                userModules: data.enabled_modules || [],
                userTerminology: data.terminology || {},
                loginTime: Math.floor(Date.now() / 1000),
            }));
            window.location.href = `${targetUrl}#_auth=${handoff}`;
        } else if (targetUrl.startsWith('http')) {
            window.location.href = targetUrl;
        } else {
            router.push(targetUrl);
        }
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
                                    onChange={(e) => setEmail(e.target.value)}
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
 
                        <Link href="/forgot-password" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                            Forgot Password?
                        </Link>
                    </div>
                )}
 
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 animate-in zoom-in-95">
                        <ShieldCheck size={16} /> {error}
                    </div>
                )}
 
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-bold text-sm hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:pointer-events-none shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-[0.98]"
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
                        <span className="bg-white px-2 text-slate-500 font-bold">New User?</span>
                    </div>
                </div>
 
                <div className="flex gap-3">
                    <Link href="/demo" className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all border border-indigo-200 shadow-sm hover:shadow-md hover:border-indigo-300">
                        Try Demo
                    </Link>
                    <Link href="/contact" className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all border border-slate-200 shadow-sm hover:shadow-md">
                        Contact Sales
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
                        The Future of Data Processing.
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed mb-10">
                        Securely manage enterprise data, streamline retrieval, and ensure compliance with our state-of-the-art digital infrastructure.
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

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col justify-center p-4 sm:p-12 lg:p-24 relative bg-slate-50/50 lg:bg-white inset-0">
                <div className="absolute top-8 left-8 lg:hidden">
                    <img src="/logo/longlogo.png" alt="Digifort" className="h-8" />
                </div>

                <div className="absolute top-8 right-8 z-10">
                    <Link href="/" className="flex items-center py-2.5 px-5 gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 group">
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
