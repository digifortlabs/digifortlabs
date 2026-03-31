"use client";

import React, { useState, useEffect } from 'react';
import { Users, ChevronLeft, Plus, Search, UserPlus, LogOut, Calendar, Bed } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';

export default function HMSAdmissionsPage() {
    const router = useRouter();
    const [admissions, setAdmissions] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [beds, setBeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDischargeOpen, setIsDischargeOpen] = useState(false);
    const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
    const [form, setForm] = useState({ patient_name: '', age: '', gender: 'Male', ward_id: '', bed_id: '', diagnosis: '', doctor_name: '', contact_phone: '', notes: '' });
    const [dischargeNotes, setDischargeNotes] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [a, w, b] = await Promise.all([
                apiFetch('hms/admissions').catch(() => []),
                apiFetch('hms/wards').catch(() => []),
                apiFetch('hms/beds').catch(() => []),
            ]);
            setAdmissions(a || []);
            setWards(w || []);
            setBeds(b || []);
        } finally { setLoading(false); }
    };

    const availableBeds = beds.filter(b => b.status === 'available' && (!form.ward_id || b.ward_id === parseInt(form.ward_id)));

    const handleAdmit = async () => {
        try {
            await apiFetch('hms/admissions', {
                method: 'POST',
                body: JSON.stringify({ ...form, ward_id: parseInt(form.ward_id), bed_id: parseInt(form.bed_id), age: parseInt(form.age) || 0 })
            });
            setIsAddOpen(false);
            setForm({ patient_name: '', age: '', gender: 'Male', ward_id: '', bed_id: '', diagnosis: '', doctor_name: '', contact_phone: '', notes: '' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed'); }
    };

    const handleDischarge = async () => {
        if (!selectedAdmission) return;
        try {
            await apiFetch(`hms/admissions/${selectedAdmission.admission_id}/discharge`, {
                method: 'POST',
                body: JSON.stringify({ discharge_notes: dischargeNotes, discharge_date: new Date().toISOString() })
            });
            setIsDischargeOpen(false);
            setDischargeNotes('');
            setSelectedAdmission(null);
            loadData();
        } catch (e: any) { alert(e.message || 'Failed to discharge'); }
    };

    const filtered = admissions.filter(a =>
        a.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
        a.doctor_name?.toLowerCase().includes(search.toLowerCase())
    );

    const active = filtered.filter(a => a.status === 'active');
    const discharged = filtered.filter(a => a.status !== 'active').slice(0, 10);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/hms')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><UserPlus className="w-6 h-6 text-emerald-600" /> Admissions</h1>
                        <p className="text-slate-500 text-sm">{active.length} active admission{active.length !== 1 ? 's' : ''}.</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" /> New Admission
                </Button>
            </div>

            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search by patient, doctor, diagnosis..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? <div className="p-12 text-center text-slate-500">Loading admissions...</div> : (
                <div className="space-y-6">
                    {/* Active */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Active Admissions ({active.length})</h2>
                        {active.length === 0 ? (
                            <Card className="border-slate-200/60"><CardContent className="p-8 text-center text-slate-400">No active admissions.</CardContent></Card>
                        ) : (
                            <div className="space-y-3">
                                {active.map(a => (
                                    <Card key={a.admission_id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                                                        {a.patient_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-semibold text-slate-900">{a.patient_name}</h3>
                                                            <Badge className="text-xs border-none bg-emerald-100 text-emerald-700">Active</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                                                            {a.diagnosis && <span>{a.diagnosis}</span>}
                                                            {a.ward_name && <span className="flex items-center gap-1"><Bed className="w-3 h-3" />{a.ward_name} • Bed {a.bed_number}</span>}
                                                            {a.doctor_name && <span>Dr. {a.doctor_name}</span>}
                                                            {a.admission_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.admission_date).toLocaleDateString('en-IN')}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline" className="gap-2 flex-shrink-0 border-rose-200 text-rose-600 hover:bg-rose-50"
                                                    onClick={() => { setSelectedAdmission(a); setIsDischargeOpen(true); }}>
                                                    <LogOut className="w-3.5 h-3.5" /> Discharge
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Discharges */}
                    {discharged.length > 0 && (
                        <div>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Discharges</h2>
                            <div className="space-y-2">
                                {discharged.map(a => (
                                    <div key={a.admission_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">{a.patient_name?.charAt(0)}</div>
                                            <div>
                                                <p className="font-medium text-slate-700 text-sm">{a.patient_name}</p>
                                                <p className="text-xs text-slate-400">{a.diagnosis} • Discharged {a.discharge_date ? new Date(a.discharge_date).toLocaleDateString('en-IN') : ''}</p>
                                            </div>
                                        </div>
                                        <Badge className="text-xs border-none bg-slate-200 text-slate-600">Discharged</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Admit Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>New Admission</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Patient Name *</Label>
                            <Input placeholder="Full name" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Age</Label>
                                <Input type="number" placeholder="Age" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Gender</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select></div>
                        </div>
                        <div className="space-y-2"><Label>Ward</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={form.ward_id} onChange={e => setForm({ ...form, ward_id: e.target.value, bed_id: '' })}>
                                <option value="">Select ward...</option>
                                {wards.map(w => <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>)}
                            </select></div>
                        {form.ward_id && (
                            <div className="space-y-2"><Label>Bed</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={form.bed_id} onChange={e => setForm({ ...form, bed_id: e.target.value })}>
                                    <option value="">Select bed...</option>
                                    {availableBeds.map(b => <option key={b.bed_id} value={b.bed_id}>Bed {b.bed_number}</option>)}
                                </select></div>
                        )}
                        <div className="space-y-2"><Label>Diagnosis</Label>
                            <Input placeholder="Primary diagnosis" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Doctor</Label>
                                <Input placeholder="Admitting doctor" value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Contact</Label>
                                <Input placeholder="Phone number" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Notes</Label>
                            <Textarea placeholder="Admission notes..." rows={2} className="resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdmit} disabled={!form.patient_name || !form.ward_id} className="bg-emerald-600">Admit Patient</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Discharge Modal */}
            <Dialog open={isDischargeOpen} onOpenChange={setIsDischargeOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Discharge — {selectedAdmission?.patient_name}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-slate-500">This will free up {selectedAdmission?.ward_name} Bed {selectedAdmission?.bed_number}.</p>
                        <div className="space-y-2"><Label>Discharge Notes</Label>
                            <Textarea placeholder="Summary, instructions at discharge..." rows={3} className="resize-none" value={dischargeNotes} onChange={e => setDischargeNotes(e.target.value)} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDischargeOpen(false)}>Cancel</Button>
                        <Button onClick={handleDischarge} className="bg-rose-600 hover:bg-rose-700">Confirm Discharge</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
