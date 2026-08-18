"use client";

import React, { useState, useEffect } from 'react';
import { Monitor, Tv, Volume2, UserCheck, Play, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';

interface QueueItem {
  appointment_id: number;
  opd_number: string;
  patient_name: string;
  doctor_name: string;
  status: 'CALLING' | 'IN_CABIN' | 'WAITING';
  cabin_number: string;
}

export default function SmartQueueManager() {
  const [currentCall, setCurrentCall] = useState<QueueItem | null>({
    appointment_id: 101,
    opd_number: "T-102",
    patient_name: "Rahul Sharma",
    doctor_name: "Dr. A. Mehta (Cardiology)",
    status: "CALLING",
    cabin_number: "Cabin 04"
  });

  const [upcomingQueue, setUpcomingQueue] = useState<QueueItem[]>([
    { appointment_id: 102, opd_number: "T-103", patient_name: "Priya Patel", doctor_name: "Dr. A. Mehta", status: "WAITING", cabin_number: "Cabin 04" },
    { appointment_id: 103, opd_number: "T-104", patient_name: "Amit Verma", doctor_name: "Dr. A. Mehta", status: "WAITING", cabin_number: "Cabin 04" },
    { appointment_id: 104, opd_number: "T-105", patient_name: "Sunita Devi", doctor_name: "Dr. S. Gupta", status: "WAITING", cabin_number: "Cabin 02" }
  ]);

  const [loading, setLoading] = useState(false);

  const handleCallNext = () => {
    if (upcomingQueue.length === 0) {
      toast.error("No pending patients in queue");
      return;
    }
    const nextPatient = upcomingQueue[0];
    const newQueue = upcomingQueue.slice(1);
    setCurrentCall({ ...nextPatient, status: 'CALLING' });
    setUpcomingQueue(newQueue);
    toast.success(`Token #${nextPatient.opd_number} broadcasted to TV display!`);
  };

  const handleOpenSmartTV = () => {
    window.open('/hospital/hms/display/tv', '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
            <Tv className="w-8 h-8 text-indigo-600" /> Smart TV Queue & Display Control
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage live lobby TV screens, monitor active called token numbers, and trigger next patient calls.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleOpenSmartTV} variant="outline" className="gap-2 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100">
            <Monitor className="w-4 h-4" /> Open Fullscreen TV Screen
          </Button>
          <Button onClick={handleCallNext} className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20">
            <Volume2 className="w-4 h-4" /> Call Next Patient Token
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Currently Displayed on TV Screen */}
        <Card className="lg:col-span-7 border-2 border-indigo-500/30 shadow-lg bg-gradient-to-br from-slate-900 to-slate-950 text-white">
          <CardHeader className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                CURRENTLY BROADCASTING ON LOBBY TV
              </CardTitle>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/50">
                LIVE
              </Badge>
            </div>
            <CardDescription className="text-slate-400 text-xs">
              This token and patient name is currently shown on waiting area screens and announced over speakers.
            </CardDescription>
          </CardHeader>

          <CardContent className="py-8 flex flex-col items-center justify-center text-center">
            {currentCall ? (
              <>
                <Badge className="bg-emerald-500 text-slate-950 px-4 py-1 font-bold text-xs uppercase tracking-widest mb-4">
                  NOW CALLING
                </Badge>
                <div className="text-7xl font-black font-mono tracking-tighter text-white my-2">
                  {currentCall.opd_number}
                </div>
                <div className="text-2xl font-bold text-slate-200 mt-2">
                  {currentCall.patient_name}
                </div>
                <div className="text-sm font-medium text-slate-400 mt-1">
                  Doctor: <span className="text-slate-200">{currentCall.doctor_name}</span>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-800/50 text-indigo-300 px-6 py-2 rounded-full font-bold text-sm">
                  <ArrowRight className="w-4 h-4 text-emerald-400" /> Proceed to {currentCall.cabin_number}
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-center py-8">No token currently broadcasted</div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Patient Queue Panel */}
        <Card className="lg:col-span-5 border border-slate-200 shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" /> Upcoming Queue ({upcomingQueue.length})
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={() => toast.success('Queue refreshed')} className="h-8 text-xs text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
              </Button>
            </div>
            <CardDescription className="text-xs">
              Patients waiting in lobby area to be called on TV display.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {upcomingQueue.map((item, idx) => (
              <div key={item.appointment_id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-indigo-600 text-sm">{item.opd_number}</span>
                    <span className="font-bold text-slate-900 text-sm">{item.patient_name}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.doctor_name} • {item.cabin_number}</div>
                </div>
                <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-700">
                  Waiting #{idx + 1}
                </Badge>
              </div>
            ))}

            {upcomingQueue.length === 0 && (
              <div className="text-slate-400 text-center py-6 text-xs">No pending patients in waiting list</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
