"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface InactivityConfig {
    timeoutMinutes: number;
    warningMinutes: number;
    excludeRoles?: string[];
}

export function useInactivityLogout(config: InactivityConfig) {
    const router = useRouter();
    const [showWarning, setShowWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = () => {
        // Clear existing timers
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setShowWarning(false);

        // Check if user should be excluded
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const role = payload.role || '';

                // Skip auto-logout for excluded roles (e.g., Super Admin)
                if (config.excludeRoles?.includes(role)) {
                    return;
                }
            } catch (e) {
                console.error("Token parse error in inactivity check", e);
                return;
            }
        }

        // Set warning timer (e.g., 2 minutes before logout)
        const warningTime = (config.timeoutMinutes - config.warningMinutes) * 60 * 1000;
        warningTimeoutRef.current = setTimeout(() => {
            setShowWarning(true);
            setTimeLeft(config.warningMinutes * 60);

            // Start countdown
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, warningTime);

        // Set logout timer
        const logoutTime = config.timeoutMinutes * 60 * 1000;
        timeoutRef.current = setTimeout(() => {
            console.log('🔒 Auto-logout due to inactivity');
            localStorage.removeItem('token');
            router.push('/login?reason=inactivity');
        }, logoutTime);
    };

    const extendSession = () => {
        resetTimer();
    };

    useEffect(() => {
        // Events that indicate user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        // Reset timer on any activity
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Start initial timer
        resetTimer();

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [config.timeoutMinutes, config.warningMinutes]);

    return { showWarning, timeLeft, extendSession };
}
