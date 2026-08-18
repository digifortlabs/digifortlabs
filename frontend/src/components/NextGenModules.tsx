"use client";
import React from "react";
import { Droplet, Truck, Utensils, Wrench, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NextGenModules() {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl pointer-events-none opacity-50" />
      
      <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
        <span className="text-blue-700 font-bold uppercase tracking-wider text-xs px-3 py-1 bg-blue-50 rounded-full border border-blue-200 inline-block mb-3">Roadmap & Future Horizons</span>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Next-Generation Specialized Modules</h2>
        <p className="text-slate-500 text-sm">Beyond the core 11 FRS modules, Digifort HMS is continuously expanding to cover advanced specialized hospital departments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        
        {/* Blood Bank */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-rose-300 hover:shadow-md transition group shadow-sm">
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-200 text-rose-600 mb-4 group-hover:scale-110 transition">
            <Droplet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">Blood Bank Management</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            End-to-end tracking of blood donations, donor screening, component separation (PRBC, FFP, Platelets), and expiry monitoring.
          </p>
        </div>

        {/* Ambulance Fleet */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-md transition group shadow-sm">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-200 text-amber-600 mb-4 group-hover:scale-110 transition">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">Ambulance Fleet GPS</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Live GPS tracking of ambulances, paramedic emergency logs, driver dispatching, and automated trip billing.
          </p>
        </div>

        {/* Dietary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-md transition group shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-200 text-emerald-600 mb-4 group-hover:scale-110 transition">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">Dietary & IPD Kitchen</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Doctors prescribe diets directly in the IPD module, auto-generating meal plans and prep lists for the hospital kitchen.
          </p>
        </div>

        {/* Asset CMMS */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-cyan-300 hover:shadow-md transition group shadow-sm">
          <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center border border-cyan-200 text-cyan-600 mb-4 group-hover:scale-110 transition">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">Bio-Med Asset CMMS</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Track MRIs, ventilators, and monitors. Manage Annual Maintenance Contracts (AMCs) and log preventive maintenance.
          </p>
        </div>

      </div>

      <div className="text-center mt-10 relative z-10">
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 hover:border-blue-300 text-slate-700 hover:text-blue-600 font-bold text-xs rounded-xl transition shadow-sm"
        >
          Request Early Access to Beta Modules <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
