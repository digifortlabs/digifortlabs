"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Users, Monitor } from "lucide-react";

export default function OPDTokenDisplay() {
    const [tokens, setTokens] = useState<any[]>([]);
    const [lastSpoken, setLastSpoken] = useState<string>("");

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                // Poll every 5 seconds
                const data = await apiFetch("/appointments/display/tokens");
                if (data && Array.isArray(data)) {
                    setTokens(data);
                    
                    // Simple TTS for new tokens
                    if (data.length > 0) {
                        const latest = data[0];
                        const speakText = `Token number ${latest.token}, please proceed to ${latest.room}`;
                        if (speakText !== lastSpoken) {
                            if ('speechSynthesis' in window) {
                                const utterance = new SpeechSynthesisUtterance(speakText);
                                window.speechSynthesis.speak(utterance);
                            }
                            setLastSpoken(speakText);
                        }
                    }
                }
            } catch (err) {
                // Ignore silent poll errors
            }
        };
        
        fetchTokens();
        const interval = setInterval(fetchTokens, 5000);
        return () => clearInterval(interval);
    }, [lastSpoken]);

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col p-8 font-sans">
            <header className="flex justify-between items-center mb-12 border-b border-slate-700 pb-6">
                <div className="flex items-center gap-4">
                    <Monitor className="w-12 h-12 text-indigo-400" />
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">OPD Token Display</h1>
                        <p className="text-xl text-slate-400 mt-1">Please wait for your token number</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-black tracking-tighter text-indigo-400">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </header>
            
            <main className="flex-1">
                {tokens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                        <Users className="w-24 h-24 mb-6 opacity-50" />
                        <h2 className="text-3xl font-bold">No Active Tokens</h2>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-8">
                        {tokens.map((t, idx) => (
                            <div 
                                key={idx} 
                                className={`rounded-3xl p-8 border-4 shadow-2xl transition-all ${
                                    idx === 0 
                                        ? "bg-indigo-600 border-indigo-400 scale-105 col-span-2 flex justify-between items-center" 
                                        : "bg-slate-800 border-slate-700"
                                }`}
                            >
                                <div>
                                    <div className="text-slate-300 text-2xl font-bold uppercase tracking-widest mb-2">Token Number</div>
                                    <div className={`font-black tracking-tighter ${idx === 0 ? "text-8xl text-white" : "text-6xl text-indigo-400"}`}>
                                        {t.token}
                                    </div>
                                </div>
                                <div className={idx === 0 ? "text-right" : "mt-6"}>
                                    <div className={`font-black ${idx === 0 ? "text-5xl text-indigo-100" : "text-3xl text-slate-200"}`}>
                                        {t.room}
                                    </div>
                                    <div className={`font-bold mt-2 ${idx === 0 ? "text-2xl text-indigo-300" : "text-xl text-slate-400"}`}>
                                        {t.doctor}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
