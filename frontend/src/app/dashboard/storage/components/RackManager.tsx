
import React, { useState } from 'react';
import { Building2, Package, ScanLine, Trash2, Printer, X, Edit2, Save, AlertTriangle, CheckCircle, Info, AlertOctagon, AlertCircle } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import { API_URL } from '../../../../config/api';

interface RackManagerProps {
    racks: any[];
    boxes: any[];
    refreshData: () => void;
}

const RackManager: React.FC<RackManagerProps> = ({ racks, boxes, refreshData }) => {
    const [rackForm, setRackForm] = useState({ label: '', aisle: 1, capacity: 100 });
    const [isCreatingRack, setIsCreatingRack] = useState(false);
    const [hospitals, setHospitals] = useState<any[]>([]); // For Admin Selection

    // Box Create State (Restored)
    const [selectedRackForBox, setSelectedRackForBox] = useState<any>(null);
    const [boxForm, setBoxForm] = useState({ label: '', capacity: 500, category: 'IPD', hospital_id: '' });
    const [isCreatingBox, setIsCreatingBox] = useState(false);

    // Box View State
    const [viewingBox, setViewingBox] = useState<any>(null);
    const [boxFiles, setBoxFiles] = useState<any[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]); // New state for selection

    // Edit Capacity State
    const [isEditingCapacity, setIsEditingCapacity] = useState(false);
    const [editCapacityValue, setEditCapacityValue] = useState(0);

    // Confirmation Modal State
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

    // Toast Notification
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

    const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleUpdateCapacity = async () => {
        if (!viewingBox) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/storage/boxes/${viewingBox.box_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ capacity: editCapacityValue })
            });

            if (res.ok) {
                setIsEditingCapacity(false);
                setViewingBox({ ...viewingBox, capacity: editCapacityValue });
                refreshData(); // Updates the main list
            } else {
                alert("Failed to update capacity");
            }
        } catch (e) { console.error(e); }
    };

    const handleBulkUnassign = async () => {
        setConfirmModal({
            isOpen: true,
            title: "Remove Files from Box",
            message: `Are you sure you want to remove ${selectedFiles.length} files from this box?`,
            type: 'warning',
            confirmText: "Remove Files",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                try {
                    const res = await fetch(`${API_URL}/storage/files/bulk-unassign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ identifiers: selectedFiles })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        triggerToast(data.message || "Files Unassigned Successfully", "success");
                        setSelectedFiles([]);
                        handleViewBox(viewingBox); // Refresh list
                        refreshData(); // Refresh global stats
                    } else {
                        triggerToast("Failed to unassign files.", "error");
                    }
                } catch (e) { console.error(e); }
            }
        });
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedFiles(boxFiles.map(f => String(f.record_id)));
        } else {
            setSelectedFiles([]);
        }
    };

    const toggleFileSelection = (id: string) => {
        setSelectedFiles(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleCreateRack = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/storage/racks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(rackForm)
            });
            if (res.ok) {
                setIsCreatingRack(false);
                setRackForm({ label: '', aisle: 1, capacity: 100 });
                refreshData();
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteRack = async (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Rack",
            message: "Are you sure you want to DELETE this Rack? This cannot be undone.",
            type: 'danger',
            confirmText: "Delete Rack",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                try {
                    const res = await fetch(`${API_URL}/storage/racks/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        refreshData();
                        triggerToast("Rack Deleted Successfully", "success");
                    }
                    else triggerToast("Failed to delete rack. Ensure it is empty first.", "error");
                } catch (e) { console.error(e); }
            }
        });
    };

    const handleCreateBox = async () => {
        const token = localStorage.getItem('token');
        if (!selectedRackForBox) return;
        const locationCode = `WH-A${selectedRackForBox.aisle}-${selectedRackForBox.label}`;

        try {
            const res = await fetch(`${API_URL}/storage/boxes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    label: boxForm.label,
                    capacity: boxForm.capacity,
                    rack_id: selectedRackForBox.rack_id,
                    location_code: locationCode,
                    category: boxForm.category,
                    hospital_id: boxForm.hospital_id || selectedRackForBox.hospital_id
                })
            });
            if (res.ok) {
                setIsCreatingBox(false);
                setSelectedRackForBox(null);
                setBoxForm({ label: '', capacity: 500, category: 'IPD', hospital_id: '' });
                refreshData();
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteBox = async (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Box",
            message: "Delete this Box?",
            type: 'danger',
            confirmText: "Delete Box",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                try {
                    const res = await fetch(`${API_URL}/storage/boxes/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        refreshData();
                    } else {
                        const data = await res.json();
                        alert(data.detail || "Failed to delete box.");
                    }
                } catch (e) { console.error(e); }
            }
        });
    };

    const handleViewBox = async (box: any) => {
        setViewingBox(box);
        setEditCapacityValue(box.capacity || 100);
        setIsEditingCapacity(false);
        setIsLoadingFiles(true);
        setSelectedFiles([]); // Reset selection
        const token = localStorage.getItem('token');

        // Parallel Fetch: Box Contents + Unassigned Files
        fetchUnassignedFiles();

        try {
            const res = await fetch(`${API_URL}/storage/boxes/${box.box_id}/patients`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setBoxFiles(await res.json());
            } else {
                setBoxFiles([]);
            }
        } catch (e) {
            console.error(e);
            setBoxFiles([]);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const handleRemoveAllFiles = async () => {
        if (boxFiles.length === 0) return;
        setConfirmModal({
            isOpen: true,
            title: "Remove ALL Files",
            message: `DANGER: Are you sure you want to remove ALL ${boxFiles.length} files from this box?`,
            type: 'danger',
            confirmText: "Remove ALL",
            onConfirm: async () => {
                const token = localStorage.getItem('token');
                const allIds = boxFiles.map(f => String(f.record_id));

                try {
                    const res = await fetch(`${API_URL}/storage/files/bulk-unassign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ identifiers: allIds })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        alert(data.message);
                        handleViewBox(viewingBox); // Refresh
                        refreshData();
                    } else {
                        alert("Failed to remove files.");
                    }
                } catch (e) { console.error(e); }
            }
        });
    };

    const [addInput, setAddInput] = useState(''); // State for adding file
    const [isAddingString, setIsAddingString] = useState(false);

    const [unassignedFiles, setUnassignedFiles] = useState<any[]>([]);
    const [isLoadingUnassigned, setIsLoadingUnassigned] = useState(false);

    const fetchUnassignedFiles = async () => {
        setIsLoadingUnassigned(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/patients/?unassigned_only=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setUnassignedFiles(await res.json());
            }
        } catch (e) { console.error(e); }
        finally { setIsLoadingUnassigned(false); }
    };

    const handleAssignFile = async (identifier: string) => {
        setIsAddingString(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/storage/files/bulk-assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    box_id: viewingBox?.box_id,
                    identifiers: [identifier]
                })
            });

            const data = await res.json();
            if (res.ok) {
                if (data.assigned > 0) {
                    setAddInput('');
                    if (viewingBox) {
                        handleViewBox(viewingBox); // Refresh box files
                        fetchUnassignedFiles(); // Refresh unassigned list
                    }
                    refreshData(); // Refresh global stats

                    if (data.box_full) {
                        alert(data.message);
                        setViewingBox(null);
                    }
                } else {
                    alert(`Failed: ${data.errors.join(', ')}`);
                }
            } else {
                alert(data.detail || "Failed to assign file.");
            }
        } catch (e) {
            console.error(e);
            alert("Error assigning file");
        } finally {
            setIsAddingString(false);
        }
    };

    const handleAddFile = (e: React.FormEvent) => {
        e.preventDefault();
        if (!addInput.trim()) return;
        handleAssignFile(addInput.trim());
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ... other component UI ... */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Rack Management</h2>
                    <p className="text-slate-400 font-medium">Configure warehouse layout and aisles</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setSelectedRackForBox(null); setIsCreatingBox(true); }}
                        className="bg-white text-indigo-600 border border-indigo-100 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors"
                    >
                        <Package size={20} /> Add New Box
                    </button>
                    <button
                        onClick={() => setIsCreatingRack(!isCreatingRack)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        {isCreatingRack ? "Cancel" : "Add New Rack"}
                    </button>
                </div>
            </div>

            {isCreatingRack && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-indigo-100">
                    <div className="grid grid-cols-3 gap-4 mb-4">

                        <input type="text" placeholder="Rack Label (Empty = Auto)" className="p-3 border rounded-xl" value={rackForm.label} onChange={e => setRackForm({ ...rackForm, label: e.target.value })} />
                        <select className="p-3 border rounded-xl" value={rackForm.aisle} onChange={e => setRackForm({ ...rackForm, aisle: parseInt(e.target.value) })}>
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Aisle {n}</option>)}
                        </select>
                        <input type="number" placeholder="Capacity" className="p-3 border rounded-xl" value={rackForm.capacity} onChange={e => setRackForm({ ...rackForm, capacity: parseInt(e.target.value) || 0 })} />
                    </div>
                    <button onClick={handleCreateRack} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold w-full">Create Rack</button>
                </div>
            )}

            {isCreatingBox && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[1.5rem] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Box</h3>
                        <div className="space-y-3 mb-6">
                            {/* Hospital Selection (New) */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Hospital</label>
                                <select
                                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-medium text-sm"
                                    value={boxForm.hospital_id}
                                    onChange={async (e) => {
                                        const hId = e.target.value;
                                        setBoxForm({ ...boxForm, hospital_id: hId });

                                        // Update label if rack and category are known
                                        if (selectedRackForBox && hId) {
                                            const token = localStorage.getItem('token');
                                            try {
                                                const res = await fetch(
                                                    `${API_URL}/storage/next-sequence?hospital_id=${hId}&category=${boxForm.category}`,
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setBoxForm(prev => ({ ...prev, label: data.full_label }));
                                                }
                                            } catch (e) { console.error(e); }
                                        }
                                    }}
                                    onFocus={async () => {
                                        if (hospitals.length === 0) {
                                            const token = localStorage.getItem('token');
                                            try {
                                                const res = await fetch(`${API_URL}/hospitals`, { headers: { Authorization: `Bearer ${token}` } });
                                                if (res.ok) setHospitals(await res.json());
                                            } catch (e) { console.error(e); }
                                        }
                                    }}
                                >
                                    <option value="">-- Select Hospital --</option>
                                    {hospitals.map(h => <option key={h.hospital_id} value={h.hospital_id}>{h.legal_name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Rack</label>
                                <select
                                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-medium text-sm"
                                    value={selectedRackForBox?.rack_id || ''}
                                    onChange={async (e) => {
                                        const rack = racks.find(r => r.rack_id === parseInt(e.target.value));
                                        setSelectedRackForBox(rack);

                                        // Fetch auto-generated label
                                        if (rack) {
                                            const token = localStorage.getItem('token');
                                            try {
                                                const res = await fetch(
                                                    `${API_URL}/storage/next-sequence?hospital_id=${boxForm.hospital_id || rack.hospital_id}&category=${boxForm.category}`,
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setBoxForm(prev => ({ ...prev, label: data.full_label }));
                                                }
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }
                                    }}
                                >
                                    <option value="">-- Choose a Rack --</option>
                                    {racks.map(r => (
                                        <option key={r.rack_id} value={r.rack_id}>
                                            {r.label} (Aisle {r.aisle}) {r.hospital_name ? `[Dedicated: ${r.hospital_name}]` : '[Shared Rack]'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category (MRD Type)</label>
                                <select
                                    className="w-full p-2.5 border rounded-lg bg-slate-50 font-medium text-sm"
                                    value={boxForm.category}
                                    onChange={async (e) => {
                                        const newCat = e.target.value;
                                        setBoxForm({ ...boxForm, category: newCat });

                                        // Update label if rack is selected
                                        if (selectedRackForBox) {
                                            const token = localStorage.getItem('token');
                                            try {
                                                const res = await fetch(
                                                    `${API_URL}/storage/next-sequence?hospital_id=${boxForm.hospital_id || selectedRackForBox.hospital_id}&category=${newCat}`,
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    setBoxForm(prev => ({ ...prev, category: newCat, label: data.full_label }));
                                                }
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }
                                    }}
                                >
                                    <option value="IPD">IPD (Inpatient)</option>
                                    <option value="OPD">OPD (Outpatient)</option>
                                    <option value="MCL">MCL (Medico-Legal)</option>
                                    <option value="BRT">Birth Records</option>
                                    <option value="DHT">Death Records</option>
                                </select>
                            </div>

                            <input type="text" placeholder="Box Label (Empty = Auto)" className="w-full p-2.5 border rounded-lg text-sm" value={boxForm.label} onChange={e => setBoxForm({ ...boxForm, label: e.target.value })} />
                            <input type="number" placeholder="Capacity" className="w-full p-2.5 border rounded-lg text-sm" value={boxForm.capacity} onChange={e => setBoxForm({ ...boxForm, capacity: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsCreatingBox(false)} className="flex-1 py-2.5 rounded-lg font-bold text-slate-500 bg-slate-100 text-xs">Cancel</button>
                            <button
                                onClick={handleCreateBox}
                                disabled={!selectedRackForBox}
                                className="flex-1 py-2.5 rounded-lg font-bold bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Box Viewer Modal */}
            {viewingBox && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[1.5rem] p-0 max-w-4xl w-full shadow-2xl animate-in zoom-in-95 overflow-hidden flex max-h-[85vh]">

                        {/* LEFT: Unassigned Files List */}
                        <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
                            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-slate-700 text-sm mb-1">Unassigned Files</h4>
                                    <p className="text-[10px] text-slate-400">Click + to add to box</p>
                                </div>
                                {unassignedFiles.length > 0 && (
                                    <button
                                        onClick={async () => {
                                            setConfirmModal({
                                                isOpen: true,
                                                title: "Add All Files",
                                                message: `Add ALL ${unassignedFiles.length} files to this box?`,
                                                type: 'info',
                                                confirmText: "Add All",
                                                onConfirm: async () => {
                                                    setIsAddingString(true);
                                                    const token = localStorage.getItem('token');
                                                    try {
                                                        const allIds = unassignedFiles.map(f => String(f.record_id));
                                                        const res = await fetch(`${API_URL}/storage/files/bulk-assign`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                            body: JSON.stringify({
                                                                box_id: viewingBox?.box_id,
                                                                identifiers: allIds
                                                            })
                                                        });
                                                        const data = await res.json();
                                                        if (res.ok) {
                                                            triggerToast(data.message || "All Files Assigned", "success");
                                                            if (viewingBox) {
                                                                handleViewBox(viewingBox);
                                                                fetchUnassignedFiles();
                                                            }
                                                            refreshData();
                                                        } else {
                                                            triggerToast(data.detail || "Failed to assign all files.", "error");
                                                            handleViewBox(viewingBox);
                                                        }
                                                    } catch (e) { console.error(e); }
                                                    finally { setIsAddingString(false); }
                                                }
                                            });
                                        }}
                                        disabled={isAddingString || viewingBox.status !== 'OPEN'}
                                        className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition disabled:opacity-50"
                                    >
                                        Add All
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                {isLoadingUnassigned ? (
                                    <div className="text-center p-4 text-xs text-slate-400">Loading...</div>
                                ) : unassignedFiles.length === 0 ? (
                                    <div className="text-center p-8 text-xs text-slate-400 italic">No unassigned files found.</div>
                                ) : (
                                    unassignedFiles.map(f => (
                                        <div key={f.record_id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group hover:shadow-md transition">
                                            <div>
                                                <p className="font-bold text-slate-700 text-xs">{f.full_name}</p>
                                                <p className="text-[10px] font-mono text-slate-400">{f.patient_u_id}</p>
                                            </div>
                                            <button
                                                onClick={() => handleAssignFile(String(f.record_id))}
                                                disabled={isAddingString || viewingBox.status !== 'OPEN'}
                                                className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition disabled:opacity-50"
                                            >
                                                {isAddingString ? '...' : '+'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Box Contents (Existing) */}
                        <div className="flex-1 flex flex-col bg-white">
                            <div className="p-4 border-b border-slate-100 flex flex-col gap-4 bg-slate-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                                {viewingBox.label}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${viewingBox.category === 'MCL' ? 'bg-red-50 text-red-600 border-red-200' :
                                                    viewingBox.category === 'DHT' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                        'bg-blue-50 text-blue-600 border-blue-200'
                                                    }`}>
                                                    {viewingBox.category || 'IPD'}
                                                </span>
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-bold text-slate-400">{viewingBox.location_code}</p>
                                                <span className="text-[10px] text-slate-300">|</span>

                                                {isEditingCapacity ? (
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            className="w-16 p-1 text-xs border rounded"
                                                            value={editCapacityValue}
                                                            onChange={e => setEditCapacityValue(parseInt(e.target.value) || 0)}
                                                        />
                                                        <button onClick={handleUpdateCapacity} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded">
                                                            <Save size={14} />
                                                        </button>
                                                        <button onClick={() => setIsEditingCapacity(false)} className="text-red-400 hover:bg-red-50 p-1 rounded">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 group">
                                                        <p className="text-[10px] font-bold text-indigo-600">Capacity: {viewingBox.capacity}</p>
                                                        <button onClick={() => setIsEditingCapacity(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition">
                                                            <Edit2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                setConfirmModal({
                                                    isOpen: true,
                                                    title: viewingBox.status === 'OPEN' ? "Close Box" : "Open Box",
                                                    message: `Mark box ${viewingBox.label} as ${viewingBox.status === 'OPEN' ? 'CLOSED' : 'OPEN'}?`,
                                                    type: viewingBox.status === 'OPEN' ? 'warning' : 'info',
                                                    confirmText: viewingBox.status === 'OPEN' ? "Close Box" : "Open Box",
                                                    onConfirm: async () => {
                                                        const token = localStorage.getItem('token');
                                                        try {
                                                            const res = await fetch(`${API_URL}/storage/boxes/${viewingBox.box_id}/status`, {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                                body: JSON.stringify({ is_open: viewingBox.status !== 'OPEN' })
                                                            });

                                                            if (res.ok) {
                                                                const data = await res.json();
                                                                setViewingBox({ ...viewingBox, status: data.is_open ? 'OPEN' : 'CLOSED' });
                                                                refreshData();
                                                            }
                                                        } catch (e) { console.error(e); }
                                                    }
                                                });
                                            }}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer hover:opacity-80 transition ${viewingBox.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
                                        >
                                            {viewingBox.status} {viewingBox.status === 'OPEN' ? '(Click to Close)' : '(Click to Open)'}
                                        </button>
                                    </div>
                                    <button onClick={() => setViewingBox(null)} className="p-1.5 bg-white rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition border border-slate-200">
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Actions Bar */}
                                <div className="flex justify-between items-center gap-4">
                                    {/* Add File Form */}
                                    <form onSubmit={handleAddFile} className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Scan MRD ID / UHID..."
                                            className="flex-1 p-2 text-xs border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            value={addInput}
                                            onChange={e => setAddInput(e.target.value)}
                                            disabled={viewingBox.status !== 'OPEN'}
                                        />
                                        <button
                                            type="submit"
                                            disabled={viewingBox.status !== 'OPEN' || !addInput.trim() || isAddingString}
                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-indigo-700"
                                        >
                                            {isAddingString ? '...' : 'Add'}
                                        </button>
                                    </form>

                                    {/* Print Labels Button */}
                                    {boxFiles.length > 0 && (
                                        <button
                                            onClick={() => {
                                                const printWindow = window.open('', '_blank');
                                                if (printWindow) {
                                                    const html = `
                                                        <html>
                                                            <head>
                                                                <title>Print Labels - ${viewingBox.label}</title>
                                                                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                                                                <style>
                                                                    body { font-family: sans-serif; padding: 20px; }
                                                                    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                                                                    .label { 
                                                                        border: 2px solid #000; 
                                                                        padding: 10px; 
                                                                        border-radius: 8px; 
                                                                        page-break-inside: avoid; 
                                                                        text-align: center;
                                                                        display: flex;
                                                                        flex-direction: column;
                                                                        align-items: center;
                                                                    }
                                                                    .mrd { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
                                                                    .name { font-size: 12px; margin-bottom: 5px; width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
                                                                    .meta { font-size: 10px; color: #666; width: 100%; }
                                                                    .qr { margin: 5px 0; }
                                                                </style>
                                                            </head>
                                                            <body>
                                                                <h1>Box: ${viewingBox.label}</h1>
                                                                <div class="grid">
                                                                    ${boxFiles.map(f => `
                                                                        <div class="label">
                                                                            <div class="mrd">${f.patient_u_id}</div>
                                                                            <div class="name">${f.full_name}</div>
                                                                            <div id="qr-${f.record_id}" class="qr"></div>
                                                                            <div class="meta">RID: ${f.record_id} | ${viewingBox.location_code}</div>
                                                                            <div style="margin-top:5px; font-size:9px; font-weight:bold; color:#4f46e5;">DigiFort Labs</div>
                                                                        </div>
                                                                    `).join('')}
                                                                </div>
                                                                <script>
                                                                    window.onload = function() {
                                                                        var files = ${JSON.stringify(boxFiles.map(f => ({ id: f.record_id, text: f.patient_u_id })))};
                                                                        files.forEach(function(f) {
                                                                            new QRCode(document.getElementById("qr-" + f.id), {
                                                                                text: f.text,
                                                                                width: 64,
                                                                                height: 64,
                                                                                colorDark : "#000000",
                                                                                colorLight : "#ffffff",
                                                                                correctLevel : QRCode.CorrectLevel.H
                                                                            });
                                                                        });
                                                                        setTimeout(function() { window.print(); }, 500);
                                                                    }
                                                                </script>
                                                            </body>
                                                        </html>
                                                    `;
                                                    printWindow.document.write(html);
                                                    printWindow.document.close();
                                                }
                                            }}
                                            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-200 transition"
                                        >
                                            <Printer size={14} /> Print Labels
                                        </button>
                                    )}

                                    {/* Bulk Remove Button */}
                                    {selectedFiles.length > 0 && (
                                        <button
                                            onClick={handleBulkUnassign}
                                            className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 animate-in zoom-in shrink-0"
                                        >
                                            <Trash2 size={14} /> Remove ({selectedFiles.length})
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                                {isLoadingFiles ? (
                                    <div className="p-8 text-center text-slate-400 font-bold text-xs">Loading Files...</div>
                                ) : boxFiles.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 font-bold text-xs">Box is Empty</div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                                            <tr>
                                                <th className="px-5 py-2 w-10">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        onChange={e => toggleSelectAll(e.target.checked)}
                                                        checked={boxFiles.length > 0 && selectedFiles.length === boxFiles.length}
                                                    />
                                                </th>
                                                <th className="px-2 py-2">Record ID</th>
                                                <th className="px-2 py-2">Patient Name</th>
                                                <th className="px-2 py-2">UHID</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {boxFiles.map((file, idx) => {
                                                const fid = String(file.record_id);
                                                const isSelected = selectedFiles.includes(fid);
                                                return (
                                                    <tr
                                                        key={idx}
                                                        className={`hover:bg-slate-50/50 cursor-pointer ${isSelected ? 'bg-indigo-50/30' : ''}`}
                                                        onClick={() => toggleFileSelection(fid)}
                                                    >
                                                        <td className="px-5 py-3 w-10" onClick={e => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                                checked={isSelected}
                                                                onChange={() => toggleFileSelection(fid)}
                                                            />
                                                        </td>
                                                        <td className="px-2 py-3 font-mono font-bold text-slate-600 text-xs">{file.record_id}</td>
                                                        <td className="px-2 py-3 font-bold text-slate-800 text-xs">{file.full_name}</td>
                                                        <td className="px-2 py-3 text-[10px] font-mono text-slate-400">{file.patient_u_id}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-medium">Select items to remove</span>
                                <span className="text-[10px] text-slate-400 font-medium hover:text-indigo-600 cursor-pointer" onClick={() => toggleSelectAll(true)}>Select items to remove</span>
                                <div className="flex items-center gap-4">
                                    {boxFiles.length > 0 && (
                                        <button
                                            onClick={handleRemoveAllFiles}
                                            className="text-[9px] font-bold text-red-400 hover:text-red-600 hover:underline uppercase tracking-widest"
                                        >
                                            Remove All Files
                                        </button>
                                    )}
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{boxFiles.length} / {viewingBox.capacity} Files Used</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                        <tr>
                            <th className="px-5 py-3">Rack</th>
                            <th className="px-5 py-3">Location</th>
                            <th className="px-5 py-3">Stats</th>
                            <th className="px-5 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {racks.map(rack => {
                            const rackBoxes = boxes.filter(b => b.rack_id === rack.rack_id);
                            return (
                                <tr key={rack.rack_id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-bold text-slate-800 text-sm">{rack.label}</td>
                                    <td className="px-5 py-3 text-xs text-slate-500">Aisle {rack.aisle}</td>
                                    <td className="px-5 py-3 text-[10px] font-bold text-slate-500">{rackBoxes.length} Boxes / {rack.capacity} Capacity</td>
                                    <td className="px-5 py-3 flex gap-2">
                                        <button
                                            onClick={() => alert(`Printing Label for ${rack.label}...`)}
                                            className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg" title="Print Label"
                                        >
                                            <Printer size={16} />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedRackForBox(rack); setIsCreatingBox(true); }}
                                            className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg" title="Add Box"
                                        >
                                            <Package size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRack(rack.rack_id)}
                                            className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg" title="Delete Rack"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Boxes List (Simplified for brevity, can expand if needed) */}
            <h3 className="text-lg font-black text-slate-800 mt-6 mb-4">All Boxes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {boxes.map(box => (
                    <div
                        key={box.box_id}
                        className={`p-3 rounded-xl border flex justify-between items-center group transition-all cursor-pointer hover:shadow-md ${box.status === 'OPEN' ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-200 opacity-75'}`}
                        onClick={() => handleViewBox(box)}
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-slate-700">{box.label}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${box.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                    {box.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mb-1">{box.location_code}</p>
                            <p className="text-xs font-bold text-indigo-600">{box.patient_count} Files Assigned</p>
                        </div>
                        <div className="flex flex-col gap-2 relative z-10" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm(`Mark box ${box.label} as ${box.status === 'OPEN' ? 'CLOSED' : 'OPEN'}?`)) return;
                                    const token = localStorage.getItem('token');
                                    try {
                                        await fetch(`${API_URL}/storage/boxes/${box.box_id}/status`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                            body: JSON.stringify({ is_open: box.status !== 'OPEN' })
                                        });
                                        refreshData();
                                    } catch (e) { console.error(e); }
                                }}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition ${box.status === 'OPEN' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                {box.status === 'OPEN' ? 'Close Box' : 'Re-Open'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteBox(box.box_id); }}
                                disabled={box.patient_count > 0}
                                className={`p-1.5 rounded-lg transition text-right bg-white/50 ${box.patient_count > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                                title={box.patient_count > 0 ? "Cannot delete non-empty box" : "Delete Box"}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />

            {showToast && (
                <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in z-[100] border ${toastType === 'success' ? 'bg-slate-900 border-slate-700 text-white' :
                    toastType === 'error' ? 'bg-red-50 border-red-200 text-red-900' :
                        'bg-blue-50 border-blue-200 text-blue-900'
                    }`}>
                    <div className={`rounded-full p-1 ${toastType === 'success' ? 'bg-green-500' :
                        toastType === 'error' ? 'bg-red-500' :
                            'bg-blue-500'
                        }`}>
                        {toastType === 'success' && <CheckCircle size={16} className="text-white" />}
                        {toastType === 'error' && <AlertCircle size={16} className="text-white" />}
                        {toastType === 'info' && <Info size={16} className="text-white" />}
                    </div>
                    <div>
                        <p className="font-bold text-sm tracking-wide">{toastMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RackManager;
