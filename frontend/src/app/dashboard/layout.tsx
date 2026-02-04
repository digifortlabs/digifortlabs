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
        excludeRoles: ['superadmin']
    });

    useEffect(() => {
        setIsMounted(true);
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role || '');

                // Force Password Change Check
                if (payload.force_password_change && pathname !== '/dashboard/settings') {
                    // Prevent navigation away
                    router.replace('/dashboard/settings');
                }

            } catch (e) {
                console.error("Invalid token format", e);
            }
        }
    }, [pathname]);

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
