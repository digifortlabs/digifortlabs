'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/config/api';
import { Trash2, RefreshCcw, AlertTriangle } from 'lucide-react';
import DashboardPageShell from '@/components/DashboardPageShell';
import ConfirmationModal from '@/components/ConfirmationModal';

interface RecycledPatient {
    record_id: number;
    patient_u_id: string;
    uhid: string;
    full_name: string;
    deleted_at: string;
    days_until_permanent_deletion: number;
}

export default function RecycleBinPage() {
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
        } catch (err: any) {
            alert(err.message || 'Failed to restore patient');
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
        } catch (err: any) {
            alert(err.message || 'Failed to permanently delete patient');
        } finally {
            setActionLoading(false);
            setSelectedPatient(null);
        }
    };

    const handleRunCleanup = async () => {
        if (!confirm('Are you sure you want to run the cleanup job? This will permanently delete all patients older than 90 days in the recycle bin.')) {
            return;
        }
        try {
            const res = await apiFetch('/patients/recycle-bin/cleanup', { method: 'POST' });
            alert(res.message || 'Cleanup completed');
            fetchPatients();
        } catch (err: any) {
            alert(err.message || 'Failed to run cleanup');
        }
    };

    return (
        <DashboardPageShell title="Recycle Bin" icon={Trash2}>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Trash2 className="w-6 h-6 text-red-500" />
                        Deleted Patients
                    </h2>
                    <button
                        onClick={handleRunCleanup}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Run 90-Day Cleanup
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="py-12 text-center text-gray-500">Loading deleted patients...</div>
                ) : patients.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">The recycle bin is empty.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-600 text-sm">
                                    <th className="pb-3 px-4 font-semibold">Patient Name</th>
                                    <th className="pb-3 px-4 font-semibold">MRD / UHID</th>
                                    <th className="pb-3 px-4 font-semibold">Deleted On</th>
                                    <th className="pb-3 px-4 font-semibold">Days to Auto-Delete</th>
                                    <th className="pb-3 px-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.map((patient) => (
                                    <tr key={patient.record_id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-gray-800 font-medium">{patient.full_name}</td>
                                        <td className="py-3 px-4 text-gray-500">{patient.patient_u_id || patient.uhid || 'N/A'}</td>
                                        <td className="py-3 px-4 text-gray-500">
                                            {patient.deleted_at ? new Date(patient.deleted_at).toLocaleDateString() : 'Unknown'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                patient.days_until_permanent_deletion < 7 ? 'bg-red-100 text-red-700' : 
                                                patient.days_until_permanent_deletion < 30 ? 'bg-orange-100 text-orange-700' : 
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {patient.days_until_permanent_deletion} days left
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => { setSelectedPatient(patient); setRestoreModalOpen(true); }}
                                                className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium mr-2 transition-colors"
                                            >
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => { setSelectedPatient(patient); setDeleteModalOpen(true); }}
                                                className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Delete
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
                    message={`Are you sure you want to restore ${selectedPatient.full_name}? They will be moved back to the active patient list.`}
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
