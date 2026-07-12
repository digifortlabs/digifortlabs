"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';

interface Supplier {
    supplier_id: number;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    gst_number: string;
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form state
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [gst, setGst] = useState('');

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const data = await apiFetch('/pharmacy/inventory/suppliers');
            setSuppliers(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load suppliers");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return toast.error("Supplier name is required");

        try {
            await apiFetch('/pharmacy/inventory/suppliers', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    contact_person: contactPerson,
                    phone,
                    email,
                    gst_number: gst
                })
            });
            toast.success("Supplier added");
            setName('');
            setContactPerson('');
            setPhone('');
            setEmail('');
            setGst('');
            fetchSuppliers();
        } catch (error: any) {
            toast.error(error.message || "Failed to add supplier");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="w-7 h-7 text-emerald-600" />
                        Supplier Management
                    </h1>
                    <p className="text-slate-500 mt-1">Manage wholesale pharmacy vendors</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-600" /> Add New Supplier
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddSupplier} className="space-y-4">
                                <div>
                                    <Label>Supplier / Company Name *</Label>
                                    <Input value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div>
                                    <Label>Contact Person</Label>
                                    <Input value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Phone Number</Label>
                                    <Input value={phone} onChange={e => setPhone(e.target.value)} />
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <Label>GST Number</Label>
                                    <Input value={gst} onChange={e => setGst(e.target.value)} />
                                </div>
                                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                    Save Supplier
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Registered Suppliers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <p className="text-slate-500">Loading suppliers...</p>
                            ) : suppliers.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 border border-dashed rounded-lg">
                                    <Truck className="w-12 h-12 mx-auto opacity-20 mb-3" />
                                    No suppliers registered yet.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {suppliers.map(sup => (
                                        <div key={sup.supplier_id} className="p-4 border rounded-lg bg-white flex justify-between items-center hover:border-emerald-300">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">{sup.name}</h3>
                                                <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                                    <span>👤 {sup.contact_person || 'N/A'}</span>
                                                    <span>📞 {sup.phone || 'N/A'}</span>
                                                    {sup.gst_number && <span className="font-mono bg-slate-100 px-1 rounded">GST: {sup.gst_number}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
