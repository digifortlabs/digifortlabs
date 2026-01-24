import React, { useState, useEffect } from 'react';
import { Archive, Search, FileText, Calendar, Box, PackagePlus, FileQuestion, CheckSquare, Square } from 'lucide-react';
import { API_URL } from '../../../../config/api';

interface ArchivedFilesListProps {
    boxes?: any[];
    refreshData?: () => void;
}

export default function ArchivedFilesList({ boxes = [], refreshData }: ArchivedFilesListProps) {
    const [archivedFiles, setArchivedFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'assigned' | 'unassigned'>('assigned');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [targetBoxId, setTargetBoxId] = useState<string>('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchData();
    }, [viewMode]);

    const fetchData = async () => {
        setLoading(true);
        setSelectedIds(new Set()); // Reset selection
        try {
            const token = localStorage.getItem('token');
            // Fetch unassigned if viewMode is unassigned
            const url = viewMode === 'unassigned'
                ? `${API_URL}/patients/?unassigned_only=true`
                : `${API_URL}/patients/`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (viewMode === 'assigned') {
                    // Filter only patients assigned to a box
                    const archived = data.filter((p: any) => p.physical_box_id !== null);
                    setArchivedFiles(archived);
                } else {
                    setArchivedFiles(data);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const filteredFiles = archivedFiles.filter(file =>
        file.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.patient_u_id?.includes(searchTerm) ||
        (file.box_label || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBulkAssign = async () => {
        if (!targetBoxId) return alert("Please select a box");
        setAssigning(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/storage/files/bulk-assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    box_id: parseInt(targetBoxId),
                    identifiers: Array.from(selectedIds)
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setShowAssignModal(false);
                fetchData();
                if (refreshData) refreshData();
            } else {
                alert("Error: " + (data.detail || data.message));
            }
        } catch (e) {
            console.error(e);
            alert("Failed to assign files");
        } finally {
            setAssigning(false);
        }
    };

    // Filter generic open boxes for dropdown
    const availableBoxes = boxes.filter(b => b.status === "OPEN" && (b.patient_count || 0) < (b.capacity || 100));

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredFiles.length && filteredFiles.length > 0) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(filteredFiles.map(f => f.patient_u_id));
            setSelectedIds(allIds);
        }
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col animate-in fade-in duration-500">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Archive className="text-indigo-600" />
                        {viewMode === 'assigned' ? 'Physical Archive' : 'Unassigned Files'}
                    </h2>
                    <p className="text-slate-400 text-sm font-medium">
                        {viewMode === 'assigned'
                            ? 'List of patient files currently stored in boxes.'
                            : 'Files waiting to be assigned to a physical box.'}
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* View Switcher */}
                    <div className="bg-slate-200 p-1 rounded-xl flex text-xs font-bold">
                        <button
                            onClick={() => setViewMode('assigned')}
                            className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'assigned' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Assigned
                        </button>
                        <button
                            onClick={() => setViewMode('unassigned')}
                            className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'unassigned' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Unassigned
                        </button>
                    </div>

                    <div className="relative flex-1 md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {viewMode === 'unassigned' && selectedIds.size > 0 && (
                <div className="bg-indigo-50 border-b border-indigo-100 p-4 flex justify-between items-center animate-in slide-in-from-top-2">
                    <span className="text-indigo-800 font-bold text-sm ml-4">{selectedIds.size} files selected</span>
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                    >
                        <PackagePlus size={16} />
                        Assign to Box
                    </button>
                </div>
            )}

            <div className="overflow-auto flex-1">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                            {viewMode === 'unassigned' && (
                                <th className="p-6 w-10">
                                    <button onClick={toggleSelectAll} className="text-indigo-600">
                                        {selectedIds.size === filteredFiles.length && filteredFiles.length > 0 ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-300" />}
                                    </button>
                                </th>
                            )}
                            <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Patient Details</th>
                            <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Location Status</th>
                            <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Discharge Date</th>
                            <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-12 text-center text-slate-400">Loading...</td></tr>
                        ) : filteredFiles.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">No files found.</td></tr>
                        ) : (
                            filteredFiles.map(file => {
                                const isSelected = selectedIds.has(file.patient_u_id); // Using patient_u_id as identifier for bulk
                                return (
                                    <tr key={file.record_id} className={`transition ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}>
                                        {viewMode === 'unassigned' && (
                                            <td className="p-6">
                                                <button onClick={() => toggleSelection(file.patient_u_id)} className="text-indigo-600">
                                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-slate-300" />}
                                                </button>
                                            </td>
                                        )}
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
                                            {viewMode === 'assigned' ? (
                                                <div className="flex items-center gap-2">
                                                    <Box size={16} className="text-amber-500" />
                                                    <span className="font-bold text-slate-700">{file.box_label || `Box #${file.physical_box_id}`}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic flex items-center gap-1">
                                                    <FileQuestion size={14} /> Unassigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                <Calendar size={16} className="text-slate-400" />
                                                {file.discharge_date ? new Date(file.discharge_date).toLocaleDateString() : (
                                                    <span className="text-slate-400 italic text-xs">Not Recorded</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            {viewMode === 'assigned' ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                                                    <FileText size={12} /> Archived
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Assign Files to Box</h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Select an active box to assign <strong className="text-indigo-600">{selectedIds.size}</strong> files.
                        </p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Box</label>
                            <select
                                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-indigo-500 transition"
                                value={targetBoxId}
                                onChange={e => setTargetBoxId(e.target.value)}
                            >
                                <option value="">Select a Box...</option>
                                {availableBoxes.map(b => (
                                    <option key={b.box_id} value={b.box_id}>
                                        {b.label} ({b.patient_count}/{b.capacity})
                                    </option>
                                ))}
                            </select>
                            {availableBoxes.length === 0 && (
                                <p className="text-xs text-red-500 mt-2">No OPEN boxes found. Please creates or open a box first.</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 rounded-lg text-slate-500 font-bold hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkAssign}
                                disabled={assigning || !targetBoxId}
                                className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                            >
                                {assigning ? 'Assigning...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
