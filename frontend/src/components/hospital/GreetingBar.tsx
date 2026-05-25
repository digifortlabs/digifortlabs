"use client";

import React, { useState, useEffect, ComponentType } from 'react';
import { Sunrise, Sun, Sunset, Moon, Activity, Bell } from 'lucide-react';

type LucideIcon = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

interface GreetingInfo {
    text: string;
    Icon: LucideIcon;
    colorClass: string;
    bgClass: string;
    borderClass: string;
}

function getGreetingData(hour: number): GreetingInfo {
    if (hour >= 5 && hour < 12) {
        return { text: 'Good Morning', Icon: Sunrise as LucideIcon, colorClass: 'text-amber-600', bgClass: 'bg-amber-50/80', borderClass: 'border-amber-200/60' };
    } else if (hour >= 12 && hour < 17) {
        return { text: 'Good Afternoon', Icon: Sun as LucideIcon, colorClass: 'text-orange-500', bgClass: 'bg-orange-50/80', borderClass: 'border-orange-200/60' };
    } else if (hour >= 17 && hour < 20) {
        return { text: 'Good Evening', Icon: Sunset as LucideIcon, colorClass: 'text-violet-600', bgClass: 'bg-violet-50/80', borderClass: 'border-violet-200/60' };
    } else {
        return { text: 'Good Night', Icon: Moon as LucideIcon, colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50/80', borderClass: 'border-indigo-200/60' };
    }
}

const BULLETINS = [
    "S3 Secure Storage pipeline fully connected.",
    "Real-time medical records encrypted with AES-256.",
    "Dual classification mapping: ICD-11 & SNOMED CT active.",
    "System Status: Nominal (all servers online).",
    "Database backup integrity check passed."
];

export default function GreetingBar() {
    const [hour, setHour] = useState(new Date().getHours());
    const [timeStr, setTimeStr] = useState('');
    const [hospitalName, setHospitalName] = useState('');
    const [userFullName, setUserFullName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const [isOnline, setIsOnline] = useState(true);

    // Live news bulletin state
    const [bulletinIndex, setBulletinIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const readFromStorage = () => {
            const name = localStorage.getItem('hospitalName') || localStorage.getItem('hospital_name') || '';
            const fullName = localStorage.getItem('userFullName') || '';
            const email = localStorage.getItem('userEmail') || '';
            const role = localStorage.getItem('userRole') || '';
            if (name) setHospitalName(name);
            if (fullName) setUserFullName(fullName);
            if (email) setUserEmail(email);
            if (role) setUserRole(role);
        };

        // Initial read
        readFromStorage();

        // Live clock tick
        const tick = () => {
            const now = new Date();
            setHour(now.getHours());
            setTimeStr(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
        };
        tick();
        const id = setInterval(tick, 1000);

        // Bulletin rotation timer
        const bulletinId = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setBulletinIndex((prev) => (prev + 1) % BULLETINS.length);
                setFade(true);
            }, 300);
        }, 6000);

        // Online/offline detection
        const onOnline = () => setIsOnline(true);
        const onOffline = () => setIsOnline(false);
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        setIsOnline(navigator.onLine);

        // Listen for updates dispatched by layout auth check
        const onHospitalUpdate = (e: Event) => {
            const ce = e as CustomEvent<{ name?: string; fullName?: string }>;
            if (ce.detail?.name) setHospitalName(ce.detail.name);
            if (ce.detail?.fullName) setUserFullName(ce.detail.fullName);
        };
        window.addEventListener('hospitalProfileUpdated', onHospitalUpdate);

        // Also listen to native storage events (cross-tab / same-tab writes)
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'hospitalName' && e.newValue) setHospitalName(e.newValue);
            if (e.key === 'userFullName' && e.newValue) setUserFullName(e.newValue);
            if (e.key === 'userRole' && e.newValue) setUserRole(e.newValue);
            if (e.key === 'userEmail' && e.newValue) setUserEmail(e.newValue);
        };
        window.addEventListener('storage', onStorage);

        return () => {
            clearInterval(id);
            clearInterval(bulletinId);
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
            window.removeEventListener('hospitalProfileUpdated', onHospitalUpdate);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    const { text: greetingText, Icon: GreetIcon, colorClass, bgClass, borderClass } = getGreetingData(hour);

    // Format display names elegantly
    const orgName = hospitalName;
    const personalName = userFullName || (userEmail ? userEmail.split('@')[0].replace(/\./g, ' ') : '');
    
    let formattedPersonalName = personalName;
    if (userRole === 'doctor' && personalName && !personalName.toLowerCase().startsWith('dr')) {
        formattedPersonalName = `Dr. ${personalName}`;
    }

    const displayParts = [orgName, formattedPersonalName].filter(Boolean);
    const displayName = displayParts.join(' | ') || 'Portal';
    const roleLabel = userRole.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <div className={`w-full ${bgClass} backdrop-blur-sm border-b ${borderClass} px-4 sm:px-6 lg:px-8 py-1.5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 transition-all duration-500`}>
            {/* Left: Greeting + dynamic names */}
            <div className="flex items-center gap-2 min-w-0 self-start sm:self-auto">
                <GreetIcon size={13} className={`${colorClass} flex-shrink-0`} strokeWidth={2.5} />
                <span className={`text-[11px] font-bold ${colorClass} whitespace-nowrap`}>
                    {greetingText},
                </span>
                <span className="text-[11px] font-black text-slate-700 truncate max-w-[200px] sm:max-w-xs capitalize">
                    {displayName}
                </span>
                {roleLabel && (
                    <span className="hidden md:inline-flex items-center text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white/60 border border-slate-200/60 rounded-full px-2 py-0.5 whitespace-nowrap">
                        {roleLabel}
                    </span>
                )}
            </div>

            {/* Center: Live Bulletin ticker */}
            <div className="flex items-center gap-1.5 max-w-full sm:max-w-[40%] bg-slate-900/5 px-2.5 py-0.5 rounded-full border border-slate-900/10">
                <Bell size={10} className="text-indigo-500 animate-pulse flex-shrink-0" />
                <p className={`text-[9px] font-bold text-slate-500 truncate transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                    {BULLETINS[bulletinIndex]}
                </p>
            </div>

            {/* Right: Live indicator + time */}
            <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                {/* Live pulse bullet */}
                <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isOnline ? 'Live' : 'Offline'}
                    </span>
                </div>

                {/* Clock */}
                {timeStr && (
                    <span className="text-[10px] font-bold text-slate-500 tabular-nums hidden sm:block">
                        {timeStr}
                    </span>
                )}
            </div>
        </div>
    );
}
