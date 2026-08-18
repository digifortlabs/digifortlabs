"use client";
import React, { useState } from "react";
import { Calculator, TrendingUp, Clock, DollarSign, ArrowRight } from "lucide-react";

export default function ROICalculator() {
  const [beds, setBeds] = useState<number>(60);
  const [opdPatients, setOpdPatients] = useState<number>(150);

  // Formulas based on industry averages
  const monthlyPaperSavings = Math.round((opdPatients * 12 * 25) + (beds * 350));
  const monthlyFefoSavings = Math.round(beds * 2200);
  const tpaDaysSaved = Math.min(14, Math.round(4 + (beds / 50)));
  const totalAnnualSavings = Math.round((monthlyPaperSavings + monthlyFefoSavings) * 12);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden backdrop-blur-xl">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-100 rounded-full blur-3xl pointer-events-none opacity-50" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Calculator className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">INTERACTIVE ROI ESTIMATOR</span>
        </div>

        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Hospital Savings & Efficiency Calculator</h2>
        <p className="text-slate-500 text-sm max-w-2xl mb-10">
          Adjust your facility size to project cost savings from digitized paperless OPD, FEFO inventory tracking, and automated TPA billing.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Sliders Input Column */}
          <div className="lg:col-span-6 space-y-8 bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
            {/* Slider 1: Bed Count */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-slate-900">Inpatient Bed Capacity</label>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-extrabold">
                  {beds} Beds
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={500}
                step={5}
                value={beds}
                onChange={(e) => setBeds(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>10 Beds</span>
                <span>250 Beds</span>
                <span>500 Beds</span>
              </div>
            </div>

            {/* Slider 2: Daily OPD Patients */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-slate-900">Daily Outpatient (OPD) Visits</label>
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-sm font-extrabold">
                  {opdPatients} Patients / Day
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={1000}
                step={10}
                value={opdPatients}
                onChange={(e) => setOpdPatients(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>20 Patients</span>
                <span>500 Patients</span>
                <span>1,000+ Patients</span>
              </div>
            </div>
          </div>

          {/* Results Output Column */}
          <div className="lg:col-span-6 space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Output 1: Paper Savings */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Paper & Printing Savings
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  ₹{monthlyPaperSavings.toLocaleString('en-IN')}<span className="text-xs text-slate-500 font-normal"> /mo</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">From digital E-Rx & OPD ticket slips</div>
              </div>

              {/* Output 2: FEFO Expiry Savings */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Pharmacy FEFO Savings
                </div>
                <div className="text-2xl font-extrabold text-emerald-600">
                  ₹{monthlyFefoSavings.toLocaleString('en-IN')}<span className="text-xs text-slate-500 font-normal"> /mo</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Prevented drug batch expiration</div>
              </div>
            </div>

            {/* Output 3: TPA TAT Savings */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">TPA Pre-Auth Speedup</div>
                  <div className="text-[11px] text-slate-500">Faster insurance claim settlement</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-amber-600">-{tpaDaysSaved} Days</span>
              </div>
            </div>

            {/* Total Annual Net Benefit */}
            <div className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 border border-blue-200 rounded-2xl text-center shadow-sm">
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Total Projected Annual Financial Impact</div>
              <div className="text-3xl md:text-4xl font-black text-slate-900">
                ₹{totalAnnualSavings.toLocaleString('en-IN')} <span className="text-sm font-semibold text-indigo-600">/ Year</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
