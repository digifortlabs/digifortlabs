"use client";

import React, { useState, useEffect } from 'react';
import { Bed, ChevronLeft, RefreshCw, UserPlus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';

export default function HMSBedsPage() {
    const router = useRouter();
    const [wards, setWards] = useState<any[]>([]);
    const [beds, setBeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWard, setSelectedWard] = useState<any>(null);
    const [selectedBed, setSelectedBed] = useState<any>(null);
    const [isAdmitOpen, setIsAdmitOpen] = useState(false);
    const [admitForm, setAdmitForm] = useState({ patient_name: '', age: '', gender: 'Male', diagnosis: '', doctor_name: '', contact_phone: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [w, b] = await Promise.all([
                apiFetch('hms/wards').catch(() => []),
                apiFetch('hms/beds').catch(() => []),
            ]);
            const wardList = w || [];
            setWards(wardList);
            setBeds(b || []);
            if (wardList.length > 0 && !selectedWard) setSelectedWard(wardList[0]);
        } finally { setLoading(false); }
    };

    const handleAdmit = async () => {
        if (!selectedBed) return;
        try {
            await apiFetch('hms/admissions', {
                method: 'POST',
                body: JSON.stringify({ ...admitForm, bed_id: selectedBed.bed_id, ward_id: selectedBed.ward_id, age: parseInt(admitForm.age) || 0 })
            });
            setIsAdmitOpen(false);
            setAdmitForm({ patient_name: '', age: '', gender: 'Male', diagnosis: '', doctor_name: '', contact_phone: '' });
            setSelectedBed(null);
            loadData();
        } catch (e: any) { alert(e.message || 'Failed to admit patient'); }
    };

    const wardBeds = beds.filter(b => selectedWard && b.ward_id === selectedWard.ward_id);
    const occupiedCount = wardBeds.filter(b => b.status === 'occupied').length;
    const availableCount = wardBeds.filter(b => b.status === 'available').length;

    const BED_COLORS: Record<string, string> = {
        available: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 cursor-pointer',
        occupied: 'bg-rose-50 border-rose-200 text-rose-700 cursor-not-allowed opacity-80',
        maintenance: 'bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed opacity-80',
        reserved: 'bg-blue-50 border-blue-200 text-blue-700 cursor-not-allowed opacity-80',
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/hms')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Bed className="w-6 h-6 text-blue-600" /> Bed Status</h1>
                        <p className="text-slate-500 text-sm">Real-time bed occupancy across all wards.</p>
                    </div>
                </div>
                <Button variant="outline" onClick={loadData} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Ward Selector */}
                <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Wards</h2>
                    {loading ? <div className="text-slate-500 text-sm">Loading...</div>
                        : wards.map(ward => {
                            const wBeds = beds.filter(b => b.ward_id === ward.ward_id);
                            const occupied = wBeds.filter(b => b.status === 'occupied').length;
                            const total = ward.total_beds || wBeds.length;
                            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
                            return (
                                <button key={ward.ward_id}
                                    onClick={() => setSelectedWard(ward)}
                                    className={cn('w-full text-left p-4 rounded-xl border-2 transition-all', selectedWard?.ward_id === ward.ward_id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300')}>
                                    <p className="font-semibold text-slate-900 text-sm">{ward.ward_name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{ward.ward_type} • Floor {ward.floor_number || 1}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                            <div className={cn('h-full rounded-full', pct > 80 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
                                                style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-xs font-medium text-slate-600">{occupied}/{total}</span>
                                    </div>
                                </button>
                            );
                        })}
                </div>

                {/* Bed Grid */}
                <div className="lg:col-span-3">
                    {selectedWard ? (
                        <Card className="border-slate-200/60 shadow-sm">
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{selectedWard.ward_name}</CardTitle>
                                        <p className="text-sm text-slate-500 mt-0.5">{occupiedCount} occupied • {availableCount} available</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 inline-block" /> Available</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-200 inline-block" /> Occupied</span>
                                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 inline-block" /> Maintenance</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {wardBeds.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">
                                        <Bed className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No beds configured for this ward.</p>
                                        <p className="text-xs mt-1">Beds are auto-generated based on ward capacity.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                                        {wardBeds.map(bed => (
                                            <button key={bed.bed_id}
                                                disabled={bed.status !== 'available'}
                                                onClick={() => { setSelectedBed(bed); setIsAdmitOpen(true); }}
                                                className={cn('p-3 rounded-xl border-2 transition-all text-center', BED_COLORS[bed.status] || 'bg-slate-50 border-slate-200')}>
                                                <Bed className="w-5 h-5 mx-auto mb-1" />
                                                <span className="text-xs font-bold">{bed.bed_number}</span>
                                                {bed.patient_name && <p className="text-[9px] mt-0.5 truncate max-w-[60px]">{bed.patient_name}</p>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : <div className="p-12 text-center text-slate-400">Select a ward to view beds.</div>}
                </div>
            </div>

            {/* Admit Patient Modal */}
            <Dialog open={isAdmitOpen} onOpenChange={setIsAdmitOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Admit Patient — Bed {selectedBed?.bed_number}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Patient Name *</Label>
                            <Input placeholder="Full name" value={admitForm.patient_name} onChange={e => setAdmitForm({ ...admitForm, patient_name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Age</Label>
                                <Input placeholder="Age" type="number" value={admitForm.age} onChange={e => setAdmitForm({ ...admitForm, age: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Gender</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={admitForm.gender} onChange={e => setAdmitForm({ ...admitForm, gender: e.target.value })}>
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select></div>
                        </div>
                        <div className="space-y-2"><Label>Diagnosis</Label>
                            <Input placeholder="Primary diagnosis" value={admitForm.diagnosis} onChange={e => setAdmitForm({ ...admitForm, diagnosis: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Doctor</Label>
                                <Input placeholder="Admitting doctor" value={admitForm.doctor_name} onChange={e => setAdmitForm({ ...admitForm, doctor_name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Contact phone</Label>
                                <Input placeholder="Attendant phone" value={admitForm.contact_phone} onChange={e => setAdmitForm({ ...admitForm, contact_phone: e.target.value })} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdmitOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdmit} disabled={!admitForm.patient_name} className="bg-blue-600">Admit Patient</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
