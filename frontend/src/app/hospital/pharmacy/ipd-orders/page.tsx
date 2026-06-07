"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Pill, CheckCircle2, BedDouble, Plus, Loader2 } from "lucide-react";
import toast from 'react-hot-toast';
import { apiFetch } from '@/config/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

export default function IPDPharmacyOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Dispense state
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [dispenseForm, setDispenseForm] = useState({ quantity: '', unit_price: '' });
    const [dispensing, setDispensing] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('pharmacy/ipd-pending');
            setOrders(res || []);
        } catch (error: any) {
            toast.error(error.message || "Failed to load IPD orders");
        } finally {
            setLoading(false);
        }
    };

    const handleDispense = async () => {
        if (!selectedOrder) return;
        const q = parseInt(dispenseForm.quantity);
        const p = parseFloat(dispenseForm.unit_price);
        
        if (isNaN(q) || q <= 0 || isNaN(p) || p < 0) {
            toast.error("Valid quantity and unit price are required");
            return;
        }

        setDispensing(true);
        try {
            await apiFetch('pharmacy/ipd-dispense', {
                method: 'POST',
                body: JSON.stringify({
                    admission_id: selectedOrder.admission_id,
                    order_id: selectedOrder.order_id,
                    quantity: q,
                    unit_price: p,
                    total_price: q * p
                })
            });
            toast.success("Medicine dispensed to IPD Running Bill");
            setSelectedOrder(null);
            setDispenseForm({ quantity: '', unit_price: '' });
            loadOrders();
        } catch (error: any) {
            toast.error(error.message || "Failed to dispense");
        } finally {
            setDispensing(false);
        }
    };

    const filteredOrders = orders.filter(o => 
        o.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.mrd_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.medicine_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.bed_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">IPD Pharmacy Queue</h1>
                    <p className="text-sm text-slate-500 font-medium">Pending medication orders from bedside doctors</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input 
                        placeholder="Search patient, bed, or medicine..." 
                        className="w-full md:w-80 pl-9 border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button onClick={loadOrders} variant="outline" size="icon"><Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <Card className="border-dashed border-2 shadow-none bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">All Caught Up!</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm">There are currently no pending IPD medication orders from the wards.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredOrders.map(order => (
                        <Card key={order.order_id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3 flex flex-row items-start justify-between bg-slate-50/50 rounded-t-lg border-b border-slate-100">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none">IPD Order</Badge>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{order.ward_name}</span>
                                    </div>
                                    <CardTitle className="text-lg font-bold text-slate-900">{order.patient_name}</CardTitle>
                                    <CardDescription className="flex items-center gap-3 font-medium mt-1">
                                        <span className="font-mono text-xs">MRD: {order.mrd_number}</span>
                                        <span className="flex items-center gap-1 text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full"><BedDouble className="w-3 h-3" /> Bed {order.bed_number}</span>
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-400 font-medium mb-1">Prescribed</div>
                                    <div className="text-sm font-bold text-slate-700">{new Date(order.prescribed_date).toLocaleString()}</div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <Pill className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-base">{order.medicine_name}</h4>
                                                <p className="text-sm text-slate-600 font-medium mt-0.5">
                                                    {order.dosage} {order.dosage_unit} • {order.route} • {order.frequency}
                                                </p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold">Qty Requested: {order.qty || 'N/A'}</Badge>
                                                    <Badge variant="outline" className="border-slate-200 text-slate-600 font-bold">For {order.duration_days} days</Badge>
                                                </div>
                                                {order.instructions && (
                                                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mt-2 border border-amber-100 italic">
                                                        <span className="font-bold not-italic">Note:</span> {order.instructions}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        className="bg-indigo-600 hover:bg-indigo-700 shadow flex-shrink-0"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setDispenseForm({ quantity: order.qty || '1', unit_price: '' });
                                        }}
                                    >
                                        Dispense <Plus className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Dispense Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Dispense to Ward</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4 py-2">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
                                <div className="text-xs font-bold text-slate-500 uppercase">Patient</div>
                                <div className="font-bold text-slate-900">{selectedOrder.patient_name} (Bed {selectedOrder.bed_number})</div>
                                <div className="text-xs font-bold text-slate-500 uppercase mt-2">Medicine</div>
                                <div className="font-bold text-blue-700">{selectedOrder.medicine_name}</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Quantity to Dispense</label>
                                    <Input 
                                        type="number" 
                                        value={dispenseForm.quantity} 
                                        onChange={e => setDispenseForm({...dispenseForm, quantity: e.target.value})}
                                        className="text-lg font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Unit Price (₹)</label>
                                    <Input 
                                        type="number" 
                                        value={dispenseForm.unit_price} 
                                        onChange={e => setDispenseForm({...dispenseForm, unit_price: e.target.value})}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm font-medium border border-blue-100 flex justify-between items-center mt-2">
                                <span>Total Cost Added to IPD Bill:</span>
                                <span className="font-black text-lg">
                                    ₹{((parseFloat(dispenseForm.quantity || '0') * parseFloat(dispenseForm.unit_price || '0')) || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
                        <Button 
                            onClick={handleDispense} 
                            disabled={dispensing || !dispenseForm.quantity || !dispenseForm.unit_price}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {dispensing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirm Dispense
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
