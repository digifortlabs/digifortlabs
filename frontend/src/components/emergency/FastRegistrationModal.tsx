import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { API_URL, apiFetch } from '@/config/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface FastRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FastRegistrationModal({ isOpen, onClose, onSuccess }: FastRegistrationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Minimal Patient Details for Emergency
    const [patientData, setPatientData] = useState({
        full_name: '',
        phone: '',
        age: '',
        gender: 'male',
        blood_group: ''
    });

    // Emergency Details
    const [emergencyData, setEmergencyData] = useState({
        triage_level: 'Yellow',
        mode_of_arrival: 'Walk-in',
        is_medico_legal: false,
        police_station: '',
        ambulance_driver: '',
        chief_complaint: '',
        is_mediclaim: false,
        mediclaim_details: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 1. Create Patient First
            const patientPayload = {
                full_name: patientData.full_name,
                contact_number: patientData.phone.replace(/\D/g, '').slice(0, 10),
                age: patientData.age ? patientData.age : null,
                gender: patientData.gender,
                blood_group: patientData.blood_group || null
            };

            const patientRes = await apiFetch('patients/', {
                method: 'POST',
                body: JSON.stringify(patientPayload)
            });

            if (!patientRes) throw new Error("Failed to register patient");

            // 2. Create Emergency Visit
            const visitPayload = {
                patient_id: patientRes.record_id,
                triage_level: emergencyData.triage_level,
                mode_of_arrival: emergencyData.mode_of_arrival,
                is_medico_legal: emergencyData.is_medico_legal,
                police_station: emergencyData.police_station || null,
                ambulance_driver: emergencyData.ambulance_driver || null,
                chief_complaint: emergencyData.chief_complaint || null,
                is_mediclaim: emergencyData.is_mediclaim,
                mediclaim_details: emergencyData.mediclaim_details || null
            };

            const visitRes = await apiFetch('emergency/', {
                method: 'POST',
                body: JSON.stringify(visitPayload)
            });

            if (visitRes) {
                onSuccess();
                onClose();
            }

        } catch (err: any) {
            setError(err.message || 'Failed to register emergency');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-red-600 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <AlertTriangle className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Fast Emergency Registration</h2>
                    </div>
                    <button onClick={onClose} className="text-red-100 hover:text-white transition bg-red-700/50 hover:bg-red-700 p-2 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <form id="emergency-form" onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* Section 1: Minimal Patient Info */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">1. Patient Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name *</Label>
                                    <Input required autoFocus placeholder="Patient Name (or 'Unknown')" value={patientData.full_name} onChange={e => setPatientData({...patientData, full_name: e.target.value})} className="border-slate-200 focus:border-red-500 focus:ring-red-500/20" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Number</Label>
                                    <Input placeholder="Mobile Number" value={patientData.phone} onChange={e => setPatientData({...patientData, phone: e.target.value})} maxLength={10} className="border-slate-200 focus:border-red-500 focus:ring-red-500/20" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input type="number" placeholder="e.g. 45" value={patientData.age} onChange={e => setPatientData({...patientData, age: e.target.value})} className="border-slate-200 focus:border-red-500 focus:ring-red-500/20" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Select value={patientData.gender} onValueChange={v => setPatientData({...patientData, gender: v})}>
                                        <SelectTrigger className="border-slate-200 focus:border-red-500 focus:ring-red-500/20"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100"></div>

                        {/* Section 2: Triage & Emergency */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">2. Emergency Assessment</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Triage Priority *</Label>
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                        {[
                                            { val: 'Red', label: 'Resuscitation', color: 'bg-red-500 text-white' },
                                            { val: 'Orange', label: 'Emergent', color: 'bg-orange-500 text-white' },
                                            { val: 'Yellow', label: 'Urgent', color: 'bg-yellow-400 text-slate-900' },
                                            { val: 'Green', label: 'Less Urgent', color: 'bg-green-500 text-white' },
                                            { val: 'Blue', label: 'Non Urgent', color: 'bg-blue-500 text-white' }
                                        ].map(lvl => (
                                            <button
                                                type="button"
                                                key={lvl.val}
                                                onClick={() => setEmergencyData({...emergencyData, triage_level: lvl.val})}
                                                className={`p-2 rounded-xl text-xs font-bold transition-all border-2 ${
                                                    emergencyData.triage_level === lvl.val 
                                                    ? `${lvl.color} border-transparent scale-105 shadow-md` 
                                                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 opacity-60'
                                                }`}
                                            >
                                                {lvl.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Chief Complaint</Label>
                                    <Input placeholder="Briefly describe emergency" value={emergencyData.chief_complaint} onChange={e => setEmergencyData({...emergencyData, chief_complaint: e.target.value})} className="border-slate-200 focus:border-red-500 focus:ring-red-500/20" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Mode of Arrival</Label>
                                    <Select value={emergencyData.mode_of_arrival} onValueChange={v => setEmergencyData({...emergencyData, mode_of_arrival: v})}>
                                        <SelectTrigger className="border-slate-200 focus:border-red-500 focus:ring-red-500/20"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Walk-in">Walk-in</SelectItem>
                                            <SelectItem value="Ambulance">Ambulance</SelectItem>
                                            <SelectItem value="Police">Police</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            {/* Medico-Legal / Optional Info */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-bold text-slate-800">Medico-Legal Case (MLC)</Label>
                                        <p className="text-xs text-slate-500">Flag this if police involvement is required.</p>
                                    </div>
                                    <Switch 
                                        checked={emergencyData.is_medico_legal} 
                                        onCheckedChange={(c: boolean) => setEmergencyData({...emergencyData, is_medico_legal: c})}
                                    />
                                </div>

                                {emergencyData.is_medico_legal && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label>Police Station Details (Optional)</Label>
                                            <Input placeholder="E.g., Central Station, Officer Name" value={emergencyData.police_station} onChange={e => setEmergencyData({...emergencyData, police_station: e.target.value})} className="border-slate-200 focus:border-red-500 focus:ring-red-500/20" />
                                        </div>
                                    </div>
                                )}

                                {emergencyData.mode_of_arrival === 'Ambulance' && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label>Ambulance / Driver Details (Optional)</Label>
                                            <Input placeholder="E.g., License Plate, Driver Name" value={emergencyData.ambulance_driver} onChange={e => setEmergencyData({...emergencyData, ambulance_driver: e.target.value})} className="border-slate-200 focus:border-red-500 focus:ring-red-500/20" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mediclaim Info */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-bold text-slate-800">Mediclaim / Insurance</Label>
                                        <p className="text-xs text-slate-500">Flag this if the visit is covered under Mediclaim.</p>
                                    </div>
                                    <Switch 
                                        checked={emergencyData.is_mediclaim} 
                                        onCheckedChange={(c: boolean) => setEmergencyData({...emergencyData, is_mediclaim: c})}
                                    />
                                </div>

                                {emergencyData.is_mediclaim && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label>Mediclaim Details</Label>
                                            <Input placeholder="E.g., Policy Number, TPA Name, Approval Status" value={emergencyData.mediclaim_details} onChange={e => setEmergencyData({...emergencyData, mediclaim_details: e.target.value})} className="border-slate-200 focus:border-red-500 focus:ring-red-500/20" />
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </form>
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="text-slate-500 hover:text-slate-700 font-bold rounded-xl">
                        Cancel
                    </Button>
                    <Button type="submit" form="emergency-form" disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 px-8">
                        {isLoading ? 'Registering...' : 'Admit Emergency'}
                    </Button>
                </div>

            </div>
        </div>
    );
}
