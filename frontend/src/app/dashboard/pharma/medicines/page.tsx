"use client";

import React, { useState, useEffect } from 'react';
import {
    Pill, Plus, Search, Filter,
    MoreVertical, Edit, Trash2, Box, ArrowLeft
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiFetch } from '@/config/api';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/formatters';

export default function PharmaMedicines() {
    const router = useRouter();
    const [medicines, setMedicines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Medicine Form State
    const [formData, setFormData] = useState({
        medicine_name: '',
        generic_name: '',
        brand_name: '',
        manufacturer: '',
        category: 'Tablet',
        mrp: 0,
        purchase_price: 0,
        selling_price: 0,
        gst_rate: 12.0,
        reorder_level: 50,
        requires_prescription: true
    });

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`pharma/medicines?search=${searchTerm}`);
            if (data) setMedicines(data);
        } catch (error) {
            console.error("Failed to fetch medicines:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchMedicines();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleCreateMedicine = async () => {
        try {
            await apiFetch('pharma/medicines', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            setIsAddModalOpen(false);
            fetchMedicines(); // Refresh list

            // Reset form
            setFormData({
                medicine_name: '', generic_name: '', brand_name: '', manufacturer: '',
                category: 'Tablet', mrp: 0, purchase_price: 0, selling_price: 0,
                gst_rate: 12.0, reorder_level: 50, requires_prescription: true
            });
        } catch (error) {
            console.error("Failed to create medicine:", error);
            alert("Error creating medicine. Check console.");
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
                        <Box className="w-8 h-8 text-blue-600" />
                        Product Master Catalog
                    </h1>
                    <p className="text-slate-500 mt-1">Manage manufactured formulas, pricing, and generic compositions.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="Search medicines by name or generic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-50 border-transparent focus-visible:bg-white transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 bg-white">
                        <Filter className="w-4 h-4" /> Filters
                    </Button>

                    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20">
                                <Plus className="w-4 h-4 mr-2" /> Add Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2"><Pill className="w-5 h-5 text-blue-600" /> Register New Medicine</DialogTitle>
                                <DialogDescription>
                                    Add a new manufactured product to the global catalog.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="name">Product/Trade Name *</Label>
                                    <Input id="name" value={formData.medicine_name} onChange={(e) => setFormData({ ...formData, medicine_name: e.target.value })} placeholder="e.g. Paracetamol 500mg" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="generic">Generic Name</Label>
                                    <Input id="generic" value={formData.generic_name} onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })} placeholder="e.g. Acetaminophen" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Brand Name</Label>
                                    <Input id="brand" value={formData.brand_name} onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="manufacturer">Manufacturer/Division</Label>
                                    <Input id="manufacturer" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} placeholder="e.g. Digifort Pharma Div 1" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category/Form</Label>
                                    <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Tablet, Syrup, Injection..." />
                                </div>

                                <div className="col-span-2 mt-4 mb-2">
                                    <h4 className="font-semibold text-slate-900 border-b pb-2">Pricing & Taxation</h4>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mrp">MRP (₹)</Label>
                                    <Input id="mrp" type="number" step="0.01" value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="purchase_price">Manufacturing Cost (₹)</Label>
                                    <Input id="purchase_price" type="number" step="0.01" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="selling_price">B2B Base Selling Price (₹)</Label>
                                    <Input id="selling_price" type="number" step="0.01" value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gst">GST Rate (%)</Label>
                                    <select
                                        id="gst"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.gst_rate}
                                        onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) })}
                                    >
                                        <option value={0}>0%</option>
                                        <option value={5}>5%</option>
                                        <option value={12}>12%</option>
                                        <option value={18}>18%</option>
                                    </select>
                                </div>

                                <div className="col-span-2 mt-4 mb-2">
                                    <h4 className="font-semibold text-slate-900 border-b pb-2">Inventory Rules</h4>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reorder">Reorder Level Warning (Units)</Label>
                                    <Input id="reorder" type="number" value={formData.reorder_level} onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="space-y-2 flex flex-col justify-end">
                                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer h-10 px-3 border rounded-md bg-slate-50">
                                        <input
                                            type="checkbox"
                                            checked={formData.requires_prescription}
                                            onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        Requires Prescription (Rx)
                                    </label>
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateMedicine} disabled={!formData.medicine_name} className="bg-blue-600 hover:bg-blue-700">Save to Catalog</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Medicines List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[300px]">Product / Generic</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Global Stock</TableHead>
                            <TableHead className="text-right">B2B Price</TableHead>
                            <TableHead className="text-right">MRP</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
                                </TableCell>
                            </TableRow>
                        ) : medicines.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                                    <p>No products found in the catalog.</p>
                                    {searchTerm && <p className="text-sm mt-1">Try adjusting your search criteria.</p>}
                                </TableCell>
                            </TableRow>
                        ) : (
                            medicines.map((med) => {
                                const isLowStock = med.current_stock <= med.reorder_level;
                                return (
                                    <TableRow key={med.medicine_id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="font-medium text-slate-900 flex items-center gap-2">
                                                {med.requires_prescription && <Badge variant="outline" className="text-[10px] px-1 py-0 border-rose-200 text-rose-600 bg-rose-50">Rx</Badge>}
                                                {med.medicine_name}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">{med.generic_name || 'N/A'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-100 font-normal">{med.category || 'Standard'}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="font-semibold">{med.current_stock}</div>
                                            {isLowStock && (
                                                <div className="text-[10px] uppercase font-bold text-rose-600 mt-1">Low Stock</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-emerald-700">{formatCurrency(med.selling_price)}</TableCell>
                                        <TableCell className="text-right text-slate-500 font-mono text-sm">{formatCurrency(med.mrp)}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4 text-slate-500" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="gap-2 cursor-pointer"><Edit className="w-4 h-4 text-slate-500" /> Edit Product</DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600"><Trash2 className="w-4 h-4" /> Deactivate</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
