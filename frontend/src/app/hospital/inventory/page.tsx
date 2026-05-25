"use client";

import React from 'react';
import { Package, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import InventoryManager from '@/app/admin/platform-billing/components/InventoryManager';
import HospitalSelectionPrompt from '@/components/HospitalSelectionPrompt';

export default function InventoryDashboard() {
    const router = useRouter();
    const [userRole, setUserRole] = React.useState<string>('');
    const [selectedHospitalId, setSelectedHospitalId] = React.useState<number | null>(null);

    React.useEffect(() => {
        const role = localStorage.getItem('userRole') || '';
        setUserRole(role);
        const saved = localStorage.getItem('inventory_hospital_id');
        if (saved) setSelectedHospitalId(Number(saved));

        const handleHospitalChanged = (e: any) => {
            if (e.detail?.storageKey === 'inventory_hospital_id') {
                setSelectedHospitalId(e.detail.hospitalId ? Number(e.detail.hospitalId) : null);
            } else if (typeof e.detail === 'string' || typeof e.detail === 'number') {
                setSelectedHospitalId(e.detail ? Number(e.detail) : null);
            }
        };
        window.addEventListener('hospitalChanged', handleHospitalChanged);
        return () => window.removeEventListener('hospitalChanged', handleHospitalChanged);
    }, []);

    if (['website_admin', 'superadmin', 'superadmin_staff'].includes(userRole) && !selectedHospitalId) {
        return <HospitalSelectionPrompt requiredModule="inventory" storageKey="inventory_hospital_id" onSelect={setSelectedHospitalId} />;
    }

    return (
        <div className="px-4 sm:px-6 pb-20 pt-4 w-full mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold mb-2"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Package className="text-indigo-600 w-8 h-8" /> 
                        Inventory Management
                    </h1>
                    <p className="text-slate-500 mt-1">Manage pharmacy, lab supplies, and general inventory items.</p>
                </div>
                
                {['website_admin', 'superadmin', 'superadmin_staff'].includes(userRole) && selectedHospitalId && (
                    <button
                        onClick={() => {
                            setSelectedHospitalId(null);
                            localStorage.removeItem('inventory_hospital_id');
                        }}
                        className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-bold transition-colors"
                    >
                        Change Hospital
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <InventoryManager />
            </div>
        </div>
    );
}
