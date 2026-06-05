"use client";

import React, { useState, useEffect } from 'react';
import { Bed, ChevronLeft, RefreshCw, UserPlus, AlertCircle, Activity, FileText, Pill, Stethoscope, Cpu, Syringe, Plus, Info, Users, Edit2, Trash2, History, Printer, MessageCircle, Share2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';
import { MedicineAutocomplete } from '@/components/pharmacy/MedicineAutocomplete';
import toast from 'react-hot-toast';

export default function HMSBedsPage() {
    const router = useRouter();
    const [wards, setWards] = useState<any[]>([]);
    const [beds, setBeds] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedWard, setSelectedWard] = useState<any>(null);
    const [userRole, setUserRole] = useState<string>('');
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

    // Modals
    const [isAdmitOpen, setIsAdmitOpen] = useState(false);
    const [isConsoleOpen, setIsConsoleOpen] = useState(false);
    
    // State for Bed selection
    const [selectedBed, setSelectedBed] = useState<any>(null);
    const [activeAdmission, setActiveAdmission] = useState<any>(null);
    const [activePatient, setActivePatient] = useState<any>(null);
    
    // Forms
    const [admitForm, setAdmitForm] = useState({ patient_name: '', age: '', gender: 'Male', diagnosis: '', doctor_name: '', contact_phone: '' });
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Console Forms
    const [alerts, setAlerts] = useState<any[]>([]);
    const [orderForm, setOrderForm] = useState({ medicine_name: '', dosage: '', qty: '', frequency: '', frequency_hours: '12', notes: '' });
    const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
    const [editOrderForm, setEditOrderForm] = useState({ medicine_name: '', dosage: '', qty: '', frequency: '', frequency_hours: '12', notes: '' });
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
    const [medLogForm, setMedLogForm] = useState({ order_id: '', medicine_name: '', notes: '' });
    const [noteForm, setNoteForm] = useState({ note_type: 'Ward Round', content: '' });
    const [vitalsForm, setVitalsForm] = useState({ temp: '', bp: '', pulse: '', respiratory_rate: '', spo2: '' });
    const [isEditingDoctor, setIsEditingDoctor] = useState(false);
    const [editDoctorName, setEditDoctorName] = useState('');
    const [editingBedNameId, setEditingBedNameId] = useState<number | null>(null);
    const [editingBedNameValue, setEditingBedNameValue] = useState<string>('');

    useEffect(() => {
        const role = localStorage.getItem('userRole') || '';
        setUserRole(role);
        const saved = localStorage.getItem('hms_hospital_id');
        if (saved) setSelectedHospitalId(Number(saved));
        loadData(saved ? Number(saved) : null);
    }, []);

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

    const handleSaveBedName = async (bedId: number) => {
        const newName = editingBedNameValue.trim();
        if (!newName) return;
        
        const isDuplicate = beds.some((b: any) => 
            b.bed_id !== bedId && 
            b.ward_id === selectedWard?.ward_id && 
            b.bed_number.toLowerCase() === newName.toLowerCase()
        );
        
        if (isDuplicate) {
            toast.error(`Bed name/number '${newName}' already exists in this ward.`);
            return;
        }

        try {
            await apiFetch(`hms/beds/${bedId}/name`, {
                method: 'PUT',
                body: JSON.stringify({ bed_number: newName })
            });
            setEditingBedNameId(null);
            loadData();
        } catch (e: any) {
            console.error("Failed to update bed name", e);
            toast.error(e.message || "Failed to update bed name");
        }
    };

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

    const loadData = async (hId: number | null = selectedHospitalId) => {
        setLoading(true);
        try {
            let suffix = hId ? `?hospital_id=${hId}` : '';
            const [w, b, e, a, d] = await Promise.all([
                apiFetch(`hms/wards${suffix}`).catch(() => []),
                apiFetch(`hms/beds${suffix}`).catch(() => []),
                apiFetch(`hms/equipment${suffix}`).catch(() => []),
                apiFetch(`hms/admissions/alerts${suffix}`).catch(() => []),
                apiFetch(`doctors${suffix}`).catch(() => []),
            ]);
            const wardList = w || [];
            setWards(wardList);
            setBeds(b || []);
            setEquipments(e || []);
            setAlerts(a || []);
            setDoctors(d || []);
            
            if (wardList.length > 0) {
                if (!selectedWard) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const wardParam = urlParams.get('ward');
                    const matchedWard = wardParam ? wardList.find((w: any) => w.ward_id.toString() === wardParam) : null;
                    setSelectedWard(matchedWard || wardList[0]);
                } else {
                    // Keep the current ward selected but update its reference if needed
                    const updatedWard = wardList.find((w: any) => w.ward_id === selectedWard.ward_id);
                    if (updatedWard) setSelectedWard(updatedWard);
                }
            }
        } finally { setLoading(false); }
    };

    const handleAdmit = async () => {
        if (!selectedBed) return;
        try {
            await apiFetch('hms/admissions', {
                method: 'POST',
                body: JSON.stringify({ 
                    ...admitForm, 
                    patient_id: selectedPatientId,
                    bed_id: selectedBed.bed_id, 
                    ward_id: selectedBed.ward_id, 
                    age: parseInt(admitForm.age) || 0 
                })
            });
            setIsAdmitOpen(false);
            setAdmitForm({ patient_name: '', age: '', gender: 'Male', diagnosis: '', doctor_name: '', contact_phone: '' });
            setSelectedPatientId(null);
            setSearchQuery('');
            setSelectedBed(null);
            loadData();
        } catch (e: any) { toast.error(e.message || 'Failed to admit patient'); }
    };

    const handleSelectPatient = (patient: any) => {
        let cleanAge = '';
        if (patient.age) {
            const match = patient.age.match(/\d+/);
            if (match) cleanAge = match[0];
        }
        setAdmitForm({
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

    const handleBedClick = async (bed: any) => {
        setSelectedBed(bed);
        if (bed.status === 'available') {
            setIsAdmitOpen(true);
        } else if (bed.status === 'occupied') {
            // Load admission details
            if (bed.admission_id) {
                try {
                    const data = await apiFetch(`hms/admissions/${bed.admission_id}`);
                    setActiveAdmission(data.admission);
                    setActivePatient(data.patient);
                    setIsConsoleOpen(true);
                } catch (e) {
                    toast.error("Could not load patient details.");
                }
            } else {
                if (confirm("Bed is occupied but no active admission record found. Would you like to mark it as available?")) {
                    try {
                        await apiFetch(`hms/beds/${bed.bed_id}/status`, {
                            method: 'PUT',
                            body: JSON.stringify({ is_occupied: false, status: 'AVAILABLE' })
                        });
                        loadData();
                    } catch (e) {
                        toast.error("Failed to update bed status.");
                    }
                }
            }
        }
    };

    const refreshAdmission = async () => {
        if (!activeAdmission?.admission_id) return;
        try {
            const data = await apiFetch(`hms/admissions/${activeAdmission.admission_id}`);
            setActiveAdmission(data.admission);
            setActivePatient(data.patient);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddOrder = async () => {
        if (!activeAdmission) return;
        try {
            await apiFetch(`hms/admissions/${activeAdmission.admission_id}/orders`, {
                method: 'POST',
                body: JSON.stringify({
                    ...orderForm,
                    frequency_hours: parseInt(orderForm.frequency_hours) || 12
                })
            });
            setOrderForm({ medicine_name: '', dosage: '', qty: '', frequency: '', frequency_hours: '12', notes: '' });
            refreshAdmission();
        } catch (e: any) { toast.error(e.message || "Failed to add order"); }
    };

    const handleSaveEditOrder = async (orderId: string) => {
        if (!activeAdmission) return;
        try {
            await apiFetch(`hms/admissions/${activeAdmission.admission_id}/orders/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...editOrderForm,
                    frequency_hours: parseInt(editOrderForm.frequency_hours) || 12
                })
            });
            setEditingOrderId(null);
            refreshAdmission();
        } catch (e: any) { toast.error(e.message || "Failed to update order"); }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!activeAdmission || !confirm("Are you sure you want to stop/delete this medication order?")) return;
        try {
            await apiFetch(`hms/admissions/${activeAdmission.admission_id}/orders/${orderId}`, {
                method: 'DELETE'
            });
            refreshAdmission();
        } catch (e: any) { toast.error(e.message || "Failed to delete order"); }
    };

    const handleLogMedication = async () => {
        if (!activeAdmission || !medLogForm.order_id) return;
        try {
            await apiFetch(`hms/admissions/${activeAdmission.admission_id}/medication`, {
                method: 'POST',
                body: JSON.stringify(medLogForm)
            });
            setMedLogForm({ order_id: '', medicine_name: '', notes: '' });
            refreshAdmission();
        } catch (e: any) { toast.error(e.message || "Failed to log medication"); }
    };

    const handleAddNote = async () => {
        if (!activeAdmission) return;
        try {
            await apiFetch(`hms/admissions/${activeAdmission.admission_id}/notes`, {
                method: 'POST',
                body: JSON.stringify(noteForm)
            });
            setNoteForm({ note_type: 'Ward Round', content: '' });
            refreshAdmission();
        } catch (e: any) { toast.error(e.message || "Failed to add note"); }
    };

    const handleLogVitals = async () => {
        if (!activeAdmission) return;
        try {
            await apiFetch(`hms/admissions/${activeAdmission.admission_id}/vitals`, {
                method: 'POST',
                body: JSON.stringify(vitalsForm)
            });
            setVitalsForm({ temp: '', bp: '', pulse: '', respiratory_rate: '', spo2: '' });
            refreshAdmission();
        } catch (e: any) { toast.error(e.message || "Failed to log vitals"); }
    };

    const handleUpdateDoctor = async () => {
        if (!activePatient?.record_id) return;
        try {
            await apiFetch(`patients/${activePatient.record_id}`, {
                method: 'PUT',
                body: JSON.stringify({ doctor_name: editDoctorName })
            });
            setIsEditingDoctor(false);
            refreshAdmission();
        } catch (e: any) { toast.error(e.message || "Failed to update doctor"); }
    };

    const handleShareMedications = async () => {
        if (!activeAdmission || !activeAdmission.medication_orders) return;
        const activeOrders = activeAdmission.medication_orders.filter((o: any) => o.status !== 'deleted');
        if (activeOrders.length === 0) {
            toast.error("No active medications to share.");
            return;
        }
        
        const phone = activeAdmission.contact_phone || activePatient?.contact_number || activePatient?.phone || '';
        if (!phone) {
            toast.error("No phone number registered for this patient.");
            return;
        }

        const hospitalName = localStorage.getItem('hms_hospital_name') || 'Digifort Labs Hospital';
        let text = `*Medication List for ${activePatient?.full_name || 'Patient'}*\n`;
        text += `Hospital: ${hospitalName}\n`;
        text += `Date & Time: ${new Date().toLocaleString()}\n\n`;
        
        activeOrders.forEach((order: any, index: number) => {
            text += `${index + 1}. *${order.medicine_name}*\n`;
            text += `   Dosage: ${order.dosage}\n`;
            if (order.qty) text += `   Qty: ${order.qty}\n`;
            text += `\n`;
        });
        
        text += `Please purchase these medications and submit them to the nursing station.\n`;
        
        let targetPhone = phone.replace(/\D/g, '');
        if (targetPhone.length === 10) {
            targetPhone = '91' + targetPhone; // Default to India country code if 10 digits
        }

        try {
            window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
            toast.success("Opened WhatsApp Desktop!");
        } catch (e: any) {
            toast.error(e.message || "Failed to open WhatsApp");
        }
    };

    const wardBeds = beds
        .filter(b => selectedWard && b.ward_id === selectedWard.ward_id)
        .sort((a, b) => a.bed_number.localeCompare(b.bed_number, undefined, { numeric: true, sensitivity: 'base' }));
    const occupiedCount = wardBeds.filter(b => b.status === 'occupied').length;
    const availableCount = wardBeds.filter(b => b.status === 'available').length;

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/hospital/hms')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Bed className="w-6 h-6 text-blue-600" /> Graphic Bed Console</h1>
                        <p className="text-slate-500 text-sm">Real-time graphic monitoring and clinical orders.</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => loadData(selectedHospitalId)} className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Ward Sidebar */}
                <div className="lg:w-72 space-y-2 flex-shrink-0">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Wards</h2>
                    {loading && wards.length === 0 ? <div className="text-slate-500 text-sm">Loading...</div>
                        : wards.map(ward => {
                            const wBeds = beds.filter(b => b.ward_id === ward.ward_id);
                            const occupied = wBeds.filter(b => b.status === 'occupied').length;
                            const total = ward.total_beds || wBeds.length;
                            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
                            return (
                                <button key={ward.ward_id}
                                    onClick={() => setSelectedWard(ward)}
                                    className={cn('w-full text-left p-4 rounded-xl border-2 transition-all', selectedWard?.ward_id === ward.ward_id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300')}>
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

                {/* Main Graphic Console */}
                <div className="flex-1">
                    {selectedWard ? (
                        <Card className="border-slate-200/60 shadow-sm min-h-[600px] bg-slate-50">
                            <CardHeader className="border-b bg-white rounded-t-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{selectedWard.ward_name} Console</CardTitle>
                                        <p className="text-sm text-slate-500 mt-1">Interactive visual map of patients and beds</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium bg-slate-100 px-4 py-2 rounded-lg">
                                        <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-400" /> Available</span>
                                        <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-rose-100 border-2 border-rose-400" /> Occupied</span>
                                        <span className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-amber-100 border-2 border-amber-400" /> Maintenance</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                {wardBeds.length === 0 ? (
                                    <div className="py-20 text-center text-slate-400">
                                        <Bed className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p className="text-lg font-medium">No beds configured for this ward.</p>
                                        <p className="text-sm mt-1">Beds are auto-generated based on ward capacity.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                                        {wardBeds.map(bed => {
                                            const isOccupied = bed.status?.toLowerCase() === 'occupied';
                                            const isMaintenance = bed.status?.toLowerCase() === 'maintenance';
                                            
                                                                            // Find equipment attached to this bed
                                            const bedEquipments = equipments.filter(e => e.bed_id === bed.bed_id && e.status === 'in_use');
                                            const bedAlerts = alerts.filter(a => a.admission_id === bed.admission_id);
                                            const hasAlert = bedAlerts.length > 0;
                                            
                                            return (
                                                <div key={bed.bed_id} 
                                                    onClick={() => handleBedClick(bed)}
                                                    className={cn(
                                                        'group relative flex flex-col p-4 rounded-xl border-[2px] transition-all cursor-pointer hover:shadow-md overflow-hidden',
                                                        isOccupied ? 'bg-white border-rose-300 hover:border-rose-400' :
                                                        isMaintenance ? 'bg-amber-50 border-amber-200' :
                                                        'bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50'
                                                    )}
                                                    style={{ minHeight: '120px' }}
                                                >
                                                    {/* Top Bar: Bed Number & Status */}
                                                    <div className="flex justify-between items-start mb-2 group/title relative">
                                                        {editingBedNameId === bed.bed_id ? (
                                                            <div className="flex items-center gap-1 z-10 bg-white p-1 -ml-1 rounded shadow-sm border border-blue-200">
                                                                <Input 
                                                                    autoFocus
                                                                    value={editingBedNameValue} 
                                                                    onChange={e => setEditingBedNameValue(e.target.value)}
                                                                    className="h-7 px-2 text-sm w-24 font-bold"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleSaveBedName(bed.bed_id);
                                                                        if (e.key === 'Escape') setEditingBedNameId(null);
                                                                    }}
                                                                />
                                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50" onClick={(e) => { e.stopPropagation(); handleSaveBedName(bed.bed_id); }}>
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:bg-slate-50" onClick={(e) => { e.stopPropagation(); setEditingBedNameId(null); }}>
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-lg font-black text-slate-700 tracking-tight">{/^\d+$/.test(bed.bed_number) ? `Bed ${bed.bed_number}` : bed.bed_number}</span>
                                                                    <button 
                                                                        onClick={(e) => { 
                                                                            e.stopPropagation(); 
                                                                            setEditingBedNameValue(bed.bed_number); 
                                                                            setEditingBedNameId(bed.bed_id); 
                                                                        }}
                                                                        className="opacity-0 group-hover/title:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-600 rounded bg-slate-50 hover:bg-blue-50"
                                                                        title="Rename Bed"
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    {isOccupied && hasAlert && (
                                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 animate-bounce shadow-[0_0_8px_rgba(245,158,11,0.6)]" title="Medication Due Now!">
                                                                            <Pill className="w-3 h-3 text-white animate-pulse" />
                                                                        </span>
                                                                    )}
                                                                    {isOccupied && <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Center Graphic */}
                                                    <div className="flex-1 flex flex-col items-center justify-center relative">
                                                        {isOccupied ? (
                                                            <>
                                                                {/* Patient lying in bed graphic */}
                                                                <div className="w-full flex items-end justify-center relative h-12">
                                                                    <div className="w-20 h-4 bg-slate-200 rounded-full absolute bottom-0" />
                                                                    <div className="w-6 h-6 bg-rose-200 rounded-full absolute left-1/2 -translate-x-[40px] bottom-1 z-10 flex items-center justify-center border border-rose-300">
                                                                        <Users className="w-3 h-3 text-rose-600" />
                                                                    </div>
                                                                    <div className="w-14 h-3 bg-rose-100 rounded-full absolute left-1/2 -translate-x-[10px] bottom-1 border border-rose-200" />
                                                                </div>
                                                                <div className="mt-2 text-center w-full">
                                                                    <p className="text-sm font-bold text-slate-900 truncate px-1" title={bed.patient_name}>{bed.patient_name}</p>
                                                                    <p className="text-[10px] font-medium text-rose-600 bg-rose-50 rounded inline-block px-1.5 py-0.5 mt-1 border border-rose-100">Admitted</p>
                                                                </div>
                                                            </>
                                                        ) : isMaintenance ? (
                                                            <div className="text-center opacity-60">
                                                                <AlertCircle className="w-10 h-10 mx-auto text-amber-500 mb-2" />
                                                                <p className="text-xs font-bold text-amber-700">Maintenance</p>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center opacity-40 group-hover:opacity-100 transition-opacity">
                                                                <Bed className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                                                                <p className="text-xs font-bold text-emerald-700">Available</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Equipment Indicators */}
                                                    {isOccupied && bedEquipments.length > 0 && (
                                                        <div className="absolute top-3 right-3 flex gap-1">
                                                            <Cpu className="w-4 h-4 text-indigo-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : <div className="p-12 text-center text-slate-400">Select a ward to view beds.</div>}
                </div>
            </div>

            {/* Admit Patient Modal */}
            <Dialog open={isAdmitOpen} onOpenChange={(open) => {
                setIsAdmitOpen(open);
                if (!open) {
                    setAdmitForm({ patient_name: '', age: '', gender: 'Male', diagnosis: '', doctor_name: '', contact_phone: '' });
                    setSelectedPatientId(null);
                    setSearchQuery('');
                    setSearchResults([]);
                }
            }}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Admit Patient — Bed {selectedBed?.bed_number}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-2">
                        {/* Search registered patients */}
                        <div className="space-y-1.5 relative">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Registered Patient (Optional)</Label>
                            <Input 
                                placeholder="Type patient name or MRD..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="border-indigo-100 focus:border-indigo-500 font-medium"
                            />
                            {searching && <span className="absolute right-3 bottom-2.5 text-xs text-slate-400">Searching...</span>}
                            
                            {searchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                    {searchResults.map(p => (
                                        <button 
                                            key={p.record_id}
                                            onClick={() => handleSelectPatient(p)}
                                            className="w-full text-left px-4 py-2.5 hover:bg-indigo-50/50 flex flex-col justify-center transition-colors"
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
                                    <p className="font-extrabold text-emerald-900 text-sm leading-tight mt-0.5">{admitForm.patient_name}</p>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => {
                                        setSelectedPatientId(null);
                                        setAdmitForm({ patient_name: '', age: '', gender: 'Male', diagnosis: '', doctor_name: '', contact_phone: '' });
                                    }}
                                    className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 font-bold"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}

                        <div className="border-t border-slate-100 pt-3 space-y-3">
                            <div className="space-y-2">
                                <Label>Patient Name *</Label>
                                <Input 
                                    placeholder="Full name" 
                                    value={admitForm.patient_name} 
                                    onChange={e => setAdmitForm({ ...admitForm, patient_name: e.target.value })} 
                                    disabled={selectedPatientId !== null}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input 
                                        placeholder="Age" 
                                        type="number" 
                                        value={admitForm.age} 
                                        onChange={e => setAdmitForm({ ...admitForm, age: e.target.value })} 
                                        disabled={selectedPatientId !== null}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <select 
                                        className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                        value={admitForm.gender} 
                                        onChange={e => setAdmitForm({ ...admitForm, gender: e.target.value })}
                                        disabled={selectedPatientId !== null}
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Diagnosis</Label>
                                <Input placeholder="Primary diagnosis" value={admitForm.diagnosis} onChange={e => setAdmitForm({ ...admitForm, diagnosis: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Doctor</Label>
                                    <Input placeholder="Admitting doctor" value={admitForm.doctor_name} onChange={e => setAdmitForm({ ...admitForm, doctor_name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact phone</Label>
                                    <Input placeholder="Attendant phone" value={admitForm.contact_phone} onChange={e => setAdmitForm({ ...admitForm, contact_phone: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdmitOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdmit} disabled={!admitForm.patient_name} className="bg-blue-600">Admit Patient</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Patient Console Modal */}
            <Dialog open={isConsoleOpen} onOpenChange={setIsConsoleOpen}>
                <DialogContent aria-describedby={undefined} className="max-w-4xl w-[95vw] p-0 overflow-hidden bg-slate-50 h-[85vh] flex flex-col">
                    <DialogTitle className="sr-only">Patient Console Modal</DialogTitle>
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-6 flex-shrink-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-2xl font-black">{selectedBed?.patient_name}</h2>
                                    <Badge className="bg-rose-500 text-white hover:bg-rose-600 border-none font-bold">IPD</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-slate-400 text-sm">
                                    <span className="font-mono">Bed: {selectedBed?.bed_number} ({selectedWard?.ward_name})</span>
                                    <span>•</span>
                                    <span>{activeAdmission?.diagnosis || 'No diagnosis logged'}</span>
                                    <span>•</span>
                                    <span>Admitted: {new Date(activeAdmission?.admission_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                              <div className="text-right flex flex-col items-end gap-3">
                                  {['hospital_admin', 'superadmin', 'mrd_staff'].includes(userRole) && (
                                      <div className="flex gap-2">
                                          <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="bg-white/10 border-white/20 hover:bg-white/20 text-white font-semibold h-8"
                                              onClick={() => window.open(`/hospital/hms/admissions/${activeAdmission.admission_id}/mrd`, '_blank')}
                                          >
                                              <Printer className="w-4 h-4 mr-2" />
                                              Print MRD File
                                          </Button>
                                      </div>
                                  )}
                                  <div>
                                      <div className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Attending Doctor</div>
                                {isEditingDoctor ? (
                                    <div className="flex items-start gap-2 relative">
                                        <div className="relative">
                                            <Input 
                                                value={editDoctorName} 
                                                onChange={e => setEditDoctorName(e.target.value)} 
                                                className="h-8 text-sm w-56 text-slate-900 bg-white" 
                                                placeholder="e.g. Dr. Smith, Dr. Patel"
                                                autoComplete="off"
                                                autoFocus
                                            />
                                            {isEditingDoctor && editDoctorName && doctors.length > 0 && (
                                                <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-md shadow-xl border border-slate-200 z-50 max-h-48 overflow-y-auto text-left">
                                                    {doctors.filter(d => (d.full_name || '').toLowerCase().includes(editDoctorName.split(',').pop()?.trim().toLowerCase() || '')).length > 0 ? (
                                                        doctors.filter(d => (d.full_name || '').toLowerCase().includes(editDoctorName.split(',').pop()?.trim().toLowerCase() || '')).map(d => (
                                                            <div 
                                                                key={d.profile_id} 
                                                                className="p-2 text-sm text-slate-700 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0"
                                                                onClick={() => {
                                                                    const parts = editDoctorName.split(',');
                                                                    parts.pop(); // remove the partial term
                                                                    const prefix = parts.length > 0 ? parts.join(',').trim() + (parts.length > 0 ? ', ' : '') : '';
                                                                    setEditDoctorName(prefix + d.full_name + ', ');
                                                                    document.querySelector('input')?.focus();
                                                                }}
                                                            >
                                                                <span className="font-medium text-slate-900">{d.full_name || 'Unknown Doctor'}</span>
                                                                {d.specialization && <span className="text-xs text-slate-500 block">{d.specialization}</span>}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-xs text-slate-500 text-center">No doctors found. Press Save to enter custom text.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <Button size="sm" onClick={handleUpdateDoctor} className="h-8 bg-indigo-600 hover:bg-indigo-700">Save</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditingDoctor(false)} className="h-8 text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
                                    </div>
                                ) : (
                                    <div 
                                        className="font-medium text-slate-200 cursor-pointer hover:text-indigo-300 flex items-center justify-end gap-2 group"
                                        onClick={() => {
                                            setEditDoctorName(activePatient?.doctor_name || '');
                                            setIsEditingDoctor(true);
                                        }}
                                        title="Click to assign multiple doctors"
                                    >
                                        {activePatient?.doctor_name || 'Unassigned'}
                                        <span className="opacity-0 group-hover:opacity-100 text-xs text-slate-400">(Edit)</span>
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex flex-col p-6 min-h-0">
                        <Tabs defaultValue="orders" className="flex-1 flex flex-col min-h-0">
                            <TabsList className="grid grid-cols-4 bg-slate-200/50 p-1 rounded-xl w-full flex-shrink-0">
                                <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 font-bold"><Stethoscope className="w-4 h-4 mr-2" /> Doctor Orders</TabsTrigger>
                                <TabsTrigger value="medication" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-rose-600 font-bold"><Syringe className="w-4 h-4 mr-2" /> Nurse Log</TabsTrigger>
                                <TabsTrigger value="vitals" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 font-bold"><Activity className="w-4 h-4 mr-2" /> Vitals & Notes</TabsTrigger>
                                <TabsTrigger value="equipment" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-teal-600 font-bold"><Cpu className="w-4 h-4 mr-2" /> Equipment</TabsTrigger>
                            </TabsList>

                            <div className="flex-1 mt-6 overflow-y-auto pr-2 min-h-0">
                                 {/* Doctor Orders Tab */}
                                                                <TabsContent value="orders" className="m-0 space-y-6 h-full">
                                                                    {['doctor', 'doctor_ipd', 'doctor_both', 'superadmin', 'superadmin_staff', 'website_admin', 'hospital_admin'].includes(userRole) ? (
                                                                        <Card className="border-indigo-100 shadow-sm overflow-hidden">
                                                                            <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
                                                                                <h3 className="font-bold text-indigo-900 flex items-center gap-2"><Plus className="w-4 h-4" /> New Medication Order</h3>
                                                                            </div>
                                                                            <CardContent className="p-4 bg-white">
                                                                                <div className="grid grid-cols-12 gap-3 items-end">
                                                                                    <div className="col-span-12 md:col-span-3">
                                                                                        <Label className="text-xs mb-1">Medicine Name</Label>
                                                                                        <MedicineAutocomplete value={orderForm.medicine_name} onChange={val => setOrderForm({...orderForm, medicine_name: val})} />
                                                                                    </div>
                                                                                    <div className="col-span-6 md:col-span-1">
                                                                                        <Label className="text-xs mb-1">Dosage</Label>
                                                                                        <Input placeholder="500mg" value={orderForm.dosage} onChange={e => setOrderForm({...orderForm, dosage: e.target.value})} />
                                                                                    </div>
                                                                                    <div className="col-span-6 md:col-span-1">
                                                                                        <Label className="text-xs mb-1">Qty</Label>
                                                                                        <Input placeholder="10 Tabs" value={orderForm.qty} onChange={e => setOrderForm({...orderForm, qty: e.target.value})} />
                                                                                    </div>
                                                                                    <div className="col-span-6 md:col-span-2">
                                                                                        <Label className="text-xs mb-1">Frequency</Label>
                                                                                        <Input placeholder="BID / TDS" value={orderForm.frequency} onChange={e => setOrderForm({...orderForm, frequency: e.target.value})} />
                                                                                    </div>
                                                                                    <div className="col-span-6 md:col-span-2">
                                                                                        <Label className="text-xs mb-1">Hours Interval</Label>
                                                                                        <Input placeholder="12" type="number" value={orderForm.frequency_hours} onChange={e => setOrderForm({...orderForm, frequency_hours: e.target.value})} />
                                                                                    </div>
                                                                                    <div className="col-span-12 md:col-span-2">
                                                                                        <Label className="text-xs mb-1">Meal Timing</Label>
                                                                                        <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm bg-white" value={orderForm.notes} onChange={e => setOrderForm({...orderForm, notes: e.target.value})}>
                                                                                            <option value="">-- Select --</option>
                                                                                            <option value="Before meals (AC)">Before meals</option>
                                                                                            <option value="After meals (PC)">After meals</option>
                                                                                            <option value="With meals">With meals</option>
                                                                                            <option value="Empty stomach">Empty stomach</option>
                                                                                        </select>
                                                                                    </div>
                                                                                    <div className="col-span-12 md:col-span-1">
                                                                                        <Button onClick={handleAddOrder} disabled={!orderForm.medicine_name || !orderForm.dosage} className="w-full bg-indigo-600 hover:bg-indigo-700 h-10"><Plus className="w-4 h-4" /></Button>
                                                                                    </div>
                                                                                </div>
                                                                            </CardContent>
                                                                        </Card>
                                                                    ) : (
                                                                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-semibold flex items-center gap-2">
                                                                            <AlertCircle className="w-5 h-5 text-amber-600" /> Only Doctors can write or prescribe new medication orders.
                                                                        </div>
                                                                    )}

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Active Orders</h3>
                                            {(activeAdmission?.medication_orders || []).filter((o: any) => o.status !== 'deleted').length > 0 && (
                                                <Button size="sm" variant="outline" className="gap-2 text-green-600 border-green-200 hover:bg-green-50" onClick={handleShareMedications}>
                                                    <MessageCircle className="w-4 h-4" /> Share via WhatsApp
                                                </Button>
                                            )}
                                        </div>
                                        {(activeAdmission?.medication_orders || []).length === 0 ? (
                                            <div className="p-8 text-center bg-slate-100/50 rounded-xl border border-dashed border-slate-300">
                                                <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                                <p className="text-sm text-slate-500">No active medication orders.</p>
                                            </div>
                                        ) : (
                                            (activeAdmission?.medication_orders || []).map((order: any, idx: number) => {
                                                const isDeleted = order.status === 'deleted';
                                                return editingOrderId === order.id ? (
                                                    <div key={idx} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm space-y-4">
                                                        <h4 className="font-bold text-indigo-900 text-sm">Edit Medication Order</h4>
                                                        <div className="grid grid-cols-12 gap-3 items-end">
                                                            <div className="col-span-12 md:col-span-3">
                                                                <Label className="text-xs mb-1">Medicine Name</Label>
                                                                <MedicineAutocomplete className="bg-white" value={editOrderForm.medicine_name} onChange={val => setEditOrderForm({...editOrderForm, medicine_name: val})} />
                                                            </div>
                                                            <div className="col-span-6 md:col-span-1">
                                                                <Label className="text-xs mb-1">Dosage</Label>
                                                                <Input value={editOrderForm.dosage} onChange={e => setEditOrderForm({...editOrderForm, dosage: e.target.value})} className="bg-white" />
                                                            </div>
                                                            <div className="col-span-6 md:col-span-1">
                                                                <Label className="text-xs mb-1">Qty</Label>
                                                                <Input value={editOrderForm.qty} onChange={e => setEditOrderForm({...editOrderForm, qty: e.target.value})} className="bg-white" />
                                                            </div>
                                                            <div className="col-span-6 md:col-span-2">
                                                                <Label className="text-xs mb-1">Frequency</Label>
                                                                <Input value={editOrderForm.frequency} onChange={e => setEditOrderForm({...editOrderForm, frequency: e.target.value})} className="bg-white" />
                                                            </div>
                                                            <div className="col-span-6 md:col-span-2">
                                                                <Label className="text-xs mb-1">Hours Interval</Label>
                                                                <Input type="number" value={editOrderForm.frequency_hours} onChange={e => setEditOrderForm({...editOrderForm, frequency_hours: e.target.value})} className="bg-white" />
                                                            </div>
                                                            <div className="col-span-6 md:col-span-3">
                                                                <Label className="text-xs mb-1">Meal Timing / Notes</Label>
                                                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm bg-white" value={editOrderForm.notes} onChange={e => setEditOrderForm({...editOrderForm, notes: e.target.value})}>
                                                                    <option value="">-- Select --</option>
                                                                    <option value="Before meals (AC)">Before meals</option>
                                                                    <option value="After meals (PC)">After meals</option>
                                                                    <option value="With meals">With meals</option>
                                                                    <option value="Empty stomach">Empty stomach</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100">
                                                            <Button size="sm" variant="ghost" onClick={() => setEditingOrderId(null)} className="h-8">Cancel</Button>
                                                            <Button size="sm" onClick={() => handleSaveEditOrder(order.id)} disabled={!editOrderForm.medicine_name || !editOrderForm.dosage} className="h-8 bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div key={idx} className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col ${isDeleted ? 'opacity-60 bg-slate-50' : ''}`}>
                                                        <div className="flex justify-between items-center w-full">
                                                            <div className="flex items-start gap-4">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDeleted ? 'bg-slate-200 text-slate-400' : 'bg-indigo-100 text-indigo-600'}`}>
                                                                    <Pill className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <h4 className={`font-bold text-lg leading-tight ${isDeleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                                                        {order.medicine_name} 
                                                                        <span className={`font-mono text-sm ml-2 px-2 py-0.5 rounded ${isDeleted ? 'text-slate-500 bg-slate-200' : 'text-indigo-600 bg-indigo-50'}`}>{order.dosage}</span>
                                                                        {order.qty && <span className={`font-mono text-sm ml-2 px-2 py-0.5 rounded ${isDeleted ? 'text-slate-500 bg-slate-200' : 'text-indigo-600 bg-indigo-50'}`}>Qty: {order.qty}</span>}
                                                                    </h4>
                                                                    <p className={`text-sm font-medium mt-1 ${isDeleted ? 'text-slate-400' : 'text-slate-600'}`}>Frequency: {order.frequency}</p>
                                                                    {order.notes && <p className={`text-xs mt-1 px-2 py-1 rounded inline-block border ${isDeleted ? 'text-slate-400 bg-slate-100 border-slate-200' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>Note: {order.notes}</p>}
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex flex-col justify-between h-full items-end gap-2">
                                                                <Badge variant="outline" className={`text-[10px] font-mono ${isDeleted ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50'}`}>{new Date(order.start_date).toLocaleString()}</Badge>
                                                                <span className={`text-xs font-bold ${isDeleted ? 'text-slate-400' : 'text-slate-400'}`}>{order.prescribed_by ? `Dr. ${order.prescribed_by}` : ''}</span>
                                                                
                                                                <div className="flex gap-1 mt-1">
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="ghost" 
                                                                        className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                                                                        onClick={() => setExpandedHistoryId(expandedHistoryId === order.id ? null : order.id)}
                                                                        title="View History"
                                                                    >
                                                                        <History className="w-4 h-4" />
                                                                    </Button>
                                                                    {!isDeleted && (
                                                                        <>
                                                                            <Button 
                                                                                size="sm" 
                                                                                variant="ghost" 
                                                                                className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600"
                                                                                onClick={() => {
                                                                                    setEditOrderForm({
                                                                                        medicine_name: order.medicine_name,
                                                                                        dosage: order.dosage,
                                                                                        qty: order.qty || '',
                                                                                        frequency: order.frequency,
                                                                                        frequency_hours: order.frequency_hours?.toString() || '12',
                                                                                        notes: order.notes || ''
                                                                                    });
                                                                                    setEditingOrderId(order.id);
                                                                                }}
                                                                            >
                                                                                <Edit2 className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button 
                                                                                size="sm" 
                                                                                variant="ghost" 
                                                                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                                                                                onClick={() => handleDeleteOrder(order.id)}
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {expandedHistoryId === order.id && (
                                                            <div className="mt-4 pt-3 border-t border-slate-100">
                                                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Change History</h5>
                                                                <div className="space-y-2">
                                                                    {(order.history || []).map((hist: any, hIdx: number) => (
                                                                        <div key={hIdx} className="flex gap-3 text-sm items-start">
                                                                            <div className="w-24 flex-shrink-0 text-xs text-slate-400 font-mono pt-0.5">
                                                                                {new Date(hist.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <span className={`font-semibold mr-2 ${hist.action === 'created' ? 'text-green-600' : hist.action === 'deleted' ? 'text-rose-600' : 'text-blue-600'}`}>
                                                                                    {hist.action.toUpperCase()}
                                                                                </span>
                                                                                <span className="text-slate-600">{hist.details}</span>
                                                                                <span className="text-xs text-slate-400 ml-2 block sm:inline">by {hist.actor}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {(!order.history || order.history.length === 0) && (
                                                                        <p className="text-xs text-slate-400 italic">No history available for this legacy order.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }).reverse()
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Nurse Log Tab */}
                                <TabsContent value="medication" className="m-0 space-y-6 h-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Administration Panel */}
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Administer Medication</h3>
                                            
                                            {/* Due Now Summary */}
                                            {(() => {
                                                const dueOrders = (activeAdmission?.medication_orders || []).filter((o: any) => {
                                                    const logs = (activeAdmission?.medication_log || []).filter((l: any) => l.order_id === o.id);
                                                    if (logs.length === 0) return true;
                                                    if (!o.frequency_hours) return false;
                                                    const lastLog = logs.reduce((a: any, b: any) => new Date(a.timestamp) > new Date(b.timestamp) ? a : b);
                                                    return (new Date().getTime() - new Date(lastLog.timestamp).getTime()) / (1000 * 60 * 60) >= o.frequency_hours;
                                                });
                                                if (dueOrders.length === 0) return null;
                                                return (
                                                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-col gap-2">
                                                        <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                                                            <AlertCircle className="w-4 h-4" />
                                                            <span>Medications Due Now</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {dueOrders.map((o: any) => (
                                                                <Badge key={o.id} variant="secondary" className="bg-white border-rose-200 text-rose-700 font-bold shadow-sm cursor-pointer hover:bg-rose-100" onClick={() => setMedLogForm({ ...medLogForm, order_id: o.id, medicine_name: o.medicine_name })}>
                                                                    {o.medicine_name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            <Card className="border-rose-100 shadow-sm">
                                                <CardContent className="p-4 space-y-4 bg-white">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Select Ordered Medicine</Label>
                                                        <select 
                                                            className="w-full border-2 border-slate-200 focus:border-rose-500 rounded-lg p-2.5 text-sm font-medium bg-slate-50"
                                                            value={medLogForm.order_id}
                                                            onChange={e => {
                                                                const order = (activeAdmission?.medication_orders || []).find((o: any) => o.id === e.target.value);
                                                                setMedLogForm({ 
                                                                    ...medLogForm, 
                                                                    order_id: e.target.value,
                                                                    medicine_name: order ? order.medicine_name : ''
                                                                });
                                                            }}
                                                        >
                                                            <option value="">-- Select Order --</option>
                                                            {(activeAdmission?.medication_orders || []).map((o: any) => {
                                                                const logs = (activeAdmission?.medication_log || []).filter((l: any) => l.order_id === o.id);
                                                                let isDue = false;
                                                                if (logs.length === 0) {
                                                                    isDue = true;
                                                                } else if (o.frequency_hours) {
                                                                    const lastLog = logs.reduce((a: any, b: any) => new Date(a.timestamp) > new Date(b.timestamp) ? a : b);
                                                                    const hoursSince = (new Date().getTime() - new Date(lastLog.timestamp).getTime()) / (1000 * 60 * 60);
                                                                    isDue = hoursSince >= o.frequency_hours;
                                                                }
                                                                return (
                                                                    <option key={o.id} value={o.id} className={isDue ? "font-bold text-rose-600" : ""}>
                                                                        {isDue ? '🚨 DUE NOW: ' : ''}{o.medicine_name} ({o.dosage}) - {o.frequency}
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Nurse Notes (Optional)</Label>
                                                        <Input placeholder="Given orally, patient reacted well..." value={medLogForm.notes} onChange={e => setMedLogForm({...medLogForm, notes: e.target.value})} className="bg-slate-50" />
                                                    </div>
                                                    <Button onClick={handleLogMedication} disabled={!medLogForm.order_id} className="w-full bg-rose-600 hover:bg-rose-700 h-10 font-bold"><Syringe className="w-4 h-4 mr-2" /> Log Administration</Button>
                                                </CardContent>
                                            </Card>
                                            
                                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                                                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-blue-800">Logging a medication automatically creates a billing hook in the background to charge the patient if pharmacy integration is enabled.</p>
                                            </div>
                                        </div>

                                        {/* Administration History */}
                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Administration Log</h3>
                                            <div className="space-y-2 h-[400px] overflow-y-auto pr-2">
                                                {(activeAdmission?.medication_log || []).length === 0 ? (
                                                    <div className="p-8 text-center bg-slate-100/50 rounded-xl border border-dashed border-slate-300">
                                                        <p className="text-sm text-slate-500">No medication administered yet.</p>
                                                    </div>
                                                ) : (
                                                    (activeAdmission?.medication_log || []).map((log: any, idx: number) => (
                                                        <div key={idx} className="bg-white border-l-4 border-l-rose-500 border-y border-r border-slate-200 rounded-r-xl p-3 shadow-sm">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h5 className="font-bold text-slate-900">{log.medicine_name}</h5>
                                                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                            </div>
                                                            <p className="text-xs text-slate-600 mb-2">Administered by: <span className="font-semibold text-rose-700">{log.administered_by}</span></p>
                                                            {log.notes && <p className="text-xs italic text-slate-500">"{log.notes}"</p>}
                                                        </div>
                                                    )).reverse()
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Vitals & Notes */}
                                <TabsContent value="vitals" className="m-0 space-y-6 h-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                            {/* Log Vitals Form */}
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Log Vitals</h3>
                                                <Card className="border-blue-100 shadow-sm">
                                                    <CardContent className="p-4 space-y-4 bg-white">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Temp (°F)</Label>
                                                                <Input placeholder="98.6" value={vitalsForm.temp} onChange={e => setVitalsForm({...vitalsForm, temp: e.target.value})} className="bg-slate-50" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">BP (mmHg)</Label>
                                                                <Input placeholder="120/80" value={vitalsForm.bp} onChange={e => setVitalsForm({...vitalsForm, bp: e.target.value})} className="bg-slate-50" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">Pulse (bpm)</Label>
                                                                <Input placeholder="72" value={vitalsForm.pulse} onChange={e => setVitalsForm({...vitalsForm, pulse: e.target.value})} className="bg-slate-50" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs">SpO2 (%)</Label>
                                                                <Input placeholder="98" value={vitalsForm.spo2} onChange={e => setVitalsForm({...vitalsForm, spo2: e.target.value})} className="bg-slate-50" />
                                                            </div>
                                                            <div className="space-y-2 col-span-2">
                                                                <Label className="text-xs">Resp Rate (breaths/min)</Label>
                                                                <Input placeholder="16" value={vitalsForm.respiratory_rate} onChange={e => setVitalsForm({...vitalsForm, respiratory_rate: e.target.value})} className="bg-slate-50" />
                                                            </div>
                                                        </div>
                                                        <Button onClick={handleLogVitals} disabled={!vitalsForm.temp && !vitalsForm.bp && !vitalsForm.pulse} className="w-full bg-blue-600 hover:bg-blue-700 h-10 font-bold">Log Vitals</Button>
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            {/* Add Doctor Note Form */}
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Add Doctor Note</h3>
                                                <Card className="border-amber-100 shadow-sm">
                                                    <CardContent className="p-4 space-y-4 bg-white">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">Note Type</Label>
                                                            <select className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm font-medium bg-slate-50"
                                                                value={noteForm.note_type} onChange={e => setNoteForm({...noteForm, note_type: e.target.value})}>
                                                                <option>Ward Round</option>
                                                                <option>Progress Note</option>
                                                                <option>Consultation</option>
                                                                <option>Nursing Note</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">Content</Label>
                                                            <textarea 
                                                                className="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm bg-slate-50 min-h-[100px] resize-y"
                                                                placeholder="Observations, patient condition..."
                                                                value={noteForm.content}
                                                                onChange={e => setNoteForm({...noteForm, content: e.target.value})}
                                                            />
                                                        </div>
                                                        <Button onClick={handleAddNote} disabled={!noteForm.content} className="w-full bg-amber-500 hover:bg-amber-600 h-10 text-white font-bold">Add Note</Button>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Clinical Notes</h3>
                                            <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
                                                {(activeAdmission?.doctor_notes || []).length === 0 ? (
                                                    <div className="p-8 text-center bg-slate-100/50 rounded-xl border border-dashed border-slate-300">
                                                        <p className="text-sm text-slate-500">No notes recorded.</p>
                                                    </div>
                                                ) : (
                                                    (activeAdmission?.doctor_notes || []).map((note: any, idx: number) => (
                                                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">{note.note_type}</Badge>
                                                                <span className="text-[10px] text-slate-400 font-mono">{new Date(note.timestamp).toLocaleString()}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                                            <div className="mt-3 text-right">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Dr. {note.doctor_name}</span>
                                                            </div>
                                                        </div>
                                                    )).reverse()
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Equipment */}
                                <TabsContent value="equipment" className="m-0 h-full">
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Assigned Machinery</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {equipments.filter(e => e.bed_id === selectedBed?.bed_id && e.status === 'in_use').length === 0 ? (
                                                <div className="col-span-full p-12 text-center bg-slate-100/50 rounded-xl border border-dashed border-slate-300">
                                                    <Cpu className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                                    <p className="text-slate-500 font-medium">No medical equipment assigned to this bed.</p>
                                                    <Button variant="link" onClick={() => router.push('/hospital/hms/equipment')} className="text-teal-600 mt-2">Manage Equipment</Button>
                                                </div>
                                            ) : (
                                                equipments.filter(e => e.bed_id === selectedBed?.bed_id && e.status === 'in_use').map(eq => (
                                                    <div key={eq.equipment_id} className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-5 relative overflow-hidden shadow-sm">
                                                        <div className="absolute -right-4 -top-4 text-teal-100/50">
                                                            <Cpu className="w-24 h-24" />
                                                        </div>
                                                        <div className="relative z-10">
                                                            <Badge className="bg-teal-500 mb-2 border-none">Active</Badge>
                                                            <h4 className="font-black text-slate-900 text-xl">{eq.name}</h4>
                                                            <p className="text-teal-700 font-medium text-sm mt-1">{eq.equipment_type}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
