"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, RefreshCw, Activity, Plus, ShieldCheck, Cpu, MapPin, Truck, AlertTriangle, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';

export default function EquipmentPage() {
    const router = useRouter();
    const [equipment, setEquipment] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);
    const [beds, setBeds] = useState<any[]>([]);
    const [ots, setOts] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isDeployOpen, setIsDeployOpen] = useState(false);
    const [selectedEq, setSelectedEq] = useState<any>(null);
    
    // Forms
    const [eqForm, setEqForm] = useState({ name: '', equipment_type: 'Ventilator' });
    const [deployForm, setDeployForm] = useState({ destination: 'bed', ward_id: '', bed_id: '', ot_id: '', patient_id: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [eq, w, b, o, p] = await Promise.all([
                apiFetch('hms/equipment').catch(() => []),
                apiFetch('hms/wards').catch(() => []),
                apiFetch('hms/beds').catch(() => []),
                apiFetch('hms/ots').catch(() => []),
                apiFetch('patients').catch(() => []),
            ]);
            setEquipment(eq || []);
            setWards(w || []);
            setBeds(b || []);
            setOts(o || []);
            setPatients(p || []);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await apiFetch('hms/equipment', {
                method: 'POST',
                body: JSON.stringify(eqForm)
            });
            setIsAddOpen(false);
            setEqForm({ name: '', equipment_type: 'Ventilator' });
            loadData();
        } catch (e: any) {
            alert(e.message || 'Failed to register device');
        }
    };

    const handleDeploy = async () => {
        if (!selectedEq) return;
        try {
            const bodyData: any = {};
            if (deployForm.destination === 'bed') {
                bodyData.ward_id = parseInt(deployForm.ward_id);
                bodyData.bed_id = parseInt(deployForm.bed_id);
                // Auto link patient currently occupying that bed if exists
                const bedObj = beds.find(b => b.bed_id === bodyData.bed_id);
                if (bedObj && bedObj.patient_id) {
                    bodyData.patient_id = bedObj.patient_id;
                }
            } else if (deployForm.destination === 'ot') {
                bodyData.ot_id = parseInt(deployForm.ot_id);
                // Auto link patient currently in that OT if exists
                const otObj = ots.find(o => o.ot_id === bodyData.ot_id);
                if (otObj && otObj.patient_id) {
                    bodyData.patient_id = otObj.patient_id;
                }
            } else if (deployForm.destination === 'patient') {
                bodyData.patient_id = parseInt(deployForm.patient_id);
            }

            await apiFetch(`hms/equipment/${selectedEq.equipment_id}/deploy`, {
                method: 'POST',
                body: JSON.stringify(bodyData)
            });
            setIsDeployOpen(false);
            setDeployForm({ destination: 'bed', ward_id: '', bed_id: '', ot_id: '', patient_id: '' });
            setSelectedEq(null);
            loadData();
        } catch (e: any) {
            alert(e.message || 'Failed to deploy device');
        }
    };

    const handleRetrieve = async (eqId: number) => {
        if (!confirm("Are you sure you want to retrieve this medical device back to the central warehouse?")) return;
        try {
            await apiFetch(`hms/equipment/${eqId}/retrieve`, { method: 'POST' });
            loadData();
        } catch (e: any) {
            alert(e.message || 'Failed to retrieve device');
        }
    };

    // Filtered beds for selected ward in deploy form
    const wardBeds = beds.filter(b => b.ward_id === parseInt(deployForm.ward_id));

    const total = equipment.length;
    const inUse = equipment.filter(e => e.status === 'in_use').length;
    const available = equipment.filter(e => e.status === 'available').length;
    const maintenance = equipment.filter(e => e.status === 'maintenance').length;

    const statusColors: Record<string, string> = {
        available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        in_use: 'bg-blue-50 text-blue-700 border-blue-200',
        maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    const stats = [
        { label: 'Total Devices', value: total, icon: Cpu, color: 'text-blue-600 bg-blue-50' },
        { label: 'Deployed (In Use)', value: inUse, icon: MapPin, color: 'text-indigo-600 bg-indigo-50' },
        { label: 'Warehouse (Available)', value: available, icon: Truck, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'In Maintenance', value: maintenance, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' }
    ];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/hospital/hms')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Cpu className="w-6 h-6 text-indigo-600" /> Equipment Logistics
                        </h1>
                        <p className="text-slate-500 text-sm">Deploy and track ventilators, patient monitors, and ICU devices.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
                    <Button onClick={() => setIsAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" /> Register Device</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <Card key={i} className="border-slate-200/60 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{s.label}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '–' : s.value}</h3>
                                </div>
                                <div className={cn('p-2.5 rounded-xl', s.color.split(' ')[1])}>
                                    <s.icon className={cn('w-5 h-5', s.color.split(' ')[0])} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg">Devices Ledger</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500 font-medium">Loading inventory...</div>
                        ) : equipment.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <Cpu className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p className="font-semibold">No medical devices registered.</p>
                                <p className="text-xs mt-1">Register new hospital equipment to get started.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="p-4 pl-6">Device Name</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Current Allocation</th>
                                        <th className="p-4">Linked Patient</th>
                                        <th className="p-4 pr-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {equipment.map(eq => {
                                        const isAvailable = eq.status === 'available';
                                        
                                        return (
                                            <tr key={eq.equipment_id} className="hover:bg-slate-50/50 text-sm transition-colors">
                                                <td className="p-4 pl-6 font-semibold text-slate-900">{eq.name}</td>
                                                <td className="p-4 text-slate-600 font-medium">{eq.equipment_type}</td>
                                                <td className="p-4">
                                                    <Badge className={cn('text-xs border font-bold px-2 py-0.5 capitalize', statusColors[eq.status] || 'bg-slate-100 text-slate-700')}>
                                                        {eq.status.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-slate-600 font-bold flex items-center gap-1.5 mt-1.5">
                                                    <MapPin size={14} className="text-slate-400" /> {eq.location}
                                                </td>
                                                <td className="p-4">
                                                    {eq.patient_name ? (
                                                        <span className="flex items-center gap-1.5 text-slate-800 font-semibold"><User size={13} className="text-slate-400" /> {eq.patient_name}</span>
                                                    ) : <span className="text-slate-400 font-medium">N/A</span>}
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    {isAvailable ? (
                                                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => { setSelectedEq(eq); setIsDeployOpen(true); }}>
                                                            Deploy Device
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="outline" className="text-rose-600 hover:bg-rose-50 border-rose-200" onClick={() => handleRetrieve(eq.equipment_id)}>
                                                            Retrieve
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Register Device Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Register Hospital Device</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2">
                            <Label>Device Identifier Name *</Label>
                            <Input placeholder="e.g., Ventilator V-102" value={eqForm.name} onChange={e => setEqForm({ ...eqForm, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Device Type</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={eqForm.equipment_type} onChange={e => setEqForm({ ...eqForm, equipment_type: e.target.value })}>
                                <option>Ventilator</option>
                                <option>ICU Monitor</option>
                                <option>Defibrillator</option>
                                <option>ECG Machine</option>
                                <option>Infusion Pump</option>
                                <option>Portable X-Ray</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!eqForm.name} className="bg-indigo-600">Register Device</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deploy Device Modal */}
            <Dialog open={isDeployOpen} onOpenChange={setIsDeployOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Deploy Device — {selectedEq?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2">
                            <Label>Deployment Target</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={deployForm.destination} onChange={e => setDeployForm({ ...deployForm, destination: e.target.value })}>
                                <option value="bed">Deploy to IPD Bed</option>
                                <option value="ot">Deploy to Operation Theater (OT)</option>
                                <option value="patient">Deploy Directly to Patient</option>
                            </select>
                        </div>

                        {deployForm.destination === 'bed' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Select Ward</Label>
                                    <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                        value={deployForm.ward_id} onChange={e => setDeployForm({ ...deployForm, ward_id: e.target.value, bed_id: '' })}>
                                        <option value="">Select ward...</option>
                                        {wards.map(w => <option key={w.ward_id} value={w.ward_id}>{w.ward_name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Select Bed</Label>
                                    <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                        disabled={!deployForm.ward_id}
                                        value={deployForm.bed_id} onChange={e => setDeployForm({ ...deployForm, bed_id: e.target.value })}>
                                        <option value="">Select bed...</option>
                                        {wardBeds.map(b => <option key={b.bed_id} value={b.bed_id}>{b.bed_number} ({b.status})</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {deployForm.destination === 'ot' && (
                            <div className="space-y-2">
                                <Label>Select Operation Theater Room</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={deployForm.ot_id} onChange={e => setDeployForm({ ...deployForm, ot_id: e.target.value })}>
                                    <option value="">Select OT room...</option>
                                    {ots.map(o => <option key={o.ot_id} value={o.ot_id}>{o.ot_name} ({o.status})</option>)}
                                </select>
                            </div>
                        )}

                        {deployForm.destination === 'patient' && (
                            <div className="space-y-2">
                                <Label>Select Patient</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={deployForm.patient_id} onChange={e => setDeployForm({ ...deployForm, patient_id: e.target.value })}>
                                    <option value="">Select patient...</option>
                                    {patients.map(p => <option key={p.record_id} value={p.record_id}>{p.full_name} (MRD: {p.patient_u_id})</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeployOpen(false)}>Cancel</Button>
                        <Button onClick={handleDeploy} className="bg-indigo-600"
                            disabled={
                                (deployForm.destination === 'bed' && (!deployForm.ward_id || !deployForm.bed_id)) ||
                                (deployForm.destination === 'ot' && !deployForm.ot_id) ||
                                (deployForm.destination === 'patient' && !deployForm.patient_id)
                            }>
                            Confirm Deployment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
