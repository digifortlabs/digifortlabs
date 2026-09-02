"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import HospitalNavbar from '@/components/hospital/HospitalNavbar';
import GreetingBar from '@/components/hospital/GreetingBar';
import MaintenanceBanner from '@/components/MaintenanceBanner';
import GlobalPatientRegister from '@/components/GlobalPatientRegister';
import DashboardSkeleton from '@/components/ui/DashboardSkeleton';

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved !== null) {
            setSidebarCollapsed(saved === 'true');
        }

        const handleCollapseChange = (e: Event) => {
            const customEvent = e as CustomEvent;
            setSidebarCollapsed(customEvent.detail?.collapsed ?? false);
        };

        window.addEventListener('hospitalSidebarCollapseChange', handleCollapseChange as EventListener);
        return () => {
            window.removeEventListener('hospitalSidebarCollapseChange', handleCollapseChange as EventListener);
        };
    }, []);

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
                
                if (user.dynamic_permissions) {
                    localStorage.setItem('userDynamicPermissions', JSON.stringify(user.dynamic_permissions));
                } else {
                    localStorage.removeItem('userDynamicPermissions');
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
                const hospitalRoles = ['hospital_admin', 'hospital_staff', 'mrd_staff', 'account_staff', 'nurse_ipd', 'doctor_ipd', 'doctor_opd', 'doctor_both', 'reception_staff'];
                if (!hospitalRoles.includes(role)) {
                    router.replace('/login');
                    return;
                }

                // Onboarding Interception
                if (role === 'hospital_admin' && user.hospital && user.hospital.is_onboarded === false) {
                    if (pathname !== '/hospital/onboarding') {
                        router.replace('/hospital/onboarding');
                        return;
                    }
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
        
        // Let onboarding page bypass these generic protections
        if (pathname === '/hospital/onboarding') return;

        if (userRole !== 'hospital_admin') {
            if (pathname === '/accounting' || pathname === '/settings' || pathname.startsWith('/accounting/') || pathname.startsWith('/settings/')) {
                router.replace('/hospital');
            }
        }

        // Module access protection based on tenant's enabled_modules
        const modulesStr = localStorage.getItem('userModules');
        if (modulesStr) {
            try {
                const modules = JSON.parse(modulesStr) as string[];
                const moduleMap: Record<string, string> = {
                    '/hospital/dental': 'dental',
                    '/hospital/ent': 'ent',
                    '/hospital/inventory': 'inventory',
                    '/hospital/billing': 'accounting',
                    '/hospital/accounting': 'accounting',
                    '/hospital/maternity': 'maternity',
                    '/hospital/pharmacy': 'pharmacy',
                    '/hospital/lab': 'lab'
                };
                for (const [pathPrefix, moduleName] of Object.entries(moduleMap)) {
                    if (pathname.startsWith(pathPrefix) && !modules.includes(moduleName)) {
                        console.warn(`[Module Protection] Blocked access to ${pathPrefix}. Missing module: ${moduleName}`);
                        router.replace('/hospital');
                        return;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse userModules', e);
            }
        }
    }, [pathname, userRole, router]);

    if (!isAuthReady) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-blue-500/30 flex">

            <HospitalNavbar />

            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'}`}>
                {/* Sticky greeting bar — always visible on every hospital page */}
                <div className="sticky top-0 z-30">
                    <MaintenanceBanner />
                    <GreetingBar />
                </div>

                <main className="flex-1 w-full p-4 sm:p-6 animate-in fade-in duration-700">
                    {children}
                </main>

                <footer className="py-6 text-center text-slate-400 text-xs font-medium border-t border-slate-200/40">
                    &copy; {new Date().getFullYear()} Digifort Labs. All rights reserved.
                </footer>
            </div>
            
            <GlobalPatientRegister />
        </div>
    );
}
