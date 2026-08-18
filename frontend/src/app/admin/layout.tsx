"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardNavbar from '../../components/DashboardNavbar';
import Sidebar from '../../components/Sidebar';
import MaintenanceBanner from '../../components/MaintenanceBanner';
import InactivityWarning from '../../components/InactivityWarning';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import GlobalPatientRegister from '@/components/GlobalPatientRegister';
import GreetingBar from '@/components/hospital/GreetingBar';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [userRole, setUserRole] = useState<string>('');
    const [hospitalSlug, setHospitalSlug] = useState<string>('');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    // Inactivity auto-logout (30 min timeout, 2 min warning)
    // Excludes Super Admins
    const { showWarning, timeLeft, extendSession } = useInactivityLogout({
        timeoutMinutes: 30,
        warningMinutes: 2,
        excludeRoles: ['superadmin'],
        forcedRoles: ['hospital_admin', 'mrd_staff']
    });

    // On mount: consume cross-subdomain hash handoff FIRST, then verify session.
    // Both steps happen in one effect so the token is in localStorage before any
    // child component fires its own API calls.
    useEffect(() => {
        // Step 1 — consume hash token synchronously (localStorage write happens before any await)
        if (window.location.hash.startsWith('#_auth=')) {
            try {
                // Extract only the first #_auth= segment (guard against double-handoff URLs)
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
                console.warn('[Auth] Failed to parse auth handoff payload:', e);
            }
        }

        // Step 2 — resolve hospital subdomain slug
        const host = window.location.host;
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';
        const hostname = host.replace(/:\d+$/, '').replace('.localhost', `.${rootDomain}`);
        const parts = hostname.split('.');
        const subdomain = parts.length > 2 ? parts[0] : '';
        if (subdomain && subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'dashboard') {
            setHospitalSlug(subdomain);
        }

        // Step 3 — verify session with backend (token is guaranteed in localStorage now)
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

                const hName = (
                    user.hospital_name ||
                    user.hospital?.legal_name ||
                    user.hospital?.name ||
                    ''
                );
                if (hName) localStorage.setItem('hospitalName', hName);
                if (user.full_name) localStorage.setItem('userFullName', user.full_name);
                window.dispatchEvent(new CustomEvent('hospitalProfileUpdated', { detail: { name: hName || '', fullName: user.full_name || '' } }));

                if (user.force_password_change && pathname !== '/admin/settings') {
                    router.replace('/admin/settings');
                }
            } catch (e) {
                console.error("Auth check failed", e);
                // Clear stale token before redirecting so login page starts fresh
                ['access_token','userRole','userEmail','userSpecialty','userModules',
                 'userTerminology','loginTime','hospital_id','globalHospitalId',
                 'mrd_hospital_id', 'dental_hospital_id', 'ent_hospital_id', 'clinic_hospital_id', 'hms_hospital_id', 'inventory_hospital_id',
                 'userGroupId','sidebarCollapsed'].forEach(k => localStorage.removeItem(k));
                router.push('/login');
                return;
            }
            // Only render children after auth is confirmed
            setIsAuthReady(true);
        };

        checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Route protection guard — runs on navigation, uses cached role from state
    useEffect(() => {
        if (!userRole || !pathname) return;

        const isSuperAdmin = userRole === 'superadmin' || userRole === 'superadmin_staff' || userRole === 'website_admin';
        
        if (!isSuperAdmin) {
            router.replace('/login');
        }
    }, [pathname, userRole, router]);

    if (!isAuthReady) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* Sidebar - Always on top left for Desktop */}
            <Sidebar userRole={userRole} hospitalSlug={hospitalSlug} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Navbar - Sticky to top of content area (Mobile Only) */}
                <div className="md:hidden">
                    <DashboardNavbar userRole={userRole} />
                </div>
                <GreetingBar />
                
                <div className="flex-1 overflow-y-auto bg-white relative">
                    <MaintenanceBanner />
                    {showWarning && <InactivityWarning timeLeft={timeLeft} onExtend={extendSession} />}
                    
                    <main className="p-4 md:p-6">
                        {children}
                    </main>
                </div>
            </div>

            <GlobalPatientRegister />
        </div>
    );
}
