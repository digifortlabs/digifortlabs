import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface EditEmergencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    emergencyDetails: any;
}

export default function EditEmergencyModal({ isOpen, onClose, onSuccess, emergencyDetails }: EditEmergencyModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        triage_level: 'Yellow',
        mode_of_arrival: 'Walk-in',
        is_medico_legal: false,
        police_station: '',
        ambulance_driver: '',
        chief_complaint: '',
        is_mediclaim: false,
        mediclaim_details: ''
    });

    useEffect(() => {
        if (isOpen && emergencyDetails) {
            setFormData({
                triage_level: emergencyDetails.triage_level || 'Yellow',
                mode_of_arrival: emergencyDetails.mode_of_arrival || 'Walk-in',
                is_medico_legal: emergencyDetails.is_medico_legal || false,
                police_station: emergencyDetails.police_station || '',
                ambulance_driver: emergencyDetails.ambulance_driver || '',
                chief_complaint: emergencyDetails.chief_complaint || '',
                is_mediclaim: emergencyDetails.is_mediclaim || false,
                mediclaim_details: emergencyDetails.mediclaim_details || ''
            });
        }
    }, [isOpen, emergencyDetails]);

    if (!isOpen || !emergencyDetails) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await apiFetch(`emergency/${emergencyDetails.emergency_id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });

            if (res) {
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update emergency record');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Edit Emergency Record</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Editing details for {emergencyDetails.patient_name || 'Patient'}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-slate-200">
                        <X className="w-4 h-4 text-slate-500" />
                    </Button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start">
                            <span className="font-semibold">{error}</span>
                        </div>
                    )}

                    <form id="edit-emergency-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-700">Triage Level *</Label>
                                    <Select value={formData.triage_level} onValueChange={(val) => setFormData({...formData, triage_level: val})}>
                                        <SelectTrigger className="h-10 bg-slate-50">
                                            <SelectValue placeholder="Select Triage Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Red"><span className="text-red-600 font-medium">Red (Resuscitation)</span></SelectItem>
                                            <SelectItem value="Orange"><span className="text-orange-600 font-medium">Orange (Emergent)</span></SelectItem>
                                            <SelectItem value="Yellow"><span className="text-yellow-600 font-medium">Yellow (Urgent)</span></SelectItem>
                                            <SelectItem value="Green"><span className="text-green-600 font-medium">Green (Less Urgent)</span></SelectItem>
                                            <SelectItem value="Blue"><span className="text-blue-600 font-medium">Blue (Non-Urgent)</span></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-700">Mode of Arrival</Label>
                                    <Select value={formData.mode_of_arrival} onValueChange={(val) => setFormData({...formData, mode_of_arrival: val})}>
                                        <SelectTrigger className="h-10 bg-slate-50">
                                            <SelectValue placeholder="Select Mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Walk-in">Walk-in</SelectItem>
                                            <SelectItem value="Ambulance">Ambulance</SelectItem>
                                            <SelectItem value="Police">Police</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-700">Chief Complaint</Label>
                                <Input 
                                    className="h-10 bg-slate-50" 
                                    placeholder="Brief description of emergency..." 
                                    value={formData.chief_complaint}
                                    onChange={(e) => setFormData({...formData, chief_complaint: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold text-slate-800">MLC Case</Label>
                                            <p className="text-[10px] text-slate-500">Medico-Legal Case</p>
                                        </div>
                                        <Switch 
                                            checked={formData.is_medico_legal}
                                            onCheckedChange={(checked) => setFormData({...formData, is_medico_legal: checked})}
                                        />
                                    </div>
                                    
                                    {formData.is_medico_legal && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2">
                                            <Label className="text-xs font-semibold text-slate-700">Police Station</Label>
                                            <Input 
                                                className="h-10 bg-slate-50" 
                                                placeholder="Jurisdiction police station..." 
                                                value={formData.police_station}
                                                onChange={(e) => setFormData({...formData, police_station: e.target.value})}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold text-slate-800">Mediclaim / TPA</Label>
                                            <p className="text-[10px] text-slate-500">Insurance coverage</p>
                                        </div>
                                        <Switch 
                                            checked={formData.is_mediclaim}
                                            onCheckedChange={(checked) => setFormData({...formData, is_mediclaim: checked})}
                                        />
                                    </div>

                                    {formData.is_mediclaim && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2">
                                            <Label className="text-xs font-semibold text-slate-700">Insurance Details</Label>
                                            <Input 
                                                className="h-10 bg-slate-50" 
                                                placeholder="Provider, Policy No..." 
                                                value={formData.mediclaim_details}
                                                onChange={(e) => setFormData({...formData, mediclaim_details: e.target.value})}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {formData.mode_of_arrival === 'Ambulance' && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 pt-2">
                                    <Label className="text-xs font-semibold text-slate-700">Ambulance Details / Driver Info</Label>
                                    <Input 
                                        className="h-10 bg-slate-50" 
                                        placeholder="Driver name, vehicle no..." 
                                        value={formData.ambulance_driver}
                                        onChange={(e) => setFormData({...formData, ambulance_driver: e.target.value})}
                                    />
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="font-medium bg-white">
                        Cancel
                    </Button>
                    <Button type="submit" form="edit-emergency-form" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6">
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
