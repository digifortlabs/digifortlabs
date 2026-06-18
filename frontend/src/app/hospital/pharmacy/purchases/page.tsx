"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PackagePlus, Plus, Search, Trash2 } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { toast } from 'sonner';

interface Supplier {
    supplier_id: number;
    name: string;
}

interface InventoryItem {
    id: number;
    name: string;
}

interface PurchaseItemForm {
    tempId: string;
    item_id: number;
    name: string;
    batch_number: string;
    mfg_date: string;
    expiry_date: string;
    quantity: number;
    free_quantity: number;
    purchase_price: number;
    mrp: number;
    tax_percentage: number;
    total_price: number;
}

export default function PurchasesPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    
    // Invoice Data
    const [supplierId, setSupplierId] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    
    // Items
    const [items, setItems] = useState<PurchaseItemForm[]>([]);
    
    // Search
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        apiFetch('/pharmacy/inventory/suppliers').then(data => setSuppliers(data || []));
    }, []);

    useEffect(() => {
        const delay = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                const results = await apiFetch(`/pharmacy/medicines/search?query=${encodeURIComponent(searchTerm)}`);
                setSearchResults(results || []);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    const addItem = (inv: InventoryItem) => {
        setItems([...items, {
            tempId: Math.random().toString(),
            item_id: inv.id,
            name: inv.name,
            batch_number: '',
            mfg_date: '',
            expiry_date: '',
            quantity: 1,
            free_quantity: 0,
            purchase_price: 0,
            mrp: 0,
            tax_percentage: 0,
            total_price: 0
        }]);
        setSearchTerm('');
        setSearchResults([]);
        toast.success(`Added ${inv.name}`);
    };

    const updateItem = (tempId: string, field: keyof PurchaseItemForm, value: any) => {
        setItems(items.map(item => {
            if (item.tempId === tempId) {
                const updated = { ...item, [field]: value };
                // Auto calculate total
                if (['quantity', 'purchase_price', 'tax_percentage'].includes(field)) {
                    const sub = updated.quantity * updated.purchase_price;
                    updated.total_price = sub + (sub * (updated.tax_percentage / 100));
                }
                return updated;
            }
            return item;
        }));
    };

    const removeItem = (tempId: string) => {
        setItems(items.filter(i => i.tempId !== tempId));
    };

    const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.purchase_price), 0);
    const taxAmount = items.reduce((acc, curr) => acc + ((curr.quantity * curr.purchase_price) * (curr.tax_percentage / 100)), 0);
    const totalAmount = subtotal + taxAmount;

    const handleSubmit = async () => {
        if (!supplierId || !invoiceNumber) return toast.error("Supplier and Invoice Number required");
        if (items.length === 0) return toast.error("Add at least one item");
        
        // Validation
        for (const item of items) {
            if (!item.batch_number) return toast.error(`Batch number required for ${item.name}`);
            if (!item.expiry_date) return toast.error(`Expiry date required for ${item.name}`);
        }

        setIsSubmitting(true);
        try {
            await apiFetch('/pharmacy/inventory/purchases', {
                method: 'POST',
                body: JSON.stringify({
                    supplier_id: parseInt(supplierId),
                    invoice_number: invoiceNumber,
                    invoice_date: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
                    subtotal,
                    tax_amount: taxAmount,
                    discount: 0,
                    total_amount: totalAmount,
                    items: items.map(i => ({
                        item_id: i.item_id,
                        batch_number: i.batch_number,
                        mfg_date: i.mfg_date ? new Date(i.mfg_date).toISOString() : null,
                        expiry_date: new Date(i.expiry_date).toISOString(),
                        quantity: i.quantity,
                        free_quantity: i.free_quantity,
                        purchase_price: i.purchase_price,
                        mrp: i.mrp,
                        tax_percentage: i.tax_percentage,
                        total_price: i.total_price
                    }))
                })
            });
            
            toast.success("Purchase recorded successfully!");
            setSupplierId('');
            setInvoiceNumber('');
            setInvoiceDate('');
            setItems([]);
        } catch (error: any) {
            toast.error(error.message || "Failed to record purchase");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <PackagePlus className="w-7 h-7 text-indigo-600" />
                    Purchase & Inward Entry
                </h1>
                <p className="text-slate-500 mt-1">Record supplier invoices and update stock batches</p>
            </div>

            <Card>
                <CardHeader className="bg-slate-50 border-b pb-4">
                    <CardTitle className="text-lg">Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <Label>Supplier *</Label>
                        <select 
                            className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white"
                            value={supplierId}
                            onChange={e => setSupplierId(e.target.value)}
                        >
                            <option value="">-- Select Supplier --</option>
                            {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Invoice Number *</Label>
                        <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="e.g. INV-2024-001" />
                    </div>
                    <div>
                        <Label>Invoice Date</Label>
                        <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-bold text-slate-700">Search Catalog</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    placeholder="Search medicine..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {searchResults.map(res => (
                                    <div key={res.id} className="flex justify-between items-center p-2 bg-slate-50 border rounded-md">
                                        <span className="text-sm font-semibold truncate w-32">{res.name}</span>
                                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => addItem(res)}>
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-3">
                    <Card>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-600 bg-slate-100 border-b">
                                    <tr>
                                        <th className="px-4 py-3">Medicine</th>
                                        <th className="px-4 py-3">Batch & Expiry</th>
                                        <th className="px-4 py-3 w-24">Qty</th>
                                        <th className="px-4 py-3">Pricing (Per Unit)</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                                Search and add medicines from the catalog to build the invoice.
                                            </td>
                                        </tr>
                                    ) : items.map((item, idx) => (
                                        <tr key={item.tempId} className="border-b bg-white">
                                            <td className="px-4 py-3 font-semibold text-slate-800">
                                                {idx + 1}. {item.name}
                                            </td>
                                            <td className="px-4 py-3 space-y-2">
                                                <Input 
                                                    size={1} placeholder="Batch No *" className="h-8 text-xs" 
                                                    value={item.batch_number} onChange={e => updateItem(item.tempId, 'batch_number', e.target.value)} 
                                                />
                                                <div className="flex gap-1 items-center">
                                                    <span className="text-xs text-slate-400 w-8">Exp:</span>
                                                    <Input 
                                                        type="month" className="h-8 text-xs flex-1" 
                                                        value={item.expiry_date} onChange={e => updateItem(item.tempId, 'expiry_date', e.target.value)} 
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 space-y-2">
                                                <Input 
                                                    type="number" className="h-8" min="1" placeholder="Qty"
                                                    value={item.quantity || ''} onChange={e => updateItem(item.tempId, 'quantity', parseInt(e.target.value) || 0)} 
                                                />
                                                <Input 
                                                    type="number" className="h-8 text-xs bg-slate-50" placeholder="+Free"
                                                    value={item.free_quantity || ''} onChange={e => updateItem(item.tempId, 'free_quantity', parseInt(e.target.value) || 0)} 
                                                />
                                            </td>
                                            <td className="px-4 py-3 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500 w-12">Pur (₹)</span>
                                                    <Input 
                                                        type="number" className="h-8 text-xs" 
                                                        value={item.purchase_price || ''} onChange={e => updateItem(item.tempId, 'purchase_price', parseFloat(e.target.value) || 0)} 
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500 w-12">MRP (₹)</span>
                                                    <Input 
                                                        type="number" className="h-8 text-xs" 
                                                        value={item.mrp || ''} onChange={e => updateItem(item.tempId, 'mrp', parseFloat(e.target.value) || 0)} 
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-700">
                                                ₹{item.total_price.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => removeItem(item.tempId)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {items.length > 0 && (
                                <div className="p-4 bg-slate-50 border-t flex justify-end">
                                    <div className="w-64 space-y-2">
                                        <div className="flex justify-between text-sm text-slate-500">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-slate-500 border-b pb-2">
                                            <span>Est. Tax</span>
                                            <span>₹{taxAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg text-indigo-900 pt-1">
                                            <span>Grand Total</span>
                                            <span>₹{totalAmount.toFixed(2)}</span>
                                        </div>
                                        <Button 
                                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 h-10" 
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? "Processing..." : "Save Invoice & Update Stock"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
