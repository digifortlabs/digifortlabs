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
import toast from 'react-hot-toast';

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
    const [dischargeForm, setDischargeForm] = useState({
        history: '',
        final_diagnosis: '',
        operative_note: '',
        advice_on_discharge: '',
        general_advice: '',
        follow_up_plan: '',
        include_investigations: false,
        discharge_notes: ''
    });
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const delayDebounce = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const performSearch = async (query: string) => {
        setSearching(true);
        try {
            const data = await apiFetch(`patients?search=${encodeURIComponent(query)}`);
            setSearchResults(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Failed to search patients", e);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectPatient = (patient: any) => {
        let cleanAge = '';
        if (patient.age) {
            const match = patient.age.match(/\d+/);
            if (match) cleanAge = match[0];
        }
        setForm({
            ...form,
            patient_name: patient.full_name,
            age: cleanAge,
            gender: patient.gender || 'Male',
            diagnosis: patient.diagnosis || '',
            doctor_name: patient.doctor_name || '',
            contact_phone: patient.contact_number || patient.phone || ''
        });
        setSelectedPatientId(patient.record_id);
        setSearchResults([]);
        setSearchQuery('');
    };

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

    const availableBeds = beds.filter(b => b.status?.toLowerCase() === 'available' && (!form.ward_id || b.ward_id === parseInt(form.ward_id)));

    const handleAdmit = async () => {
        try {
            await apiFetch('hms/admissions', {
                method: 'POST',
                body: JSON.stringify({ ...form, patient_id: selectedPatientId, ward_id: parseInt(form.ward_id), bed_id: parseInt(form.bed_id), age: parseInt(form.age) || 0 })
            });
            setIsAddOpen(false);
            setForm({ patient_name: '', age: '', gender: 'Male', ward_id: '', bed_id: '', diagnosis: '', doctor_name: '', contact_phone: '', notes: '' });
            setSelectedPatientId(null);
            setSearchQuery('');
            loadData();
        } catch (e: any) { toast.error(e.message || 'Failed'); }
    };

    const handleOpenDischarge = async (admission: any) => {
        setSelectedAdmission(admission);
        setIsDischargeOpen(true);
        setDischargeForm({
            history: '',
            final_diagnosis: admission.diagnosis || '',
            operative_note: '',
            advice_on_discharge: '',
            general_advice: '',
            follow_up_plan: '',
            include_investigations: false,
            discharge_notes: ''
        });
        try {
            const data = await apiFetch(`hms/admissions/${admission.admission_id}`);
            const surgeries = data.surgeries || [];
            if (surgeries.length > 0) {
                const opNote = surgeries.map((s:any) => s.surgery_name).join(', ');
                setDischargeForm(prev => ({ ...prev, operative_note: opNote }));
            }
        } catch(e) { console.error(e); }
    };

    const handleDischarge = async () => {
        if (!selectedAdmission) return;
        try {
            await apiFetch(`hms/admissions/${selectedAdmission.admission_id}/discharge`, {
                method: 'POST',
                body: JSON.stringify({ ...dischargeForm, discharge_date: new Date().toISOString() })
            });
            setIsDischargeOpen(false);
            setDischargeForm({
                history: '', final_diagnosis: '', operative_note: '', advice_on_discharge: '',
                general_advice: '', follow_up_plan: '', include_investigations: false, discharge_notes: ''
            });
            setSelectedAdmission(null);
            loadData();
        } catch (e: any) { toast.error(e.message || 'Failed to discharge'); }
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
                    <Button variant="ghost" size="icon" onClick={() => router.push('/hospital/hms')} className="rounded-full bg-white shadow-sm border">
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
                                                    onClick={() => handleOpenDischarge(a)}>
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
            <Dialog open={isAddOpen} onOpenChange={(open) => {
                setIsAddOpen(open);
                if (!open) {
                    setForm({ patient_name: '', age: '', gender: 'Male', ward_id: '', bed_id: '', diagnosis: '', doctor_name: '', contact_phone: '', notes: '' });
                    setSelectedPatientId(null);
                    setSearchQuery('');
                    setSearchResults([]);
                }
            }}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>New Admission</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Search registered patients */}
                        <div className="space-y-1.5 relative">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Registered Patient (Optional)</Label>
                            <Input 
                                placeholder="Type patient name or MRD..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="border-emerald-100 focus:border-emerald-500 font-medium"
                            />
                            {searching && <span className="absolute right-3 bottom-2.5 text-xs text-slate-400">Searching...</span>}
                            
                            {searchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                    {searchResults.map(p => (
                                        <button 
                                            key={p.record_id}
                                            onClick={() => handleSelectPatient(p)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50/50 flex flex-col justify-center transition-colors"
                                        >
                                            <span className="font-bold text-slate-900 text-sm">{p.full_name}</span>
                                            <span className="text-xs text-slate-500 font-mono mt-0.5">MRD: {p.patient_u_id} • Age: {p.age || 'N/A'} • {p.gender}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedPatientId && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Selected Existing Patient</span>
                                    <p className="font-extrabold text-emerald-900 text-sm leading-tight mt-0.5">{form.patient_name}</p>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => {
                                        setSelectedPatientId(null);
                                        setForm({ ...form, patient_name: '', age: '', gender: 'Male', diagnosis: '', doctor_name: '', contact_phone: '' });
                                    }}
                                    className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 font-bold"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}

                        <div className="border-t border-slate-100 pt-3 space-y-3">
                            {!selectedPatientId && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Patient Name *</Label>
                                        <Input 
                                            placeholder="Full name" 
                                            value={form.patient_name} 
                                            onChange={e => setForm({ ...form, patient_name: e.target.value })} 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Age</Label>
                                            <Input 
                                                placeholder="Age" 
                                                type="number" 
                                                value={form.age} 
                                                onChange={e => setForm({ ...form, age: e.target.value })} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            <select 
                                                className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                                value={form.gender} 
                                                onChange={e => setForm({ ...form, gender: e.target.value })}
                                            >
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Contact phone</Label>
                                        <Input placeholder="Attendant phone" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} />
                                    </div>
                                </>
                            )}
                            <div className="space-y-2">
                                <Label>Diagnosis</Label>
                                <Input placeholder="Primary diagnosis" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Admitting Doctor</Label>
                                <Input placeholder="Admitting doctor" value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} />
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
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdmit} disabled={!form.patient_name || !form.ward_id} className="bg-emerald-600">Admit Patient</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Discharge Modal */}
            <Dialog open={isDischargeOpen} onOpenChange={setIsDischargeOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Discharge — {selectedAdmission?.patient_name}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-slate-500">Fill in the details for the Discharge Card. This will also free up {selectedAdmission?.ward_name} Bed {selectedAdmission?.bed_number}.</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Final Diagnosis</Label>
                                <Textarea placeholder="Final Diagnosis..." rows={2} className="resize-none" value={dischargeForm.final_diagnosis} onChange={(e: any) => setDischargeForm({...dischargeForm, final_diagnosis: e.target.value})} /></div>
                            <div className="space-y-2"><Label>History</Label>
                                <Textarea placeholder="Patient history..." rows={2} className="resize-none" value={dischargeForm.history} onChange={(e: any) => setDischargeForm({...dischargeForm, history: e.target.value})} /></div>
                            
                            <div className="space-y-2"><Label>Operative Details</Label>
                                <Textarea placeholder="Operative notes..." rows={2} className="resize-none" value={dischargeForm.operative_note} onChange={(e: any) => setDischargeForm({...dischargeForm, operative_note: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Advice on Discharge</Label>
                                <Textarea placeholder="Advice on discharge..." rows={2} className="resize-none" value={dischargeForm.advice_on_discharge} onChange={(e: any) => setDischargeForm({...dischargeForm, advice_on_discharge: e.target.value})} /></div>
                            
                            <div className="space-y-2"><Label>General Advice</Label>
                                <Textarea placeholder="General advice..." rows={2} className="resize-none" value={dischargeForm.general_advice} onChange={(e: any) => setDischargeForm({...dischargeForm, general_advice: e.target.value})} /></div>
                            <div className="space-y-2"><Label>Follow Up Plan</Label>
                                <Textarea placeholder="Follow up plan..." rows={2} className="resize-none" value={dischargeForm.follow_up_plan} onChange={(e: any) => setDischargeForm({...dischargeForm, follow_up_plan: e.target.value})} /></div>
                        </div>

                        <div className="space-y-2"><Label>Additional Notes (Legacy Summary)</Label>
                            <Textarea placeholder="Summary, additional instructions..." rows={2} className="resize-none" value={dischargeForm.discharge_notes} onChange={(e: any) => setDischargeForm({...dischargeForm, discharge_notes: e.target.value})} /></div>
                        
                        <div className="flex items-center space-x-2 pt-2">
                            <input type="checkbox" id="include_labs" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" 
                                checked={dischargeForm.include_investigations} 
                                onChange={e => setDischargeForm({...dischargeForm, include_investigations: e.target.checked})} />
                            <Label htmlFor="include_labs" className="font-normal cursor-pointer text-slate-700">Include detailed lab investigations in printout (if unchecked, shows "Attached")</Label>
                        </div>
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
