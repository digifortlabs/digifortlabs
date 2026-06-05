"use client";

import { Smartphone, Download, ShieldCheck, Zap, MessageCircle } from 'lucide-react';

export default function WhatsAppDownloadsPage() {
    return (
        <div className="w-full mx-auto px-6 pt-0 pb-8 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="space-y-4 px-4 relative z-10 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        <Zap size={14} /> Official Release
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight">Digifort WA Sender</h1>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Automate your hospital's WhatsApp communications directly from your desktop.
                        Secure, reliable, and requires only a single WhatsApp Web login.
                    </p>
                    <div className="flex items-center gap-4 pt-4">
                        <a
                            href="https://digifortlabs.com/downloads/wa_sender/DigifortWASender_Setup.exe"
                            download
                            className="flex items-center gap-3 px-6 py-3.5 bg-white text-slate-900 rounded-xl font-bold hover:bg-emerald-50 transition-all hover:scale-105 shadow-xl shadow-white/10"
                        >
                            <Download size={20} />
                            Download for Windows
                        </a>
                        <button
                            onClick={() => window.open('digifort-wa://login', '_self')}
                            className="flex items-center gap-3 px-6 py-3.5 bg-emerald-800 text-white border border-emerald-700 rounded-xl font-bold hover:bg-emerald-700 transition-all hover:scale-105 shadow-xl"
                        >
                            <Smartphone size={20} />
                            Connect WhatsApp
                        </button>
                        <div className="text-xs text-slate-500 font-mono hidden lg:block">
                            v1.0 • 64-bit • Auto-Updates
                        </div>
                    </div>
                </div>

                <div className="relative z-10 hidden md:block">
                    <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-2xl transform rotate-[3deg] hover:rotate-0 transition-transform duration-500">
                        <div className="bg-slate-900 rounded-lg p-6 w-80 space-y-4">
                            <div className="h-2 w-20 bg-slate-700 rounded-full"></div>
                            <div className="space-y-2">
                                <div className="h-20 bg-emerald-900/20 rounded-lg border border-emerald-500/20 flex items-center justify-center">
                                    <MessageCircle className="text-emerald-500" size={32} />
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full">
                                    <div className="h-full w-full bg-emerald-500 rounded-full"></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500">
                                    <span>Sending Invoice to Patient...</span>
                                    <span>Sent!</span>
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
                    <h3 className="text-lg font-bold text-slate-800 mb-2">100% Local & Secure</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Messages are sent directly from your own computer using your own IP address and session, preventing any third-party bans.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                        <Smartphone className="text-blue-600" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Single Scan Login</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Scan your WhatsApp QR code once via Chrome. The session is saved locally so you don't need to scan it every time.
                    </p>
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Installation Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                    <li>Click the <strong>Download for Windows</strong> button above.</li>
                    <li>Run <code>DigifortWASender_Setup.exe</code> and follow the setup prompts.</li>
                    <li>The installer will automatically register the necessary protocols on your computer.</li>
                    <li>Once installed, you don't need to open the app manually. Whenever you click "Send WhatsApp" in Digifort, it will automatically launch and send the message for you!</li>
                </ol>
            </div>
        </div>
    );
}
