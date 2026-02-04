"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface InactivityConfig {
    timeoutMinutes: number;
    warningMinutes: number;
    excludeRoles?: string[];
    forcedRoles?: string[]; // Roles that must confirm session regardless of activity
}

export function useInactivityLogout(config: InactivityConfig) {
    const router = useRouter();
    const [showWarning, setShowWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = (isActivity: boolean = false) => {
        // Get Role
        const token = localStorage.getItem('token');
        let role = '';
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                role = payload.role || '';
            } catch (e) {
                console.error("Token parse error in inactivity check", e);
            }
        }

        // If this is a natural activity event (mouse/keyboard) AND 
        // the user role is in forcedRoles, DO NOT reset the timer.
        if (isActivity && config.forcedRoles?.includes(role)) {
            return;
        }

        // Clear existing timers
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setShowWarning(false);

        // Check if user should be excluded
        if (role && config.excludeRoles?.includes(role)) {
            return;
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
        resetTimer(false); // Forced reset on explicit confirmation
    };

    useEffect(() => {
        // Events that indicate user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        // Reset timer on any activity (only for non-forced roles)
        const activityHandler = () => resetTimer(true);

        events.forEach(event => {
            window.addEventListener(event, activityHandler);
        });

        // Start initial timer
        resetTimer(false);

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, activityHandler);
            });
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [config.timeoutMinutes, config.warningMinutes]);

    return { showWarning, timeLeft, extendSession };
}
