import React from 'react';
import { ArrowUpRight, CheckCircle2, XCircle, AlertOctagon } from 'lucide-react';

interface AlertItemProps {
    type: string;
    title: string;
    time: string;
    desc: string;
    patient?: string;
    user?: string;
}

const AlertItem = ({ type, title, time, desc, patient, user }: AlertItemProps) => {
    const icons: Record<string, React.ReactNode> = {
        UPLOADED: <ArrowUpRight size={14} className="text-indigo-600" />,
        CONFIRMED: <CheckCircle2 size={14} className="text-emerald-600" />,
        DRAFT_DISCARDED: <XCircle size={14} className="text-slate-400" />,
        DELETION_REQUESTED: <AlertOctagon size={14} className="text-red-500" />,
        DELETED: <AlertOctagon size={14} className="text-red-600" />,
        INFO: <CheckCircle2 size={14} className="text-blue-500" />
    };

    const actionType = title.split(' ').join('_').toUpperCase();
    const icon = icons[actionType] || icons.INFO;

    return (
        <div className="flex gap-3 py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 items-center">
            <div className="p-2 rounded-lg bg-white border border-slate-100 shadow-sm shrink-0">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center bg-white/0 mb-0.5">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-tight truncate">{title}</h4>
                    <span className="text-[9px] font-bold text-slate-400 shrink-0 ml-2">{time}</span>
                </div>
                {patient && <p className="text-[10px] text-indigo-600 font-bold truncate">{patient}</p>}
                {user && <p className="text-[9px] text-slate-400 font-medium truncate">by {user}</p>}
            </div>
        </div>
    );
};

export default AlertItem;
