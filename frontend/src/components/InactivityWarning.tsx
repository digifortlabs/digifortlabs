"use client";

import { Clock, AlertTriangle } from 'lucide-react';

interface InactivityWarningProps {
    timeLeft: number;
    onExtend: () => void;
}

export default function InactivityWarning({ timeLeft, onExtend }: InactivityWarningProps) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-amber-100 rounded-xl">
                        <AlertTriangle className="text-amber-600" size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Session Timeout Warning</h2>
                        <p className="text-sm text-slate-500">You've been inactive</p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Clock className="text-slate-600" size={24} />
                        <div className="text-4xl font-black text-slate-800 tabular-nums">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                    </div>
                    <p className="text-center text-sm text-slate-600">
                        You will be automatically logged out due to inactivity
                    </p>
                </div>

                <button
                    onClick={onExtend}
                    className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                    Continue Session
                </button>

                <p className="text-center text-xs text-slate-400 mt-4">
                    Click anywhere or press any key to stay logged in
                </p>
            </div>
        </div>
    );
}
