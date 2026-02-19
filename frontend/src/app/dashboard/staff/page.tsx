"use client";

import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Mail, Shield, AlertTriangle, Search, Edit2, Phone, Calendar, UserCheck, UserX, User } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { API_URL } from '../../../config/api';

export default function StaffManagement() {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newStaff, setNewStaff] = useState({ email: '', password: '', role: 'mrd_staff' });
    const [error, setError] = useState('');

    // New states for confirmation modal and potential edit mode (though edit mode is not fully implemented in this change)
    const [editMode, setEditMode] = useState(false); // Added as per instruction, but not used in this snippet
    const [editingUser, setEditingUser] = useState<any | null>(null); // Added as per instruction, but not used in this snippet
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info' | 'success';
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setStaff(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newStaff)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to create staff");

            setShowModal(false);
            setNewStaff({ email: '', password: '', role: 'mrd_staff' });
            fetchStaff();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: "Remove Staff Member",
            message: "Are you sure you want to remove this staff member? This action cannot be undone.",
            type: 'danger',
            confirmText: "Remove User",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                if (!token) return;
                try {
                    const res = await fetch(`${API_URL}/users/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        setStaff(staff.filter(u => u.user_id !== id));
                        // Optionally add a toast notification here if a toast library is imported
                        // toast.success("Staff member removed successfully");
                    } else {
                        // Optionally add a toast notification here
                        // toast.error("Failed to remove staff member");
                    }
                } catch (e) {
                    console.error(e);
                    // Optionally add a toast notification here
                    // toast.error("An error occurred");
                } finally {
                    setConfirmModal({ ...confirmModal, isOpen: false }); // Close modal after action
                }
            }
        });
    };

    return (
        <div className="w-full mx-auto px-4 pb-4 pt-0">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Users className="text-indigo-600" /> Staff Management
                    </h1>
                    <p className="text-slate-500 mt-2">Manage your MRD team access permissions.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
                >
                    <Plus size={18} /> Add New Staff
                </button>
            </div>

            {/* Stats / Limit Warning could go here */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map(user => (
                    <div key={user.user_id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                                {user.email[0].toUpperCase()}
                            </div>
                            {user.role !== 'hospital_admin' && (
                                <button onClick={() => handleDelete(user.user_id)} className="text-slate-300 hover:text-red-500 transition">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 truncate">{user.email}</h3>
                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 font-medium bg-slate-50 w-fit px-3 py-1 rounded-full border border-slate-100">
                            <Shield size={12} className="text-indigo-500" />
                            {user.role.replace('_', ' ').toUpperCase()}
                        </div>

                        {user.plain_password && (
                            <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide block mb-1">Temp Password</span>
                                <code className="text-indigo-900 font-mono text-sm">{user.plain_password}</code>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Add Team Member</h2>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3 text-sm font-medium">
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
                                    value={newStaff.email}
                                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
                                    value={newStaff.password}
                                    onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30">
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
}
