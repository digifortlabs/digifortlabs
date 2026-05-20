"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardNavbar from '../../components/DashboardNavbar';
import Sidebar from '../../components/Sidebar';
import MaintenanceBanner from '../../components/MaintenanceBanner';
import InactivityWarning from '../../components/InactivityWarning';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import GlobalPatientRegister from '@/components/GlobalPatientRegister';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [userRole, setUserRole] = useState<string>('');
    const [hospitalSlug, setHospitalSlug] = useState<string>('');
    const [isMounted, setIsMounted] = useState(false);
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

    useEffect(() => {
        setIsMounted(true);

        // ── Cross-subdomain auth handoff ───────────────────────────────────────
        // When the login page redirects to a different subdomain (e.g. admin.localhost)
        // it encodes the session payload in the URL hash as #_auth=<base64>.
        // We consume it here, populate localStorage, and clean the URL immediately.
        if (typeof window !== 'undefined' && window.location.hash.startsWith('#_auth=')) {
            try {
                const encoded = window.location.hash.replace('#_auth=', '');
                const payload = JSON.parse(atob(encoded));
                if (payload.access_token) localStorage.setItem('access_token', payload.access_token);
                if (payload.userRole) localStorage.setItem('userRole', payload.userRole);
                if (payload.userEmail) localStorage.setItem('userEmail', payload.userEmail);
                if (payload.userSpecialty) localStorage.setItem('userSpecialty', payload.userSpecialty);
                if (payload.userModules) localStorage.setItem('userModules', JSON.stringify(payload.userModules));
                if (payload.userTerminology) localStorage.setItem('userTerminology', JSON.stringify(payload.userTerminology));
                if (payload.loginTime) localStorage.setItem('loginTime', payload.loginTime.toString());
                // Remove hash from URL without adding to browser history
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                console.log('[Auth] Cross-subdomain token handoff consumed successfully.');
            } catch (e) {
                console.warn('[Auth] Failed to parse auth handoff payload:', e);
            }
        }
        // ── End handoff ────────────────────────────────────────────────────────
        
        // Extract hospital slug from subdomain
        const host = window.location.host;
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';
        const hostname = host.replace(/:\d+$/, '').replace('.localhost', `.${rootDomain}`);
        const parts = hostname.split('.');
        const subdomain = parts.length > 2 ? parts[0] : '';
        if (subdomain && subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'dashboard') {
            setHospitalSlug(subdomain);
            console.log(`Scoped to hospital: ${subdomain}`);
        }

        const checkAuth = async () => {
            try {
                // Use config/api so the URL goes through getApiUrl() dynamically
                // (avoids the lib/api module-level URL cache issue)
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

                // --- Route Protection Guard ---
                const isSuperAdmin = role === 'superadmin' || role === 'superadmin_staff' || role === 'website_admin';
                const isHospitalAdmin = role === 'hospital_admin';
                const isAdmin = isSuperAdmin || isHospitalAdmin;
                const path = pathname || '';

                // 1. Platform Level Protection (Hospitals, Global Settings)
                if (path.includes('/dashboard/hospitals') && !isSuperAdmin) {
                    router.replace('/dashboard');
                }

                // 2. Financial Protection (Accounting, Billing)
                if ((path.includes('/dashboard/accounting') || path.includes('/dashboard/billing')) && !isAdmin) {
                    router.replace('/dashboard');
                }

                // 3. User Management Protection
                if (path.includes('/dashboard/user_mgmt') && !isAdmin) {
                    router.replace('/dashboard');
                }

                // Force Password Change Check
                if (user.force_password_change && pathname !== '/dashboard/settings') {
                    router.replace('/dashboard/settings');
                }
            } catch (e) {
                console.error("Auth check failed", e);
                localStorage.removeItem('userRole');
                localStorage.removeItem('userEmail');
                router.push('/login');
            }
        };

        checkAuth();
    }, [pathname, router]);

    if (!isMounted) {
        return null; 
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-950">
            {/* Sidebar - Always on top left for Desktop */}
            <Sidebar userRole={userRole} hospitalSlug={hospitalSlug} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Navbar - Sticky to top of content area */}
                <DashboardNavbar userRole={userRole} />
                
                <div className="flex-1 overflow-y-auto bg-slate-50 relative">
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
