"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/config/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { Activity, Plus, Search, Edit2, Trash2, X } from 'lucide-react';

export default function DiagnosticsCenterPage() {
    const [catalog, setCatalog] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTest, setEditTest] = useState<any>(null);

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTestForm, setNewTestForm] = useState({ test_name: '', price: '' });

    useEffect(() => {
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            const data = await apiFetch('lab/catalog');
            setCatalog(data || []);
        } catch (error) {
            toast.error("Failed to fetch diagnostics catalog");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSave = async () => {
        if (!editTest.test_name.trim()) return toast.error("Test name is required");
        try {
            await apiFetch(`lab/catalog/${editTest.test_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    test_name: editTest.test_name,
                    price: parseFloat(editTest.price) || 0
                })
            });
            toast.success("Test updated successfully");
            setIsEditModalOpen(false);
            fetchCatalog();
        } catch (error: any) {
            toast.error(error.message || "Failed to update test");
        }
    };

    const handleDelete = async (test_id: number) => {
        if (!confirm("Are you sure you want to delete this test permanently?")) return;
        try {
            await apiFetch(`lab/catalog/${test_id}`, { method: 'DELETE' });
            toast.success("Test deleted successfully");
            fetchCatalog();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete test");
        }
    };

    const handleAddSubmit = async () => {
        if (!newTestForm.test_name.trim()) return toast.error("Test name is required");
        try {
            await apiFetch('lab/catalog', {
                method: 'POST',
                body: JSON.stringify({
                    test_name: newTestForm.test_name,
                    price: parseFloat(newTestForm.price) || 0
                })
            });
            toast.success("New test added successfully");
            setIsAddModalOpen(false);
            setNewTestForm({ test_name: '', price: '' });
            fetchCatalog();
        } catch (error: any) {
            toast.error(error.message || "Failed to add test");
        }
    };

    const filteredCatalog = catalog.filter(t => 
        t.test_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-600" />
                        Diagnostics Center
                    </h1>
                    <p className="text-slate-500 mt-1">Manage laboratory and radiological test catalog, names, and pricing.</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" /> Add New Test
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search tests by name..." 
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        Total Tests: {catalog.length}
                    </Badge>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-white border-b border-slate-200">
                                <th className="p-4 font-bold text-slate-600 text-sm w-16">ID</th>
                                <th className="p-4 font-bold text-slate-600 text-sm">Test Name / Description</th>
                                <th className="p-4 font-bold text-slate-600 text-sm text-right w-32">Price (₹)</th>
                                <th className="p-4 font-bold text-slate-600 text-sm text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400">Loading catalog...</td>
                                </tr>
                            ) : filteredCatalog.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400">
                                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No tests found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCatalog.map(test => (
                                    <tr key={test.test_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-500 font-mono text-sm">#{test.test_id}</td>
                                        <td className="p-4 font-medium text-slate-800">{test.test_name}</td>
                                        <td className="p-4 text-right font-mono font-bold text-emerald-600">
                                            ₹{test.price.toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="w-8 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                    onClick={() => {
                                                        setEditTest({ ...test });
                                                        setIsEditModalOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="w-8 h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200"
                                                    onClick={() => handleDelete(test.test_id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Edit Modal */}
            {isEditModalOpen && editTest && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-lg">Edit Diagnostic Test</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-600 block mb-1.5">Test Name</label>
                                <Input 
                                    value={editTest.test_name} 
                                    onChange={e => setEditTest({ ...editTest, test_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-600 block mb-1.5">Price (₹)</label>
                                <Input 
                                    type="number"
                                    value={editTest.price} 
                                    onChange={e => setEditTest({ ...editTest, price: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleEditSave}>Save Changes</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800 text-lg">Add New Test</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-600 block mb-1.5">Test Name</label>
                                <Input 
                                    value={newTestForm.test_name} 
                                    onChange={e => setNewTestForm({ ...newTestForm, test_name: e.target.value })}
                                    placeholder="e.g. MRI Brain"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-600 block mb-1.5">Price (₹)</label>
                                <Input 
                                    type="number"
                                    value={newTestForm.price} 
                                    onChange={e => setNewTestForm({ ...newTestForm, price: e.target.value })}
                                    placeholder="e.g. 500"
                                />
                            </div>
                        </div>
                        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddSubmit}>Add Test</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
