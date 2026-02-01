"use client";

import { useEffect, useState } from 'react';
import { Clock, User, Building2, Activity, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { formatDistanceToNow } from 'date-fns';

interface LoginActivity {
    user_id: number;
    email: string;
    role: string;
    hospital_name: string | null;
    last_login_at: string | null;
    previous_login_at: string | null;
    last_active_at: string | null;
}

export default function LoginActivityPanel() {
    const [activities, setActivities] = useState<LoginActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchActivity = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await apiFetch('/users/login-activity?limit=20');
            setActivities(data);
        } catch (error) {
            console.error("Failed to fetch login activity:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchActivity();
    }, []);

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            'superadmin': 'bg-purple-100 text-purple-700 border-purple-200',
            'hospital_admin': 'bg-blue-100 text-blue-700 border-blue-200',
            'hospital_staff': 'bg-green-100 text-green-700 border-green-200',
            'platform_staff': 'bg-indigo-100 text-indigo-700 border-indigo-200'
        };

        const labels: Record<string, string> = {
            'superadmin': 'Super Admin',
            'hospital_admin': 'Hospital Admin',
            'hospital_staff': 'Staff',
            'platform_staff': 'Platform Staff'
        };

        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
                {labels[role] || role}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                        <Activity className="text-emerald-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recent Login Activity</h2>
                        <p className="text-xs text-slate-500">Last 20 user sessions</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchActivity(true)}
                    disabled={refreshing}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw size={16} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <Clock size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">No login activity yet</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {activities.map((activity) => (
                        <div
                            key={activity.user_id}
                            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                    <User size={16} className="text-slate-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-sm text-slate-800 truncate">{activity.email}</p>
                                        {getRoleBadge(activity.role)}
                                    </div>
                                    {activity.hospital_name && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Building2 size={12} />
                                            <span className="truncate">{activity.hospital_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-right ml-4">
                                {activity.last_login_at && (
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-1">
                                        <Clock size={12} />
                                        <span>{formatDistanceToNow(new Date(activity.last_login_at), { addSuffix: true })}</span>
                                    </div>
                                )}
                                {activity.last_active_at && (
                                    <p className="text-[10px] text-slate-400">
                                        Active: {formatDistanceToNow(new Date(activity.last_active_at), { addSuffix: true })}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
