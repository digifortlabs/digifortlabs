"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RefreshCw, Activity, Plus, ShieldCheck, UserCheck, CreditCard, HelpCircle, UserPlus, Heart, AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';

export default function RFIDPage() {
    const router = useRouter();
    const [cards, setCards] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanInput, setScanInput] = useState('');
    const [scannedRecord, setScannedRecord] = useState<any>(null);
    const [scanError, setScanError] = useState('');
    const [scanLoading, setScanLoading] = useState(false);
    
    // Modals
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isLinkOpen, setIsLinkOpen] = useState(false);
    
    // Forms
    const [regForm, setRegForm] = useState({ card_number: '' });
    const [linkForm, setLinkForm] = useState({ card_number: '', patient_id: '' });
    const [vitalsForm, setVitalsForm] = useState({ temp: '', bp: '', pulse: '', spo2: '', respiratory_rate: '', notes: '' });

    const scanInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [c, p] = await Promise.all([
                apiFetch('hms/rfid').catch(() => []),
                apiFetch('patients').catch(() => []),
            ]);
            setCards(c || []);
            setPatients(p || []);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterCard = async () => {
        try {
            await apiFetch('hms/rfid/register', {
                method: 'POST',
                body: JSON.stringify(regForm)
            });
            setIsRegisterOpen(false);
            setRegForm({ card_number: '' });
            loadData();
        } catch (e: any) {
            alert(e.message || 'Failed to register RFID card');
        }
    };

    const handleLinkCard = async () => {
        try {
            await apiFetch('hms/rfid/assign', {
                method: 'POST',
                body: JSON.stringify({
                    card_number: linkForm.card_number,
                    patient_id: parseInt(linkForm.patient_id)
                })
            });
            setIsLinkOpen(false);
            setLinkForm({ card_number: '', patient_id: '' });
            loadData();
            // If currently viewing scanned card details, reload to see patient details
            if (scannedRecord && scannedRecord.card_number === linkForm.card_number) {
                handleScan(linkForm.card_number);
            }
        } catch (e: any) {
            alert(e.message || 'Failed to assign card to patient');
        }
    };

    const handleScan = async (cardNumberOverride?: string) => {
        const queryNum = cardNumberOverride || scanInput;
        if (!queryNum) return;
        
        setScanLoading(true);
        setScanError('');
        setScannedRecord(null);
        
        try {
            const data = await apiFetch(`hms/rfid/scan/${queryNum}`);
            if (data && data.status === 'success') {
                setScannedRecord(data);
                setScanInput('');
            } else {
                setScanError('Card not linked or inactive.');
            }
        } catch (e: any) {
            setScanError(e.message || 'RFID card not recognized.');
        } finally {
            setScanLoading(false);
        }
    };

    const handleAddVitals = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scannedRecord || !scannedRecord.active_admission) return;
        try {
            const res = await apiFetch(`hms/admissions/${scannedRecord.active_admission.admission_id}/vitals`, {
                method: 'POST',
                body: JSON.stringify(vitalsForm)
            });
            if (res) {
                // Update scanned details vitals log locally
                setScannedRecord({
                    ...scannedRecord,
                    active_admission: {
                        ...scannedRecord.active_admission,
                        vitals_log: res.vitals_log
                    }
                });
                setVitalsForm({ temp: '', bp: '', pulse: '', spo2: '', respiratory_rate: '', notes: '' });
                alert("Vitals successfully logged completely paperless!");
            }
        } catch (e: any) {
            alert(e.message || 'Failed to record vitals');
        }
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
                            <CreditCard className="w-6 h-6 text-indigo-600" /> RFID Paperless Flow
                        </h1>
                        <p className="text-slate-500 text-sm">Hardware scan simulator and EHR smart patient identifier registry.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
                    <Button onClick={() => setIsRegisterOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" /> Register New Card</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Hardware Simulator Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-slate-200/60 shadow-lg bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
                        <CardHeader>
                            <CardTitle className="text-indigo-400 flex items-center gap-2 font-black tracking-wide">
                                <Activity className="w-4 h-4 text-indigo-400 animate-pulse" /> RFID TAP SCANNER
                            </CardTitle>
                            <CardDescription className="text-indigo-200/60">Simulate tapping a patient RFID smart card.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            
                            {/* Visual Scanner Area */}
                            <div className="relative flex flex-col items-center justify-center p-8 bg-slate-950/40 border border-indigo-500/20 rounded-2xl group transition-all duration-300">
                                <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CreditCard className="w-16 h-16 text-indigo-500/60 group-hover:text-indigo-400 transform group-hover:scale-105 transition-all duration-300" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse absolute top-4 right-4 shadow-lg shadow-emerald-500/50" />
                                
                                <span className="text-xs font-black text-indigo-400/80 uppercase tracking-widest mt-4">Place Card Near Reader</span>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label className="text-indigo-200">Tap Registered Card UID</Label>
                                    <select className="w-full border border-indigo-500/20 bg-slate-950/80 text-white rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        value={scanInput} onChange={e => setScanInput(e.target.value)}>
                                        <option value="" className="text-slate-500">Select active card to tap...</option>
                                        {cards.filter(c => c.patient_id).map(c => (
                                            <option key={c.rfid_id} value={c.card_number} className="text-slate-800">
                                                {c.patient_name} — UID: {c.card_number}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30"
                                    disabled={!scanInput || scanLoading} onClick={() => handleScan()}>
                                    {scanLoading ? 'Reading EHR Sensor...' : '⚡ Tap Simulated RFID Card'}
                                </Button>
                            </div>

                            {scanError && (
                                <div className="bg-rose-500/25 border border-rose-500/30 p-4 rounded-xl flex items-start gap-3 text-xs text-rose-200">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                                    <span>{scanError} Ensure the card has been registered and is linked to an active patient record below.</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Link Card Modals button list */}
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="pb-3"><CardTitle className="text-base">Quick Links</CardTitle></CardHeader>
                        <CardContent className="p-4 space-y-2">
                            <Button variant="outline" className="w-full justify-start gap-3 py-5 rounded-xl border-slate-200" onClick={() => setIsLinkOpen(true)}>
                                <UserPlus className="w-4 h-4 text-slate-500" /> Link Card to Active Patient
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Scanned EHR Dashboard View */}
                <div className="lg:col-span-2">
                    {scannedRecord ? (
                        <div className="space-y-6">
                            
                            {/* Glowing Patient Profile Screen */}
                            <Card className="border-indigo-100 shadow-md overflow-hidden bg-white relative">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
                                <CardHeader className="border-b p-6 bg-slate-50/50 flex flex-row items-center justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl">
                                            {scannedRecord.patient.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-lg text-slate-900 leading-none">{scannedRecord.patient.full_name}</h3>
                                                <Badge className="text-xs border-none bg-indigo-100 text-indigo-700 font-bold">RFID Scanned</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1.5 font-semibold">MRD Number: <span className="text-indigo-600 font-bold">{scannedRecord.patient.patient_u_id}</span></p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Linked Card UID</span>
                                        <code className="text-sm font-mono font-bold bg-slate-100 border px-3 py-1 rounded-lg text-slate-800 block mt-1">{scannedRecord.card_number}</code>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 border border-slate-100 p-4 rounded-2xl">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase block">Age / Gender</span>
                                            <span className="text-sm font-bold text-slate-800 mt-1 block">{scannedRecord.patient.age || 'N/A'} yrs • {scannedRecord.patient.gender}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase block">Attendant Phone</span>
                                            <span className="text-sm font-bold text-slate-800 mt-1 block">{scannedRecord.patient.phone || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase block">Intake Complaint</span>
                                            <span className="text-sm font-bold text-slate-800 mt-1 block truncate max-w-[120px]">{scannedRecord.patient.chief_complaint}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase block">Treating Doctor</span>
                                            <span className="text-sm font-bold text-slate-800 mt-1 block">Dr. {scannedRecord.patient.doctor_name || 'Unassigned'}</span>
                                        </div>
                                    </div>

                                    {scannedRecord.active_admission ? (
                                        <div className="space-y-6">
                                            
                                            {/* Inpatient Allocation */}
                                            <div className="border border-indigo-100 bg-indigo-50/20 p-4 rounded-2xl space-y-2">
                                                <h4 className="font-bold text-xs text-indigo-800 uppercase tracking-wide">Active Inpatient Ward Location</h4>
                                                <div className="grid grid-cols-2 gap-4 text-sm mt-1">
                                                    <div>
                                                        <span className="text-xs text-slate-500 font-medium">Ward Floor Allocation</span>
                                                        <p className="font-bold text-slate-800">{scannedRecord.active_admission.ward_name}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-slate-500 font-medium">Allocated Bed ID</span>
                                                        <p className="font-bold text-slate-800">Bed {scannedRecord.active_admission.bed_number}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Inpatient Paperless Vitals Logs */}
                                            <div className="space-y-4">
                                                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Heart size={16} className="text-rose-500" /> Daily Clinical Vitals Log</h4>
                                                
                                                {/* Vitals Log list */}
                                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                    {scannedRecord.active_admission.vitals_log.length === 0 ? (
                                                        <p className="text-xs text-slate-400 py-2 italic text-center bg-slate-50 rounded-xl border border-dashed">No vitals registered today.</p>
                                                    ) : (
                                                        scannedRecord.active_admission.vitals_log.map((v: any, index: number) => (
                                                            <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center gap-3">
                                                                <div className="grid grid-cols-5 gap-3 text-center flex-1">
                                                                    <div><span className="text-[9px] text-slate-400 font-bold block">Temp</span><span className="text-xs font-bold text-slate-800">{v.temp || '--'} °F</span></div>
                                                                    <div><span className="text-[9px] text-slate-400 font-bold block">BP</span><span className="text-xs font-bold text-slate-800">{v.bp || '--'}</span></div>
                                                                    <div><span className="text-[9px] text-slate-400 font-bold block">Pulse</span><span className="text-xs font-bold text-slate-800">{v.pulse || '--'}</span></div>
                                                                    <div><span className="text-[9px] text-slate-400 font-bold block">SpO2</span><span className="text-xs font-bold text-slate-800">{v.spo2 || '--'}%</span></div>
                                                                    <div><span className="text-[9px] text-slate-400 font-bold block">Resp</span><span className="text-xs font-bold text-slate-800">{v.respiratory_rate || '--'}</span></div>
                                                                </div>
                                                                <div className="text-right text-[10px] text-slate-400 flex-shrink-0">
                                                                    <span className="block font-semibold text-slate-600">{v.recorded_by}</span>
                                                                    <span>{new Date(v.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                {/* Add Vitals Inline Form */}
                                                <form onSubmit={handleAddVitals} className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                                                    <h5 className="font-bold text-xs text-slate-600 uppercase tracking-wide">Record Daily Vitals (Paperless Input)</h5>
                                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                        <div>
                                                            <Input placeholder="Temp" size={30} className="h-9 text-xs" value={vitalsForm.temp} onChange={e => setVitalsForm({ ...vitalsForm, temp: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <Input placeholder="BP" className="h-9 text-xs" value={vitalsForm.bp} onChange={e => setVitalsForm({ ...vitalsForm, bp: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <Input placeholder="Pulse" className="h-9 text-xs" value={vitalsForm.pulse} onChange={e => setVitalsForm({ ...vitalsForm, pulse: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <Input placeholder="SpO2" className="h-9 text-xs" value={vitalsForm.spo2} onChange={e => setVitalsForm({ ...vitalsForm, spo2: e.target.value })} />
                                                        </div>
                                                        <div>
                                                            <Input placeholder="Resp" className="h-9 text-xs" value={vitalsForm.respiratory_rate} onChange={e => setVitalsForm({ ...vitalsForm, respiratory_rate: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Input placeholder="Notes..." className="h-9 text-xs flex-1" value={vitalsForm.notes} onChange={e => setVitalsForm({ ...vitalsForm, notes: e.target.value })} />
                                                        <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-500 text-white font-bold h-9">
                                                            Save Vitals
                                                        </Button>
                                                    </div>
                                                </form>

                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-xl flex items-start gap-3">
                                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                                            <div>
                                                <p className="font-bold">Outpatient Status (OPD)</p>
                                                <p className="mt-0.5">This patient is currently mapped as an outpatient and does not have an active IPD ward bed assignment.</p>
                                            </div>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-400 border border-dashed rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center py-24">
                            <Activity className="w-12 h-12 opacity-20 animate-pulse mb-3 text-indigo-500" />
                            <p className="font-bold text-slate-500">EHR Patient Scan Reader Idle</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm">Tap an RFID Card in the simulator panel to decrypt and instantly display the patient clinical chart.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* RFID Ledger */}
            <Card className="border-slate-200/60 shadow-sm mt-6">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg">RFID Registry Ledger</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500 font-medium">Loading ledger...</div>
                        ) : cards.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="font-semibold">No RFID smart cards registered.</p>
                                <p className="text-xs mt-1">Register new digital hospital smart cards above.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="p-4 pl-6">Card UID Number</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Linked Patient Name</th>
                                        <th className="p-4">MRD Number</th>
                                        <th className="p-4">Issued At</th>
                                        <th className="p-4 pr-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {cards.map(c => (
                                        <tr key={c.rfid_id} className="hover:bg-slate-50/50 text-sm transition-colors">
                                            <td className="p-4 pl-6 font-mono font-bold text-slate-900">{c.card_number}</td>
                                            <td className="p-4">
                                                <Badge className={cn('text-xs border font-bold px-2 py-0.5 capitalize', c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200')}>
                                                    {c.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                {c.patient_name ? (
                                                    <span className="font-semibold text-slate-800">{c.patient_name}</span>
                                                ) : <span className="text-slate-400 font-medium italic">Unassigned (Blank)</span>}
                                            </td>
                                            <td className="p-4">
                                                {c.mrd_number ? (
                                                    <span className="font-mono text-indigo-600 font-bold">{c.mrd_number}</span>
                                                ) : <span className="text-slate-400">--</span>}
                                            </td>
                                            <td className="p-4 text-slate-500 font-medium">
                                                {new Date(c.issued_at).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <Button size="sm" variant="outline" className="border-slate-200"
                                                    onClick={() => { setLinkForm({ card_number: c.card_number, patient_id: '' }); setIsLinkOpen(true); }}>
                                                    Link Patient
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Register Card Modal */}
            <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Register Blank Smart Card</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2">
                            <Label>Card UID Hex/Number *</Label>
                            <Input placeholder="e.g., DFL-RFID-091A" value={regForm.card_number} onChange={e => setRegForm({ ...regForm, card_number: e.target.value })} />
                            <p className="text-[10px] text-slate-400">Input card RFID chip serial number to add to hospital database.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
                        <Button onClick={handleRegisterCard} disabled={!regForm.card_number} className="bg-indigo-600">Register Card</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Link Card Modal */}
            <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Link Smart Card to Patient</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2">
                            <Label>Card UID Number</Label>
                            <Input disabled value={linkForm.card_number} />
                        </div>
                        <div className="space-y-2">
                            <Label>Select Patient *</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={linkForm.patient_id} onChange={e => setLinkForm({ ...linkForm, patient_id: e.target.value })}>
                                <option value="">Select patient...</option>
                                {patients.map(p => <option key={p.record_id} value={p.record_id}>{p.full_name} (MRD: {p.patient_u_id})</option>)}
                            </select>
                            <p className="text-[10px] text-slate-400">Links card to this patient record. Tapping card will instantly load this patient EHR profile.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLinkOpen(false)}>Cancel</Button>
                        <Button onClick={handleLinkCard} disabled={!linkForm.patient_id} className="bg-indigo-600">Link Card</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
