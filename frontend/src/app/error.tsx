"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-red-500/20 p-12 rounded-3xl shadow-2xl max-w-lg w-full">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-500/20">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">System Malfunction</h1>

                <p className="text-slate-400 mb-8 leading-relaxed">
                    Our digital filing system encountered an unexpected critical error.
                    <br /><span className="text-xs text-slate-600 font-mono mt-2 block">Error Code: {error.digest || "UNKNOWN_ERROR"}</span>
                </p>

                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition shadow-lg shadow-white/10 group"
                >
                    <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    Reboot System
                </button>
            </div>
        </div>
    );
}
