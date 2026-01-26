"use client";

import React, { useState, useEffect } from 'react';
import { Archive, Search, FileText, Calendar, Box } from 'lucide-react';
import { API_URL } from '../../../config/api';
import { formatDate } from '@/lib/dateFormatter';

export default function ArchiveView() {
    const [archivedFiles, setArchivedFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchArchive();
    }, []);

    const fetchArchive = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/patients/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter only patients assigned to a box
                const archived = data.filter((p: any) => p.physical_box_id !== null);
                setArchivedFiles(archived);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredFiles = archivedFiles.filter(file =>
        file.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.patient_u_id?.includes(searchTerm) ||
        file.box_label?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full mx-auto p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Archive className="text-indigo-600" /> Physical Archive
                    </h1>
                    <p className="text-slate-500 mt-2">List of patient files currently stored in the warehouse.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by Name, ID or Box Label..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Patient Details</th>
                            <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Box Location</th>
                            <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Discharge Date</th>
                            <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Archive Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-12 text-center">Loading Archive...</td></tr>
                        ) : filteredFiles.length === 0 ? (
                            <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">No archived files found matching your search.</td></tr>
                        ) : (
                            filteredFiles.map(file => (
                                <tr key={file.record_id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                {file.full_name?.[0] || 'Unknown'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{file.full_name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{file.patient_u_id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <Box size={16} className="text-amber-500" />
                                            <span className="font-bold text-slate-700">{file.box_label}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                            <Calendar size={16} className="text-slate-400" />
                                            {file.discharge_date ? formatDate(file.discharge_date) : (
                                                <span className="text-slate-400 italic text-xs">Not Recorded</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                                            <FileText size={12} /> Archived
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
