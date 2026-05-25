"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { useTerminology } from '@/hooks/useTerminology';

const calculateAgeFromDob = (dobString: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const today = new Date();
    if (isNaN(dob.getTime())) return null;

    let diffTime = today.getTime() - dob.getTime();
    if (diffTime < 0) return { age: '0', unit: 'Days' };

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) {
        return { age: String(diffDays), unit: 'Days' };
    }

    const diffMonths = Math.floor(diffDays / 30.4375);
    if (diffMonths < 12) {
        return { age: String(diffMonths), unit: 'Months' };
    }

    // Years calculation
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return { age: String(age), unit: 'Years' };
};

export default function PatientEditModal({ patient, isOpen, onClose, onUpdated }: any) {
    const { terms } = useTerminology();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<any>({
        full_name: '',
        uhid: '',
        age: '',
        gender: '',
        contact_number: '',
        address: '',
        blood_group: '',
        weight: '',
        allergies: '',
        mediclaim: '',
        aadhaar_number: '',
        abha_id: '',
        ayushman_id: '',
        maa_card: '',
        doctor_name: '',
        diagnosis: '',
        operative_notes: '',
        medical_summary: '',
        remarks: '',
        dob: '',
    });
    const [ageUnit, setAgeUnit] = useState<'Years' | 'Months' | 'Days'>('Years');

    useEffect(() => {
        if (patient && isOpen) {
            let ageVal = '';
            let unitVal: 'Years' | 'Months' | 'Days' = 'Years';
            
            if (patient.age) {
                const parts = patient.age.trim().split(/\s+/);
                if (parts.length >= 2) {
                    ageVal = parts[0];
                    const u = parts[1].toLowerCase();
                    if (u.startsWith('day')) unitVal = 'Days';
                    else if (u.startsWith('month')) unitVal = 'Months';
                    else unitVal = 'Years';
                } else if (parts.length === 1) {
                    ageVal = parts[0];
                }
            }
            
            setAgeUnit(unitVal);
            setFormData({
                full_name: patient.full_name || '',
                uhid: patient.uhid || '',
                age: ageVal,
                gender: patient.gender || '',
                contact_number: patient.contact_number || '',
                address: patient.address || '',
                blood_group: patient.blood_group || '',
                weight: patient.weight || '',
                allergies: patient.allergies || '',
                mediclaim: patient.mediclaim || '',
                aadhaar_number: patient.aadhaar_number || '',
                abha_id: patient.abha_id || '',
                ayushman_id: patient.ayushman_id || '',
                maa_card: patient.maa_card || '',
                doctor_name: patient.doctor_name || '',
                diagnosis: patient.diagnosis || '',
                operative_notes: patient.operative_notes || '',
                medical_summary: patient.medical_summary || '',
                remarks: patient.remarks || '',
                dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '',
            });
        }
    }, [patient, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                age: formData.age ? `${formData.age} ${ageUnit}` : '',
                dob: formData.dob ? new Date(formData.dob).toISOString() : null
            };
            const data = await apiFetch(`/patients/${patient.record_id}`, {
                method: 'PUT',
                body: payload
            });
            onUpdated(data);
            onClose();
        } catch (error: any) {
            console.error("Update failed", error);
            alert(error.message || "Failed to update patient");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit {terms.patient} Profile</h2>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Demographics</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-sm font-bold text-slate-700">Full Name</label>
                                <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                            </div>
                             <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Date of Birth</label>
                                <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.dob}
                                    onChange={e => {
                                        const dobVal = e.target.value;
                                        const calculated = calculateAgeFromDob(dobVal);
                                        if (calculated) {
                                            setFormData((prev: any) => ({
                                                ...prev,
                                                dob: dobVal,
                                                age: calculated.age
                                            }));
                                            setAgeUnit(calculated.unit as any);
                                        } else {
                                            setFormData((prev: any) => ({ ...prev, dob: dobVal }));
                                        }
                                    }}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Age</label>
                                <div className="flex gap-1">
                                    <input type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                        value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                                    <select 
                                        className="w-20 px-2 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-slate-50 font-bold text-xs"
                                        value={ageUnit}
                                        onChange={e => setAgeUnit(e.target.value as any)}
                                    >
                                        <option value="Years">YR</option>
                                        <option value="Months">MO</option>
                                        <option value="Days">DY</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Gender</label>
                                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Phone</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">UHID</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium font-mono"
                                    value={formData.uhid} onChange={e => setFormData({...formData, uhid: e.target.value})} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-sm font-bold text-slate-700">Address</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                        </div>

                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mt-6 pt-4 border-t border-slate-100">Clinical Vitals</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Blood Group</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})} placeholder="e.g. O+" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Weight (kg)</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-sm font-bold text-slate-700">Allergies</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-sm font-bold text-slate-700">Mediclaim / Insurance</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.mediclaim} onChange={e => setFormData({...formData, mediclaim: e.target.value})} />
                            </div>
                        </div>

                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mt-6 pt-4 border-t border-slate-100">Government & Health IDs</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Aadhaar Card</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.aadhaar_number} onChange={e => setFormData({...formData, aadhaar_number: e.target.value})} placeholder="12-digit number" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">ABHA ID</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.abha_id} onChange={e => setFormData({...formData, abha_id: e.target.value})} placeholder="ABHA number or address" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Ayushman Bharat ID</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.ayushman_id} onChange={e => setFormData({...formData, ayushman_id: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">MAA Card ID</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.maa_card} onChange={e => setFormData({...formData, maa_card: e.target.value})} />
                            </div>
                        </div>

                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mt-6 pt-4 border-t border-slate-100">Medical Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Treating Doctor</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.doctor_name} onChange={e => setFormData({...formData, doctor_name: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">Diagnosis</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-sm font-bold text-slate-700">Operative Notes</label>
                                <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.operative_notes} onChange={e => setFormData({...formData, operative_notes: e.target.value})} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-sm font-bold text-slate-700">Medical Summary</label>
                                <textarea rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.medical_summary} onChange={e => setFormData({...formData, medical_summary: e.target.value})} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-sm font-bold text-slate-700">Remarks</label>
                                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                                    value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-900">
                        Cancel
                    </button>
                    <button type="submit" onClick={handleSubmit} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
