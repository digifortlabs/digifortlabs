import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 bg-white border border-slate-200 p-12 rounded-3xl shadow-xl max-w-lg w-full animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100 shadow-sm">
                    <FileQuestion className="w-10 h-10" />
                </div>

                <h1 className="text-6xl font-black text-slate-900 mb-2 tracking-tight">404</h1>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Record or Page Not Found</h2>

                <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed">
                    The medical record, page, or digital archive you are looking for does not exist or may have been moved.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-sm"
                >
                    <Home className="w-4 h-4" />
                    Return to Home / Archives
                </Link>
            </div>
        </div>
    );
}
