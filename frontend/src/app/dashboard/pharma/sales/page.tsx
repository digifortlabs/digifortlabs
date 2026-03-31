"use client";

import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, Plus, Search, Filter, Hash,
    FileText, CheckCircle2, ArrowLeft, Trash2
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

export default function PharmaSales() {
    const router = useRouter();
    const [sales, setSales] = useState<any[]>([]);
    const [medicines, setMedicines] = useState<any[]>([]);
    const [availableStock, setAvailableStock] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

    // New Sale Form State
    const [formData, setFormData] = useState<{
        customer_name: string;
        payment_method: string;
        discount: number;
        items: any[];
    }>({
        customer_name: '',
        payment_method: 'bank_transfer',
        discount: 0,
        items: []
    });

    const [currentItem, setCurrentItem] = useState({
        medicine_id: '',
        stock_id: '',
        quantity: 1,
        unit_price: 0,
        discount: 0
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Need a fast way to get sales history and available stock
            // Will use stock/expiring with big window to grab stock since we don't have a plain /stock GET
            const [statsData, medsData, stockData] = await Promise.all([
                apiFetch(`pharma/stats`), // Just using stats as a ping, ideally we'd fetch actual sales history here
                apiFetch(`pharma/medicines`),
                apiFetch(`pharma/stock/expiring?days=3650`)
            ]);

            // Note: Since Amazon Q didn't create a GET /pharma/sales endpoint in pharma.py
            // We will mock the sales history list for now, but the POST will work
            setSales([{
                sale_id: 1001,
                customer_name: "Apollo Pharmacy Hub",
                total_amount: 45000,
                sale_date: new Date().toISOString(),
                status: "Completed"
            }]);

            if (medsData) setMedicines(medsData);
            if (stockData) setAvailableStock(stockData);
        } catch (error) {
            console.error("Failed to fetch pharma data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddItem = () => {
        if (!currentItem.medicine_id || !currentItem.stock_id || currentItem.quantity <= 0) {
            alert("Please select a valid medicine and batch.");
            return;
        }

        const med = medicines.find(m => m.medicine_id.toString() === currentItem.medicine_id);
        const stock = availableStock.find(s => s.stock_id.toString() === currentItem.stock_id);

        if (currentItem.quantity > stock.quantity_remaining) {
            alert(`Only ${stock.quantity_remaining} units available in this batch.`);
            return;
        }

        setFormData({
            ...formData,
            items: [...formData.items, {
                ...currentItem,
                medicine_id: parseInt(currentItem.medicine_id),
                stock_id: parseInt(currentItem.stock_id),
                medicine_name: med?.medicine_name,
                batch_number: stock?.batch_number,
                gst_rate: med?.gst_rate || 12
            }]
        });

        // Reset current item UI
        setCurrentItem({
            medicine_id: '', stock_id: '', quantity: 1, unit_price: 0, discount: 0
        });
    };

    const handleProcessSale = async () => {
        if (formData.items.length === 0) {
            alert("Please add at least one item to the order.");
            return;
        }

        try {
            await apiFetch('pharma/sales', {
                method: 'POST',
                body: JSON.stringify({
                    customer_name: formData.customer_name,
                    payment_method: formData.payment_method,
                    discount: formData.discount,
                    items: formData.items.map(item => ({
                        medicine_id: item.medicine_id,
                        stock_id: item.stock_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        discount: item.discount
                    }))
                })
            });

            setIsSaleModalOpen(false);
            alert("B2B Sale Invoice Generated Successfully.");

            // Reset form
            setFormData({ customer_name: '', payment_method: 'bank_transfer', discount: 0, items: [] });
            fetchData();
        } catch (error) {
            console.error("Failed to process sale:", error);
            alert("Error processing sale. See console.");
        }
    };

    // Derived Calculations for Invoice
    const calculateTotals = () => {
        let subtotal = 0;
        let totalGst = 0;

        formData.items.forEach(item => {
            const lineSub = (item.quantity * item.unit_price) - item.discount;
            const lineGst = lineSub * (item.gst_rate / 100);
            subtotal += lineSub;
            totalGst += lineGst;
        });

        const grandTotal = subtotal + totalGst - formData.discount;
        return { subtotal, totalGst, grandTotal };
    };

    const { subtotal, totalGst, grandTotal } = calculateTotals();

    // Filter stock to only show batches for the selected medicine
    const filteredStock = currentItem.medicine_id
        ? availableStock.filter(s => s.medicine_id.toString() === currentItem.medicine_id && s.quantity_remaining > 0)
        : [];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <Button variant="ghost" onClick={() => router.push('/dashboard/pharma')} size="sm" className="rounded-full bg-slate-100 hover:bg-slate-200">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <ShoppingCart className="w-8 h-8 text-emerald-600" />
                        B2B Distributor Sales
                    </h1>
                    <p className="text-slate-500 mt-1">Process wholesale orders, generate GST invoices, and track distributor purchases.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                <div className="relative w-full sm:w-[400px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="Search invoices by distributor or ID..."
                        className="pl-9 bg-slate-50 border-transparent focus-visible:bg-white transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Dialog open={isSaleModalOpen} onOpenChange={setIsSaleModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20">
                                <Plus className="w-4 h-4 mr-2" /> New B2B Invoice
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl"><FileText className="w-5 h-5 text-emerald-600" /> Generate B2B Sale Invoice</DialogTitle>
                                <DialogDescription>
                                    Add items from available manufacturing batches and bill a distributor.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
                                {/* Left Side: Add Items Form */}
                                <div className="lg:col-span-1 space-y-4 border-r pr-6">
                                    <h4 className="font-semibold text-slate-900 border-b pb-2">Add Product to Invoice</h4>

                                    <div className="space-y-2">
                                        <Label>Select Product *</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={currentItem.medicine_id}
                                            onChange={(e) => {
                                                const medId = e.target.value;
                                                const med = medicines.find(m => m.medicine_id.toString() === medId);
                                                setCurrentItem({
                                                    ...currentItem,
                                                    medicine_id: medId,
                                                    stock_id: '', // Reset stock when med changes
                                                    unit_price: med ? med.selling_price : 0
                                                });
                                            }}
                                        >
                                            <option value="">-- Choose Product --</option>
                                            {medicines.map(m => (
                                                <option key={m.medicine_id} value={m.medicine_id}>{m.medicine_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Select Batch *</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                                            value={currentItem.stock_id}
                                            onChange={(e) => setCurrentItem({ ...currentItem, stock_id: e.target.value })}
                                            disabled={!currentItem.medicine_id}
                                        >
                                            <option value="">-- Choose Available Batch --</option>
                                            {filteredStock.map(s => (
                                                <option key={s.stock_id} value={s.stock_id}>
                                                    B#: {s.batch_number} ({s.quantity_remaining} left)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label>Quantity</Label>
                                            <Input type="number" min="1" value={currentItem.quantity} onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Unit B2B Price</Label>
                                            <Input type="number" step="0.01" value={currentItem.unit_price} onChange={(e) => setCurrentItem({ ...currentItem, unit_price: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    </div>

                                    <Button onClick={handleAddItem} disabled={!currentItem.stock_id} className="w-full bg-slate-900 mt-2">
                                        <ShoppingCart className="w-4 h-4 mr-2" /> Add to Invoice
                                    </Button>
                                </div>

                                {/* Right Side: Invoice Preview & Details */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Distributor / Customer Name *</Label>
                                            <Input value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} placeholder="e.g. Apollo Pharmacy Ltd." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Payment Method</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={formData.payment_method}
                                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                            >
                                                <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="credit">Credit (Net 30)</option>
                                                <option value="cash">Cash</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-h-[200px]">
                                        <h4 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wider">Invoice Items</h4>
                                        {formData.items.length === 0 ? (
                                            <div className="text-center text-slate-400 py-8">
                                                No items added to invoice yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {formData.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded shadow-sm">
                                                        <div>
                                                            <div className="font-semibold text-slate-900">{item.medicine_name}</div>
                                                            <div className="text-xs text-slate-500">Batch: {item.batch_number} | {item.quantity} units @ {formatCurrency(item.unit_price)}</div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right font-medium text-slate-900">
                                                                {formatCurrency(item.quantity * item.unit_price)}
                                                            </div>
                                                            <Button variant="ghost" size="icon" onClick={() => {
                                                                const newItems = [...formData.items];
                                                                newItems.splice(idx, 1);
                                                                setFormData({ ...formData, items: newItems });
                                                            }} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg space-y-2">
                                        <div className="flex justify-between text-slate-300">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-300">
                                            <span>GST Applied</span>
                                            <span>{formatCurrency(totalGst)}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-slate-700 pt-3 mt-3">
                                            <span className="text-lg font-semibold">Grand Total</span>
                                            <span className="text-2xl font-bold text-emerald-400">{formatCurrency(grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="mt-2 border-t pt-4">
                                <Button variant="outline" onClick={() => setIsSaleModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleProcessSale} disabled={formData.items.length === 0 || !formData.customer_name} className="bg-emerald-600 hover:bg-emerald-700">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Generate Invoice
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[120px]">Invoice ID</TableHead>
                            <TableHead>Distributor/Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                            <TableHead className="w-[120px] text-center">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center">
                                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>
                                </TableCell>
                            </TableRow>
                        ) : sales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                    <p>No B2B sales invoices generated yet.</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sales.map((sale) => (
                                <TableRow key={sale.sale_id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="font-mono text-sm text-slate-600 font-medium flex items-center gap-1">
                                            <Hash className="w-3 h-3" /> {sale.sale_id}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-slate-900">{sale.customer_name || 'Walk-in'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-600">
                                            {new Date(sale.sale_date).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="font-bold text-slate-900">{formatCurrency(sale.total_amount)}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none">Billed</Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
