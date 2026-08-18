"use client";
import React, { useState, useEffect } from "react";
import { BrainCircuit, FileText, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, Send } from "lucide-react";

export default function AiClaimPredictor() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<"idle" | "scanning" | "denied" | "approved">("idle");

  const runScan = () => {
    setResult("scanning");
    setScanning(true);
    setTimeout(() => {
      setResult("denied");
      setScanning(false);
    }, 2500);
  };

  const fixAndResubmit = () => {
    setResult("scanning");
    setScanning(true);
    setTimeout(() => {
      setResult("approved");
      setScanning(false);
    }, 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-100 rounded-full blur-3xl pointer-events-none opacity-50" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <span className="text-amber-600 font-bold uppercase tracking-wider text-xs px-3 py-1 bg-amber-50 rounded-full border border-amber-200 inline-block mb-3">AI Decision Support</span>
          <h2 className="text-2xl font-extrabold text-slate-900">TPA Claim Denial Predictor</h2>
          <p className="text-slate-500 text-sm mt-1">Pre-scan GIPSA insurance claims before submission to prevent rejections.</p>
        </div>
        <BrainCircuit className={`w-12 h-12 text-amber-500 ${scanning ? 'animate-pulse' : ''}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* Claim Document Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative shadow-sm">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Draft Claim #CLM-9021</div>
              <div className="text-xs text-slate-500">Total Amount: ₹45,000</div>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex justify-between items-center p-2 rounded bg-white border border-slate-200 shadow-sm">
              <span>Patient Name:</span>
              <span className="font-bold text-slate-900">Rajesh Kumar</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-white border border-slate-200 shadow-sm">
              <span>Diagnosis (ICD-10):</span>
              <span className="font-bold text-slate-900">Acute Appendicitis (K35.8)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-white border border-slate-200 shadow-sm">
              <span>Included Documents:</span>
              <span className="font-bold text-slate-900">Discharge Summary, Final Bill</span>
            </div>
            
            {result === "approved" && (
              <div className="flex justify-between items-center p-2 rounded bg-emerald-50 border border-emerald-200">
                <span>Missing Documents:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Surgery Notes Attached</span>
              </div>
            )}
          </div>

          <button 
            onClick={result === "idle" ? runScan : undefined}
            disabled={result !== "idle"}
            className={`w-full mt-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
              result === "idle" 
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            }`}
          >
            {scanning && result === "scanning" ? <><RefreshCw className="w-4 h-4 animate-spin"/> AI Scanning Claim...</> : <><Sparkles className="w-4 h-4" /> Run AI Pre-Submission Scan</>}
          </button>
        </div>

        {/* AI Scanner Results */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-center shadow-sm">
          
          {result === "idle" && (
            <div className="text-center text-slate-400">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold text-slate-500">Awaiting AI Scan</p>
              <p className="text-xs mt-1">Run the predictor to analyze GIPSA rules.</p>
            </div>
          )}

          {result === "scanning" && (
            <div className="text-center">
              <BrainCircuit className="w-12 h-12 text-amber-500 animate-bounce mx-auto mb-4" />
              <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 animate-pulse w-full origin-left transform transition-transform duration-1000 scale-x-100"></div>
              </div>
              <p className="text-xs text-amber-600 mt-4 font-mono font-bold">Cross-referencing 500+ TPA denial rules...</p>
            </div>
          )}

          {result === "denied" && (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-4">
                <div className="flex items-center gap-2 text-rose-700 font-bold mb-2">
                  <AlertTriangle className="w-5 h-5" /> 89% Probability of Rejection
                </div>
                <p className="text-xs text-rose-600 leading-relaxed">
                  AI detected that ICD-10 code (K35.8) for surgery requires <strong>Surgeon's Operation Notes</strong>. This document is currently missing from the packet.
                </p>
              </div>
              <button 
                onClick={fixAndResubmit}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition shadow-md"
              >
                Attach Surgery Notes & Rescan
              </button>
            </div>
          )}

          {result === "approved" && (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <div className="text-emerald-700 font-bold text-lg mb-1">
                  100% Ready for Submission
                </div>
                <p className="text-xs text-emerald-600">
                  All GIPSA requirements met. TPA packet is complete.
                </p>
              </div>
              <button 
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4"/> Submit to TPA Portal
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
