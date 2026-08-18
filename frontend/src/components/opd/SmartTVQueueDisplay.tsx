'use client';
import React, { useEffect, useState } from 'react';

interface QueueToken {
  token_number: string;
  patient_name: string;
  doctor_name: string;
  cabin_number: string;
  status: 'CALLING' | 'IN_CABIN' | 'WAITING';
}

interface SmartTVQueueDisplayProps {
  doctorId: number;
}

export const SmartTVQueueDisplay: React.FC<SmartTVQueueDisplayProps> = ({ doctorId }) => {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [currentCall, setCurrentCall] = useState<QueueToken | null>(null);

  useEffect(() => {
    // Polling / Stream connection mock for live display
    const fetchQueue = async () => {
      try {
        const res = await fetch(`/api/appointments/doctor-queue/${doctorId}/live`);
        if (res.ok) {
          const data = await res.json();
          setTokens(data.waiting || []);
          if (data.current) setCurrentCall(data.current);
        }
      } catch (err) {
        console.error('Failed to update live queue display', err);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [doctorId]);

  return (
    <div className="w-full h-screen bg-slate-950 text-white p-8 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-emerald-400">OPD CONSULTATION QUEUE</h1>
          <p className="text-xl text-slate-400 mt-1">DigifortLabs Smart Waiting Display</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-slate-200">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Main Display Grid */}
      <main className="grid grid-cols-12 gap-8 my-auto">
        {/* Active Call Banner */}
        <div className="col-span-7 bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 shadow-2xl flex flex-col justify-center items-center text-center">
          <span className="bg-emerald-500 text-slate-950 px-6 py-2 rounded-full font-bold text-lg animate-pulse tracking-wider">
            NOW CALLING / NEXT PATIENT
          </span>
          <div className="text-8xl font-black text-white my-6 font-mono tracking-tight">
            {currentCall ? `#${currentCall.token_number}` : '---'}
          </div>
          <div className="text-4xl font-semibold text-slate-200">
            {currentCall ? currentCall.patient_name : 'Waiting for next call'}
          </div>
          <div className="mt-6 text-2xl text-emerald-400 font-medium">
            {currentCall ? `Please proceed to Cabin ${currentCall.cabin_number}` : 'Please be seated'}
          </div>
        </div>

        {/* Upcoming List */}
        <div className="col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col">
          <h2 className="text-2xl font-bold text-slate-300 border-b border-slate-800 pb-3 mb-4">
            UPCOMING TOKENS
          </h2>
          <div className="space-y-3 overflow-hidden">
            {tokens.slice(0, 5).map((tok, idx) => (
              <div key={idx} className="bg-slate-800/80 p-4 rounded-xl flex justify-between items-center text-xl">
                <span className="font-mono font-bold text-emerald-400">#{tok.token_number}</span>
                <span className="font-medium text-slate-200">{tok.patient_name}</span>
              </div>
            ))}
            {tokens.length === 0 && (
              <div className="text-slate-500 text-center py-8 text-lg">No pending patients in queue</div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Announcement */}
      <footer className="bg-slate-900 border-t border-slate-800 p-4 rounded-2xl text-center text-slate-400 text-lg">
        📢 Please keep your OPD Token receipts ready. Scan QR code on your receipt to view queue status on your phone.
      </footer>
    </div>
  );
};
