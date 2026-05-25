"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import HospitalNavbar from '@/components/hospital/HospitalNavbar';
import GreetingBar from '@/components/hospital/GreetingBar';
import MaintenanceBanner from '@/components/MaintenanceBanner';
import GlobalPatientRegister from '@/components/GlobalPatientRegister';

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        // Consume cross-subdomain auth handoff hash
        if (window.location.hash.startsWith('#_auth=')) {
            try {
                const raw = window.location.hash.slice('#_auth='.length);
                const encoded = raw.split('#')[0];
                const payload = JSON.parse(atob(encoded));
                if (payload.access_token) localStorage.setItem('access_token', payload.access_token);
                if (payload.userRole) localStorage.setItem('userRole', payload.userRole);
                if (payload.userEmail) localStorage.setItem('userEmail', payload.userEmail);
                if (payload.userSpecialty) localStorage.setItem('userSpecialty', payload.userSpecialty);
                if (payload.userModules) localStorage.setItem('userModules', JSON.stringify(payload.userModules));
                if (payload.userTerminology) localStorage.setItem('userTerminology', JSON.stringify(payload.userTerminology));
                if (payload.loginTime) localStorage.setItem('loginTime', payload.loginTime.toString());
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch (e) {
                console.warn('[Hospital Auth] Failed to parse auth handoff:', e);
            }
        }

        const checkAuth = async () => {
            try {
                const { apiFetch } = await import('@/config/api');
                const user = await apiFetch('/users/me');

                const role = user.role || '';
                setUserRole(role);
                localStorage.setItem('userRole', role);
                if (user.email) localStorage.setItem('userEmail', user.email);
                if (user.hospital_id) localStorage.setItem('hospital_id', user.hospital_id.toString());
                if (user.hospital) {
                    if (user.hospital.specialty) localStorage.setItem('userSpecialty', user.hospital.specialty);
                    if (user.hospital.enabled_modules) localStorage.setItem('userModules', JSON.stringify(user.hospital.enabled_modules));
                    if (user.hospital.terminology) localStorage.setItem('userTerminology', JSON.stringify(user.hospital.terminology));
                }

                // Store hospital name — check every known field shape from the API
                const hName = (
                    user.hospital_name ||
                    user.hospital?.legal_name ||
                    user.hospital?.name ||
                    ''
                );
                if (hName) {
                    localStorage.setItem('hospitalName', hName);
                }
                if (user.full_name) {
                    localStorage.setItem('userFullName', user.full_name);
                }
                window.dispatchEvent(new CustomEvent('hospitalProfileUpdated', { detail: { name: hName || '', fullName: user.full_name || '' } }));

                // Redirect wrong roles away
                const hospitalRoles = ['hospital_admin', 'hospital_staff', 'mrd_staff', 'account_staff', 'nurse_ipd', 'doctor_ipd', 'doctor_opd'];
                if (!hospitalRoles.includes(role)) {
                    router.replace('/login');
                    return;
                }
            } catch {
                ['access_token','userRole','userEmail','userSpecialty','userModules',
                 'userTerminology','loginTime','hospital_id','globalHospitalId',
                 'mrd_hospital_id','dental_hospital_id','ent_hospital_id',
                 'clinic_hospital_id','hms_hospital_id','inventory_hospital_id',
                 'userGroupId','sidebarCollapsed'].forEach(k => localStorage.removeItem(k));
                router.push('/login');
                return;
            }
            setIsAuthReady(true);
        };

        checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Route protection — admin-only pages
    useEffect(() => {
        if (!userRole || !pathname) return;
        if (userRole !== 'hospital_admin') {
            if (pathname === '/accounting' || pathname === '/settings' || pathname.startsWith('/accounting/') || pathname.startsWith('/settings/')) {
                router.replace('/hospital');
            }
        }
    }, [pathname, userRole, router]);

    if (!isAuthReady) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Verifying session…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-500/30 flex">
            {/* Ambient background gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/80 to-transparent" />
                <div className="absolute -top-[200px] -right-[200px] w-[800px] h-[800px] bg-blue-400/5 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -left-[200px] w-[600px] h-[600px] bg-teal-400/5 rounded-full blur-[100px]" />
            </div>

            <HospitalNavbar />

            <div className="relative z-10 flex-1 flex flex-col min-h-screen lg:pl-72 transition-all duration-300">
                {/* Sticky greeting bar — always visible on every hospital page */}
                <div className="sticky top-0 z-30">
                    <MaintenanceBanner />
                    <GreetingBar />
                </div>

                <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in duration-700">
                    {children}
                    <GlobalPatientRegister />
                </main>

                <footer className="py-6 text-center text-slate-400 text-xs font-medium border-t border-slate-200/40">
                    &copy; {new Date().getFullYear()} Digifort Labs. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
