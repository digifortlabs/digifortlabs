"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pill, Activity, ShoppingCart, Truck, PackagePlus } from "lucide-react";

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: "OPD Prescriptions", href: "/hospital/pharmacy", icon: Pill },
        { name: "IPD Orders", href: "/hospital/pharmacy/ipd-orders", icon: Activity },
        { name: "POS / Direct Sales", href: "/hospital/pharmacy/pos", icon: ShoppingCart },
        { name: "Sales History", href: "/hospital/pharmacy/sales-history", icon: Activity },
        { name: "Purchase & Inward", href: "/hospital/pharmacy/purchases", icon: PackagePlus },
        { name: "Suppliers", href: "/hospital/pharmacy/suppliers", icon: Truck },
    ];

    return (
        <div className="min-h-full bg-slate-50 flex flex-col">
            {/* Pharmacy Sub-Navigation */}
            <div className="bg-white border-b border-slate-200 sticky top-16 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center gap-8 h-14 overflow-x-auto">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href;
                            const Icon = tab.icon;
                            return (
                                <Link
                                    key={tab.name}
                                    href={tab.href}
                                    className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                                        isActive 
                                            ? "border-emerald-600 text-emerald-700" 
                                            : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
