"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Info, X } from 'lucide-react';
import { API_URL } from '@/config/api';

export default function MaintenanceBanner() {
    const router = useRouter();
    const [settings, setSettings] = useState<{ maintenance_mode?: string; announcement?: string } | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [userRole, setUserRole] = useState<string>('');
    const [showMaintenanceWarning, setShowMaintenanceWarning] = useState(false);
    const logoutScheduledRef = useRef(false); // Prevent multiple logout attempts

    useEffect(() => {
        // Get user role from token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role || '');
            } catch (e) {
                console.error("Invalid token", e);
            }
        }

        // Fetch platform settings
        async function fetchSettings() {
            try {
                const res = await fetch(`${API_URL}/platform/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);

                    // AUTO-LOGOUT: If maintenance mode is ON and user is NOT Super Admin
                    if (data.maintenance_mode === 'true' && !logoutScheduledRef.current) {
                        const token = localStorage.getItem('token');
                        if (token) {
                            try {
                                const payload = JSON.parse(atob(token.split('.')[1]));
                                const role = payload.role || '';

                                // Logout all users except Super Admins
                                if (role !== 'superadmin') {
                                    console.log('🔒 Maintenance mode detected - showing warning before logout');
                                    logoutScheduledRef.current = true; // Mark logout as scheduled
                                    setShowMaintenanceWarning(true);

                                    // Give user 3 seconds to see the message before logout
                                    setTimeout(() => {
                                        localStorage.removeItem('token');
                                        router.push('/login?reason=maintenance');
                                    }, 3000);
                                }
                            } catch (e) {
                                console.error("Token parse error during maintenance check", e);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch platform settings:", error);
            }
        }
        fetchSettings();

        // Poll every 30 seconds for updates
        const interval = setInterval(fetchSettings, 30000);
        return () => clearInterval(interval);
    }, [router]);

    if (!settings || dismissed) return null;

    const isMaintenanceMode = settings.maintenance_mode === 'true';
    const hasAnnouncement = settings.announcement && settings.announcement.trim().length > 0;
    const isSuperAdmin = userRole === 'superadmin';

    // Don't show anything if there's no maintenance mode and no announcement
    if (!isMaintenanceMode && !hasAnnouncement) return null;

    // Show maintenance banner to everyone if maintenance mode is on
    const showMaintenanceBanner = isMaintenanceMode || showMaintenanceWarning;
    // Show announcement banner to everyone when there's an announcement (and no maintenance mode)
    const showAnnouncementBanner = hasAnnouncement && !isMaintenanceMode;

    return (
        <>
            {/* Maintenance Mode Banner */}
            {showMaintenanceBanner && (
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 shadow-lg relative animate-in slide-in-from-top duration-300">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <AlertTriangle size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <p className="font-bold text-sm">🔧 System Maintenance in Progress</p>
                                <p className="text-xs opacity-90">
                                    {isSuperAdmin
                                        ? "All users except Super Admins have been automatically logged out and blocked from accessing the system."
                                        : "The system is currently under maintenance. You will be logged out shortly. Please try again later."}
                                </p>
                            </div>
                        </div>
                        {isSuperAdmin && (
                            <button
                                onClick={() => setDismissed(true)}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label="Dismiss"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Announcement Banner */}
            {showAnnouncementBanner && (
                <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-3 shadow-lg relative animate-in slide-in-from-top duration-300">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white/20 rounded-lg">
                                <Info size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">📢 System Announcement</p>
                                <p className="text-xs opacity-90">{settings.announcement}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Dismiss"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
