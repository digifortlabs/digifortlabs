"use client";

import React, { useState, useEffect } from 'react';
import {
    Package, Plus, Search, Filter, AlertTriangle,
    Calendar, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/config/api';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/formatters';

export default function PharmaStockBatches() {
    const router = useRouter();
    const [batches, setBatches] = useState<any[]>([]);
    const [medicines, setMedicines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Batch Form State
    const [formData, setFormData] = useState({
        medicine_id: '',
        batch_number: '',
        manufacturing_date: '',
        expiry_date: '',
        quantity_received: 0,
        supplier_name: 'Internal Production',
        supplier_invoice: '',
        purchase_price_per_unit: 0,
        selling_price_per_unit: 0
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Re-using the expiring endpoint without days limit for a quick batch view
            // In a real app we'd have a paginated /pharma/stock endpoint
            const [stockData, medsData] = await Promise.all([
                apiFetch(`pharma/stock/expiring?days=3650`), // grab 10 years of stock
                apiFetch(`pharma/medicines`)
            ]);

            if (stockData) setBatches(stockData);
            if (medsData) setMedicines(medsData);
        } catch (error) {
            console.error("Failed to fetch batches:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogBatch = async () => {
        try {
            await apiFetch('pharma/stock', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    medicine_id: parseInt(formData.medicine_id)
                })
            });
            setIsAddModalOpen(false);
            fetchData(); // Refresh list

            // Reset form
            setFormData({
                medicine_id: '', batch_number: '', manufacturing_date: '',
                expiry_date: '', quantity_received: 0, supplier_name: 'Internal Production',
                supplier_invoice: '', purchase_price_per_unit: 0, selling_price_per_unit: 0
            });
        } catch (error) {
            console.error("Failed to log batch:", error);
            alert("Error logging batch. Check inputs.");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <Button variant="ghost" onClick={() => router.push('/dashboard/pharma')} size="sm" className="rounded-full bg-slate-100 hover:bg-slate-200">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Package className="w-8 h-8 text-indigo-600" />
                        Production Batch Tracking
                    </h1>
                    <p className="text-slate-500 mt-1">Log newly manufactured batches, monitor quantities, and track expiries.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="Search batches..."
                        className="pl-9 bg-slate-50 border-transparent focus-visible:bg-white transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20">
                                <Plus className="w-4 h-4 mr-2" /> Log New Batch
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-indigo-600" /> Log Production Batch</DialogTitle>
                                <DialogDescription>
                                    Record a newly manufactured or received batch of medicine.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="medicine">Select Product *</Label>
                                    <select
                                        id="medicine"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={formData.medicine_id}
                                        onChange={(e) => {
                                            const medId = e.target.value;
                                            const med = medicines.find(m => m.medicine_id.toString() === medId);
                                            setFormData({
                                                ...formData,
                                                medicine_id: medId,
                                                purchase_price_per_unit: med ? med.purchase_price : 0,
                                                selling_price_per_unit: med ? med.selling_price : 0
                                            });
                                        }}
                                    >
                                        <option value="">-- Start typing or select --</option>
                                        {medicines.map(m => (
                                            <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name} ({m.category})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="batch">Batch Number *</Label>
                                    <Input id="batch" value={formData.batch_number} onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })} placeholder="e.g. BATCH-2025-01A" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="qty">Manufactured Quantity *</Label>
                                    <Input id="qty" type="number" value={formData.quantity_received} onChange={(e) => setFormData({ ...formData, quantity_received: parseInt(e.target.value) || 0 })} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mfg_date">Manufacturing Date</Label>
                                    <Input id="mfg_date" type="date" value={formData.manufacturing_date} onChange={(e) => setFormData({ ...formData, manufacturing_date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="exp_date">Expiry Date *</Label>
                                    <Input id="exp_date" type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="source">Source / Manufacturer Base</Label>
                                    <Input id="source" value={formData.supplier_name} onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })} />
                                </div>
                            </div>

                            <DialogFooter className="mt-4 border-t pt-4">
                                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleLogBatch} disabled={!formData.medicine_id || !formData.batch_number || !formData.expiry_date} className="bg-indigo-600 hover:bg-indigo-700">Commit Batch</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Batches List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[250px]">Product / Batch ID</TableHead>
                            <TableHead>Mfg Date</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead className="text-right">Original Qty</TableHead>
                            <TableHead className="text-right">Available Qty</TableHead>
                            <TableHead className="w-[100px] text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
                                </TableCell>
                            </TableRow>
                        ) : batches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                    <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                    <p>No manufacturing batches logged yet.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            batches.map((batch) => {
                                const expDate = new Date(batch.expiry_date);
                                const isExpiringSoon = (expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) < 90;
                                const isExpired = expDate < new Date();

                                return (
                                    <TableRow key={batch.stock_id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="font-semibold text-slate-900 line-clamp-1">{batch.medicine?.medicine_name || `Med ID: ${batch.medicine_id}`}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-1">B#: {batch.batch_number}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-slate-600 flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                {batch.manufacturing_date ? new Date(batch.manufacturing_date).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`text-sm font-medium flex items-center gap-2 ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-600'}`}>
                                                <Calendar className={`w-3 h-3 ${isExpired ? 'text-rose-400' : isExpiringSoon ? 'text-amber-400' : 'text-slate-400'}`} />
                                                {expDate.toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-slate-500">{batch.quantity_received}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="font-bold text-slate-900">{batch.quantity_remaining}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isExpired ? (
                                                <Badge variant="destructive" className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-none">Expired</Badge>
                                            ) : isExpiringSoon ? (
                                                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">Expiring</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none">Good</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
