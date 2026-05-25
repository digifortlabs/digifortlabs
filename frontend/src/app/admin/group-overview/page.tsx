"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
    Activity, Building2, Users, FileText, IndianRupee, TrendingUp, ChevronRight, LayoutDashboard, Building, ArrowUpRight, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Sidebar from '@/components/Sidebar';
import DashboardNavbar from '@/components/DashboardNavbar';

export default function GroupOverview() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole') || '';
        setUserRole(storedRole);

        const fetchGroupStats = async () => {
            try {
                const data = await apiFetch('stats/group');
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch group stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupStats();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Synchronizing Group Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar userRole={userRole} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardNavbar userRole={userRole} />
                <main className="flex-1 overflow-y-auto p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                                <LayoutDashboard className="text-white w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {stats?.group_name || "Group Executive Overview"}
                            </h1>
                        </div>
                        <p className="text-slate-500 font-medium">
                            Aggregated performance metrics across {stats?.branch_count || 0} hospital branches.
                        </p>
                    </div>

                    {/* Metric Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard 
                            label="Total Group Patients" 
                            value={stats?.total_patients || 0} 
                            icon={<Users className="w-5 h-5" />} 
                            color="indigo" 
                        />
                        <MetricCard 
                            label="Digital Records" 
                            value={stats?.total_files || 0} 
                            icon={<FileText className="w-5 h-5" />} 
                            color="emerald" 
                        />
                        <MetricCard 
                            label="Active Group Staff" 
                            value={stats?.total_users || 0} 
                            icon={<Activity className="w-5 h-5" />} 
                            color="blue" 
                        />
                        <MetricCard 
                            label="Group Revenue (Est.)" 
                            value={`₹${(stats?.total_revenue || 0).toLocaleString()}`} 
                            icon={<IndianRupee className="w-5 h-5" />} 
                            color="amber" 
                        />
                    </div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Branch Performance List */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                                        <Building className="w-4 h-4 text-indigo-600" />
                                        Branch Comparison
                                    </h3>
                                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Full Report</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Name</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patients</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Records</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                                                <th className="px-6 py-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {stats?.branches?.map((branch: any) => (
                                                <tr key={branch.hospital_id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{branch.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium">ID: #{branch.hospital_id}</div>
                                                    </td>
                                                    <td className="px-6 py-5 font-bold text-slate-700">{branch.patient_count}</td>
                                                    <td className="px-6 py-5 font-bold text-slate-700">{branch.file_count}</td>
                                                    <td className="px-6 py-5 font-black text-slate-900 text-right">₹{branch.revenue.toLocaleString()}</td>
                                                    <td className="px-6 py-5 text-right">
                                                        <button 
                                                            onClick={() => router.push(`/admin/hospital-overview?hospital_id=${branch.hospital_id}`)}
                                                            className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                                                        >
                                                            <ChevronRight className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Side Analytics */}
                        <div className="space-y-6">
                            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="font-black uppercase tracking-widest text-[10px] text-indigo-400 mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" /> Group Health
                                    </h3>
                                    <div className="space-y-6">
                                        <HealthMetric label="Data Accuracy" value="99.4%" color="emerald" />
                                        <HealthMetric label="Platform Uptime" value="100%" color="emerald" />
                                        <HealthMetric label="Compliance Rate" value="98.2%" color="amber" />
                                    </div>
                                    <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all border border-white/10">
                                        View Security Audit
                                    </button>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-600 rounded-full blur-[80px] opacity-20"></div>
                            </div>

                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="font-black text-slate-900 uppercase tracking-wider text-[10px] mb-4">Strategic Insights</h3>
                                <div className="space-y-4">
                                    <InsightItem 
                                        title="Volume Surge" 
                                        desc="Branch A shows 15% increase in digitisation requests this week." 
                                        type="positive" 
                                    />
                                    <InsightItem 
                                        title="License Alert" 
                                        desc="Branch B has reached 90% of user seat capacity." 
                                        type="warning" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon, color }: any) {
    const colors: any = {
        indigo: 'bg-indigo-600 text-white shadow-indigo-200',
        emerald: 'bg-emerald-600 text-white shadow-emerald-200',
        blue: 'bg-blue-600 text-white shadow-blue-200',
        amber: 'bg-amber-600 text-white shadow-amber-200',
    };
    
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className={`${colors[color]} p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3 h-3" /> 4.2%
                </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mb-1">{value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
        </div>
    );
}

function HealthMetric({ label, value, color }: any) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-300">{label}</span>
                <span className={`text-xs font-black text-${color}-400`}>{value}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className={`bg-${color}-500 h-full rounded-full`} style={{ width: value }}></div>
            </div>
        </div>
    );
}

function InsightItem({ title, desc, type }: any) {
    return (
        <div className={`p-4 rounded-2xl border ${type === 'positive' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
            <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${type === 'positive' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {title}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{desc}</p>
        </div>
    );
}
