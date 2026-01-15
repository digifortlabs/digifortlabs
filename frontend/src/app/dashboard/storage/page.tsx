"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../config/api';
import {
    QrCode,
    Printer,
    Scan,
    Search,
    User,
    Building2,
    History,
    ArrowLeftRight,
    CheckCircle2,
    FileText,
    Clock,
    MapPin,
    Download,
    LayoutGrid,
    AlertTriangle,
    Package,
    ScanLine,

    Loader2,
    Camera,
    StopCircle
} from 'lucide-react';
import { Html5QrcodeScanner } from "html5-qrcode";
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for classes
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

// --- Types ---
interface WarehouseRack {
    id: string;
    name: string;
    capacity: number;
    occupied: number; // Percentage or count
}

interface WarehouseAisle {
    aisle: number;
    racks: WarehouseRack[];
}

interface MovementLog {
    id: number;
    type: string;
    uhid: string;
    name: string;
    dest: string;
    time: string;
    status: string;
}

export default function WarehousePage() {
    const router = useRouter();
    // State management for Warehouse and Rack Manager
    const [activeTab, setActiveTab] = useState('warehouse'); // Default to map
    const [userRole, setUserRole] = useState('');
    const [unassignedPatients, setUnassignedPatients] = useState<any[]>([]);

    // Data State
    const [warehouseData, setWarehouseData] = useState<WarehouseAisle[]>([]);
    const [logs, setLogs] = useState<MovementLog[]>([]);
    const [racks, setRacks] = useState<any[]>([]); // List of Racks for Manager
    const [boxes, setBoxes] = useState<any[]>([]); // List of Boxes (fetched with Racks)
    const [rackForm, setRackForm] = useState({ label: '', aisle: 1, capacity: 100, total_rows: 5, total_columns: 10 });
    const [isCreatingRack, setIsCreatingRack] = useState(false);
    const [editingRack, setEditingRack] = useState<any>(null);

    // Box Management State
    const [selectedRackForBox, setSelectedRackForBox] = useState<any>(null);
    const [boxForm, setBoxForm] = useState({ label: '', capacity: 50, rack_row: '', rack_column: '' }); // Default 50 per user request
    const [isCreatingBox, setIsCreatingBox] = useState(false);
    const [editingBox, setEditingBox] = useState<any>(null);

    // Box View / Assignment State
    const [expandedRackId, setExpandedRackId] = useState<number | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedBoxForAssignment, setSelectedBoxForAssignment] = useState<any>(null);
    const [assignForm, setAssignForm] = useState({ patientId: '' });

    // Search / Generator State
    const [uhidSearch, setUhidSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [scanInput, setScanInput] = useState('');

    // Camera State
    const [useCamera, setUseCamera] = useState(false);
    const [scannerInstance, setScannerInstance] = useState<any>(null);

    // Camera Effect
    useEffect(() => {
        if (useCamera && !scanResult) {
            setTimeout(() => {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    /* verbose= */ false
                );
                scanner.render(
                    (decodedText: string) => {
                        console.log("Scan Success:", decodedText);
                        setScanInput(decodedText);
                        handleRealScan(decodedText);
                        setUseCamera(false);
                        scanner.clear().catch(console.error);
                    },
                    (error: any) => { /* ignore */ }
                );
                setScannerInstance(scanner);
            }, 100);
        }
        return () => {
            if (scannerInstance) {
                try { scannerInstance.clear().catch(console.error); } catch (e) { }
            }
        };
    }, [useCamera]);

    const stopCamera = () => {
        if (scannerInstance) {
            try { scannerInstance.clear().catch(console.error); } catch (e) { }
        }
        setUseCamera(false);
        setScannerInstance(null);
    };

    // --- Auth & Initial Fetch ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserRole(payload.role || '');
            fetchLayout(token);
            fetchLogs(token);
            fetchRacks(token);
            fetchBoxes(token);
        } catch (e) {
            console.error("Token error", e);
        }
    }, [router]);

    const fetchLayout = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/storage/layout`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setWarehouseData(await res.json());
            }
        } catch (e) {
            console.error("Layout fetch error", e);
        }
    };

    const fetchLogs = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/storage/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setLogs(await res.json());
            }
        } catch (e) {
            console.error("Logs fetch error", e);
        }
    };

    const fetchRacks = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/storage/racks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setRacks(await res.json());
            }
        } catch (e) {
            console.error("Racks fetch error", e);
        }
    };

    const fetchBoxes = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/storage/boxes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setBoxes(await res.json());
            }
        } catch (e) {
            console.error("Boxes fetch error", e);
        }
    };

    const fetchUnassignedPatients = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/patients/?unassigned_only=true`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setUnassignedPatients(await res.json());
            }
        } catch (e) {
            console.error("Unassigned fetch error", e);
        }
    };

    const handleCreateRack = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const url = editingRack
                ? `${API_URL}/storage/racks/${editingRack.rack_id}`
                : `${API_URL}/storage/racks`;

            const method = editingRack ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(rackForm)
            });

            if (res.ok) {
                setIsCreatingRack(false);
                setEditingRack(null);
                setRackForm({ label: '', aisle: 1, capacity: 100, total_rows: 5, total_columns: 10 });
                fetchRacks(token);
                fetchLayout(token); // Refresh layout map too
                alert(editingRack ? "Rack Updated Successfully!" : "Rack Created Successfully!");
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to save rack");
            }
        } catch (e) {
            console.error("Save rack error", e);
        }
    };

    const handleCreateBox = async () => {
        const token = localStorage.getItem('token');
        if (!token || !selectedRackForBox) return;

        try {
            const locationCode = `WH-A${selectedRackForBox.aisle}-${selectedRackForBox.label}`;

            const url = editingBox
                ? `${API_URL}/storage/boxes/${editingBox.box_id}`
                : `${API_URL}/storage/boxes`;

            const method = editingBox ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    label: boxForm.label,
                    capacity: boxForm.capacity,
                    rack_id: selectedRackForBox.rack_id,
                    location_code: locationCode
                })
            });

            if (res.ok) {
                setIsCreatingBox(false);
                setEditingBox(null);
                setBoxForm({ label: '', capacity: 50, rack_row: '', rack_column: '' });
                setSelectedRackForBox(null);
                alert(editingBox ? "Box Updated Successfully!" : "Box Created Successfully!");
                fetchBoxes(token);
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to save box");
            }
        } catch (e) {
            console.error("Save box error", e);
        }
    };

    const toggleRack = (id: number) => {
        if (expandedRackId === id) setExpandedRackId(null);
        else setExpandedRackId(id);
    };

    const openEditRack = (rack: any) => {
        setEditingRack(rack);
        setRackForm({
            label: rack.label,
            aisle: rack.aisle,
            capacity: rack.capacity,
            total_rows: rack.total_rows || 5,
            total_columns: rack.total_columns || 10
        });
        setIsCreatingRack(true);
    };

    const openEditBox = (box: any, rack: any) => {
        setEditingBox(box);
        setSelectedRackForBox(rack);
        setBoxForm({
            label: box.label,
            capacity: box.capacity,
            rack_row: box.rack_row || '',
            rack_column: box.rack_column || ''
        });
        setIsCreatingBox(true);
    };

    const handleAssignPatient = async () => {
        const token = localStorage.getItem('token');
        if (!token || !selectedBoxForAssignment) return;

        try {
            // Need record_id - assuming input is record id for MVP
            // Real app would verify UHID -> Get ID first
            const res = await fetch(`${API_URL}/storage/patients/${assignForm.patientId}/assign-box`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ box_id: selectedBoxForAssignment.box_id })
            });

            if (res.ok) {
                setIsAssigning(false);
                setAssignForm({ patientId: '' });
                setSelectedBoxForAssignment(null);
                fetchBoxes(token); // Refresh counts
                alert("File Assigned Successfully!");
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to assign file");
            }
        } catch (e) {
            console.error("Assign error", e);
        }
    };

    // --- Handlers ---
    const handleSearch = async () => {
        // Mock Search for Demo purposes or assume UHID is valid to generate label
        // In real app, we'd query /patients/search
        if (!uhidSearch) return;

        // Simulate found patient for Label Gen
        setSelectedPatient({
            id: 'P999',
            name: 'Demo Patient',
            uhid: uhidSearch,
            dob: '01/01/1990',
            location: 'Aisle 1, Rack A (Pending)'
        });
    };

    const handleRealScan = async (overrideInput?: string) => {
        const inputToUse = overrideInput || scanInput;
        if (!inputToUse) return;
        setIsScanning(true);
        const token = localStorage.getItem('token');

        try {
            // Search for patient
            const res = await fetch(`${API_URL}/patients/?q=${encodeURIComponent(inputToUse)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const results = await res.json();
                if (results.length > 0) {
                    // Match found
                    const patient = results[0];
                    setScanResult({
                        name: patient.full_name,
                        uhid: patient.uhid || patient.patient_u_id,
                        record_id: patient.record_id
                    });
                    setScanInput(''); // Clear input for next scan
                } else {
                    alert("No patient found with that code.");
                    setScanResult(null);
                }
            } else {
                alert("Scan failed. API Error.");
            }
        } catch (e) {
            console.error("Scan error", e);
            alert("Connection Error");
        } finally {
            setIsScanning(false);
        }
    };

    const processMovement = async (type: 'CHECK-IN' | 'CHECK-OUT') => {
        const token = localStorage.getItem('token');
        if (!token || !scanResult) return;

        const dest = type === 'CHECK-IN' ? 'MRD Warehouse' : 'Doctor OPD';

        try {
            const res = await fetch(`${API_URL}/storage/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: type,
                    uhid: scanResult.uhid,
                    name: scanResult.name,
                    dest: dest
                })
            });

            if (res.ok) {
                fetchLogs(token); // Refresh logs
                setScanResult(null); // Clear scan
            }
        } catch (e) {
            console.error("Move error", e);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto min-h-screen pb-20 text-slate-900">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Package className="text-indigo-600" /> Warehouse Manager
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 font-medium mt-2">Physical inventory tracking and aisle management.</p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto w-full lg:w-auto scrollbar-hide">
                    <div className="flex min-w-max">
                        <NavBtn label="Map View" icon={<LayoutGrid size={18} />} active={activeTab === 'warehouse'} onClick={() => setActiveTab('warehouse')} />
                        <NavBtn label="Scanner" icon={<Scan size={18} />} active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} />
                        <NavBtn label="Labels" icon={<Printer size={18} />} active={activeTab === 'generator'} onClick={() => setActiveTab('generator')} />
                        <NavBtn label="History" icon={<History size={18} />} active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
                        {userRole === 'website_admin' && (
                            <NavBtn label="Rack Manager" icon={<Building2 size={18} />} active={activeTab === 'manager'} onClick={() => setActiveTab('manager')} />
                        )}
                    </div>
                </div>
            </div>

            <main className="space-y-8">

                {/* WAREHOUSE MAP TAB */}
                {activeTab === 'warehouse' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800">MRD Physical Map</h2>
                                <p className="text-sm sm:text-base text-slate-400 font-medium">Visual occupancy and capacity monitoring</p>
                            </div>
                            <div className="flex flex-wrap gap-3 sm:gap-4">
                                <StatusLegend color="bg-emerald-500" label="Available" />
                                <StatusLegend color="bg-amber-500" label="Near Capacity" />
                                <StatusLegend color="bg-red-500" label="Full" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {warehouseData.map((aisleData) => (
                                <div key={aisleData.aisle} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-black text-lg text-indigo-950 flex items-center gap-2">
                                            <MapPin size={22} className="text-indigo-600" />
                                            Aisle {aisleData.aisle}
                                        </h3>
                                        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                            Zone: {aisleData.aisle < 3 ? 'A' : 'B'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {aisleData.racks.map(rack => (
                                            <RackCard key={rack.id} rack={rack} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {warehouseData.length === 0 && (
                                <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No warehouse layout data available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'scanner' && (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-4 sm:p-8 animate-in fade-in duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800">File Movement Scanner</h2>
                            <p className="text-sm sm:text-base text-slate-400 font-medium">Scan patient files for check-in/check-out</p>
                        </div>

                        {!scanResult ? (
                            <div className="space-y-8">
                                {/* Camera Toggle */}
                                <div className="flex justify-center mb-6">
                                    {!useCamera ? (
                                        <button onClick={() => setUseCamera(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-100 font-bold text-slate-600 rounded-full hover:bg-slate-200 transition">
                                            <Camera size={20} /> Use Camera
                                        </button>
                                    ) : (
                                        <button onClick={stopCamera} className="flex items-center gap-2 px-6 py-3 bg-red-100 font-bold text-red-600 rounded-full hover:bg-red-200 transition">
                                            <StopCircle size={20} /> Stop Scanning
                                        </button>
                                    )}
                                </div>

                                {useCamera ? (
                                    <div className="max-w-md mx-auto bg-slate-100 rounded-2xl overflow-hidden border-4 border-slate-200">
                                        <div id="reader" className="w-full"></div>
                                        <p className="text-center py-2 text-xs font-bold text-slate-400">Point at a QR Code or Barcode</p>
                                    </div>
                                ) : (
                                    <div className="max-w-md mx-auto relative">
                                        <input
                                            autoFocus
                                            type="text"
                                            className="w-full bg-slate-50 border-2 border-indigo-100 rounded-2xl px-6 py-6 font-mono text-2xl font-bold text-center text-slate-800 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-sans placeholder:text-lg"
                                            placeholder="Scan Barcode / Type UHID..."
                                            value={scanInput}
                                            onChange={e => setScanInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleRealScan()}
                                            disabled={isScanning}
                                        />
                                        {isScanning && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Loader2 className="animate-spin text-indigo-600" size={24} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => handleRealScan()}
                                        disabled={isScanning || !scanInput}
                                        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                                    >
                                        <Scan size={20} />
                                        {isScanning ? 'Searching...' : 'Process Scan'}
                                    </button>
                                </div>

                                <p className="text-xs text-slate-400 font-medium">
                                    Supports UHID, MRD Number, or Patient Name. <br />
                                    <span className="opacity-70">Focus the input field and use your barcode scanner.</span>
                                </p>
                            </div>
                        ) : (
                            <div className="animate-in zoom-in-95 duration-300">
                                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 inline-flex items-center gap-4 mb-8">
                                    <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><CheckCircle2 size={24} /></div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Scan Successful</p>
                                        <h3 className="font-black text-slate-800 text-lg">{scanResult.name}</h3>
                                        <p className="text-xs font-bold text-slate-500">{scanResult.uhid}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <ActionButton
                                        icon={<MapPin size={32} />}
                                        label="Check-In"
                                        sub="Return to Warehouse"
                                        color="emerald"
                                        onClick={() => processMovement('CHECK-IN')}
                                    />
                                    <ActionButton
                                        icon={<ArrowLeftRight size={32} />}
                                        label="Check-Out"
                                        sub="Issue to Doctor"
                                        color="blue"
                                        onClick={() => processMovement('CHECK-OUT')}
                                    />
                                </div>
                                <button onClick={() => setScanResult(null)} className="text-slate-400 font-bold text-sm hover:text-slate-600 underline">Cancel</button>
                            </div>
                        )}
                    </div>
                )}

                {/* GENERATOR TAB */}
                {
                    activeTab === 'generator' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
                                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-950">
                                    <Search size={20} className="text-indigo-600" /> Find Patient File
                                </h2>
                                <div className="flex gap-3 mb-8">
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-100 border-transparent rounded-2xl px-6 py-4 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Enter UHID..."
                                        value={uhidSearch}
                                        onChange={e => setUhidSearch(e.target.value)}
                                    />
                                    <button onClick={handleSearch} className="bg-indigo-600 text-white px-8 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                        Search
                                    </button>
                                </div>
                                {selectedPatient ? (
                                    <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><User size={24} /></div>
                                                <div>
                                                    <h3 className="font-black text-slate-800 text-lg leading-tight">{selectedPatient.name}</h3>
                                                    <p className="text-indigo-600 text-sm font-bold uppercase tracking-widest">{selectedPatient.uhid}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1 mt-6">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Warehouse Location</p>
                                            <p className="text-sm font-semibold">{selectedPatient.location}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                        <FileText size={48} className="text-slate-200 mx-auto mb-3" />
                                        <p className="text-slate-400 font-medium">Search for a patient to generate label</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                <h2 className="text-lg font-bold mb-8 text-slate-400 flex items-center gap-2"><Printer size={18} /> Printer Preview</h2>
                                {selectedPatient ? (
                                    <div className="bg-white p-6 rounded-2xl max-w-[260px] mx-auto text-slate-900 relative">
                                        <div className="border-b-2 border-dashed border-slate-200 pb-3 mb-3 text-center">
                                            <p className="text-[9px] font-black uppercase tracking-[2px] text-indigo-600">Digifort Labs</p>
                                        </div>
                                        <div className="bg-slate-100 p-4 mb-3 flex justify-center"><QrCode size={100} className="text-slate-800" /></div>
                                        <div className="text-center">
                                            <h4 className="font-black text-sm uppercase">{selectedPatient.name}</h4>
                                            <p className="text-[10px] font-bold text-indigo-600">{selectedPatient.uhid}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-slate-700 italic border border-slate-800 rounded-2xl border-dashed">No Data</div>
                                )}
                                <div className="mt-8 flex gap-4">
                                    <button disabled={!selectedPatient} className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-black text-sm hover:bg-slate-100 disabled:opacity-20">Print Label</button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* HISTORY/LOGS TAB */}
                {activeTab === 'logs' && (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
                        <div className="p-4 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-800">Movement History</h2>
                            <p className="text-slate-400 text-sm font-medium">Tracking all physical file check-ins and check-outs.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-4">Type</th>
                                        <th className="px-8 py-4">Patient / UHID</th>
                                        <th className="px-8 py-4">Destination</th>
                                        <th className="px-8 py-4">Timestamp</th>
                                        <th className="px-8 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.length > 0 ? logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border",
                                                    log.type === 'CHECK-IN' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                                )}>
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-slate-800 text-sm">{log.name}</p>
                                                <p className="text-xs font-mono text-slate-400">{log.uhid}</p>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-medium text-slate-600">{log.dest}</td>
                                            <td className="px-8 py-6 text-xs text-slate-400 font-medium">
                                                {new Date(log.time).toLocaleString()}
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase">
                                                    <CheckCircle2 size={14} /> {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">No movement logs found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* RACK MANAGER TAB */}
                {
                    activeTab === 'manager' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">Rack Management</h2>
                                    <p className="text-slate-400 font-medium">Configure warehouse layout and aisles</p>
                                </div>
                                <button
                                    onClick={() => setIsCreatingRack(!isCreatingRack)}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    {isCreatingRack ? <History size={18} /> : <ScanLine size={18} />}
                                    {isCreatingRack ? "Cancel" : "Add New Rack"}
                                </button>
                            </div>

                            {/* Create Rack Form */}
                            {isCreatingRack && (
                                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-indigo-100 animate-in slide-in-from-top-4">
                                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <Building2 className="text-indigo-600" /> {editingRack ? "Update Rack Details" : "New Rack Details"}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Rack Label</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Rack-A1"
                                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                                value={rackForm.label}
                                                onChange={e => setRackForm({ ...rackForm, label: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Aisle Number</label>
                                            <select
                                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                                value={rackForm.aisle}
                                                onChange={e => setRackForm({ ...rackForm, aisle: parseInt(e.target.value) })}
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                    <option key={n} value={n}>Aisle {n}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Capacity (Boxes)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                                value={rackForm.capacity}
                                                onChange={e => setRackForm({ ...rackForm, capacity: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleCreateRack}
                                            className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
                                        >
                                            Create Rack
                                        </button>
                                    </div>
                                </div>
                            )}



                            {/* Box Creation Modal */}
                            {isCreatingBox && selectedRackForBox && (
                                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">{editingBox ? `Edit Box in ${selectedRackForBox.label}` : `Add Box to ${selectedRackForBox.label}`}</h3>
                                        <p className="text-slate-400 text-sm mb-6">{editingBox ? "Update current storage box details." : "Create a new storage box in this rack."}</p>

                                        <div className="space-y-4 mb-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Box Label</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. BOX-A1-001"
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                                    value={boxForm.label}
                                                    onChange={e => setBoxForm({ ...boxForm, label: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Capacity (Files)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                                    value={boxForm.capacity}
                                                    onChange={e => {
                                                        const val = parseInt(e.target.value);
                                                        setBoxForm({ ...boxForm, capacity: isNaN(val) ? 0 : val });
                                                    }}
                                                />
                                                <p className="text-[10px] text-slate-400 font-bold">Standard capacity is 50 files.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => { setIsCreatingBox(false); setSelectedRackForBox(null); setEditingBox(null); }}
                                                className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleCreateBox}
                                                className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors"
                                            >
                                                {editingBox ? "Update Box" : "Create Box"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Assignment Modal */}
                            {isAssigning && selectedBoxForAssignment && (
                                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Assign File to Box</h3>
                                        <p className="text-slate-400 text-sm mb-6">Enter Patient UHID/Name to assign to <b>{selectedBoxForAssignment.label}</b></p>

                                        <div className="space-y-4 mb-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Patient UHID or Record ID</label>
                                                <select
                                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                                    value={assignForm.patientId}
                                                    onChange={e => setAssignForm({ ...assignForm, patientId: e.target.value })}
                                                >
                                                    <option value="">Select a Patient...</option>
                                                    {unassignedPatients.map(p => (
                                                        <option key={p.record_id} value={p.record_id}>
                                                            {p.full_name} ({p.uhid || p.patient_u_id})
                                                        </option>
                                                    ))}
                                                </select>
                                                {unassignedPatients.length === 0 && (
                                                    <p className="text-[10px] text-red-500 mt-1 font-bold">No unassigned patients found.</p>
                                                )}
                                                <p className="text-[10px] text-slate-400">Enter the numeric Record ID (for demo) or UHID.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => { setIsAssigning(false); setSelectedBoxForAssignment(null); }}
                                                className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleAssignPatient}
                                                className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Racks List */}
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                                            <th className="px-8 py-5">Rack ID</th>
                                            <th className="px-8 py-5">Label</th>
                                            <th className="px-8 py-5">Location</th>
                                            <th className="px-8 py-5">Contents</th>
                                            <th className="px-8 py-5">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {racks.length > 0 ? racks.map(rack => {
                                            const rackBoxes = boxes.filter(b => b.rack_id === rack.rack_id);
                                            return (
                                                <React.Fragment key={rack.rack_id}>
                                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-8 py-6 font-bold text-slate-500">#{rack.rack_id}</td>
                                                        <td className="px-8 py-6 font-black text-slate-800 text-sm">{rack.label}</td>
                                                        <td className="px-8 py-6">
                                                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold">Aisle {rack.aisle}</span>
                                                        </td>
                                                        <td className="px-8 py-6 text-xs font-bold text-slate-500">
                                                            {rackBoxes.length} Boxes / {rack.capacity} Slots
                                                        </td>
                                                        <td className="px-8 py-6 flex items-center gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRackForBox(rack);
                                                                    setIsCreatingBox(true);
                                                                }}
                                                                className="text-emerald-600 hover:text-emerald-800 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"
                                                            >
                                                                <Package size={14} /> Add Box
                                                            </button>
                                                            <button
                                                                onClick={() => toggleRack(rack.rack_id)}
                                                                className="text-slate-500 hover:text-slate-800 font-bold text-xs flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
                                                            >
                                                                {expandedRackId === rack.rack_id ? 'Hide Boxes' : 'View Boxes'}
                                                            </button>
                                                            <button
                                                                onClick={() => openEditRack(rack)}
                                                                className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
                                                            >
                                                                Edit
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {expandedRackId === rack.rack_id && (
                                                        <tr>
                                                            <td colSpan={5} className="px-8 py-4 bg-slate-50/50">
                                                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                                                    <table className="w-full">
                                                                        <thead>
                                                                            <tr className="bg-slate-100 text-[9px] font-bold text-slate-400 uppercase">
                                                                                <th className="px-6 py-3">Box Label</th>
                                                                                <th className="px-6 py-3">Location</th>
                                                                                <th className="px-6 py-3">Capacity</th>
                                                                                <th className="px-6 py-3">Files</th>
                                                                                <th className="px-6 py-3">Action</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {rackBoxes.length > 0 ? rackBoxes.map(box => (
                                                                                <tr key={box.box_id} className="border-t border-slate-50">
                                                                                    <td className="px-6 py-4 font-bold text-slate-700 text-xs">{box.label}</td>
                                                                                    <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                                                                                        {box.rack_row && box.rack_column
                                                                                            ? `R${box.rack_row}:C${box.rack_column}`
                                                                                            : 'UNASSIGNED'}
                                                                                    </td>
                                                                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{box.capacity} Files</td>
                                                                                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{box.patient_count} Assigned</td>
                                                                                    <td className="px-6 py-4 flex items-center gap-2">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setSelectedBoxForAssignment(box);
                                                                                                const token = localStorage.getItem('token');
                                                                                                if (token) fetchUnassignedPatients(token);
                                                                                                setIsAssigning(true);
                                                                                            }}
                                                                                            className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-md"
                                                                                        >
                                                                                            Assign
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => openEditBox(box, rack)}
                                                                                            className="text-slate-500 hover:text-slate-800 text-[10px] font-bold uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-md"
                                                                                        >
                                                                                            Edit
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            )) : (
                                                                                <tr>
                                                                                    <td colSpan={4} className="px-6 py-4 text-center text-xs text-slate-400 italic">No boxes in this rack.</td>
                                                                                </tr>
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">No racks configured. Create one to start.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                }

            </main >

            {/* Global Scan Animation Keyframes */}
            < style jsx global > {`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style >
        </div >
    );
}

// --- Sub Components ---

const NavBtn = ({ label, icon, active, onClick }: any) => (
    <button onClick={onClick} className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
        active ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
    )}>
        {icon} <span className="hidden sm:inline">{label}</span>
    </button>
);

const StatusLegend = ({ color, label }: any) => (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <div className={cn("w-3 h-3 rounded-full", color)}></div> {label}
    </div>
);

const RackCard = ({ rack }: { rack: WarehouseRack }) => {
    let occupancy = rack.occupied; // assumes raw number OR percent
    // if using count vs capacity:
    // occupancy = (rack.occupied / rack.capacity) * 100;

    let color = { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-100', tint: 'bg-emerald-50/50' };

    if (occupancy >= 95) color = { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-100', tint: 'bg-red-50/50' };
    else if (occupancy >= 80) color = { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-100', tint: 'bg-amber-50/50' };

    return (
        <div className={cn("p-4 rounded-2xl border transition-all hover:shadow-md group", color.border, color.tint)}>
            <div className="flex justify-between items-center mb-3">
                <div>
                    <p className="font-bold text-slate-800 text-sm">{rack.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{rack.id}</p>
                </div>
                <div className="text-right">
                    <p className={cn("text-sm font-black", color.text)}>{occupancy}%</p>
                    <p className="text-[10px] text-slate-400 font-medium">Occupied</p>
                </div>
            </div>
            <div className="relative w-full h-3 bg-white/50 rounded-full overflow-hidden border border-white">
                <div className={cn("absolute top-0 left-0 h-full transition-all duration-1000", color.bg)} style={{ width: `${occupancy}%` }}></div>
            </div>
        </div>
    );
};

const ActionButton = ({ icon, label, sub, color, onClick }: any) => (
    <button onClick={onClick} className={cn(
        "p-6 rounded-[2rem] bg-white border-2 border-slate-100 transition-all group flex flex-col items-center gap-2 hover:shadow-lg active:scale-95",
        color === 'emerald' ? 'hover:border-emerald-500 hover:bg-emerald-50' : 'hover:border-blue-500 hover:bg-blue-50'
    )}>
        <div className={cn(
            "p-3 rounded-2xl transition-all text-slate-400 group-hover:text-white",
            color === 'emerald' ? 'bg-slate-50 group-hover:bg-emerald-500' : 'bg-slate-50 group-hover:bg-blue-500'
        )}>
            {icon}
        </div>
        <span className="font-black text-slate-800">{label}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{sub}</span>
    </button>
);
