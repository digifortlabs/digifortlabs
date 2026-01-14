"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import DashboardNavbar from '../../components/DashboardNavbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [userRole, setUserRole] = useState<string>('');
    const [isMounted, setIsMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

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
            <div className="flex-1 pt-20 px-4 sm:px-6 lg:px-8">
                {children}
            </div>
        </div>
    );
}
