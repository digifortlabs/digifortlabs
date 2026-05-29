import React, { useState, useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface UpdateVitalsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    emergencyId: number;
    initialVitals?: {
        temperature?: number | null;
        blood_pressure?: string | null;
        pulse_rate?: number | null;
        weight?: number | null;
    } | null;
}

export default function UpdateVitalsModal({ isOpen, onClose, onSuccess, emergencyId, initialVitals }: UpdateVitalsModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [vitals, setVitals] = useState({
        temperature: '',
        blood_pressure: '',
        pulse_rate: '',
        weight: ''
    });

    useEffect(() => {
        if (isOpen && initialVitals) {
            setVitals({
                temperature: initialVitals.temperature?.toString() || '',
                blood_pressure: initialVitals.blood_pressure || '',
                pulse_rate: initialVitals.pulse_rate?.toString() || '',
                weight: initialVitals.weight?.toString() || ''
            });
        } else if (!isOpen) {
            setVitals({ temperature: '', blood_pressure: '', pulse_rate: '', weight: '' });
            setError('');
        }
    }, [isOpen, initialVitals]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const payload = {
                temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
                blood_pressure: vitals.blood_pressure || null,
                pulse_rate: vitals.pulse_rate ? parseInt(vitals.pulse_rate) : null,
                weight: vitals.weight ? parseFloat(vitals.weight) : null
            };

            const res = await apiFetch(`emergency/${emergencyId}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (res) {
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update vitals');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Update Vitals</h2>
                            <p className="text-xs text-slate-500">Record patient triage vitals</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Blood Pressure</Label>
                            <div className="relative">
                                <Input 
                                    placeholder="120/80" 
                                    value={vitals.blood_pressure}
                                    onChange={e => setVitals({...vitals, blood_pressure: e.target.value})}
                                    className="pr-12"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">mmHg</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Pulse Rate</Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    placeholder="80" 
                                    value={vitals.pulse_rate}
                                    onChange={e => setVitals({...vitals, pulse_rate: e.target.value})}
                                    className="pr-12"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">bpm</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Temperature</Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    step="0.1"
                                    placeholder="98.6" 
                                    value={vitals.temperature}
                                    onChange={e => setVitals({...vitals, temperature: e.target.value})}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">°F</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Weight</Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    step="0.1"
                                    placeholder="65.5" 
                                    value={vitals.weight}
                                    onChange={e => setVitals({...vitals, weight: e.target.value})}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">kg</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                        <Button type="submit" disabled={isLoading} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                            {isLoading ? 'Saving...' : 'Save Vitals'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
