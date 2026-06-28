import React, { useState, useEffect } from 'react';
import { X, Activity, FileText, CheckCircle, AlertOctagon, ListChecks, Stethoscope } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

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
    const [activeTab, setActiveTab] = useState('assessment');
    
    const [chartData, setChartData] = useState({
        diagnosis: '',
        treatment: '',
        notes: '',
        status: 'Active',
        triage_level: 'Yellow',
        blood_pressure: '',
        pulse_rate: '',
        temperature: '',
        weight: '',
        
        // New Extended Fields
        hpi: '',
        allergies: 'None Known',
        pastHistory: '',
        abcde: {
            airway: false,
            breathing: false,
            circulation: false,
            disability: false,
            exposure: false
        },
        statOrders: ''
    });

    useEffect(() => {
        if (isOpen && patientDetails) {
            setChartData({
                diagnosis: patientDetails.diagnosis || '',
                treatment: patientDetails.treatment || '',
                notes: patientDetails.notes || '',
                status: patientDetails.status || 'Active',
                triage_level: patientDetails.triage_level || 'Yellow',
                blood_pressure: patientDetails.blood_pressure || '',
                pulse_rate: patientDetails.pulse_rate || '',
                temperature: patientDetails.temperature || '',
                weight: patientDetails.weight || '',
                hpi: patientDetails.hpi || '',
                allergies: patientDetails.allergies || 'None Known',
                pastHistory: patientDetails.past_history || '',
                abcde: patientDetails.abcde_assessment || { airway: false, breathing: false, circulation: false, disability: false, exposure: false },
                statOrders: patientDetails.stat_orders || ''
            });
            setActiveTab('assessment');
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
                body: JSON.stringify({
                    diagnosis: chartData.diagnosis,
                    treatment: chartData.treatment,
                    notes: chartData.notes,
                    status: chartData.status,
                    triage_level: chartData.triage_level,
                    blood_pressure: chartData.blood_pressure,
                    pulse_rate: chartData.pulse_rate ? parseInt(chartData.pulse_rate) : null,
                    temperature: chartData.temperature ? parseFloat(chartData.temperature) : null,
                    weight: chartData.weight ? parseFloat(chartData.weight) : null,
                    hpi: chartData.hpi,
                    allergies: chartData.allergies,
                    past_history: chartData.pastHistory,
                    abcde_assessment: chartData.abcde,
                    stat_orders: chartData.statOrders
                })
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
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Vitals & Triage Header */}
                <div className="p-4 px-6 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-500 uppercase">Triage Level</span>
                            <Select value={chartData.triage_level} onValueChange={(val) => setChartData({...chartData, triage_level: val})}>
                                <SelectTrigger className={`h-7 px-2 py-0 border-0 rounded-md text-xs font-bold w-auto gap-2 focus:ring-0 ${
                                    chartData.triage_level === 'Red' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                    chartData.triage_level === 'Orange' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                                    chartData.triage_level === 'Yellow' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                    chartData.triage_level === 'Green' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                    'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Red">Red (Resuscitation)</SelectItem>
                                    <SelectItem value="Orange">Orange (Emergent)</SelectItem>
                                    <SelectItem value="Yellow">Yellow (Urgent)</SelectItem>
                                    <SelectItem value="Green">Green (Less Urgent)</SelectItem>
                                    <SelectItem value="Blue">Blue (Non-Urgent)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-xs font-medium text-slate-600">
                            <strong>Complaint:</strong> {patientDetails.chief_complaint || 'N/A'}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        <div className="p-2 border border-slate-100 rounded-md bg-slate-50 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">BP (mmHg)</span>
                            <Input 
                                value={chartData.blood_pressure} 
                                onChange={e => setChartData({...chartData, blood_pressure: e.target.value})}
                                className="h-7 px-1 text-center font-semibold text-sm bg-white border-slate-200"
                                placeholder="120/80"
                            />
                        </div>
                        <div className="p-2 border border-slate-100 rounded-md bg-slate-50 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">HR (bpm)</span>
                            <Input 
                                type="number"
                                value={chartData.pulse_rate} 
                                onChange={e => setChartData({...chartData, pulse_rate: e.target.value})}
                                className="h-7 px-1 text-center font-semibold text-sm bg-white border-slate-200"
                                placeholder="72"
                            />
                        </div>
                        <div className="p-2 border border-slate-100 rounded-md bg-slate-50 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">TEMP (°F)</span>
                            <Input 
                                type="number" step="0.1"
                                value={chartData.temperature} 
                                onChange={e => setChartData({...chartData, temperature: e.target.value})}
                                className="h-7 px-1 text-center font-semibold text-sm bg-white border-slate-200"
                                placeholder="98.6"
                            />
                        </div>
                        <div className="p-2 border border-slate-100 rounded-md bg-slate-50 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">WT (kg)</span>
                            <Input 
                                type="number" step="0.1"
                                value={chartData.weight} 
                                onChange={e => setChartData({...chartData, weight: e.target.value})}
                                className="h-7 px-1 text-center font-semibold text-sm bg-white border-slate-200"
                                placeholder="70"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                        <div className="px-6 pt-4 border-b border-slate-100 bg-white">
                            <TabsList className="grid w-full grid-cols-3 bg-slate-100 rounded-md p-1 h-10">
                                <TabsTrigger value="context" className="rounded-sm text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <AlertOctagon className="w-3.5 h-3.5 mr-2" /> Context
                                </TabsTrigger>
                                <TabsTrigger value="assessment" className="rounded-sm text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <Stethoscope className="w-3.5 h-3.5 mr-2" /> Assessment
                                </TabsTrigger>
                                <TabsTrigger value="orders" className="rounded-sm text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <ListChecks className="w-3.5 h-3.5 mr-2" /> Orders & Plan
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <form id="chart-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                            {error && (
                                <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">
                                    {error}
                                </div>
                            )}

                            <TabsContent value="context" className="space-y-6 mt-0">
                                <div className="space-y-2">
                                    <Label className="text-red-600 font-bold flex items-center gap-2">Allergies & Alerts</Label>
                                    <Textarea 
                                        placeholder="E.g., Penicillin, Peanuts..."
                                        value={chartData.allergies}
                                        onChange={e => setChartData({...chartData, allergies: e.target.value})}
                                        className="min-h-[80px] border-red-100 focus-visible:ring-red-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Past Medical History</Label>
                                    <Textarea 
                                        placeholder="Major conditions, surgeries, current medications..."
                                        value={chartData.pastHistory}
                                        onChange={e => setChartData({...chartData, pastHistory: e.target.value})}
                                        className="min-h-[120px]"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="assessment" className="space-y-6 mt-0">
                                <div className="space-y-3 bg-white p-4 border border-slate-200 rounded-md shadow-sm">
                                    <Label className="font-bold text-slate-800 border-b pb-2 mb-2 block">Primary Assessment (ABCDE)</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="airway" checked={chartData.abcde.airway} onCheckedChange={(c) => setChartData({...chartData, abcde: {...chartData.abcde, airway: !!c}})} />
                                            <label htmlFor="airway" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Airway Patent</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="breathing" checked={chartData.abcde.breathing} onCheckedChange={(c) => setChartData({...chartData, abcde: {...chartData.abcde, breathing: !!c}})} />
                                            <label htmlFor="breathing" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Breathing Intact</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="circulation" checked={chartData.abcde.circulation} onCheckedChange={(c) => setChartData({...chartData, abcde: {...chartData.abcde, circulation: !!c}})} />
                                            <label htmlFor="circulation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Circulation Stable</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="disability" checked={chartData.abcde.disability} onCheckedChange={(c) => setChartData({...chartData, abcde: {...chartData.abcde, disability: !!c}})} />
                                            <label htmlFor="disability" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Disability (Neuro Check)</label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="exposure" checked={chartData.abcde.exposure} onCheckedChange={(c) => setChartData({...chartData, abcde: {...chartData.abcde, exposure: !!c}})} />
                                            <label htmlFor="exposure" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Exposure / Environment</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>History of Present Illness (HPI)</Label>
                                    <Textarea 
                                        placeholder="Detailed narrative of the emergency..."
                                        value={chartData.hpi}
                                        onChange={e => setChartData({...chartData, hpi: e.target.value})}
                                        className="min-h-[150px]"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="orders" className="space-y-6 mt-0">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-slate-400" />
                                        Provisional Diagnosis
                                    </Label>
                                    <Textarea 
                                        placeholder="Enter diagnosis..."
                                        value={chartData.diagnosis}
                                        onChange={e => setChartData({...chartData, diagnosis: e.target.value})}
                                        className="min-h-[60px]"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>STAT Orders & Investigations</Label>
                                    <Textarea 
                                        placeholder="Urgent labs, X-Rays, CT Scans..."
                                        value={chartData.statOrders}
                                        onChange={e => setChartData({...chartData, statOrders: e.target.value})}
                                        className="min-h-[60px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Treatment Plan / Meds Given</Label>
                                    <Textarea 
                                        placeholder="Enter treatment plan, meds administered in ER..."
                                        value={chartData.treatment}
                                        onChange={e => setChartData({...chartData, treatment: e.target.value})}
                                        className="min-h-[80px]"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Additional Clinical Notes</Label>
                                    <Textarea 
                                        placeholder="Any other observations..."
                                        value={chartData.notes}
                                        onChange={e => setChartData({...chartData, notes: e.target.value})}
                                        className="min-h-[60px]"
                                    />
                                </div>
                            </TabsContent>
                        </form>
                    </Tabs>
                </div>

                <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex-shrink-0 flex items-center justify-between gap-4">
                    <div className="flex-1 max-w-[200px]">
                        <Label className="text-xs text-slate-500 mb-1 block">Disposition</Label>
                        <Select value={chartData.status} onValueChange={(val) => setChartData({...chartData, status: val})}>
                            <SelectTrigger className="w-full h-9 bg-white rounded-md text-xs font-semibold">
                                <SelectValue placeholder="Select outcome" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Active">Keep Active in ER</SelectItem>
                                <SelectItem value="Discharged">Discharge Patient</SelectItem>
                                <SelectItem value="Admitted">Admit to IPD</SelectItem>
                                <SelectItem value="Transferred to OT">Transfer to OT</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-md h-9 text-xs">Cancel</Button>
                        <Button 
                            type="submit" 
                            form="chart-form"
                            disabled={isLoading} 
                            className="rounded-md h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-6"
                        >
                            {isLoading ? 'Saving...' : (chartData.status === 'Admitted' ? 'Continue to IPD' : 'Sign & Save Chart')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
