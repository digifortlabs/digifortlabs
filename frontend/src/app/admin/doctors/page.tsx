"use client";

import React, { useState, useEffect } from 'react';
import { Stethoscope, Plus, Trash2, Edit2, Shield, AlertTriangle, Building, Briefcase, DollarSign } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { apiFetch } from '@/config/api';

export default function DoctorsManagement() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    const [newDoctor, setNewDoctor] = useState({ 
        email: '', password: '', full_name: '', role: 'doctor_opd', 
        department_id: '', specialization: '', consultation_fee: 0 
    });
    const [editDoctor, setEditDoctor] = useState({ 
        user_id: 0, role: '', password: '', full_name: '',
        department_id: '', specialization: '', consultation_fee: 0 
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info' | 'success';
        confirmText?: string;
    }>({
        isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'danger'
    });

    useEffect(() => {
        fetchDoctors();
        fetchDepartments();
    }, []);

    const fetchDoctors = async () => {
        try {
            const data = await apiFetch(`doctors/`);
            if (data) setDoctors(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const data = await apiFetch(`appointments/departments`);
            if (data) setDepartments(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const payload = {
                ...newDoctor,
                department_id: parseInt(newDoctor.department_id),
                consultation_fee: parseFloat(newDoctor.consultation_fee.toString())
            };
            
            const data = await apiFetch(`doctors/`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (data) {
                setShowModal(false);
                setNewDoctor({ 
                    email: '', password: '', full_name: '', role: 'doctor_opd', 
                    department_id: '', specialization: '', consultation_fee: 0 
                });
                fetchDoctors();
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: "Remove Doctor",
            message: "Are you sure you want to remove this doctor? This action cannot be undone.",
            type: 'danger',
            confirmText: "Remove Doctor",
            onConfirm: async () => {
                try {
                    await apiFetch(`doctors/${id}`, { method: 'DELETE' });
                    setDoctors(doctors.filter(d => d.user_id !== id));
                } catch (e) {
                    console.error(e);
                } finally {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            }
        });
    };

    const handleEdit = (doc: any) => {
        setEditDoctor({ 
            user_id: doc.user_id, 
            role: doc.role, 
            password: '', 
            full_name: doc.full_name || '',
            department_id: doc.doctor_profile?.department_id?.toString() || '',
            specialization: doc.doctor_profile?.specialization || '',
            consultation_fee: doc.doctor_profile?.consultation_fee || 0
        });
        setIsEditing(true);
        setShowModal(true);
        setError('');
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const bodyData: any = { 
                role: editDoctor.role,
                full_name: editDoctor.full_name,
                department_id: parseInt(editDoctor.department_id),
                specialization: editDoctor.specialization,
                consultation_fee: parseFloat(editDoctor.consultation_fee.toString())
            };
            if (editDoctor.password) {
                bodyData.password = editDoctor.password;
            }
            
            const data = await apiFetch(`doctors/${editDoctor.user_id}`, {
                method: 'PATCH',
                body: JSON.stringify(bodyData)
            });

            if (data) {
                setShowModal(false);
                setIsEditing(false);
                fetchDoctors();
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const getDepartmentName = (id: number) => {
        const dept = departments.find(d => d.department_id === id);
        return dept ? dept.name : 'Unknown Department';
    };

    if (loading) return null;

    return (
        <div className="w-full mx-auto px-4 pb-4 pt-0">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Stethoscope className="text-indigo-600" /> Doctors Directory
                    </h1>
                    <p className="text-slate-500 mt-2">Manage your hospital's doctors and their profiles.</p>
                </div>
                <button
                    onClick={() => { setIsEditing(false); setShowModal(true); }}
                    className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                >
                    <Plus size={18} /> Add New Doctor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map(doc => (
                    <div key={doc.user_id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 group hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
                                    {doc.full_name ? doc.full_name[0].toUpperCase() : doc.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 truncate">Dr. {doc.full_name || 'Unnamed'}</h3>
                                    <p className="text-sm text-slate-500 truncate">{doc.email}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(doc)} className="text-slate-300 hover:text-indigo-500 transition">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(doc.user_id)} className="text-slate-300 hover:text-red-500 transition">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 mt-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Building size={14} className="text-slate-400" />
                                <span className="font-medium">{doc.doctor_profile?.department_id ? getDepartmentName(doc.doctor_profile.department_id) : 'No Department'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Briefcase size={14} className="text-slate-400" />
                                <span>{doc.doctor_profile?.specialization || 'General'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <DollarSign size={14} className="text-green-500" />
                                <span className="font-medium">₹{doc.doctor_profile?.consultation_fee || 0}</span> Consultation
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-indigo-600 font-bold bg-indigo-50 w-fit px-3 py-1.5 rounded-full">
                            <Shield size={12} />
                            {doc.role === 'doctor_ipd' ? 'IPD Access' : 'OPD Only'}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Doctor Profile' : 'Add New Doctor'}</h2>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-start gap-3 text-sm font-medium">
                                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {!isEditing && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                        <input
                                            type="email" required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
                                            value={newDoctor.email}
                                            onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                    <input
                                        type="text" required
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
                                        value={isEditing ? editDoctor.full_name : newDoctor.full_name}
                                        onChange={e => isEditing ? setEditDoctor({ ...editDoctor, full_name: e.target.value }) : setNewDoctor({ ...newDoctor, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">{isEditing ? 'New Password (Optional)' : 'Password'}</label>
                                    <input
                                        type="text" required={!isEditing}
                                        placeholder={isEditing ? 'Leave blank to keep unchanged' : ''}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
                                        value={isEditing ? editDoctor.password : newDoctor.password}
                                        onChange={e => isEditing ? setEditDoctor({ ...editDoctor, password: e.target.value }) : setNewDoctor({ ...newDoctor, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">System Access Role</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-medium"
                                        value={isEditing ? editDoctor.role : newDoctor.role}
                                        onChange={(e) => isEditing ? setEditDoctor({ ...editDoctor, role: e.target.value }) : setNewDoctor({ ...newDoctor, role: e.target.value })}
                                    >
                                        <option value="doctor_opd">Doctor (OPD Access Only)</option>
                                        <option value="doctor_ipd">Doctor (IPD + OPD Access)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 my-6 pt-4">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-slate-400" /> Professional Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition font-medium"
                                            value={isEditing ? editDoctor.department_id : newDoctor.department_id}
                                            onChange={(e) => isEditing ? setEditDoctor({ ...editDoctor, department_id: e.target.value }) : setNewDoctor({ ...newDoctor, department_id: e.target.value })}
                                        >
                                            <option value="">Select Department...</option>
                                            {departments.map(dept => (
                                                <option key={dept.department_id} value={dept.department_id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Specialization</label>
                                        <input
                                            type="text" placeholder="e.g. Endodontist"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition font-medium"
                                            value={isEditing ? editDoctor.specialization : newDoctor.specialization}
                                            onChange={e => isEditing ? setEditDoctor({ ...editDoctor, specialization: e.target.value }) : setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Consultation Fee (₹)</label>
                                        <input
                                            type="number" min="0" required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition font-medium"
                                            value={isEditing ? editDoctor.consultation_fee : newDoctor.consultation_fee}
                                            onChange={e => isEditing ? setEditDoctor({ ...editDoctor, consultation_fee: parseFloat(e.target.value) }) : setNewDoctor({ ...newDoctor, consultation_fee: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30">
                                    {isEditing ? 'Save Changes' : 'Add Doctor'}
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
