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
import { apiFetch } from '@/config/api';
import { useTerminology } from '@/hooks/useTerminology';
import { toTitleCase, toUpperCaseMRD } from '@/lib/formatters';
import QuickAssignDoctorModal from './QuickAssignDoctorModal';
import IPDAdmissionModal from './IPDAdmissionModal';
import toast from 'react-hot-toast';

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

export default function GlobalPatientRegister() {
    const [isOpen, setIsOpen] = useState(false);
    const { terms, specialty } = useTerminology();
    const [isSaving, setIsSaving] = useState(false);
    const [ageUnit, setAgeUnit] = useState<'Years' | 'Months' | 'Days'>('Years');
    const [namePrefix, setNamePrefix] = useState('Mr.');
    const [uhidMode, setUhidMode] = useState<'auto' | 'semi-auto' | 'manual'>('auto');
    const [isExistingPatient, setIsExistingPatient] = useState(false);

    const checkExistingUHID = async (uhidVal: string) => {
        if (!uhidVal) return;
        const normalized = uhidVal.toUpperCase().trim();
        try {
            const res = await apiFetch(`patients/check/uhid/${encodeURIComponent(normalized)}`);
            if (res && res.exists && res.patient) {
                const p = res.patient;
                let ageVal = p.age || '';
                let unitVal: 'Years' | 'Months' | 'Days' = 'Years';
                if (p.dob) {
                    const calc = calculateAgeFromDob(p.dob.split('T')[0]);
                    if (calc) {
                        ageVal = calc.age;
                        unitVal = calc.unit as any;
                    }
                }
                setFormData(prev => ({
                    ...prev,
                    full_name: p.full_name || prev.full_name,
                    uhid: normalized,
                    contact_number: p.contact_number || prev.contact_number,
                    gender: p.gender || prev.gender,
                    age: ageVal,
                    dob: p.dob ? p.dob.split('T')[0] : prev.dob,
                    address: p.address || prev.address,
                    email_id: p.email_id || prev.email_id,
                    aadhaar_number: p.aadhaar_number || prev.aadhaar_number
                }));
                setAgeUnit(unitVal);
                setIsExistingPatient(true);
                toast.success("✨ Patient details auto-filled from existing UHID record!");
            } else {
                setIsExistingPatient(false);
            }
        } catch (e: any) {
            console.error('UHID check failed:', e);
        }
    };

    const [formData, setFormData] = useState({
        full_name: '',
        uhid: '',
        patient_u_id: '', // MRD No
        age: '',
        gender: 'Male',
        dob: '',
        contact_number: '',
        address: '',
        email_id: '',
        aadhaar_number: '',
        abha_id: '',
        ayushman_id: '',
        maa_card: '',
        patient_category: 'OPD',
        admission_date: '',
        discharge_date: '',
        doctor_name: '',
        chief_complaint: '',
        medical_history: '',
        allergies: '',
        medications: '',
        weight: '',
        diagnosis: '',
        blood_group: ''
    });

    const autoGenerateIds = async () => {
        let finalUHID = `DF-${Math.floor(1000 + Math.random() * 9000)}`;
        let mode = 'auto';
        try {
            const res = await apiFetch('/patients/next-id');
            if (res && res.next_id) {
                finalUHID = res.next_id;
                if (res.mode) mode = res.mode;
            }
        } catch (err) {
            console.error("Failed to fetch next sequential IDs:", err);
        }
        return { finalUHID, mode };
    };

    useEffect(() => {
        const handleOpen = async () => {
            setIsOpen(true);
            setIsExistingPatient(false);
            const today = new Date().toISOString().split('T')[0];
            const { finalUHID, mode } = await autoGenerateIds();
            setUhidMode(mode as any);
            setFormData(prev => ({
                ...prev,
                patient_u_id: '',
                uhid: finalUHID,
                admission_date: today,
                discharge_date: today
            }));
        };
        window.addEventListener('open-global-patient-register', handleOpen);
        return () => window.removeEventListener('open-global-patient-register', handleOpen);
    }, []);

    // Assign Doctor Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isIPDModalOpen, setIsIPDModalOpen] = useState(false);
    const [newlyRegisteredId, setNewlyRegisteredId] = useState<number | null>(null);
    const [newlyRegisteredName, setNewlyRegisteredName] = useState<string>('');

    const handleClose = () => {
        setIsOpen(false);
        resetForm();
    };

    const resetForm = async () => {
        setIsExistingPatient(false);
        const { finalUHID, mode } = await autoGenerateIds();
        setUhidMode(mode as any);
        setFormData({
            full_name: '',
            uhid: finalUHID,
            patient_u_id: '',
            age: '',
            gender: 'Male',
            dob: '',
            contact_number: '',
            address: '',
            email_id: '',
            aadhaar_number: '',
            abha_id: '',
            ayushman_id: '',
            maa_card: '',
            patient_category: 'OPD',
            admission_date: '',
            discharge_date: '',
            doctor_name: '',
            chief_complaint: '',
            medical_history: '',
            allergies: '',
            medications: '',
            weight: '',
            diagnosis: '',
            blood_group: ''
        });
        setNamePrefix('Mr.');
    };

    const handlePrefixChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const prefix = e.target.value;
        setNamePrefix(prefix);
        if (['Mr.', 'Master'].includes(prefix)) {
            setFormData(prev => ({ ...prev, gender: 'Male' }));
        } else if (['Mrs.', 'Miss', 'Baby'].includes(prefix)) {
            setFormData(prev => ({ ...prev, gender: 'Female' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.full_name || !formData.contact_number) {
            toast.error("Name and Contact Number are required.");
            return;
        }

        if (formData.contact_number.length !== 10) {
            toast.error("Contact Number must be exactly 10 digits.");
            return;
        }

        setIsSaving(true);
        try {
            let endpoint = 'patients';
            if (specialty === 'Dental') endpoint = 'dental/patients';
            else if (specialty === 'ENT') endpoint = 'ent/patients';

            const payload = {
                ...formData,
                full_name: `${namePrefix} ${formData.full_name.trim()}`,
                age: formData.age ? `${formData.age} ${ageUnit}` : '',
                dob: formData.dob ? `${formData.dob}T00:00:00Z` : null,
                admission_date: formData.admission_date ? `${formData.admission_date}T00:00:00Z` : null,
                discharge_date: formData.discharge_date ? `${formData.discharge_date}T00:00:00Z` : null,
            };

            const data = await apiFetch(`/${endpoint}`, {
                method: 'POST',
                body: payload
            });

            setNewlyRegisteredId(data.record_id || data.patient_id);
            setNewlyRegisteredName(`${namePrefix} ${formData.full_name.trim()}`);
            if (formData.patient_category === 'IPD') {
                setIsIPDModalOpen(true);
            } else {
                setIsAssignModalOpen(true);
            }
        } catch (error: any) {
            console.error("Registration failed:", error);
            if (error.status === 409 && error.data && error.data.detail) {
                const existingId = error.data.detail.existing_patient_id;
                const msg = error.data.detail.message;
                const confirmMsg = `${msg}\n\nWould you like to skip registration and book an appointment for this existing patient?`;
                if (window.confirm(confirmMsg)) {
                    setNewlyRegisteredId(existingId);
                    setNewlyRegisteredName(`${namePrefix} ${formData.full_name.trim()}`);
                    if (formData.patient_category === 'IPD') {
                        setIsIPDModalOpen(true);
                    } else {
                        setIsAssignModalOpen(true);
                    }
                }
            } else {
                toast.error(`Error: ${error.message || "Data formatting error in server response."}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={handleClose} />
            
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Register New Patient</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">General Command Center</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} id="global-register-form" className="space-y-8 pb-8">
                        {/* Section: Basic Details */}
                        <div>
                            <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <User className="w-4 h-4 text-indigo-500" /> Basic Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Full Name *</Label>
                                        <div className="flex gap-2">
                                            <select 
                                                className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500 bg-slate-50 px-3 font-semibold text-sm outline-none border"
                                                value={namePrefix}
                                                onChange={handlePrefixChange}
                                            >
                                                <option value="Mr.">Mr.</option>
                                                <option value="Mrs.">Mrs.</option>
                                                <option value="Miss">Miss</option>
                                                <option value="Master">Master</option>
                                                <option value="Baby">Baby</option>
                                            </select>
                                            <Input 
                                                placeholder="Enter patient full name"
                                                className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500 font-bold flex-1"
                                                value={formData.full_name}
                                                onChange={e => setFormData({...formData, full_name: toTitleCase(e.target.value)})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
                                                UHID ({uhidMode === 'manual' ? 'Manual' : uhidMode === 'semi-auto' ? 'Editable' : 'Auto-generated'})
                                            </Label>
                                            {isExistingPatient && (
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                    Patient Found
                                                </span>
                                            )}
                                        </div>
                                        <Input 
                                            placeholder="DF-1234"
                                            className={`h-11 border-slate-200 rounded-xl focus:ring-indigo-500 font-mono ${uhidMode === 'auto' ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                                            value={formData.uhid}
                                            readOnly={uhidMode === 'auto'}
                                            onChange={e => {
                                                const val = toUpperCaseMRD(e.target.value);
                                                setFormData({...formData, uhid: val});
                                                if (val.trim().length >= 3) {
                                                    checkExistingUHID(val);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    checkExistingUHID(formData.uhid);
                                                }
                                            }}
                                            onBlur={e => checkExistingUHID(e.target.value)}
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
                                                onChange={e => setFormData({...formData, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                                                maxLength={10}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 md:col-span-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Date of Birth</Label>
                                            <Input 
                                                type="date"
                                                className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500 font-medium"
                                                value={formData.dob}
                                                max={new Date().toISOString().split('T')[0]}
                                                min="1900-01-01"
                                                onChange={e => {
                                                    const dobVal = e.target.value;
                                                    const calculated = calculateAgeFromDob(dobVal);
                                                    if (calculated) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            dob: dobVal,
                                                            age: calculated.age
                                                        }));
                                                        setAgeUnit(calculated.unit as any);
                                                    } else {
                                                        setFormData(prev => ({ ...prev, dob: dobVal }));
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Age *</Label>
                                            <div className="flex gap-1">
                                                <Input 
                                                    type="number"
                                                    placeholder="25"
                                                    className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500 min-w-0"
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
                                                className="w-full h-11 border border-slate-200 rounded-xl bg-white text-sm px-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Category *</Label>
                                            <select 
                                                className="w-full h-11 border border-slate-200 rounded-xl bg-white text-sm px-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                                value={formData.patient_category}
                                                onChange={e => setFormData({...formData, patient_category: e.target.value})}
                                                required
                                            >
                                                <option value="OPD">OPD</option>
                                                <option value="IPD">IPD</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
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
                                <div className="mt-6 pt-4 border-t border-slate-100">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4">Government & Health IDs (Optional)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Aadhaar Number</Label>
                                            <Input 
                                                placeholder="12-digit Aadhaar No"
                                                className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500"
                                                value={formData.aadhaar_number}
                                                onChange={e => setFormData({...formData, aadhaar_number: e.target.value.replace(/\D/g, '').slice(0, 12)})}
                                                maxLength={12}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">ABHA Health ID</Label>
                                            <Input 
                                                placeholder="ABHA ID (14 digits)"
                                                className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500"
                                                value={formData.abha_id}
                                                onChange={e => setFormData({...formData, abha_id: e.target.value.replace(/\D/g, '').slice(0, 14)})}
                                                maxLength={14}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Ayushman Bharat ID</Label>
                                            <Input 
                                                placeholder="Ayushman Card ID"
                                                className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500"
                                                value={formData.ayushman_id}
                                                onChange={e => setFormData({...formData, ayushman_id: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">MAA Card ID</Label>
                                            <Input 
                                                placeholder="Maa Vatsalya Card ID"
                                                className="h-11 border-slate-200 rounded-xl focus:ring-indigo-500"
                                                value={formData.maa_card}
                                                onChange={e => setFormData({...formData, maa_card: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                        {/* Section: Clinical Vitals */}
                        <div>
                            <h3 className="text-sm font-black text-slate-900 mb-4 mt-2 flex items-center gap-2 border-b border-slate-100 pb-2">
                                <Activity className="w-4 h-4 text-rose-500" /> Clinical Vitals
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Blood Group</Label>
                                    <select
                                        className="w-full h-11 border border-slate-200 rounded-xl bg-white text-sm px-3 outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                                        value={formData.blood_group}
                                        onChange={e => setFormData({...formData, blood_group: e.target.value})}
                                    >
                                        <option value="">Select Blood Group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="Bombay Blood Group">Bombay Blood Group</option>
                                    </select>
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
                        </div>

                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving} className="rounded-xl px-6">
                            Cancel
                        </Button>
                        <Button type="button" variant="ghost" onClick={resetForm} disabled={isSaving} className="rounded-xl text-slate-500 hover:text-slate-900">
                            Reset Form
                        </Button>
                    </div>

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
                </div>
            </div>

            <QuickAssignDoctorModal 
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    handleClose(); 
                    window.dispatchEvent(new CustomEvent('patient-registered'));
                }}
                patientId={newlyRegisteredId}
                patientName={newlyRegisteredName}
            />

            <IPDAdmissionModal 
                isOpen={isIPDModalOpen}
                patientId={newlyRegisteredId}
                patientName={newlyRegisteredName}
                onClose={() => {
                    setIsIPDModalOpen(false);
                    handleClose(); 
                    window.dispatchEvent(new CustomEvent('patient-registered'));
                }}
            />
        </div>
    );
}
