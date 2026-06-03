'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/config/api';
import { Trash2, RefreshCcw, AlertTriangle, Building2 } from 'lucide-react';
import DashboardPageShell from '@/components/DashboardPageShell';
import ConfirmationModal from '@/components/ConfirmationModal';
import toast from 'react-hot-toast';

interface RecycledPatient {
    record_id: number;
    patient_u_id: string;
    uhid: string;
    full_name: string;
    deleted_at: string;
    days_until_permanent_deletion: number;
    hospital_name?: string;
}

export default function PlatformRecycleBinPage() {
    const [patients, setPatients] = useState<RecycledPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<RecycledPatient | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const data = await apiFetch('/patients/recycle-bin/list');
            setPatients(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch recycle bin');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleRestore = async () => {
        if (!selectedPatient) return;
        setActionLoading(true);
        try {
            await apiFetch(`/patients/${selectedPatient.record_id}/restore`, { method: 'POST' });
            setRestoreModalOpen(false);
            fetchPatients();
            toast.success(`${selectedPatient.full_name} has been restored successfully.`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to restore patient');
        } finally {
            setActionLoading(false);
            setSelectedPatient(null);
        }
    };

    const handlePermanentDelete = async () => {
        if (!selectedPatient) return;
        setActionLoading(true);
        try {
            await apiFetch(`/patients/${selectedPatient.record_id}/permanent`, { method: 'DELETE' });
            setDeleteModalOpen(false);
            fetchPatients();
            toast.success(`${selectedPatient.full_name} has been permanently deleted.`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to permanently delete patient');
        } finally {
            setActionLoading(false);
            setSelectedPatient(null);
        }
    };

    const handleRunCleanup = async () => {
        if (!confirm('Are you sure you want to run the global cleanup job? This will permanently delete all patients older than 90 days in the recycle bin across ALL clinics.')) {
            return;
        }
        try {
            const res = await apiFetch('/patients/recycle-bin/cleanup', { method: 'POST' });
            toast.success(res.message || 'Cleanup completed');
            fetchPatients();
        } catch (err: any) {
            toast.error(err.message || 'Failed to run cleanup');
        }
    };

    return (
        <DashboardPageShell title="Platform Recycle Bin" icon={Trash2}>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                            <Trash2 className="w-6 h-6 text-red-500" />
                            Deleted Patients (Global)
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Review and manage patients deleted by any clinic on the platform.</p>
                    </div>
                    <button
                        onClick={handleRunCleanup}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 text-sm font-medium transition-colors flex items-center gap-2 border border-slate-200"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Run 90-Day Global Cleanup
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Loading platform recycle bin...</span>
                    </div>
                ) : patients.length === 0 ? (
                    <div className="py-16 text-center text-slate-500">
                        <Trash2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-base font-semibold">The global recycle bin is empty.</p>
                        <p className="text-sm mt-1">No deleted patients found across any clinics.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider bg-slate-50">
                                    <th className="py-3 px-4 font-bold">Patient Details</th>
                                    <th className="py-3 px-4 font-bold">Clinic / Hospital</th>
                                    <th className="py-3 px-4 font-bold">Deleted On</th>
                                    <th className="py-3 px-4 font-bold">Days to Auto-Delete</th>
                                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {patients.map((patient) => (
                                    <tr key={patient.record_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-slate-900">{patient.full_name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{patient.patient_u_id || patient.uhid || 'No UHID'}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                {patient.hospital_name || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-500">
                                            {patient.deleted_at ? new Date(patient.deleted_at).toLocaleDateString() : 'Unknown'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                                patient.days_until_permanent_deletion < 7 ? 'bg-red-50 text-red-700 border border-red-100' : 
                                                patient.days_until_permanent_deletion < 30 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                                                'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            }`}>
                                                {patient.days_until_permanent_deletion} days left
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => { setSelectedPatient(patient); setRestoreModalOpen(true); }}
                                                className="px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold uppercase tracking-wider mr-2 transition-colors border border-transparent hover:border-indigo-100"
                                            >
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => { setSelectedPatient(patient); setDeleteModalOpen(true); }}
                                                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-transparent hover:border-red-100"
                                            >
                                                Purge
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {restoreModalOpen && selectedPatient && (
                <ConfirmationModal
                    isOpen={restoreModalOpen}
                    title="Restore Patient"
                    message={`Are you sure you want to restore ${selectedPatient.full_name}? They will be moved back to the active patient list for ${selectedPatient.hospital_name}.`}
                    onConfirm={handleRestore}
                    onClose={() => { setRestoreModalOpen(false); setSelectedPatient(null); }}
                    confirmText="Yes, Restore"
                    type="success"
                    isLoading={actionLoading}
                />
            )}

            {deleteModalOpen && selectedPatient && (
                <ConfirmationModal
                    isOpen={deleteModalOpen}
                    title="Permanently Delete Patient"
                    message={`WARNING: This action cannot be undone. Are you sure you want to permanently delete ${selectedPatient.full_name} and all their associated files?`}
                    onConfirm={handlePermanentDelete}
                    onClose={() => { setDeleteModalOpen(false); setSelectedPatient(null); }}
                    confirmText="Yes, Delete Permanently"
                    type="danger"
                    isLoading={actionLoading}
                />
            )}
        </DashboardPageShell>
    );
}
