"use client";
import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../config/api';
import { formatDate, formatDateTime } from '../../../lib/dateFormatter';

export default function DraftsPage() {
    const router = useRouter();
    const [userRole, setUserRole] = useState('');
    const [drafts, setDrafts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
        fetchDrafts(token);
    }, [router]);

    const fetchDrafts = async (token: string) => {
        setIsLoading(true);
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/storage/drafts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setDrafts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async (fileId: number) => {
        if (!confirm("Confirm this file for final upload?")) return;
        const token = localStorage.getItem('token');
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/patients/files/${fileId}/confirm`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchDrafts(token || '');
            }
        } catch (e) { console.error(e); }
    };

    const handleDiscard = async (fileId: number) => {
        if (!confirm("Discard this draft?")) return;
        const token = localStorage.getItem('token');
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/patients/files/${fileId}/draft`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchDrafts(token || '');
            }
        } catch (e) { console.error(e); }
    };

    const handleConfirmAll = async () => {
        if (!confirm("Are you sure you want to confirm ALL pending drafts? This will move all files to final storage and start OCR.")) return;
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/storage/confirm-all`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || `Successfully confirmed drafts.`);
                fetchDrafts(token || '');
            } else {
                alert(`Error: ${data.detail || 'Failed to confirm all'}`);
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred during bulk confirmation.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 px-8 pt-0">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">📤 Upload Draft Queue</h1>
                    <p className="text-gray-500 text-sm">Review and confirm files before they are published to the platform.</p>
                </div>
                {drafts.length > 0 && (
                    <button
                        onClick={handleConfirmAll}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Processing...' : '✅ Confirm All Drafts'}
                    </button>
                )}
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drafted On</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {drafts.length > 0 ? drafts.map((d) => (
                            <tr key={d.file_id} className="hover:bg-orange-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">{d.filename}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    <Link href={`/dashboard/records/${d.patient_id}`} className="hover:underline hover:text-blue-600 block font-bold">
                                        {d.patient_name}
                                    </Link>
                                    <div className="text-[10px] text-gray-400 mt-0.5 flex gap-2">
                                        <span className="bg-slate-100 px-1 rounded">{d.mrn}</span>
                                        <span>•</span>
                                        <span className="text-indigo-400">{d.hospital_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDateTime(d.upload_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                    <button
                                        onClick={() => handleConfirm(d.file_id)}
                                        className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded border border-green-200 font-bold"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() => handleDiscard(d.file_id)}
                                        className="text-red-500 hover:text-red-700 bg-red-50 px-3 py-1 rounded border border-red-200"
                                    >
                                        Discard
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl mb-2">✅</span>
                                        <p className="font-medium">All caught up!</p>
                                        <p className="text-sm">No pending drafts found.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    );
}
