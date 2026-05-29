"use client";

import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Mail, Shield, AlertTriangle, Search, Edit2, Phone, Calendar, UserCheck, UserX, User } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { apiFetch } from '@/config/api';

export default function StaffManagement() {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newStaff, setNewStaff] = useState({ full_name: '', email: '', password: '', role: 'mrd_staff', mfa_enabled: true });
    const [editStaff, setEditStaff] = useState({ user_id: 0, role: '', password: '', mfa_enabled: true });
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [hospitalInfo, setHospitalInfo] = useState<any>(null);
    const [planLimits] = useState({ 'Standard': 2, 'Premium': 5, 'Enterprise': 10 });
    const currentUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';

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
        const storedHospitalId = localStorage.getItem('hospital_id');
        if (storedHospitalId) {
            fetchHospitalPlan(storedHospitalId);
        }
    }, []);

    const fetchHospitalPlan = async (hospitalId: string) => {
        try {
            const data = await apiFetch(`hospitals/${hospitalId}`);
            if (data) setHospitalInfo(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStaff = async () => {
        try {
            const data = await apiFetch(`users/`);
            if (data) {
                setStaff(data);
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
            const data = await apiFetch(`users/`, {
                method: 'POST',
                body: JSON.stringify(newStaff)
            });

            if (data) {
                setShowModal(false);
                setNewStaff({ full_name: '', email: '', password: '', role: 'mrd_staff', mfa_enabled: true });
                fetchStaff();
            }
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
                try {
                    const data = await apiFetch(`users/${id}`, {
                        method: 'DELETE'
                    });
                    if (data !== undefined) {
                        setStaff(staff.filter(u => u.user_id !== id));
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            }
        });
    };

    const handleEdit = (user: any) => {
        setEditStaff({ user_id: user.user_id, role: user.role, password: '', mfa_enabled: user.mfa_enabled !== false });
        setIsEditing(true);
        setShowModal(true);
        setError('');
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const bodyData: any = { role: editStaff.role, mfa_enabled: editStaff.mfa_enabled };
            if (editStaff.password) {
                bodyData.password = editStaff.password;
            }
            
            const data = await apiFetch(`users/${editStaff.user_id}`, {
                method: 'PATCH',
                body: JSON.stringify(bodyData)
            });

            if (data) {
                setShowModal(false);
                setIsEditing(false);
                fetchStaff();
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const isEditingSelf = isEditing && staff.find(u => u.user_id === editStaff.user_id)?.email === currentUserEmail;

    return (
        <div className="w-full mx-auto px-4 pb-4 pt-0">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Users className="text-indigo-600" /> Staff Management
                    </h1>
                    <p className="text-slate-500 mt-2">Manage your team access permissions.</p>
                    {hospitalInfo && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-slate-500">
                                Subscription: <span className="font-bold text-indigo-600">{hospitalInfo.subscription_tier}</span>
                            </span>
                            <span className="text-sm font-medium text-slate-400">•</span>
                            <span className={`text-sm font-bold ${staff.length >= planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits] ? 'text-red-500' : 'text-slate-600'}`}>
                                {staff.length} / {planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits]} Seats Used
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex gap-4 items-center">
                    {hospitalInfo && staff.length >= planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits] && (
                        <a href="/settings" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition">
                            🚀 Upgrade Plan
                        </a>
                    )}
                    <button
                        onClick={() => { setIsEditing(false); setShowModal(true); }}
                        disabled={hospitalInfo && staff.length >= planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits]}
                        className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition ${hospitalInfo && staff.length >= planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits]
                            ? 'bg-amber-100 text-amber-700 cursor-default border border-amber-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                            }`}
                    >
                        {hospitalInfo && staff.length >= planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits]
                            ? '📞 Contact Sales to Add'
                            : <><Plus size={18} /> Add New Staff</>}
                    </button>
                </div>
            </div>

            {/* Stats / Limit Warning could go here */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map(user => (
                    <div key={user.user_id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                                {user.email[0].toUpperCase()}
                            </div>
                            {user.email !== currentUserEmail && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(user)} className="text-slate-300 hover:text-indigo-500 transition">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(user.user_id)} className="text-slate-300 hover:text-red-500 transition">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 truncate">{user.email}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <Shield size={12} className="text-indigo-500" />
                                {user.role === 'superadmin' ? 'Platform Admin (Super Admin)' :
                                 user.role === 'superadmin_staff' ? 'Platform Staff' :
                                 user.role === 'warehouse_manager' ? 'Warehouse Manager' :
                                 user.role === 'group_admin' ? 'Group Admin' :
                                 user.role === 'doctor_both' ? 'Doctor (IPD & OPD Access)' :
                                 user.role === 'doctor_ipd' ? 'Doctor (IPD Only)' :
                                 user.role === 'doctor_opd' ? 'Doctor (OPD Only)' :
                                 user.role.replace('_', ' ').toUpperCase()}
                            </div>
                            {user.mfa_enabled !== false ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                    🛡️ OTP Enabled
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                                    ⚠️ OTP Disabled
                                </span>
                            )}
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
                        <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Staff Member' : 'Add Team Member'}</h2>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3 text-sm font-medium">
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="space-y-4">
                            {!isEditing && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
                                            value={newStaff.full_name}
                                            onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                                        />
                                    </div>
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
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">{isEditing ? 'New Password (Optional)' : 'Password'}</label>
                                <input
                                    type="text"
                                    required={!isEditing}
                                    placeholder={isEditing ? 'Leave blank to keep unchanged' : ''}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
                                    value={isEditing ? editStaff.password : newStaff.password}
                                    onChange={e => isEditing ? setEditStaff({ ...editStaff, password: e.target.value }) : setNewStaff({ ...newStaff, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                                <select
                                    disabled={isEditingSelf}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                    value={isEditing ? editStaff.role : newStaff.role}
                                    onChange={(e) => isEditing ? setEditStaff({ ...editStaff, role: e.target.value }) : setNewStaff({ ...newStaff, role: e.target.value })}
                                >
                                    <option value="superadmin">Platform Admin (Super Admin)</option>
                                    <option value="superadmin_staff">Platform Staff (Super Admin Staff)</option>
                                    <option value="warehouse_manager">Warehouse Manager (Central)</option>
                                    <option value="group_admin">Group Admin (Multi-Hospital)</option>
                                    <option value="hospital_admin">Client Admin (Hospital Admin)</option>
                                    <option value="mrd_staff">MRD Staff (Warehouse Only)</option>
                                    <option value="account_staff">Account Staff (Billing & Invoices)</option>
                                    <option value="nurse_ipd">Nurse IPD (Ward & Bed Manager)</option>
                                    <option value="doctor_ipd">Doctor (IPD Only)</option>
                                    <option value="doctor_opd">Doctor (OPD Only)</option>
                                    <option value="doctor_both">Doctor (IPD & OPD Access)</option>
                                    <option value="reception_staff">Receptionist (Registration & Intake)</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="mfa_enabled"
                                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                                    checked={isEditing ? editStaff.mfa_enabled : newStaff.mfa_enabled}
                                    onChange={e => isEditing 
                                        ? setEditStaff({ ...editStaff, mfa_enabled: e.target.checked }) 
                                        : setNewStaff({ ...newStaff, mfa_enabled: e.target.checked })
                                    }
                                />
                                <label htmlFor="mfa_enabled" className="text-sm font-bold text-slate-700 select-none cursor-pointer">
                                    Enable OTP 2FA Security (New Devices)
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30">
                                    {isEditing ? 'Update Account' : 'Create Account'}
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

