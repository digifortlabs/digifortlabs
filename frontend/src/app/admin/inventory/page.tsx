"use client";

import React from 'react';
import { Package, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import InventoryManager from '@/app/admin/platform-billing/components/InventoryManager';
import HospitalSelectionPrompt from '@/components/HospitalSelectionPrompt';

export default function InventoryDashboard() {
    const router = useRouter();

    return (
        <div className="px-4 sm:px-6 pb-20 pt-4 w-full mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <button 
                        onClick={() => router.push('/admin')}
                        className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-bold mb-2"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Package className="text-indigo-600 w-8 h-8" /> 
                        Platform Inventory
                    </h1>
                    <p className="text-slate-500 mt-1">Manage Digifort Labs hardware and operational stock.</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <InventoryManager />
            </div>
        </div>
    );
}
