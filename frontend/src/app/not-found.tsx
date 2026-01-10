import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-12 rounded-3xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-700">
                    <FileQuestion className="w-12 h-12 text-slate-400" />
                </div>

                <h1 className="text-6xl font-bold text-white mb-2 tracking-tighter">404</h1>
                <h2 className="text-2xl font-semibold text-slate-300 mb-6">File Not Found</h2>

                <p className="text-slate-400 mb-10 leading-relaxed">
                    The physical or digital record you are looking for has been misplaced, archived incorrectly, or does not exist in our registry.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-900/40 group"
                >
                    <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    Return to Archives
                </Link>
            </div>
        </div>
    );
}
