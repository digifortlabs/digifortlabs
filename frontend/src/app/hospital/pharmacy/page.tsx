"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pill, Search, ClipboardList, CheckCircle, Package } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

function ExpiryAlertWidget() {
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        apiFetch('/pharmacy/inventory/expiring?days=90').then(data => {
            if (data && data.length > 0) setAlerts(data);
        }).catch(console.error);
    }, []);

    if (alerts.length === 0) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5" /> Expiring Soon ({alerts.length})
            </h3>
            <div className="space-y-1 max-h-32 overflow-y-auto text-sm text-red-900">
                {alerts.map((a: any) => (
                    <div key={a.batch_id} className="flex justify-between border-b border-red-100 pb-1">
                        <span><span className="font-semibold">{a.item_name}</span> (Batch: {a.batch_number})</span>
                        <span>Exp: {format(new Date(a.expiry_date), 'MMM yyyy')} | Qty: {a.current_stock}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function PharmacyDashboard() {
    const [pendingRx, setPendingRx] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Dispense Modal State
    const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
    const [selectedRx, setSelectedRx] = useState<any>(null);
    const [dispenseForm, setDispenseForm] = useState({
        quantity: 1,
        unit_price: 0,
        payment_method: 'Cash'
    });

    const fetchPendingRx = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/pharmacy/pending-prescriptions');
            setPendingRx(data || []);
        } catch (error) {
            console.error("Failed to fetch prescriptions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRx();
    }, []);

    const handleOpenDispenseModal = async (rx: any) => {
        setSelectedRx(rx);
        setDispenseForm({ quantity: 1, unit_price: 0, payment_method: 'Cash' });
        
        // Auto-fetch price from inventory
        try {
            const items = await apiFetch(`/pharmacy/medicines/search?query=${encodeURIComponent(rx.medicine_name)}`);
            if (items && items.length > 0) {
                // Exact or closest match
                const match = items.find((i: any) => i.name.toLowerCase() === rx.medicine_name.toLowerCase()) || items[0];
                setDispenseForm({ ...dispenseForm, unit_price: match.price });
            }
        } catch (e) {
            console.error(e);
        }
        
        setIsDispenseModalOpen(true);
    };

    const handleDispense = async () => {
        if (!selectedRx) return;
        try {
            const total = dispenseForm.quantity * dispenseForm.unit_price;
            await apiFetch('/pharmacy/dispense', {
                method: 'POST',
                body: JSON.stringify({
                    prescription_id: selectedRx.prescription_id,
                    quantity: dispenseForm.quantity,
                    unit_price: dispenseForm.unit_price,
                    total_price: total,
                    payment_method: dispenseForm.payment_method
                })
            });
            toast.success("Prescription dispensed successfully.");
            setIsDispenseModalOpen(false);
            fetchPendingRx();
        } catch (error: any) {
            console.error("Failed to dispense:", error);
            toast.error(error.message || "Failed to dispense medication.");
        }
    };

    const filteredRx = pendingRx.filter(rx => 
        rx.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        rx.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Pill className="w-7 h-7 text-emerald-600" />
                        Pharmacy Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">Manage e-prescriptions and dispense medications</p>
                </div>
            </div>

            {/* Expiry Alerts */}
            <ExpiryAlertWidget />


            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search by Patient Name or Medicine..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-50 border-slate-200"
                    />
                </div>
            </div>

            {/* Prescriptions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                        Loading prescriptions...
                    </div>
                ) : filteredRx.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
                        <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-700">No Pending Prescriptions</h3>
                        <p className="text-slate-500">All active e-prescriptions have been processed.</p>
                    </div>
                ) : (
                    filteredRx.map((rx) => (
                        <Card key={rx.prescription_id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                            <div className="bg-slate-50 p-4 border-b border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{rx.patient_name}</h3>
                                        <p className="text-xs text-slate-500">MRD: {rx.mrd_number}</p>
                                    </div>
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Pending</Badge>
                                </div>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="bg-emerald-50 text-emerald-900 p-3 rounded-lg border border-emerald-100">
                                    <div className="font-bold flex items-center gap-2">
                                        <Package className="w-4 h-4 text-emerald-600" /> {rx.medicine_name}
                                    </div>
                                    <div className="text-sm mt-1 flex justify-between">
                                        <span><span className="text-emerald-700 opacity-70">Dosage:</span> {rx.dosage}</span>
                                        <span><span className="text-emerald-700 opacity-70">Freq:</span> {rx.frequency}</span>
                                    </div>
                                    <div className="text-sm flex justify-between mt-1">
                                        <span><span className="text-emerald-700 opacity-70">Duration:</span> {rx.duration}</span>
                                    </div>
                                </div>
                                
                                {rx.instructions && (
                                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                                        <span className="font-semibold text-slate-700">Instructions:</span> {rx.instructions}
                                    </div>
                                )}

                                <Button 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-200" 
                                    onClick={() => handleOpenDispenseModal(rx)}
                                >
                                    Dispense & Bill
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Dispense Modal */}
            <Dialog open={isDispenseModalOpen} onOpenChange={setIsDispenseModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" /> Dispense Medication
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedRx && (
                        <div className="space-y-4 py-4">
                            <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100 mb-2">
                                <p><span className="text-slate-500 font-semibold">Patient:</span> {selectedRx.patient_name}</p>
                                <p><span className="text-slate-500 font-semibold">Medicine:</span> <span className="font-bold text-emerald-700">{selectedRx.medicine_name}</span></p>
                                <p><span className="text-slate-500 font-semibold">Regimen:</span> {selectedRx.dosage} ({selectedRx.frequency}) for {selectedRx.duration}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Quantity to Dispense</Label>
                                    <Input 
                                        type="number" 
                                        min="1"
                                        value={dispenseForm.quantity} 
                                        onChange={e => setDispenseForm({...dispenseForm, quantity: parseInt(e.target.value) || 1})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit Price (₹)</Label>
                                    <Input 
                                        type="number" 
                                        value={dispenseForm.unit_price} 
                                        onChange={e => setDispenseForm({...dispenseForm, unit_price: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                            </div>
                            
                            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex justify-between items-center">
                                <span className="font-semibold text-indigo-900">Total Bill Amount:</span>
                                <span className="text-xl font-black text-indigo-700">₹{(dispenseForm.quantity * dispenseForm.unit_price).toFixed(2)}</span>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <select 
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white"
                                    value={dispenseForm.payment_method}
                                    onChange={e => setDispenseForm({...dispenseForm, payment_method: e.target.value})}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Mediclaim">Added to Mediclaim / IPD Bill</option>
                                </select>
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDispenseModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleDispense} className="bg-emerald-600 hover:bg-emerald-700">Confirm & Dispense</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
