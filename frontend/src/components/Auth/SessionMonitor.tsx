"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const PUBLIC_PREFIXES = [
    '/login',
    '/register',
    '/privacy',
    '/terms',
    '/pricing',
    '/demo',
    '/legal',
    '/forgot-password',
    '/site-map',
    '/invoice-preview',
    '/about',
    '/contact',
    '/services',
];

function isPublicPath(pathname: string): boolean {
    if (pathname === '/') return true;
    return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

export default function SessionMonitor() {
    const [isExpired, setIsExpired] = useState(false);
    const pathname = usePathname();

    // Reset expired state when navigating to a public page
    useEffect(() => {
        if (pathname && isPublicPath(pathname)) {
            setIsExpired(false);
        }
    }, [pathname]);

    useEffect(() => {
        // Don't monitor public pages at all
        if (!pathname || isPublicPath(pathname)) return;

        let lastActivity = Date.now();
        const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

        const updateActivity = () => { lastActivity = Date.now(); };
        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('click', updateActivity);
        window.addEventListener('scroll', updateActivity);

        const checkSession = async () => {
            if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
                const { logout } = await import('@/config/api');
                await logout();
                return;
            }

            try {
                const { apiFetch } = await import('@/config/api');
                await apiFetch('/users/me');
            } catch (e: any) {
                // Only show expired modal if server explicitly says 401
                if (e?.status === 401) {
                    setIsExpired(true);
                }
            }
        };

        const interval = setInterval(checkSession, 300000);
        const timer = setTimeout(checkSession, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('click', updateActivity);
            window.removeEventListener('scroll', updateActivity);
        };
    }, [pathname]);

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
                    onClick={async () => { const { logout } = await import('@/config/api'); await logout(); }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-indigo-200"
                >
                    Return to Login
                </button>
            </div>
        </div>
    );
}
