import React from 'react';

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
}

const ActionButton = ({ icon, label, onClick, className = "" }: ActionButtonProps) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all font-bold text-xs gap-2 active:scale-95 ${className}`}
    >
        {icon}
        {label}
    </button>
);

export default ActionButton;
