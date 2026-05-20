"use client";

import React from 'react';
import { Package, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import InventoryManager from '../accounting/components/InventoryManager';

export default function InventoryDashboard() {
    const router = useRouter();

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
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Track stock levels, manage medical consumables, and monitor supply chains.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <InventoryManager />
            </div>
        </div>
    );
}
