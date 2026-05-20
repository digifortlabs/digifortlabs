import React from 'react';
import { TrendingUp } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string | number;
    sub?: string;
    trend?: string;
    trendUp?: boolean;
    icon: React.ReactNode;
    color: 'blue' | 'indigo' | 'amber' | 'emerald' | 'cyan' | 'purple';
}

const MetricCard = ({ label, value, sub, trend, trendUp, icon, color }: MetricCardProps) => {
    const bgColors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        amber: 'bg-amber-50 text-amber-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        cyan: 'bg-cyan-50 text-cyan-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${bgColors[color] || bgColors.indigo}`}>
                    {icon}
                </div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {trend} {trendUp && <TrendingUp size={10} />}
                </div>
            </div>
            <div>
                <p className="text-xl font-black text-slate-800 tracking-tight">{value}</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">{label}</p>
                {sub && <p className="text-slate-400 text-[9px] font-medium mt-0.5">{sub}</p>}
            </div>
        </div>
    );
};

export default MetricCard;
