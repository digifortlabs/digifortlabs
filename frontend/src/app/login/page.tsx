"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { API_URL } from '../../config/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Lock, ArrowRight, ShieldCheck, Activity, Globe } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const errorMsg = searchParams.get('error');
        const reason = searchParams.get('reason');

        if (reason === 'maintenance') {
            setError('🔧 System is currently under maintenance. Please try again later.');
        } else if (reason === 'inactivity') {
            setError('⏱️ You were logged out due to inactivity. Please log in again.');
        } else if (errorMsg) {
            setError(errorMsg);
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        console.log("🔵 [Login] Starting login request...");

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const apiUrl = API_URL;
            console.log(`🔵 [Login] URL: ${apiUrl}/auth/token`);

            const res = await fetch(`${apiUrl}/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            console.log(`🟢 [Login] Response Status: ${res.status}`);

            if (!res.ok) {
                const errorData = await res.json();
                console.error('[Login] Failed:', res.status, errorData);
                throw new Error(errorData.detail || 'Invalid credentials');
            }

            const data = await res.json();
            console.log("🟢 [Login] Success, Token received.");
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('userEmail', email); // Store for Secure View Watermark
            router.push('/dashboard');

        } catch (err: any) {
            console.error('[Login] Error:', err);
            setError(err.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-10">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
                <p className="text-slate-500 mt-2 font-medium">Please enter your credentials to access the portal.</p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                            placeholder="name@hospital.com"
                        />
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
                            className="appearance-none block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                        <span className="text-sm font-medium text-slate-600">Remember me</span>
                    </label>

                    <Link href="/forgot-password" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                        Forgot Password?
                    </Link>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 animate-in zoom-in-95">
                        <ShieldCheck size={16} /> {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative flex items-center justify-center gap-2 py-4 px-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 active:scale-[0.98]"
                >
                    {loading ? (
                        <>Processing...</>
                    ) : (
                        <>Sign In <ArrowRight size={16} /></>
                    )}
                </button>

                <p className="text-center text-sm font-medium text-slate-500">
                    Don't have an account? <a href="/contact" className="text-indigo-600 font-bold hover:underline">Contact Sales</a>
                </p>
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

                    <h2 className="text-5xl font-black leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        The Future of Medical Records.
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed mb-10">
                        Securely manage patient data, streamline retrieval, and ensuring compliance with our state-of-the-art digital infrastructure.
                    </p>

                    <div className="flex gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">HIPAA Compliant</p>
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
            <div className="flex-1 flex flex-col justify-center p-4 sm:p-12 lg:p-24 relative">
                <div className="absolute top-8 left-8 lg:hidden">
                    <img src="/logo/longlogo.png" alt="Digifort" className="h-8" />
                </div>

                <Suspense fallback={<div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>}>
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
