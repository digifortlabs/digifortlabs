"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Package, Plus, AlertTriangle, PlusCircle, MinusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { Badge } from '@/components/ui/badge';

interface InventoryItem {
    item_id: number;
    name: string;
    category: string;
    sku_code: string;
    current_stock: number;
    reorder_point: number;
    unit_of_measure: string;
}

export default function DentalInventory() {
    const router = useRouter();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // New Item State
    const [newItem, setNewItem] = useState({ name: '', category: 'Consumables', sku_code: '', current_stock: 0, reorder_point: 5, unit_of_measure: 'boxes' });

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('dental/inventory');
            if (data) setItems(data);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleAddItem = async () => {
        try {
            await apiFetch('dental/inventory', { method: 'POST', body: JSON.stringify(newItem) });
            alert("Item added successfully.");
            setIsAddModalOpen(false);
            fetchInventory();
        } catch (error) {
            alert("Failed to add item.");
        }
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/dental')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Package className="w-8 h-8 text-blue-600" />
                            Dental Inventory
                        </h1>
                        <p className="text-slate-500 mt-1">Manage clinical supplies, materials, and instruments.</p>
                    </div>
                </div>

                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" /> Add New Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Inventory Item</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Category</Label>
                                <Input id="category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="col-span-3" placeholder="e.g., Consumables" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="stock" className="text-right">Initial Stock</Label>
                                <Input id="stock" type="number" value={newItem.current_stock} onChange={(e) => setNewItem({ ...newItem, current_stock: parseInt(e.target.value) })} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddItem}>Save Item</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Inventory Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Current Stock</CardTitle>
                    <CardDescription>Live tracking of all clinic materials.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-slate-500">Loading inventory...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Current Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">No items in inventory.</TableCell>
                                    </TableRow>
                                ) : items.map((item) => {
                                    const isLow = item.current_stock <= item.reorder_point;
                                    return (
                                        <TableRow key={item.item_id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {item.current_stock} <span className="text-xs text-slate-500 font-normal">{item.unit_of_measure}</span>
                                            </TableCell>
                                            <TableCell>
                                                {isLow ? (
                                                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                                        <AlertTriangle className="w-3 h-3" /> Low Stock
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Optimal</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50" title="Restock">
                                                    <PlusCircle className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-amber-600 hover:bg-amber-50" title="Consume">
                                                    <MinusCircle className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
