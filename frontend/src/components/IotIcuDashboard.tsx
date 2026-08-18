"use client";
import React, { useState, useEffect } from "react";
import { Activity, HeartPulse, Wind, Thermometer, AlertCircle, Wifi } from "lucide-react";

export default function IotIcuDashboard() {
  const [hr, setHr] = useState(72);
  const [spo2, setSpo2] = useState(98);
  
  // Simulate live IoT vitals fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setHr(prev => prev + (Math.floor(Math.random() * 5) - 2));
      setSpo2(prev => Math.min(100, Math.max(90, prev + (Math.floor(Math.random() * 3) - 1))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-rose-100 rounded-full blur-[100px] pointer-events-none opacity-50" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
        <div>
          <span className="text-rose-600 font-bold uppercase tracking-wider text-xs px-3 py-1 bg-rose-50 rounded-full border border-rose-200 inline-flex items-center gap-2 mb-3">
            <Wifi className="w-3.5 h-3.5 animate-pulse" /> Live IoT Integration
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">ICU Vitals Central Station</h2>
          <p className="text-slate-500 text-sm mt-1">Direct API feed from Philips/GE patient monitors straight into the Nursing eMAR.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500">Bed: <span className="text-slate-900">ICU-01</span></div>
          <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500">Patient: <span className="text-slate-900">UHID-4921</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        {/* Heart Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><HeartPulse className="w-4 h-4 text-emerald-600" /> HR / ECG</span>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Normal</span>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-5xl font-black text-emerald-600 font-mono transition-all">{hr}</div>
            <div className="text-sm font-bold text-slate-500 mb-1">bpm</div>
          </div>
          {/* Mock ECG Wave */}
          <div className="absolute bottom-2 right-2 w-24 h-8 opacity-40">
             <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-600 fill-none stroke-2">
               <path d="M0 15 L20 15 L25 5 L35 25 L40 15 L100 15" strokeLinecap="round" />
             </svg>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Wind className="w-4 h-4 text-cyan-600" /> SpO2</span>
            <span className="text-[10px] text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">Normal</span>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-5xl font-black text-cyan-600 font-mono transition-all">{spo2}</div>
            <div className="text-sm font-bold text-slate-500 mb-1">%</div>
          </div>
           {/* Mock Pulse Wave */}
           <div className="absolute bottom-2 right-2 w-24 h-8 opacity-40">
             <svg viewBox="0 0 100 30" className="w-full h-full stroke-cyan-600 fill-none stroke-2">
               <path d="M0 20 Q10 10 20 20 T40 20 T60 20 T80 20 T100 20" />
             </svg>
          </div>
        </div>

        {/* NIBP */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-4 h-4 text-rose-600" /> NIBP</span>
            <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Elevated</span>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-4xl font-black text-rose-600 font-mono">135<span className="text-2xl text-slate-400">/85</span></div>
            <div className="text-sm font-bold text-slate-500 mb-1">mmHg</div>
          </div>
        </div>

        {/* Temp */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-amber-600" /> Temp</span>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">10m ago</span>
          </div>
          <div className="flex items-end gap-2">
            <div className="text-5xl font-black text-amber-600 font-mono">98.6</div>
            <div className="text-sm font-bold text-slate-500 mb-1">°F</div>
          </div>
        </div>

      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <span className="text-xs text-slate-600">Automated eMAR charting triggers every 1 hour. No manual data entry required.</span>
        </div>
        <button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-2 shadow-sm">
          <Activity className="w-4 h-4" /> View Full eMAR Chart
        </button>
      </div>

    </div>
  );
}
