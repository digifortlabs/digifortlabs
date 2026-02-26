"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionMonitor() {
    const [isExpired, setIsExpired] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let lastActivity = Date.now();
        const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutes

        const updateActivity = () => {
            lastActivity = Date.now();
        };

        // Activity listeners
        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('click', updateActivity);
        window.addEventListener('scroll', updateActivity);

        const checkSession = async () => {
            // Check Idle Time
            if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
                // If idle, explicitly logout to clear cookie
                try {
                    const { apiFetch } = await import('@/lib/api');
                    await apiFetch('/auth/logout', { method: 'POST' });
                } catch (e) { }
                localStorage.removeItem('userRole');
                localStorage.removeItem('userEmail');
                router.push('/login?error=Session timed out due to inactivity.');
                return;
            }

            // Ping backend to verify if HttpOnly cookie session is still alive
            try {
                const { apiFetch } = await import('@/lib/api');
                const res = await apiFetch('/users/me');
                if (res.status === 401) {
                    setIsExpired(true);
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('userEmail');
                }
            } catch (e) {
                console.error("Session monitor ping failed", e);
            }
        };

        // Check every 5 minutes (300000 ms) instead of every second
        // Less intrusive now that we rely on backend state
        const interval = setInterval(checkSession, 300000);

        // Initial check deferred briefly to let main page load
        setTimeout(checkSession, 5000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('click', updateActivity);
            window.removeEventListener('scroll', updateActivity);
        };
    }, [router]);

    if (!isExpired) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 text-center animate-in zoom-in-95 duration-300 transform">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Session Expired</h3>
                <p className="text-sm text-slate-500 mb-6 font-medium">Your session has expired or your permissions have changed. Please log in again to continue.</p>
                <button
                    onClick={() => router.push('/login')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-indigo-200"
                >
                    Return to Login
                </button>
            </div>
        </div>
    );
}
