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
        
        // Extract hospital slug from subdomain
        const host = window.location.host;
        const parts = host.split('.');
        const subdomain = parts.length > 2 ? parts[0] : '';
        if (subdomain && subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'dashboard') {
            setHospitalSlug(subdomain);
            console.log(`Scoped to hospital: ${subdomain}`);
        }

        const checkAuth = async () => {
            try {
                const { apiFetch } = await import('@/lib/api');
                const res = await apiFetch('/users/me');

                if (!res.ok) {
                    throw new Error("Unauthorized");
                }

                const user = await res.json();
                const role = user.role || '';
                setUserRole(role);
                localStorage.setItem('userRole', role);

                // --- Route Protection Guard ---
                const isSuperAdmin = role === 'superadmin' || role === 'superadmin_staff' || role === 'website_admin';
                const isHospitalAdmin = role === 'hospital_admin';
                const isStaff = role === 'hospital_staff' || role === 'mrd_staff' || role === 'website_staff' || role === 'data_uploader' || role === 'warehouse_manager';
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
