"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/config/api';
import { Plus, Edit2, Trash2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Department {
    department_id: number;
    name: string;
    description: string;
    is_active: boolean;
}

export default function DepartmentSettings() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', is_active: true });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('appointments/departments');
            if (data) {
                setDepartments(data);
            }
        } catch (e) {
            console.error("Failed to load departments", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({ name: dept.name, description: dept.description || '', is_active: dept.is_active });
        } else {
            setEditingDept(null);
            setFormData({ name: '', description: '', is_active: true });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDept(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingDept) {
                await apiFetch(`appointments/departments/${editingDept.department_id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                await apiFetch(`appointments/departments`, {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }
            await fetchDepartments();
            handleCloseModal();
        } catch (e: any) {
            toast.error(e.message || "Failed to save department");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this department?")) return;
        try {
            await apiFetch(`appointments/departments/${id}`, {
                method: 'DELETE'
            });
            await fetchDepartments();
        } catch (e: any) {
            toast.error(e.message || "Cannot delete department");
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Department Management</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage hospital departments and their status.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                >
                    <Plus size={14} /> Add Department
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-8 text-slate-500">Loading departments...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                <th className="p-3">Department Name</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                                        No departments found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                departments.map((dept) => (
                                    <tr key={dept.department_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-semibold text-slate-800">{dept.name}</td>
                                        <td className="p-3 text-sm text-slate-600">{dept.description || '-'}</td>
                                        <td className="p-3">
                                            {dept.is_active ? (
                                                <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded w-fit">
                                                    <CheckCircle size={12} /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded w-fit">
                                                    <XCircle size={12} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(dept)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(dept.department_id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                {editingDept ? 'Edit Department' : 'Add Department'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-700">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    placeholder="e.g. Cardiology"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[80px]"
                                    placeholder="Optional description"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input 
                                    type="checkbox" 
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">Active Department</label>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
