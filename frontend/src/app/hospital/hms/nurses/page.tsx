"use client";

import React, { useState, useEffect } from 'react';
import { Pill, AlertCircle, Clock, CheckCircle2, History, RefreshCw, UserPlus, Syringe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';

export default function NursingStationDashboard() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

    // Modal
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<any>(null);
    const [medLogForm, setMedLogForm] = useState({ order_id: '', medicine_name: '', notes: '' });

    useEffect(() => {
        const saved = localStorage.getItem('hms_hospital_id');
        if (saved) setSelectedHospitalId(Number(saved));
        loadAlerts(saved ? Number(saved) : null);
        
        // Auto-refresh every 60 seconds
        const interval = setInterval(() => {
            loadAlerts(saved ? Number(saved) : null, false);
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadAlerts = async (hId: number | null = selectedHospitalId, showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            let suffix = hId ? `?hospital_id=${hId}` : '';
            const data = await apiFetch(`hms/admissions/alerts${suffix}`);
            
            // Sort alerts: Overdue first (descending overdue seconds), then due soon (ascending time left)
            const sorted = (data || []).sort((a: any, b: any) => {
                if (a.overdue_seconds > 0 || b.overdue_seconds > 0) {
                    return b.overdue_seconds - a.overdue_seconds;
                }
                const aTime = new Date(a.next_due).getTime();
                const bTime = new Date(b.next_due).getTime();
                return aTime - bTime;
            });
            
            setAlerts(sorted);
        } catch (e) {
            console.error("Failed to load alerts", e);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleOpenLog = (alert: any) => {
        setSelectedAlert(alert);
        setMedLogForm({
            order_id: alert.order_id,
            medicine_name: alert.medicine_name,
            notes: ''
        });
        setIsLogOpen(true);
    };

    const handleLogMedication = async () => {
        if (!selectedAlert || !medLogForm.order_id) return;
        try {
            await apiFetch(`hms/admissions/${selectedAlert.admission_id}/medication`, {
                method: 'POST',
                body: JSON.stringify(medLogForm)
            });
            toast.success("Medication administered and billed successfully!");
            setIsLogOpen(false);
            loadAlerts();
        } catch (e: any) { 
            toast.error(e.message || "Failed to log medication"); 
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <Syringe className="text-rose-500" /> Nursing Station Dashboard
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Unified view of due medications across all wards</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => loadAlerts()} className="border-slate-200">
                        <RefreshCw className="w-4 h-4 mr-2 text-slate-500" /> Refresh List
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                </div>
            ) : (
                <Card className="border-rose-100 shadow-sm overflow-hidden">
                    <div className="bg-rose-50/50 px-6 py-4 border-b border-rose-100 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-rose-500" />
                        <h2 className="font-bold text-rose-900 text-lg">Due & Overdue Medications ({alerts.length})</h2>
                    </div>
                    
                    {alerts.length === 0 ? (
                        <div className="text-center py-24 bg-white">
                            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-800">All Caught Up!</h3>
                            <p className="text-slate-500 font-medium">There are no pending medications across all active wards.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 bg-white">
                            {alerts.map((alert, idx) => {
                                const isOverdue = alert.overdue_seconds > 0;
                                return (
                                    <div key={idx} className={`p-4 md:p-6 transition-colors hover:bg-slate-50 flex flex-col md:flex-row items-center gap-6 ${isOverdue ? 'bg-rose-50/30' : ''}`}>
                                        
                                        {/* Status / Timing */}
                                        <div className="flex-shrink-0 text-center w-full md:w-32">
                                            {isOverdue ? (
                                                <div className="bg-rose-100 text-rose-700 px-3 py-2 rounded-xl border border-rose-200 shadow-sm">
                                                    <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                                                    <div className="font-bold text-xs uppercase tracking-wider">Overdue</div>
                                                    <div className="font-mono font-black text-sm">{Math.floor(alert.overdue_seconds / 60)} mins</div>
                                                </div>
                                            ) : (
                                                <div className="bg-amber-50 text-amber-600 px-3 py-2 rounded-xl border border-amber-100 shadow-sm">
                                                    <Clock className="w-5 h-5 mx-auto mb-1" />
                                                    <div className="font-bold text-xs uppercase tracking-wider">Due Soon</div>
                                                    <div className="font-mono font-bold text-sm">
                                                        {new Date(alert.next_due).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Medication Info */}
                                        <div className="flex-1 w-full text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                <h3 className="text-xl font-black text-slate-900">{alert.medicine_name}</h3>
                                                <Badge variant="outline" className="bg-slate-50">{alert.dosage}</Badge>
                                            </div>
                                            <div className="text-slate-500 text-sm font-medium">Frequency: {alert.frequency}</div>
                                            
                                            <div className="mt-3 flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none px-2.5 py-1">
                                                    <UserPlus className="w-3 h-3 mr-1 inline" /> {alert.patient_name}
                                                </Badge>
                                                <div className="text-sm font-semibold text-slate-600">
                                                    Ward: <span className="text-slate-900">{alert.ward_name}</span>
                                                </div>
                                                <div className="text-sm font-semibold text-slate-600">
                                                    Bed: <span className="text-slate-900">{alert.bed_number}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex-shrink-0 w-full md:w-auto">
                                            <Button 
                                                onClick={() => handleOpenLog(alert)}
                                                className={`w-full md:w-auto h-12 px-6 font-bold text-md shadow-sm ${isOverdue ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                            >
                                                <Syringe className="w-5 h-5 mr-2" /> 
                                                Mark Administered
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            )}

            {/* Log Medication Dialog */}
            <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-800">
                            <Syringe className="w-5 h-5 text-rose-500" /> Administer Medication
                        </DialogTitle>
                    </DialogHeader>
                    {selectedAlert && (
                        <div className="space-y-4 py-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Patient</div>
                                    <div className="font-black text-slate-800">{selectedAlert.patient_name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-400 uppercase">Location</div>
                                    <div className="font-bold text-slate-800">{selectedAlert.ward_name} / {selectedAlert.bed_number}</div>
                                </div>
                            </div>
                            
                            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center gap-4">
                                <div className="bg-white p-2 rounded-lg border border-rose-200">
                                    <Pill className="w-8 h-8 text-rose-500" />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg text-rose-900">{selectedAlert.medicine_name}</h4>
                                    <p className="font-medium text-rose-700">{selectedAlert.dosage}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase">Administration Notes (Optional)</Label>
                                <textarea 
                                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm bg-slate-50 min-h-[100px] resize-none focus:border-rose-500 focus:ring-0 transition-colors"
                                    placeholder="e.g., Given with food, patient reported mild nausea..."
                                    value={medLogForm.notes}
                                    onChange={e => setMedLogForm({...medLogForm, notes: e.target.value})}
                                />
                            </div>

                            <div className="pt-2">
                                <Button 
                                    onClick={handleLogMedication} 
                                    className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-md shadow-md"
                                >
                                    Confirm Administration
                                </Button>
                                <p className="text-center mt-3 text-xs text-slate-500 flex items-center justify-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Note: This will append an administration fee to the patient's Running Bill.
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
