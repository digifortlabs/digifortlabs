"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Building2, Stethoscope, Tags, Receipt, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export default function HospitalOnboarding() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hospitalId, setHospitalId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        legal_name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        
        enabled_modules: ['core'] as string[],
        
        patient_registration_fee: 500.0,
        nursing_base_charge: 150.0,
        ot_base_charge: 15000.0,
        
        gst_number: '',
        billing_header: '',
        billing_footer: ''
    });

    useEffect(() => {
        // Fetch current hospital details to pre-fill
        const loadInitialData = async () => {
            try {
                const user = await apiFetch('/users/me');
                if (user && user.hospital_id) {
                    setHospitalId(user.hospital_id);
                    if (user.hospital) {
                        setFormData(prev => ({
                            ...prev,
                            legal_name: user.hospital.legal_name || '',
                            address: user.hospital.address || '',
                            city: user.hospital.city || '',
                            state: user.hospital.state || '',
                            pincode: user.hospital.pincode || '',
                            phone: user.hospital.phone || '',
                            enabled_modules: user.hospital.enabled_modules?.length ? user.hospital.enabled_modules : ['core'],
                        }));
                    }
                }
            } catch (err) {
                console.error("Failed to load user info", err);
            }
        };
        loadInitialData();
    }, []);

    const toggleModule = (moduleKey: string) => {
        setFormData(prev => {
            const exists = prev.enabled_modules.includes(moduleKey);
            if (exists) {
                return { ...prev, enabled_modules: prev.enabled_modules.filter(m => m !== moduleKey) };
            } else {
                return { ...prev, enabled_modules: [...prev.enabled_modules, moduleKey] };
            }
        });
    };

    const handleSkipPricing = () => {
        setFormData(prev => ({
            ...prev,
            patient_registration_fee: 500.0,
            nursing_base_charge: 150.0,
            ot_base_charge: 15000.0
        }));
        setStep(4);
    };

    const handleComplete = async () => {
        if (!hospitalId) {
            toast.error("Hospital ID not found.");
            return;
        }
        setLoading(true);
        try {
            await apiFetch(`/hospitals/${hospitalId}/onboard`, {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            toast.success("Setup complete! Welcome to Digifort Labs.");
            setTimeout(() => {
                window.location.href = '/hospital';
            }, 1500);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to complete onboarding.");
            setLoading(false);
        }
    };

    const modulesList = [
        { key: 'core', name: 'Core HMS', desc: 'Patient management, appointments, profiles.', icon: <Activity className="w-5 h-5" /> },
        { key: 'ipd', name: 'Inpatient (IPD)', desc: 'Admissions, wards, bed management, OT.', icon: <Building2 className="w-5 h-5" /> },
        { key: 'pharmacy', name: 'Pharmacy POS', desc: 'Medicines, batches, direct sales.', icon: <Stethoscope className="w-5 h-5" /> },
        { key: 'inventory', name: 'Inventory', desc: 'Medical supplies, stock management, GRN.', icon: <Tags className="w-5 h-5" /> },
        { key: 'dental', name: 'Dental Clinic', desc: 'Odontograms, phase-wise treatments.', icon: <ShieldCheck className="w-5 h-5" /> },
        { key: 'accounting', name: 'Accounting', desc: 'Invoices, taxation, revenue tracking.', icon: <Receipt className="w-5 h-5" /> }
    ];

    return (
        <div className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center overflow-y-auto pt-10 pb-10">
            <div className="max-w-3xl w-full px-4">
                <div className="mb-8 text-center animate-in slide-in-from-bottom-4 duration-500">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Hospital Setup</h1>
                    <p className="text-slate-500 mt-2">Let's get your hospital configured in 4 easy steps.</p>
                </div>

                <div className="flex items-center justify-center gap-2 mb-8 animate-in fade-in duration-700">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step === s ? 'bg-indigo-600 text-white shadow-md' : step > s ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                            </div>
                            {s < 4 && <div className={`w-16 h-1 transition-colors ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
                        </div>
                    ))}
                </div>

                <Card className="shadow-xl border-slate-200/60 animate-in zoom-in-95 duration-500">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl pb-6">
                        <CardTitle className="text-xl flex items-center gap-2">
                            {step === 1 && <><Building2 className="text-indigo-600" /> Basic Details</>}
                            {step === 2 && <><Stethoscope className="text-indigo-600" /> Department Modules</>}
                            {step === 3 && <><Tags className="text-indigo-600" /> Pricing Configuration</>}
                            {step === 4 && <><Receipt className="text-indigo-600" /> Billing & Invoicing</>}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && "Verify your hospital's legal and contact information."}
                            {step === 2 && "Select the software modules your hospital will use."}
                            {step === 3 && "Set your baseline default prices. You can always override these during billing."}
                            {step === 4 && "Configure your taxation and invoice aesthetics."}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-6">
                        {step === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Legal Hospital Name <span className="text-red-500">*</span></Label>
                                    <Input value={formData.legal_name} onChange={e => setFormData({...formData, legal_name: e.target.value})} placeholder="e.g. City Care Hospital" className="mt-1" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label>Address</Label>
                                        <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="123 Health Ave" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>City</Label>
                                        <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="New Delhi" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>State</Label>
                                        <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="Delhi" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>Pincode</Label>
                                        <Input value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} placeholder="110001" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>Primary Phone</Label>
                                        <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 9876543210" className="mt-1" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {modulesList.map(mod => {
                                    const isActive = formData.enabled_modules.includes(mod.key);
                                    // Core and Accounting should probably be locked, but we'll let them toggle for flexibility
                                    const isLocked = mod.key === 'core' || mod.key === 'accounting';
                                    
                                    return (
                                        <div 
                                            key={mod.key} 
                                            onClick={() => !isLocked && toggleModule(mod.key)}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isActive ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-300'} ${isLocked ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {mod.icon}
                                                </div>
                                                {isActive && <CheckCircle2 className="text-indigo-600 w-5 h-5" />}
                                            </div>
                                            <h3 className="font-bold text-slate-900">{mod.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1">{mod.desc}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm">
                                    <p className="font-bold mb-1">Customizable Defaults</p>
                                    <p>These values will be automatically inserted into patient invoices when required. You can always change the price of these items directly on the billing screen later.</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label className="font-bold">First-Time Registration Fee (₹)</Label>
                                        <p className="text-xs text-slate-500 mb-2">Automatically applied to a patient's very first bill.</p>
                                        <Input type="number" min="0" value={formData.patient_registration_fee} onChange={e => setFormData({...formData, patient_registration_fee: Number(e.target.value)})} className="h-12 text-lg font-bold" />
                                    </div>
                                    
                                    <div>
                                        <Label className="font-bold">Nursing Administration Charge (₹)</Label>
                                        <p className="text-xs text-slate-500 mb-2">Default charge per medication administration in IPD.</p>
                                        <Input type="number" min="0" value={formData.nursing_base_charge} onChange={e => setFormData({...formData, nursing_base_charge: Number(e.target.value)})} className="h-12 text-lg font-bold" />
                                    </div>
                                    
                                    <div>
                                        <Label className="font-bold">Operation Theatre Base Charge (₹)</Label>
                                        <p className="text-xs text-slate-500 mb-2">Applied when an IPD admission requires surgery.</p>
                                        <Input type="number" min="0" value={formData.ot_base_charge} onChange={e => setFormData({...formData, ot_base_charge: Number(e.target.value)})} className="h-12 text-lg font-bold" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <Label className="font-bold">GST Number (Optional)</Label>
                                    <p className="text-xs text-slate-500 mb-2">If left blank, the system will not calculate or display GST on invoices.</p>
                                    <Input value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value})} placeholder="e.g. 22AAAAA0000A1Z5" className="uppercase" />
                                </div>
                                
                                <div>
                                    <Label className="font-bold">Invoice Header Text</Label>
                                    <p className="text-xs text-slate-500 mb-2">Text printed at the very top of PDF invoices.</p>
                                    <Input value={formData.billing_header} onChange={e => setFormData({...formData, billing_header: e.target.value})} placeholder="e.g. Health is Wealth" />
                                </div>
                                
                                <div>
                                    <Label className="font-bold">Invoice Footer Text</Label>
                                    <p className="text-xs text-slate-500 mb-2">Terms and conditions printed at the bottom.</p>
                                    <Input value={formData.billing_footer} onChange={e => setFormData({...formData, billing_footer: e.target.value})} placeholder="e.g. Subject to local jurisdiction." />
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
                            <Button 
                                variant="outline" 
                                onClick={() => setStep(step - 1)} 
                                disabled={step === 1 || loading}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            
                            <div className="flex gap-3">
                                {step === 3 && (
                                    <Button 
                                        variant="ghost" 
                                        className="text-slate-500 hover:text-slate-800"
                                        onClick={handleSkipPricing}
                                        disabled={loading}
                                    >
                                        Skip Pricing Setup
                                    </Button>
                                )}
                                
                                {step < 4 ? (
                                    <Button 
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white" 
                                        onClick={() => {
                                            if (step === 1 && !formData.legal_name) {
                                                toast.error("Legal Name is required");
                                                return;
                                            }
                                            setStep(step + 1);
                                        }}
                                        disabled={loading}
                                    >
                                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button 
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" 
                                        onClick={handleComplete}
                                        disabled={loading}
                                    >
                                        {loading ? "Saving..." : "Launch Hospital"} <CheckCircle2 className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
