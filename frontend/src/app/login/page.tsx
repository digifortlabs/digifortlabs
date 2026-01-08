"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { API_URL } from '../../config/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const errorMsg = searchParams.get('error');
        if (errorMsg) {
            setError(errorMsg);
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const apiUrl = API_URL;
            const res = await fetch(`${apiUrl}/auth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
            });

            if (!res.ok) {
                console.error('[Login] Failed:', res.status, res.statusText);
                throw new Error('Invalid credentials');
            }

            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            router.push('/dashboard');

        } catch (err) {
            console.error('[Login] Error:', err);
            setError('Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 border border-slate-100 sm:rounded-2xl sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                        Email Address
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="admin@hospital.com"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                        Password
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                            Forgot your password?
                        </a>
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />

            <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 mt-16 relative overflow-hidden">
                {/* Background Decoration - Neo-Clean */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl opacity-60"></div>
                </div>

                <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl text-white font-bold text-2xl mb-4 shadow-lg shadow-blue-900/20">
                            D
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Partner Login
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            Secure access for Hospital Administrators
                        </p>
                    </div>

                    <Suspense fallback={<div className="text-center p-4">Loading login form...</div>}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>

            <Footer />
        </div>
    );
}
