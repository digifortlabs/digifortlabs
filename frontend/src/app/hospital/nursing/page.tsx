"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeartPulse, BedDouble, Activity, ClipboardList, Clock, Info, Save } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function NursingStation() {
    const [admissions, setAdmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Vitals Modal State
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
    const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
    const [vitalsForm, setVitalsForm] = useState({
        temperature: '',
        blood_pressure: '',
        pulse_rate: '',
        respiratory_rate: '',
        spo2: '',
        blood_sugar: '',
        notes: ''
    });

    const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const fetchAdmissions = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/nursing/admitted-patients');
            setAdmissions(data || []);
        } catch (error) {
            console.error("Failed to fetch admissions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmissions();
    }, []);

    const fetchVitalsHistory = async (admissionId: number) => {
        setIsHistoryLoading(true);
        try {
            const data = await apiFetch(`/nursing/vitals/${admissionId}`);
            setVitalsHistory(data || []);
        } catch (error) {
            console.error("Failed to fetch vitals history:", error);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handleOpenVitalsModal = (adm: any) => {
        setSelectedAdmission(adm);
        setVitalsForm({
            temperature: '', blood_pressure: '', pulse_rate: '',
            respiratory_rate: '', spo2: '', blood_sugar: '', notes: ''
        });
        fetchVitalsHistory(adm.admission_id);
        setIsVitalsModalOpen(true);
    };

    const handleSaveVitals = async () => {
        if (!selectedAdmission) return;
        try {
            await apiFetch('/nursing/vitals', {
                method: 'POST',
                body: JSON.stringify({
                    admission_id: selectedAdmission.admission_id,
                    temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : null,
                    blood_pressure: vitalsForm.blood_pressure || null,
                    pulse_rate: vitalsForm.pulse_rate ? parseInt(vitalsForm.pulse_rate) : null,
                    respiratory_rate: vitalsForm.respiratory_rate ? parseInt(vitalsForm.respiratory_rate) : null,
                    spo2: vitalsForm.spo2 ? parseInt(vitalsForm.spo2) : null,
                    blood_sugar: vitalsForm.blood_sugar ? parseFloat(vitalsForm.blood_sugar) : null,
                    notes: vitalsForm.notes || null
                })
            });
            
            // Refresh
            fetchVitalsHistory(selectedAdmission.admission_id);
            fetchAdmissions();
            
            setVitalsForm({
                temperature: '', blood_pressure: '', pulse_rate: '',
                respiratory_rate: '', spo2: '', blood_sugar: '', notes: ''
            });
        } catch (error) {
            console.error("Failed to save vitals:", error);
        }
    };

    const filteredAdmissions = admissions.filter(a => 
        a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.ward_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.bed_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-7 h-7 text-rose-500" />
                        IPD Nursing Station
                    </h1>
                    <p className="text-slate-500 mt-1">Ward overview and vital signs monitoring</p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white overflow-hidden group">
                    <div className="h-1 w-full bg-blue-500 group-hover:h-1.5 transition-all"></div>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Admitted</p>
                            <h3 className="text-2xl font-black text-slate-800">{admissions.length}</h3>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                            <BedDouble className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <Input 
                    placeholder="Search by Patient Name, Ward, or Bed..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md bg-slate-50 border-slate-200"
                />
            </div>

            {/* Ward Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-4"></div>
                        Loading ward data...
                    </div>
                ) : filteredAdmissions.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
                        <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-700">No Patients in Ward</h3>
                        <p className="text-slate-500">There are currently no admitted patients matching your search.</p>
                    </div>
                ) : (
                    filteredAdmissions.map((adm) => (
                        <Card key={adm.admission_id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold">
                                            {adm.ward_name}
                                        </Badge>
                                        <span className="text-sm font-bold text-slate-700">Bed {adm.bed_number}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">{adm.patient_name}</h3>
                                    <p className="text-xs text-slate-500">MRD: {adm.mrd_number}</p>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Logs</p>
                                    <p className="text-lg font-black text-rose-500 leading-none">{adm.vitals_log_count}</p>
                                </div>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</p>
                                    <p className="text-sm font-medium text-slate-700 line-clamp-2">{adm.diagnosis || 'Pending'}</p>
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Clock className="w-4 h-4" /> Admitted: {format(new Date(adm.admission_date), 'dd MMM, h:mm a')}
                                </div>

                                <Button 
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-sm shadow-rose-200" 
                                    onClick={() => handleOpenVitalsModal(adm)}
                                >
                                    <HeartPulse className="w-4 h-4 mr-2" /> Log Vitals
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Vitals Modal */}
            <Dialog open={isVitalsModalOpen} onOpenChange={setIsVitalsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 border-b border-slate-100 bg-white shrink-0">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Activity className="w-6 h-6 text-rose-500" /> Vitals & Nursing Flowsheet
                        </DialogTitle>
                    </DialogHeader>

                    {selectedAdmission && (
                        <div className="flex flex-col md:flex-row h-full overflow-hidden">
                            {/* Left: Input Form */}
                            <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-slate-50/50 border-r border-slate-100 space-y-6">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-800">{selectedAdmission.patient_name}</h3>
                                    <p className="text-sm text-slate-500">{selectedAdmission.ward_name} - Bed {selectedAdmission.bed_number}</p>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <HeartPulse className="w-4 h-4 text-rose-500" /> Record New Vitals
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Temperature (°F)</Label>
                                            <Input type="number" step="0.1" value={vitalsForm.temperature} onChange={e => setVitalsForm({...vitalsForm, temperature: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Blood Pressure</Label>
                                            <Input placeholder="120/80" value={vitalsForm.blood_pressure} onChange={e => setVitalsForm({...vitalsForm, blood_pressure: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Pulse (bpm)</Label>
                                            <Input type="number" value={vitalsForm.pulse_rate} onChange={e => setVitalsForm({...vitalsForm, pulse_rate: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Resp. Rate (/min)</Label>
                                            <Input type="number" value={vitalsForm.respiratory_rate} onChange={e => setVitalsForm({...vitalsForm, respiratory_rate: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>SpO2 (%)</Label>
                                            <Input type="number" value={vitalsForm.spo2} onChange={e => setVitalsForm({...vitalsForm, spo2: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Blood Sugar (mg/dL)</Label>
                                            <Input type="number" value={vitalsForm.blood_sugar} onChange={e => setVitalsForm({...vitalsForm, blood_sugar: e.target.value})} />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label>Nursing Notes</Label>
                                            <Input placeholder="Patient status, complaints..." value={vitalsForm.notes} onChange={e => setVitalsForm({...vitalsForm, notes: e.target.value})} />
                                        </div>
                                    </div>
                                    <Button onClick={handleSaveVitals} className="w-full bg-rose-500 hover:bg-rose-600 shadow-sm">
                                        <Save className="w-4 h-4 mr-2" /> Save Vitals
                                    </Button>
                                </div>
                            </div>

                            {/* Right: History Timeline */}
                            <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-white space-y-4">
                                <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                                    <Clock className="w-4 h-4 text-slate-500" /> Recent Vitals History
                                </h4>
                                
                                {isHistoryLoading ? (
                                    <div className="text-center py-8 text-slate-500"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500 mx-auto"></div></div>
                                ) : vitalsHistory.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <Info className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                                        <p className="text-sm text-slate-500">No vitals recorded yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-slate-100">
                                        {vitalsHistory.map((log) => (
                                            <div key={log.log_id} className="relative pl-6">
                                                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                </div>
                                                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-center mb-2 border-b border-slate-50 pb-2">
                                                        <span className="text-xs font-bold text-slate-900">{format(new Date(log.recorded_at), 'dd MMM, h:mm a')}</span>
                                                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{log.nurse_name}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                                                        {log.temperature && <div><span className="text-slate-500">Temp:</span> <span className="font-semibold">{log.temperature}°F</span></div>}
                                                        {log.blood_pressure && <div><span className="text-slate-500">BP:</span> <span className="font-semibold">{log.blood_pressure}</span></div>}
                                                        {log.pulse_rate && <div><span className="text-slate-500">Pulse:</span> <span className="font-semibold">{log.pulse_rate}</span></div>}
                                                        {log.spo2 && <div><span className="text-slate-500">SpO2:</span> <span className="font-semibold text-blue-600">{log.spo2}%</span></div>}
                                                        {log.respiratory_rate && <div><span className="text-slate-500">Resp:</span> <span className="font-semibold">{log.respiratory_rate}</span></div>}
                                                        {log.blood_sugar && <div><span className="text-slate-500">Sugar:</span> <span className="font-semibold">{log.blood_sugar}</span></div>}
                                                    </div>
                                                    {log.notes && (
                                                        <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-slate-600 bg-amber-50 p-2 rounded-lg">
                                                            <span className="font-semibold">Note:</span> {log.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
