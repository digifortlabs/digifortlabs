"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, RefreshCw, Calendar, Users, Activity, Plus, ShieldCheck, Clock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';

export default function OTPage() {
    const router = useRouter();
    const [ots, setOts] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedOt, setSelectedOt] = useState<any>(null);
    const [isAddOtOpen, setIsAddOtOpen] = useState(false);
    
    // Forms
    const [assignForm, setAssignForm] = useState({ patient_id: '', doctor_id: '', scheduled_start: '', scheduled_end: '' });
    const [otForm, setOtForm] = useState({ ot_name: '', ot_type: 'General' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [o, p, d] = await Promise.all([
                apiFetch('hms/ots').catch(() => []),
                apiFetch('patients').catch(() => []),
                apiFetch('users').catch(() => []),
            ]);
            setOts(o || []);
            setPatients(p || []);
            // Filter users to get those with doctor roles
            setDoctors((d || []).filter((u: any) => u.role.includes('doctor') || u.role === 'hospital_admin'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOt = async () => {
        try {
            await apiFetch('hms/ots', {
                method: 'POST',
                body: JSON.stringify(otForm)
            });
            setIsAddOtOpen(false);
            setOtForm({ ot_name: '', ot_type: 'General' });
            loadData();
        } catch (e: any) {
            alert(e.message || 'Failed to create OT Room');
        }
    };

    const handleAssign = async () => {
        if (!selectedOt) return;
        try {
            await apiFetch(`hms/ots/${selectedOt.ot_id}/assign`, {
                method: 'POST',
                body: JSON.stringify({
                    patient_id: parseInt(assignForm.patient_id),
                    doctor_id: parseInt(assignForm.doctor_id),
                    scheduled_start: assignForm.scheduled_start ? new Date(assignForm.scheduled_start).toISOString() : new Date().toISOString(),
                    scheduled_end: assignForm.scheduled_end ? new Date(assignForm.scheduled_end).toISOString() : null
                })
            });
            setIsAssignOpen(false);
            setAssignForm({ patient_id: '', doctor_id: '', scheduled_start: '', scheduled_end: '' });
            setSelectedOt(null);
            loadData();
        } catch (e: any) {
            alert(e.message || 'Failed to schedule surgery');
        }
    };

    const handleRelease = async (otId: number) => {
        if (!confirm("Are you sure you want to conclude the current surgery and release this OT Room?")) return;
        try {
            await apiFetch(`hms/ots/${otId}/release`, { method: 'POST' });
            loadData();
        } catch (e: any) {
            alert(e.message || 'Failed to release OT Room');
        }
    };

    const statusColors: Record<string, string> = {
        available: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        in_use: 'bg-rose-50 text-rose-700 border-rose-200',
        maintenance: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/hospital/hms')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-blue-600 animate-pulse" /> Operation Theater (OT)
                        </h1>
                        <p className="text-slate-500 text-sm">Real-time scheduling and surgeon allocation controls.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
                    <Button onClick={() => setIsAddOtOpen(true)} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" /> Add OT Room</Button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-500 font-medium">Loading OT schedules...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ots.map(ot => {
                        const isAvailable = ot.status === 'available';
                        const isInUse = ot.status === 'in_use';
                        
                        return (
                            <Card key={ot.ot_id} className="border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                                <CardHeader className="border-b bg-slate-50/50 p-5 flex flex-row items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-base text-slate-800 font-bold">{ot.ot_name}</CardTitle>
                                        <Badge className="text-xs mt-1 border-none bg-slate-200 text-slate-600 font-semibold">{ot.ot_type}</Badge>
                                    </div>
                                    <Badge className={cn('text-xs border font-bold capitalize px-2.5 py-0.5 rounded-full', statusColors[ot.status] || 'bg-slate-100 text-slate-700')}>
                                        {ot.status.replace('_', ' ')}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
                                    {isInUse ? (
                                        <div className="space-y-3">
                                            <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-semibold text-rose-500 flex items-center gap-1"><Clock size={12} /> Live Surgery</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-slate-400 font-medium">Patient</p>
                                                    <p className="text-sm font-bold text-slate-800">{ot.patient_name || 'Patient'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-slate-400 font-medium">Lead Surgeon</p>
                                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500" /> Dr. {ot.doctor_name || 'Surgeon'}</p>
                                                </div>
                                            </div>
                                            
                                            {ot.scheduled_start && (
                                                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                                    <Calendar size={11} /> Started: {new Date(ot.scheduled_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-6 text-center text-slate-400 flex flex-col items-center justify-center">
                                            <Activity className="w-8 h-8 opacity-25 mb-1.5" />
                                            <p className="text-sm font-semibold">OT Available</p>
                                            <p className="text-xs mt-0.5">Ready for surgery assignments.</p>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t flex gap-2">
                                        {isAvailable ? (
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-1.5" size="sm" onClick={() => { setSelectedOt(ot); setIsAssignOpen(true); }}>
                                                <Calendar size={14} /> Schedule Surgery
                                            </Button>
                                        ) : (
                                            <Button variant="outline" className="w-full text-rose-600 hover:bg-rose-50 border-rose-200 gap-1.5" size="sm" onClick={() => handleRelease(ot.ot_id)}>
                                                <LogOut size={14} className="rotate-180" /> Conclude Surgery
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {ots.length === 0 && (
                        <div className="col-span-full p-12 text-center text-slate-400">
                            <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="font-semibold">No Operation Theater Rooms Configured.</p>
                            <p className="text-xs mt-1">Configure your clinical rooms above.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create OT Modal */}
            <Dialog open={isAddOtOpen} onOpenChange={setIsAddOtOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Add New OT Room</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2">
                            <Label>OT Room Name *</Label>
                            <Input placeholder="e.g., OT Room 1 (Cardiac)" value={otForm.ot_name} onChange={e => setOtForm({ ...otForm, ot_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>OT Room Type</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={otForm.ot_type} onChange={e => setOtForm({ ...otForm, ot_type: e.target.value })}>
                                <option>General</option>
                                <option>Cardiac</option>
                                <option>Neuro</option>
                                <option>Ortho</option>
                                <option>Ophthalmic</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOtOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateOt} disabled={!otForm.ot_name} className="bg-blue-600">Create Room</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Schedule Surgery Modal */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Schedule Surgery — {selectedOt?.ot_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2">
                            <Label>Select Patient *</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={assignForm.patient_id} onChange={e => setAssignForm({ ...assignForm, patient_id: e.target.value })}>
                                <option value="">Select patient...</option>
                                {patients.map(p => <option key={p.record_id} value={p.record_id}>{p.full_name} (MRD: {p.patient_u_id})</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Lead Surgeon *</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={assignForm.doctor_id} onChange={e => setAssignForm({ ...assignForm, doctor_id: e.target.value })}>
                                <option value="">Select surgeon...</option>
                                {doctors.map(d => <option key={d.user_id} value={d.user_id}>Dr. {d.full_name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Input type="datetime-local" value={assignForm.scheduled_start} onChange={e => setAssignForm({ ...assignForm, scheduled_start: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>End Time (Est)</Label>
                                <Input type="datetime-local" value={assignForm.scheduled_end} onChange={e => setAssignForm({ ...assignForm, scheduled_end: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssign} disabled={!assignForm.patient_id || !assignForm.doctor_id} className="bg-blue-600">Start Surgery</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
