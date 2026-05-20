"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { 
    Activity, 
    Building2, 
    Users, 
    FileText, 
    IndianRupee, 
    TrendingUp, 
    ShieldCheck, 
    Clock, 
    ArrowRight,
    ArrowUpRight,
    ChevronRight,
    LayoutDashboard,
    ScanLine,
    Package,
    AppWindow,
    Database
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDateTime } from '@/lib/dateFormatter';
import { useTerminology } from '@/hooks/useTerminology';

export default function HospitalOverview() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hospitalId = searchParams?.get('hospital_id');
    const { terms } = useTerminology();
    
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hospitalInfo, setHospitalInfo] = useState<any>(null);

    useEffect(() => {
        if (!hospitalId) {
            router.push('/dashboard');
            return;
        }

        const fetchOverviewData = async () => {
            setIsLoading(true);
            try {
                // Fetch basic hospital info
                const hospitalData = await apiFetch(`/hospitals/${hospitalId}`);
                setHospitalInfo(hospitalData);

                // Fetch specialized dashboard stats for this hospital
                const dashboardStats = await apiFetch(`/stats/dashboard?hospital_id=${hospitalId}`);
                setStats(dashboardStats);
            } catch (error) {
                console.error("Failed to fetch hospital overview:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOverviewData();
    }, [hospitalId, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Assembling Command Center...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 pb-20 pt-0 w-full mx-auto animate-in fade-in duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors"
                        >
                            Global Platform
                        </button>
                        <ChevronRight size={12} className="text-slate-300" />
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Hospital Command Center</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight flex items-center gap-3">
                        <Building2 className="text-indigo-600 w-8 h-8 sm:w-10 sm:h-10" />
                        {hospitalInfo?.legal_name || "Hospital Overview"}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Operational intelligence and multi-module performance monitoring.
                    </p>
                </div>

                <div className="flex gap-2">
                    <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <ShieldCheck size={18} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">System Status</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs font-black text-emerald-600 leading-none">OPERATIONAL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Metrics: Large Command Center Style Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricHeroCard 
                    label={`Total ${terms.patient}s`}
                    value={stats?.patients?.total || 0}
                    subValue={`${stats?.patients?.trend || "+0%"} growth`}
                    icon={<Users size={24} />}
                    color="indigo"
                />
                <MetricHeroCard 
                    label="Active Staff"
                    value={stats?.staff_active || 0}
                    subValue="Currently Online"
                    icon={<Activity size={24} />}
                    color="blue"
                />
                <MetricHeroCard 
                    label="Pending Actions"
                    value={stats?.requests?.pending || 0}
                    subValue="Action Required"
                    icon={<FileText size={24} />}
                    color="amber"
                />
                <MetricHeroCard 
                    label="Monthly Revenue"
                    value={stats?.billing?.total_collected ? `₹${stats.billing.total_collected.toLocaleString()}` : "₹0"}
                    subValue="April 2026"
                    icon={<IndianRupee size={24} />}
                    color="emerald"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Center Column: Module Health & Entry Points */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <LayoutDashboard size={16} className="text-indigo-600" />
                                Module Deployment
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ModuleAccessCard 
                                name="Medical Records (MRD)"
                                desc="Patient file digitization and UHID management."
                                stats={`${stats?.patients?.total || 0} Files Digitized`}
                                status="active"
                                icon={<Database />}
                                href={`/dashboard/records?hospital_id=${hospitalId}`}
                            />
                            <ModuleAccessCard 
                                name="Physical Archive"
                                desc="Warehouse tracking and physical box inventory."
                                stats={`${stats?.warehouse?.open_boxes || 0} Active Boxes`}
                                status="active"
                                icon={<Package />}
                                href={`/dashboard/archive?hospital_id=${hospitalId}`}
                            />
                            <ModuleAccessCard 
                                name="Billing & Accounting"
                                desc="Revenue tracking, aging reports, and invoicing."
                                stats="Updated 2m ago"
                                status="active"
                                icon={<IndianRupee />}
                                href={`/dashboard/accounting?hospital_id=${hospitalId}`}
                            />
                            <ModuleAccessCard 
                                name="Specialty Units"
                                desc="Dental, ENT, and Clinical workstation access."
                                stats="3 Active Units"
                                status="active"
                                icon={<AppWindow />}
                                href={`/dashboard/clinic?hospital_id=${hospitalId}`}
                            />
                        </div>
                    </div>

                    {/* Data Intake Trend Chart */}
                    <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={16} className="text-indigo-400" />
                                Data Ingestion Trend
                            </h2>
                            <div className="text-[10px] font-bold text-slate-400 uppercase bg-white/5 px-2 py-1 rounded">Last 7 Days</div>
                        </div>
                        {stats?.activity_trend && stats.activity_trend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={stats.activity_trend}>
                                    <defs>
                                        <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 10, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis hide={true} />
                                    <Tooltip
                                        contentStyle={{
                                            background: '#0f172a',
                                            border: '1px solid #1e293b',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            color: '#fff'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#818cf8"
                                        strokeWidth={3}
                                        fill="url(#colorInflow)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm italic">
                                Initializing telemetry stream...
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Hospital Details & Alerts */}
                <div className="space-y-6">
                    {/* Hospital Info Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Client Registry Info</h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Legal Name</span>
                                    <p className="text-sm font-black text-slate-800">{hospitalInfo?.legal_name || "N/A"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Internal ID</span>
                                        <p className="text-xs font-mono font-bold text-slate-600">#{hospitalId?.substring(0, 8)}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Platform Status</span>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[10px] font-black text-emerald-600 uppercase">ACTIVE</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Primary Endpoint</span>
                                    <p className="text-xs font-bold text-slate-600 truncate">{hospitalInfo?.api_endpoint || "api.digifort.com/v1/client"}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => router.push(`/dashboard/hospitals/edit?id=${hospitalId}`)}
                                className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                            >
                                Edit Client Profile
                            </button>
                        </div>
                    </div>

                    {/* Quality Alerts */}
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                                    <ScanLine size={14} /> QA Exceptions
                                </h3>
                                <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                                    {stats?.qa_issues?.length || 0}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {stats?.qa_issues?.slice(0, 3).map((issue: any, idx: number) => (
                                    <div key={idx} className="bg-white/50 p-3 rounded-xl border border-amber-200/50">
                                        <p className="text-xs font-black text-amber-800 truncate mb-1">{issue.file}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">{issue.issue}</span>
                                            <span className="text-[9px] text-amber-400">{issue.timestamp}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!stats?.qa_issues || stats.qa_issues.length === 0) && (
                                    <p className="text-xs text-amber-600 italic">No quality exceptions detected for this client.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-components for cleaner structure
function MetricHeroCard({ label, value, subValue, icon, color }: any) {
    const colors = {
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100"
    };

    const iconColors = {
        indigo: "text-indigo-400",
        emerald: "text-emerald-400",
        amber: "text-amber-400",
        blue: "text-blue-400",
        purple: "text-purple-400"
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-indigo-200 transition-all">
            <div className={`absolute top-6 right-6 ${iconColors[color as keyof typeof iconColors] || 'text-slate-300'} group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
                <span className="text-3xl font-black text-slate-900 tracking-tight mb-2">{value}</span>
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${colors[color as keyof typeof colors] || 'bg-slate-50 text-slate-500'}`}>
                    {subValue}
                </div>
            </div>
        </div>
    );
}

function ModuleAccessCard({ name, desc, stats, status, icon, href }: any) {
    const router = useRouter();
    return (
        <div 
            onClick={() => router.push(href)}
            className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-500/5 hover:border-indigo-500/20 group cursor-pointer transition-all flex flex-col gap-3"
        >
            <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 flex items-center justify-center transition-colors shadow-sm">
                    {React.cloneElement(icon, { size: 20 })}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                    Access <ArrowRight size={12} />
                </div>
            </div>
            <div>
                <h3 className="text-sm font-black text-slate-800">{name}</h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">{desc}</p>
            </div>
            <div className="mt-auto pt-3 border-t border-slate-100 group-hover:border-indigo-50 flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase">{stats}</span>
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight">Active</span>
                </div>
            </div>
        </div>
    );
}
