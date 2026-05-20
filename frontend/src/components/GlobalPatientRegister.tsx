"use client";

import React, { useState, useEffect } from 'react';
import { 
    X, User, Phone, Calendar, MapPin, Activity, 
    ClipboardList, HeartPulse, Building2, 
    Sparkles, Camera, Loader2, Save,
    Stethoscope, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import { useTerminology } from '@/hooks/useTerminology';
import { toTitleCase, toUpperCaseMRD } from '@/lib/formatters';

export default function GlobalPatientRegister() {
    const [isOpen, setIsOpen] = useState(false);
    const { terms, specialty } = useTerminology();
    const [activeTab, setActiveTab] = useState('identity');
    const [isSaving, setIsSaving] = useState(false);
    const [ageUnit, setAgeUnit] = useState<'Years' | 'Months' | 'Days'>('Years');

    const [formData, setFormData] = useState({
        full_name: '',
        uhid: '',
        patient_u_id: '', // MRD No
        age: '',
        gender: '',
        dob: '',
        contact_number: '',
        address: '',
        email_id: '',
        aadhaar_number: '',
        patient_category: 'STANDARD',
        admission_date: '',
        discharge_date: '',
        doctor_name: '',
        chief_complaint: '',
        medical_history: '',
        allergies: '',
        medications: '',
        weight: '',
        diagnosis: ''
    });

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            // Default dates if needed
            const today = new Date().toISOString().split('T')[0];
            setFormData(prev => ({
                ...prev,
                admission_date: today,
                discharge_date: today
            }));
        };
        window.addEventListener('open-global-patient-register', handleOpen);
        return () => window.removeEventListener('open-global-patient-register', handleOpen);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            uhid: '',
            patient_u_id: '',
            age: '',
            gender: '',
            dob: '',
            contact_number: '',
            address: '',
            email_id: '',
            aadhaar_number: '',
            patient_category: 'STANDARD',
            admission_date: '',
            discharge_date: '',
            doctor_name: '',
            chief_complaint: '',
            medical_history: '',
            allergies: '',
            medications: '',
            weight: '',
            diagnosis: ''
        });
        setActiveTab('identity');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.full_name || !formData.contact_number) {
            alert("Name and Contact Number are required.");
            return;
        }

        setIsSaving(true);
        try {
            // Determine endpoint based on specialty or use a universal one if backend supports it
            // For now, we'll hit the core patients endpoint which most modules sync with
            let endpoint = 'patients';
            if (specialty === 'Dental') endpoint = 'dental/patients';
            else if (specialty === 'ENT') endpoint = 'ent/patients';

            const payload = {
                ...formData,
                age: formData.age ? `${formData.age} ${ageUnit}` : '',
                // Sanitize dates
                dob: formData.dob || null,
                admission_date: formData.admission_date || null,
                discharge_date: formData.discharge_date || null,
            };

            const res = await apiFetch(endpoint, {
                method: 'POST',
                body: payload
            });

            if (res.ok) {
                const data = await res.json().catch(() => payload);
                alert("Patient registered successfully!");
                handleClose();
                // Optionally refresh current page data if possible
                window.dispatchEvent(new CustomEvent('patient-registered', { detail: data }));
            }
        } catch (error: any) {
            console.error("Registration failed:", error);
            alert(error.message || "Failed to register patient.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Register New {terms.patient}</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{specialty} Command Center</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 p-1 rounded-2xl">
                            <TabsTrigger value="identity" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs">
                                1. Identity
                            </TabsTrigger>
                            <TabsTrigger value="clinical" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs">
                                2. Clinical
                            </TabsTrigger>
                            <TabsTrigger value="admission" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm font-bold text-xs">
                                3. Admission
                            </TabsTrigger>
                        </TabsList>

                        <form onSubmit={handleSubmit} id="global-register-form">
                            <TabsContent value="identity" className="space-y-6 mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Full Name *</Label>
                                        <Input 
                                            placeholder="Enter patient full name"
                                            className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500 font-bold"
                                            value={formData.full_name}
                                            onChange={e => setFormData({...formData, full_name: toTitleCase(e.target.value)})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">UHID (Optional)</Label>
                                        <Input 
                                            placeholder="UHID-12345"
                                            className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500 font-mono"
                                            value={formData.uhid}
                                            onChange={e => setFormData({...formData, uhid: toUpperCaseMRD(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Contact Number *</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input 
                                                placeholder="Phone number"
                                                className="h-11 pl-10 border-slate-200 rounded-xl focus:ring-indigo-500"
                                                value={formData.contact_number}
                                                onChange={e => setFormData({...formData, contact_number: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Age *</Label>
                                            <div className="flex gap-1">
                                                <Input 
                                                    type="number"
                                                    placeholder="25"
                                                    className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500"
                                                    value={formData.age}
                                                    onChange={e => setFormData({...formData, age: e.target.value})}
                                                    required
                                                />
                                                <select 
                                                    className="w-16 h-11 border border-slate-200 rounded-xl bg-slate-50 text-[10px] font-bold px-1"
                                                    value={ageUnit}
                                                    onChange={e => setAgeUnit(e.target.value as any)}
                                                >
                                                    <option value="Years">YR</option>
                                                    <option value="Months">MO</option>
                                                    <option value="Days">DY</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Gender *</Label>
                                            <select 
                                                className="w-full h-11 border border-slate-200 rounded-xl bg-white text-sm px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={formData.gender}
                                                onChange={e => setFormData({...formData, gender: e.target.value})}
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Current Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <Textarea 
                                            placeholder="Residential address..."
                                            className="min-h-[80px] pl-10 border-slate-200 rounded-xl focus:ring-indigo-500"
                                            value={formData.address}
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="clinical" className="space-y-6 mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Chief Complaint</Label>
                                        <Input 
                                            placeholder="Reason for visit"
                                            className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500"
                                            value={formData.chief_complaint}
                                            onChange={e => setFormData({...formData, chief_complaint: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Weight (kg)</Label>
                                        <Input 
                                            placeholder="e.g. 70"
                                            className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500"
                                            value={formData.weight}
                                            onChange={e => setFormData({...formData, weight: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Medical History</Label>
                                    <Textarea 
                                        placeholder="Past surgeries, systemic diseases..."
                                        className="min-h-[80px] border-slate-200 rounded-xl focus:ring-indigo-500"
                                        value={formData.medical_history}
                                        onChange={e => setFormData({...formData, medical_history: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Allergies</Label>
                                        <div className="relative">
                                            <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
                                            <Input 
                                                placeholder="e.g. Penicillin"
                                                className="h-11 pl-10 border-slate-200 rounded-xl focus:ring-rose-200"
                                                value={formData.allergies}
                                                onChange={e => setFormData({...formData, allergies: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Current Medications</Label>
                                        <Input 
                                            placeholder="e.g. Aspirin 50mg"
                                            className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500"
                                            value={formData.medications}
                                            onChange={e => setFormData({...formData, medications: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="admission" className="space-y-6 mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">{terms.mrd} Number</Label>
                                        <Input 
                                            placeholder="MRD-2025/123"
                                            className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500 font-mono font-bold"
                                            value={formData.patient_u_id}
                                            onChange={e => setFormData({...formData, patient_u_id: toUpperCaseMRD(e.target.value)})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Admission Date</Label>
                                        <Input 
                                            type="date"
                                            className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500"
                                            value={formData.admission_date}
                                            onChange={e => setFormData({...formData, admission_date: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Category</Label>
                                        <select 
                                            className="w-full h-11 border border-slate-200 rounded-xl bg-white text-sm px-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={formData.patient_category}
                                            onChange={e => setFormData({...formData, patient_category: e.target.value})}
                                        >
                                            <option value="STANDARD">STANDARD</option>
                                            <option value="OPD">OPD</option>
                                            <option value="IPD">IPD</option>
                                            <option value="EMERGENCY">EMERGENCY</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Consulting Doctor</Label>
                                        <div className="relative">
                                            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input 
                                                placeholder="e.g. Dr. Shah"
                                                className="h-11 pl-10 border-slate-200 rounded-xl focus:ring-indigo-500 font-bold"
                                                value={formData.doctor_name}
                                                onChange={e => setFormData({...formData, doctor_name: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Initial Diagnosis</Label>
                                    <Textarea 
                                        placeholder="Preliminary diagnosis details..."
                                        className="min-h-[80px] border-slate-200 rounded-xl focus:ring-indigo-500"
                                        value={formData.diagnosis}
                                        onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                                    />
                                </div>
                            </TabsContent>
                        </form>
                    </Tabs>
                </div>

                <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex gap-2">
                        {activeTab === 'identity' ? (
                            <>
                                <Button variant="outline" onClick={handleClose} className="rounded-xl px-6">
                                    Cancel
                                </Button>
                                <Button variant="ghost" onClick={resetForm} className="rounded-xl text-slate-500 hover:text-slate-900">
                                    Reset Form
                                </Button>
                            </>
                        ) : (
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    if (activeTab === 'clinical') setActiveTab('identity');
                                    else if (activeTab === 'admission') setActiveTab('clinical');
                                }} 
                                className="rounded-xl px-6 flex items-center gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </Button>
                        )}
                    </div>

                    {activeTab === 'admission' ? (
                        <Button 
                            type="submit" 
                            form="global-register-form"
                            disabled={isSaving}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 h-11 font-bold shadow-lg shadow-slate-900/20 gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Register {terms.patient}
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => {
                                if (activeTab === 'identity') setActiveTab('clinical');
                                else if (activeTab === 'clinical') setActiveTab('admission');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-8 h-11 font-bold shadow-lg shadow-indigo-500/20 gap-2"
                        >
                            Next Step
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
