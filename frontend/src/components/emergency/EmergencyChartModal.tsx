import React, { useState, useEffect } from 'react';
import { X, Activity, FileText, CheckCircle } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmergencyChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    emergencyId: number;
    patientDetails: any;
    onAdmitToIPD?: (patientId: number, emergencyId: number) => void;
}

export default function EmergencyChartModal({ isOpen, onClose, onSuccess, emergencyId, patientDetails, onAdmitToIPD }: EmergencyChartModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [chartData, setChartData] = useState({
        diagnosis: '',
        treatment: '',
        notes: '',
        status: 'Active' // Active, Discharged, Admitted, Transferred to OT
    });

    useEffect(() => {
        if (isOpen && patientDetails) {
            setChartData({
                diagnosis: patientDetails.diagnosis || '',
                treatment: patientDetails.treatment || '',
                notes: patientDetails.notes || '',
                status: patientDetails.status || 'Active'
            });
        }
    }, [isOpen, patientDetails]);

    if (!isOpen || !patientDetails) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await apiFetch(`emergency/${emergencyId}`, {
                method: 'PUT',
                body: JSON.stringify(chartData)
            });

            if (res) {
                onSuccess();
                onClose();
                
                // If Admitted, trigger the IPD workflow AFTER saving the chart
                if (chartData.status === 'Admitted' && onAdmitToIPD) {
                    onAdmitToIPD(patientDetails.patient_id, emergencyId);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update chart');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Emergency Chart</h2>
                        <p className="text-sm text-slate-500">{patientDetails.patient_name} • ER-{emergencyId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Clinical Info Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 space-y-1">
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Chief Complaint</span>
                            <p className="text-sm font-medium text-slate-800">{patientDetails.chief_complaint || 'N/A'}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100/50 space-y-1">
                            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Triage Level</span>
                            <p className="text-sm font-medium text-slate-800">{patientDetails.triage_level}</p>
                        </div>
                    </div>

                    {/* Vitals Summary */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-slate-400" />
                            Latest Vitals
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">BP (mmHg)</span>
                                <span className="text-sm font-semibold text-slate-700">{patientDetails.blood_pressure || '--'}</span>
                            </div>
                            <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pulse (bpm)</span>
                                <span className="text-sm font-semibold text-slate-700">{patientDetails.pulse_rate || '--'}</span>
                            </div>
                            <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Temp (°F)</span>
                                <span className="text-sm font-semibold text-slate-700">{patientDetails.temperature || '--'}</span>
                            </div>
                            <div className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Weight (kg)</span>
                                <span className="text-sm font-semibold text-slate-700">{patientDetails.weight || '--'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Doctor Charting Form */}
                    <form id="chart-form" onSubmit={handleSubmit} className="space-y-5 border-t border-slate-100 pt-6">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-slate-400" />
                                Provisional Diagnosis
                            </Label>
                            <Textarea 
                                placeholder="Enter diagnosis..."
                                value={chartData.diagnosis}
                                onChange={e => setChartData({...chartData, diagnosis: e.target.value})}
                                className="min-h-[80px] resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Treatment Plan</Label>
                            <Textarea 
                                placeholder="Enter treatment plan, STAT meds, etc..."
                                value={chartData.treatment}
                                onChange={e => setChartData({...chartData, treatment: e.target.value})}
                                className="min-h-[100px] resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Clinical Notes</Label>
                            <Textarea 
                                placeholder="Additional clinical notes..."
                                value={chartData.notes}
                                onChange={e => setChartData({...chartData, notes: e.target.value})}
                                className="min-h-[80px] resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-800 font-bold">Disposition / Outcome</Label>
                            <Select value={chartData.status} onValueChange={(val) => setChartData({...chartData, status: val})}>
                                <SelectTrigger className="w-full h-12 bg-white">
                                    <SelectValue placeholder="Select outcome" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Keep Active in ER</SelectItem>
                                    <SelectItem value="Discharged">Discharge Patient</SelectItem>
                                    <SelectItem value="Admitted">Admit to IPD (Ward/ICU)</SelectItem>
                                    <SelectItem value="Transferred to OT">Transfer to OT (Surgery)</SelectItem>
                                </SelectContent>
                            </Select>
                            {chartData.status === 'Admitted' && (
                                <p className="text-xs font-medium text-amber-600 mt-2 flex items-center gap-1.5">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Saving this will automatically launch the IPD Admission process.
                                </p>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 bg-white flex-shrink-0 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                    <Button 
                        type="submit" 
                        form="chart-form"
                        disabled={isLoading} 
                        className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm px-6"
                    >
                        {isLoading ? 'Saving...' : (chartData.status === 'Admitted' ? 'Continue to IPD Admission' : 'Sign & Save Chart')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
