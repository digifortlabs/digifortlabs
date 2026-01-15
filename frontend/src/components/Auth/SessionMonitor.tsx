"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionMonitor() {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showCountdown, setShowCountdown] = useState(false);
    const router = useRouter();

    const parseJwt = (token: string) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        const checkToken = () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setShowCountdown(false);
                setTimeLeft(null);
                return;
            }

            const decoded = parseJwt(token);
            if (!decoded || !decoded.exp) {
                return;
            }

            const expiry = decoded.exp * 1000;
            const now = Date.now();
            const diff = Math.floor((expiry - now) / 1000);

            if (diff <= 0) {
                // Token already expired
                localStorage.removeItem('token');
                router.push('/login?error=Session expired. Please log in again.');
                return;
            }

            if (diff <= 60) {
                setShowCountdown(true);
                setTimeLeft(diff);
            } else {
                setShowCountdown(false);
                setTimeLeft(null);
            }
        };

        // Check every second
        const interval = setInterval(checkToken, 1000);
        checkToken();

        return () => clearInterval(interval);
    }, [router]);

    if (!showCountdown || timeLeft === null) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-bounce">
            <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl border-4 border-white flex flex-col items-center gap-1 min-w-[200px]">
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Session Expiring In</span>
                <span className="text-3xl font-black">{timeLeft}s</span>
                <button
                    onClick={() => router.push('/login')}
                    className="mt-2 text-[10px] bg-white text-red-600 px-3 py-1 rounded-full font-bold hover:bg-red-50"
                >
                    RE-AUTHENTICATE NOW
                </button>
            </div>
        </div>
    );
}
