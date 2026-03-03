"use client";

import React, { useState, useEffect } from 'react';
import {
    Activity, ChevronRight, Package, Box, Filter,
    ShoppingCart, TrendingUp, AlertTriangle, Search,
    Plus, Factory
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/config/api';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from '@/lib/formatters';

export default function PharmaDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [expiringStock, setExpiringStock] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [statsData, expiringData] = await Promise.all([
                    apiFetch(`pharma/stats`),
                    apiFetch(`pharma/stock/expiring?days=90`)
                ]);

                if (statsData) setStats(statsData);
                if (expiringData) setExpiringStock(expiringData);
            } catch (error) {
                console.error("Failed to fetch pharma dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statCards = [
        { title: "Product Catalog", value: stats?.total_medicines || 0, icon: Box, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Low Stock Items", value: stats?.low_stock_items || 0, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
        { title: "Today's Orders", value: stats?.today_sales || 0, icon: ShoppingCart, color: "text-indigo-600", bg: "bg-indigo-50" },
        { title: "Today's Revenue", value: formatCurrency(stats?.today_revenue || 0), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Factory className="w-8 h-8 text-blue-600" />
                        Pharma Manufacturing
                    </h1>
                    <p className="text-slate-500 mt-1">Manage production batches, B2B sales, and product catalogs.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => router.push('/dashboard/pharma/stock')} variant="outline" className="bg-white">
                        <Package className="w-4 h-4 mr-2" /> Log Batch
                    </Button>
                    <Button onClick={() => router.push('/dashboard/pharma/sales')} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> New B2B Sale
                    </Button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                    <Card key={idx} className="bg-white border-slate-200/60 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '-' : stat.value}</h3>
                                </div>
                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Action Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200/60 shadow-sm hover:border-blue-200 transition-colors group cursor-pointer" onClick={() => router.push('/dashboard/pharma/medicines')}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                                    <Box className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Product Master Catalog</h3>
                                    <p className="text-slate-500 text-sm">Manage all manufactured medicines, pricing, and generic compositions.</p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/60 shadow-sm hover:border-indigo-200 transition-colors group cursor-pointer" onClick={() => router.push('/dashboard/pharma/stock')}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Package className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Production Batch Tracking</h3>
                                    <p className="text-slate-500 text-sm">Log newly manufactured batches, monitor quantities, and track expiries.</p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/60 shadow-sm hover:border-emerald-200 transition-colors group cursor-pointer" onClick={() => router.push('/dashboard/pharma/sales')}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <ShoppingCart className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">B2B Distributor Sales</h3>
                                    <p className="text-slate-500 text-sm">Process wholesale orders, generate GST invoices, and track distributor purchases.</p>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                        </CardContent>
                    </Card>
                </div>

                {/* Side Panel: Alerts */}
                <div className="space-y-6">
                    <Card className="border-rose-200 shadow-sm bg-rose-50/30">
                        <CardHeader className="pb-3 border-b border-rose-100">
                            <CardTitle className="text-lg text-rose-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-600" /> Expiry Alerts (90 Days)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-rose-100 max-h-[400px] overflow-y-auto">
                                {expiringStock.length === 0 ? (
                                    <div className="p-6 text-center text-rose-700 text-sm">
                                        No batches expiring within 90 days.
                                    </div>
                                ) : (
                                    expiringStock.map((batch: any) => (
                                        <div key={batch.stock_id} className="p-4 hover:bg-white transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-slate-900 line-clamp-1">{batch.medicine?.medicine_name || `Med ID: ${batch.medicine_id}`}</span>
                                                <Badge variant="destructive" className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-none shrink-0">
                                                    {batch.quantity_remaining} left
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-slate-500">
                                                <span>Batch: {batch.batch_number}</span>
                                                <span className="text-rose-600 font-medium">{new Date(batch.expiry_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
