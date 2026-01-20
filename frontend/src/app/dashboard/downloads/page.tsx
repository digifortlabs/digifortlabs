"use client";

import { Monitor, Download, ShieldCheck, Zap, HardDrive } from 'lucide-react';

export default function DownloadsPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="space-y-4 px-4 relative z-10 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider">
                        <Zap size={14} /> Official Release
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">Digifort Scanner</h1>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        The secure, high-speed bridge between your physical paper records and the cloud.
                        Direct TWAIN scanning, auto-compression, and bulk upload capabilities.
                    </p>
                    <div className="flex items-center gap-4 pt-4">
                        <a
                            href="/DigifortScanner_Setup.exe"
                            download
                            className="flex items-center gap-3 px-6 py-3.5 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-all hover:scale-105 shadow-xl shadow-white/10"
                        >
                            <Download size={20} />
                            Download for Windows
                        </a>
                        <div className="text-xs text-slate-500 font-mono">
                            v2.0 • 64-bit • 45.4MB
                        </div>
                    </div>
                </div>

                <div className="relative z-10 hidden md:block">
                    <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-2xl transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                        <div className="bg-slate-900 rounded-lg p-6 w-80 space-y-4">
                            <div className="h-2 w-20 bg-slate-700 rounded-full"></div>
                            <div className="space-y-2">
                                <div className="h-20 bg-indigo-900/20 rounded-lg border border-indigo-500/20 flex items-center justify-center">
                                    <Monitor className="text-indigo-500" size={32} />
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full">
                                    <div className="h-full w-2/3 bg-indigo-500 rounded-full"></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>Uploading Batch #392...</span>
                                    <span>65%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                        <ShieldCheck className="text-emerald-600" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Secure Hardened</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        End-to-end encryption (AES-256) before files even leave your computer.
                        Zero-knowledge architecture ensures patient privacy.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <Monitor className="text-blue-600" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">High-Res Capture</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Optimized for document cameras and webcams (up to 4K).
                        Includes auto-crop, perspective correction, and image enhancement filters.
                    </p>
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Installation Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                    <li>Click the <strong>Download for Windows</strong> button above to get the installer.</li>
                    <li>Run <code>DigifortScanner_Setup.exe</code> and follow the setup prompts.</li>
                    <li><strong>Important:</strong> You do not need to open the app manually.</li>
                    <li>Return to the Dashboard, go to "Upload Records", and click <strong>"Open Desktop Scanner"</strong> to launch it automatically.</li>
                </ol>
            </div>
        </div>
    );
}
