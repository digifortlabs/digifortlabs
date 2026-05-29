"use client";

import React, { useState, useEffect } from 'react';
import { X, BedDouble, UserPlus, FileText, Calendar, Building2, Stethoscope, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/config/api';

interface IPDAdmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number | null;
    patientName: string;
    onSuccess?: () => void;
}

export default function IPDAdmissionModal({ isOpen, onClose, patientId, patientName, onSuccess }: IPDAdmissionModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    
    const [wards, setWards] = useState<any[]>([]);
    const [beds, setBeds] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        ward_id: '',
        bed_id: '',
        admitting_doctor_id: '',
        admission_date: new Date().toISOString().split('T')[0],
        diagnosis: '',
        treatment_plan: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            // Reset form when opened with a new patient
            setFormData({
                ward_id: '',
                bed_id: '',
                admitting_doctor_id: '',
                admission_date: new Date().toISOString().split('T')[0],
                diagnosis: '',
                treatment_plan: ''
            });
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const [wardsRes, doctorsRes] = await Promise.all([
                apiFetch('/hms/wards'),
                apiFetch('/appointments/doctors')
            ]);
            setWards(wardsRes || []);
            setDoctors(doctorsRes || []);
        } catch (error) {
            console.error("Failed to fetch initial data for IPD Admission", error);
        }
    };

    const fetchBedsForWard = async (wardId: string) => {
        try {
            const res = await apiFetch(`/hms/beds?ward_id=${wardId}`);
            setBeds(res || []);
        } catch (error) {
            console.error("Failed to fetch beds", error);
        }
    };

    const handleWardChange = (value: string) => {
        setFormData(prev => ({ ...prev, ward_id: value, bed_id: '' }));
        fetchBedsForWard(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.ward_id || !formData.bed_id) {
            alert("Please select both a Ward and a Bed.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                patient_id: patientId,
                ward_id: parseInt(formData.ward_id),
                bed_id: parseInt(formData.bed_id),
                admitting_doctor_id: formData.admitting_doctor_id ? parseInt(formData.admitting_doctor_id) : null,
                diagnosis: formData.diagnosis,
                treatment_plan: formData.treatment_plan,
                admission_date: formData.admission_date ? `${formData.admission_date}T00:00:00Z` : null
            };

            await apiFetch('/hms/admissions', {
                method: 'POST',
                body: payload
            });
            
            // Dispatch event so dashboards refresh
            window.dispatchEvent(new Event('ipd-admissions-updated'));
            
            alert(`Patient ${patientName} successfully admitted to IPD!`);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Failed to admit patient:", error);
            alert(`Admission failed: ${error.message || "Unknown error"}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <BedDouble className="w-5 h-5 text-blue-600" />
                            Admit to IPD
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Assign bed and admitting doctor for {patientName}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="ipd-admission-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                <UserPlus size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-blue-900">Patient Details</h3>
                                <p className="text-sm text-blue-700">{patientName}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-slate-700 flex items-center gap-2">
                                    <Building2 size={14} className="text-slate-400" /> Ward
                                </Label>
                                <Select value={formData.ward_id} onValueChange={handleWardChange}>
                                    <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-blue-500">
                                        <SelectValue placeholder="Select Ward" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {wards.map((w: any) => (
                                            <SelectItem key={w.ward_id} value={w.ward_id.toString()}>
                                                {w.ward_name} ({w.ward_type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 flex items-center gap-2">
                                    <BedDouble size={14} className="text-slate-400" /> Bed
                                </Label>
                                <Select 
                                    value={formData.bed_id} 
                                    onValueChange={(val) => setFormData(prev => ({...prev, bed_id: val}))}
                                    disabled={!formData.ward_id}
                                >
                                    <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-blue-500">
                                        <SelectValue placeholder="Select Bed" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {beds.filter((b: any) => !b.is_occupied).length === 0 ? (
                                            <SelectItem value="none" disabled>No available beds</SelectItem>
                                        ) : (
                                            beds.filter((b: any) => !b.is_occupied).map((b: any) => (
                                                <SelectItem key={b.bed_id} value={b.bed_id.toString()}>
                                                    Bed {b.bed_number}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 flex items-center gap-2">
                                    <Stethoscope size={14} className="text-slate-400" /> Admitting Doctor (Optional)
                                </Label>
                                <Select 
                                    value={formData.admitting_doctor_id} 
                                    onValueChange={(val) => setFormData(prev => ({...prev, admitting_doctor_id: val}))}
                                >
                                    <SelectTrigger className="bg-slate-50/50 border-slate-200 focus:ring-blue-500">
                                        <SelectValue placeholder="Select Doctor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors.map((d: any) => (
                                            <SelectItem key={d.profile_id} value={d.profile_id.toString()}>
                                                Dr. {d.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" /> Admission Date
                                </Label>
                                <Input 
                                    type="date"
                                    required
                                    value={formData.admission_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, admission_date: e.target.value }))}
                                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                <FileText size={16} className="text-slate-400" /> Clinical Details
                            </h4>
                            
                            <div className="space-y-2">
                                <Label className="text-slate-700">Initial Diagnosis</Label>
                                <Input 
                                    placeholder="e.g. Acute Appendicitis, Dengue Fever..."
                                    value={formData.diagnosis}
                                    onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700">Initial Treatment Plan / Notes</Label>
                                <Textarea 
                                    placeholder="Any immediate orders or treatment plan..."
                                    value={formData.treatment_plan}
                                    onChange={(e) => setFormData(prev => ({ ...prev, treatment_plan: e.target.value }))}
                                    className="bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 min-h-[100px] resize-y"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        disabled={isSaving}
                        className="bg-white"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        form="ipd-admission-form"
                        disabled={isSaving || !formData.ward_id || !formData.bed_id}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200 min-w-[120px]"
                    >
                        {isSaving ? (
                            <><Loader2 size={16} className="animate-spin mr-2" /> Admitting...</>
                        ) : (
                            'Admit Patient'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
