"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardNavbar from '../../components/DashboardNavbar';
import MaintenanceBanner from '../../components/MaintenanceBanner';
import InactivityWarning from '../../components/InactivityWarning';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [userRole, setUserRole] = useState<string>('');
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
        const checkAuth = async () => {
            try {
                const { apiFetch } = await import('@/lib/api');
                const res = await apiFetch('/users/me');

                if (!res.ok) {
                    throw new Error("Unauthorized");
                }

                const user = await res.json();
                setUserRole(user.role || '');
                localStorage.setItem('userRole', user.role || '');

                // Force Password Change Check (if backend sends this flag in the future)
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
        return null; // or a loading spinner
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <DashboardNavbar userRole={userRole} />
            <MaintenanceBanner />
            {showWarning && <InactivityWarning timeLeft={timeLeft} onExtend={extendSession} />}
            <div className="flex-1 pt-14 px-2 sm:px-4 lg:px-6">
                {children}
            </div>
        </div>
    );
}
