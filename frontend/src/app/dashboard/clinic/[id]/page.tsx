"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, User, CalendarDays, Activity, Pill,
    Plus, Stethoscope, Save, Clock, IndianRupee, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/config/api';
import { formatDate } from '@/lib/dateFormatter';
import { toast } from 'sonner';

export default function ClinicPatientDetail() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;

    const [patient, setPatient] = useState<any>(null);
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Consultation Modal State
    const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
    const [consultForm, setConsultForm] = useState({
        temperature: '',
        blood_pressure: '',
        pulse_rate: '',
        weight: '',
        chief_complaint: '',
        diagnosis: '',
        treatment: '',
        consultation_fee: 500,
        is_paid: false
    });

    // Prescription State inside Consultation
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [newRx, setNewRx] = useState({ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' });

    useEffect(() => {
        if (!patientId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                // Determine patient details from the generic patient API for header
                const patientData = await apiFetch(`patients/${patientId}`);
                if (patientData) setPatient(patientData);

                // Fetch clinic visits for this patient
                const visitsData = await apiFetch(`clinic/visits/${patientId}`);
                if (visitsData) setVisits(visitsData);
            } catch (error) {
                console.error("Failed to fetch clinic patient details:", error);
                toast.error("Failed to load patient records.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [patientId]);

    const handleSaveConsultation = async () => {
        if (!consultForm.chief_complaint) {
            toast.error("Chief complaint is required");
            return;
        }

        try {
            // Log Visit
            const visitResult = await apiFetch('clinic/visits', {
                method: 'POST',
                body: JSON.stringify({
                    patient_id: parseInt(patientId),
                    ...consultForm,
                    temperature: consultForm.temperature ? parseFloat(consultForm.temperature) : null,
                    pulse_rate: consultForm.pulse_rate ? parseInt(consultForm.pulse_rate) : null,
                    weight: consultForm.weight ? parseFloat(consultForm.weight) : null,
                })
            });

            if (!visitResult) throw new Error("Failed to save visit");

            // Save Prescriptions linked to visit
            for (const rx of prescriptions) {
                await apiFetch('clinic/prescriptions', {
                    method: 'POST',
                    body: JSON.stringify({
                        visit_id: visitResult.visit_id,
                        ...rx
                    })
                });
            }

            toast.success("Consultation saved successfully");
            setIsConsultModalOpen(false);

            // Refetch visits
            const updatedVisits = await apiFetch(`clinic/visits/${patientId}`);
            setVisits(updatedVisits || []);

            // Reset Form
            setConsultForm({
                temperature: '', blood_pressure: '', pulse_rate: '', weight: '',
                chief_complaint: '', diagnosis: '', treatment: '', consultation_fee: 500, is_paid: false
            });
            setPrescriptions([]);

        } catch (error) {
            console.error(error);
            toast.error("Error saving consultation");
        }
    };

    const addPrescription = () => {
        if (!newRx.medicine_name || !newRx.dosage || !newRx.duration) {
            toast.error("Please fill in Medicine, Dosage, and Duration.");
            return;
        }
        setPrescriptions([...prescriptions, newRx]);
        setNewRx({ medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' });
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Clinical Details...</div>;
    if (!patient) return <div className="p-8 text-center text-red-500">Patient not found.</div>;

    const age = patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A';

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="p-2" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{patient.full_name}</h1>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">MRD: {patient.mrd_number}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                            <span>{age} yrs, {patient.gender}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" /> {patient.phone}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsConsultModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                        <Stethoscope className="w-4 h-4 mr-2" /> Start Consultation
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Timeline / Left Side */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" /> Clinical History
                    </h3>

                    {visits.length === 0 ? (
                        <Card className="border-dashed bg-slate-50">
                            <CardContent className="p-12 text-center text-slate-500">
                                <Stethoscope className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <p>No previous clinical visits found.</p>
                                <Button variant="link" onClick={() => setIsConsultModalOpen(true)} className="mt-2">Record first visit</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                            {visits.map((visit, idx) => (
                                <div key={visit.visit_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                                        <Stethoscope className="w-5 h-5" />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                                        <div className="flex items-center justify-between mb-3 text-slate-500">
                                            <span className="text-sm font-semibold text-slate-900">{formatDate(visit.visit_date)}</span>
                                            <Badge variant={visit.is_paid ? "default" : "secondary"} className={visit.is_paid ? "bg-emerald-100 text-emerald-700" : "bg-red-50 text-red-600"}>
                                                ₹{visit.consultation_fee}
                                            </Badge>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs uppercase font-bold tracking-wider text-slate-500">Chief Complaint</p>
                                                <p className="text-sm text-slate-800">{visit.chief_complaint || '-'}</p>
                                            </div>
                                            {visit.diagnosis && (
                                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                                    <p className="text-xs uppercase font-bold tracking-wider text-amber-700 mb-1">Diagnosis</p>
                                                    <p className="text-sm font-medium text-amber-900">{visit.diagnosis}</p>
                                                </div>
                                            )}
                                            {visit.treatment && (
                                                <div>
                                                    <p className="text-xs uppercase font-bold tracking-wider text-slate-500">Treatment Plan</p>
                                                    <p className="text-sm text-slate-700 whitespace-pre-line">{visit.treatment}</p>
                                                </div>
                                            )}

                                            {/* Vitals Mini */}
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg">
                                                {visit.temperature && <span>Temp: {visit.temperature}°F</span>}
                                                {visit.blood_pressure && <span>BP: {visit.blood_pressure}</span>}
                                                {visit.weight && <span>Wt: {visit.weight}kg</span>}
                                            </div>

                                            <div className="flex justify-end pt-2 border-t mt-3">
                                                <Button variant="ghost" size="sm" className="text-blue-600 h-8">
                                                    <Printer className="w-4 h-4 mr-2" /> View Full Rx
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Patient Vitals Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5" /> Patient Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-500 block mb-1 text-xs uppercase font-bold">Email</span>
                                    <span className="text-slate-900">{patient.email || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block mb-1 text-xs uppercase font-bold">Location</span>
                                    <span className="text-slate-900">{patient.address || '-'}</span>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <span className="text-slate-500 block mb-2 text-xs uppercase font-bold">System Tags</span>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">OPD Registered</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Consultation Form Modal */}
            <Dialog open={isConsultModalOpen} onOpenChange={setIsConsultModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Stethoscope className="w-6 h-6 text-blue-600" /> Register Clinical Visit
                        </DialogTitle>
                        <DialogDescription>
                            Log consultation notes and generate prescriptions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        {/* Column 1: Vitals & Evaluation */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> Vitals
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Temperature (°F)</Label>
                                        <Input type="number" step="0.1" value={consultForm.temperature} onChange={e => setConsultForm({ ...consultForm, temperature: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Blood Pressure</Label>
                                        <Input placeholder="120/80" value={consultForm.blood_pressure} onChange={e => setConsultForm({ ...consultForm, blood_pressure: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pulse (bpm)</Label>
                                        <Input type="number" value={consultForm.pulse_rate} onChange={e => setConsultForm({ ...consultForm, pulse_rate: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Weight (kg)</Label>
                                        <Input type="number" step="0.1" value={consultForm.weight} onChange={e => setConsultForm({ ...consultForm, weight: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-800 border-b pb-2">Clinical Evaluation</h4>
                                <div className="space-y-2">
                                    <Label className="text-red-500">Chief Complaint *</Label>
                                    <Textarea required placeholder="Describe patient symptoms..." value={consultForm.chief_complaint} onChange={e => setConsultForm({ ...consultForm, chief_complaint: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Diagnosis</Label>
                                    <Input placeholder="Primary diagnosis" value={consultForm.diagnosis} onChange={e => setConsultForm({ ...consultForm, diagnosis: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Treatment Plan / Advice</Label>
                                    <Textarea placeholder="Procedures, diet restrictions, etc." value={consultForm.treatment} onChange={e => setConsultForm({ ...consultForm, treatment: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Rx & Billing */}
                        <div className="space-y-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                                    <Pill className="w-4 h-4" /> Prescription (Rx)
                                </h4>

                                {/* Rx Builder Form */}
                                <div className="bg-white p-3 rounded border shadow-sm space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <Label className="text-xs">Medicine Name *</Label>
                                            <Input size={1} className="h-8 text-sm" value={newRx.medicine_name} onChange={e => setNewRx({ ...newRx, medicine_name: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Dosage *</Label>
                                            <Input size={1} placeholder="e.g. 500mg" className="h-8 text-sm" value={newRx.dosage} onChange={e => setNewRx({ ...newRx, dosage: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Frequency *</Label>
                                            <select className="flex h-8 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
                                                value={newRx.frequency} onChange={e => setNewRx({ ...newRx, frequency: e.target.value })}>
                                                <option value="">Select...</option>
                                                <option value="1-0-0">Morning (1-0-0)</option>
                                                <option value="0-0-1">Night (0-0-1)</option>
                                                <option value="1-0-1">Morning & Night (1-0-1)</option>
                                                <option value="1-1-1">Thrice a Day (1-1-1)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Duration *</Label>
                                            <Input size={1} placeholder="5 days" className="h-8 text-sm" value={newRx.duration} onChange={e => setNewRx({ ...newRx, duration: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Timing</Label>
                                            <Input size={1} placeholder="After meals" className="h-8 text-sm" value={newRx.instructions} onChange={e => setNewRx({ ...newRx, instructions: e.target.value })} />
                                        </div>
                                    </div>
                                    <Button type="button" onClick={addPrescription} variant="secondary" className="w-full h-8 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        <Plus className="w-3 h-3 mr-1" /> Add to Rx
                                    </Button>
                                </div>

                                {/* Active Rx List */}
                                <div className="space-y-2">
                                    {prescriptions.map((px, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border text-sm shadow-sm">
                                            <div>
                                                <p className="font-bold text-slate-800">{px.medicine_name} <span className="text-slate-500 font-normal">({px.dosage})</span></p>
                                                <p className="text-xs text-slate-500">{px.frequency} for {px.duration} • {px.instructions}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-red-500 h-6 px-2" onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))}>
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                    {prescriptions.length === 0 && <p className="text-center text-xs text-slate-400 py-4">No medicines added.</p>}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <IndianRupee className="w-4 h-4" /> Billing
                                </h4>
                                <div className="flex gap-4">
                                    <div className="space-y-2 flex-1">
                                        <Label>Consultation Fee</Label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <Input type="number" className="pl-9" value={consultForm.consultation_fee} onChange={e => setConsultForm({ ...consultForm, consultation_fee: parseFloat(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex-none pt-8 flex items-center gap-2">
                                        <input type="checkbox" id="is_paid" className="w-4 h-4" checked={consultForm.is_paid} onChange={e => setConsultForm({ ...consultForm, is_paid: e.target.checked })} />
                                        <Label htmlFor="is_paid" className="cursor-pointer">Fee Collected</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-6 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsConsultModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveConsultation} className="bg-blue-600">
                            <Save className="w-4 h-4 mr-2" /> Save & Generate Rx
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
// A minimal phone icon to replace Lucide's if needed or imported correctly. I'll define it here.
function PhoneIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    );
}
