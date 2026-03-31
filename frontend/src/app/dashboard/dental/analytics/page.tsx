"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, TrendingUp, TrendingDown, DollarSign, Activity, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { cn } from '@/lib/utils';
// Assuming recharts is installed, creating a fallback if not 
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

interface AnalyticsData {
    total_realized: number;
    pipeline_revenue: number;
    total_planned: number;
    completion_rate: number;
    revenue_by_type: { name: string, value: number }[];
    monthly_trend: { month: string, revenue: number }[];
}

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

export default function AnalyticsDashboard() {
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await apiFetch('dental/analytics/revenue');
                if (res) setData(res);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading || !data) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen text-slate-500">
                <Activity className="w-6 h-6 animate-spin mr-2" /> Loading Analytics...
            </div>
        );
    }

    // Format currency
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/dental')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Revenue Analytics</h1>
                        <p className="text-slate-500 mt-1">Financial performance and treatment pipeline tracking.</p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-900 to-blue-800 text-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <DollarSign className="w-5 h-5 text-blue-100" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-blue-100/80 text-sm font-medium">Realized Revenue</p>
                            <h3 className="text-3xl font-bold mt-1 tracking-tight">{formatCurrency(data.total_realized)}</h3>
                            <p className="text-xs text-blue-200 mt-2 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> All completed treatments
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-amber-50 rounded-lg">
                                <Activity className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-slate-500 text-sm font-medium">Pipeline Revenue</p>
                            <h3 className="text-3xl font-bold mt-1 tracking-tight text-slate-900">{formatCurrency(data.pipeline_revenue)}</h3>
                            <p className="text-xs text-slate-400 mt-2">Planned / In-progress treatments</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-slate-500 text-sm font-medium">Total Proposed</p>
                            <h3 className="text-3xl font-bold mt-1 tracking-tight text-slate-900">{formatCurrency(data.total_planned)}</h3>
                            <p className="text-xs text-slate-400 mt-2">From all active treatment plans</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div className={cn("p-2 rounded-lg", data.completion_rate > 50 ? "bg-emerald-50" : "bg-rose-50")}>
                                {data.completion_rate > 50 ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-rose-600" />}
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-slate-500 text-sm font-medium">Treatment Completion Rate</p>
                            <h3 className="text-3xl font-bold mt-1 tracking-tight text-slate-900">{data.completion_rate}%</h3>
                            <p className="text-xs text-slate-400 mt-2">Completed vs. Total treatments</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Realized Revenue Trend</CardTitle>
                        <CardDescription>Last 6 active months of completed treatments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            {data.monthly_trend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.monthly_trend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748B', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748B', fontSize: 12 }}
                                            tickFormatter={(val) => `₹${val / 1000}k`}
                                            dx={-10}
                                        />
                                        <RechartsTooltip
                                            formatter={(value: any) => [formatCurrency(Number(value || 0)), "Revenue"]}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#1e40af"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#1e40af', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">No trend data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue by Treatment Type */}
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Top Revenue by Procedure</CardTitle>
                        <CardDescription>Highest generating treatments (Realized).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            {data.revenue_by_type.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.revenue_by_type}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {data.revenue_by_type.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value || 0))} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center">
                                    <PieChartIcon className="w-12 h-12 mb-2 opacity-20" />
                                    No procedure data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
