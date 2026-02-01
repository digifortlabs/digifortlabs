"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '../../../../config/api';
import { toTitleCase, toUpperCaseMRD } from '@/lib/formatters';
import { Search, Upload, X, Plus, FileText, Trash2, CheckCircle, AlertCircle, Loader2, PlayCircle, FileType, Building2, User, Camera, Monitor } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import DigitizationScanner from '@/components/Scanner/DigitizationScanner';

type UploadStatus = 'pending' | 'compressing' | 'uploading' | 'processing' | 'completed' | 'error';

interface FileQueueItem {
    id: string; // Unique ID for key
    originalFile: File;
    compressedFile?: File;
    status: UploadStatus;
    progress: number;
    error?: string;
    backendFileId?: number;
}

export default function PatientUploadPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialPatientId = searchParams.get('patient_id');

    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Superadmin / Staff Logic
    const [userProfile, setUserProfile] = useState<any>(null);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

    // Upload Queue State
    const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
    const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);

    const [showScanner, setShowScanner] = useState(false);
    const [isLaunchingDesktopApp, setIsLaunchingDesktopApp] = useState(false);
    const abortControllers = useRef<{ [key: string]: XMLHttpRequest }>({});

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (userProfile && (userProfile.role === 'website_admin' || userProfile.role === 'website_staff')) {
            fetchHospitals();
        } else if (userProfile) {
            // Regular hospital staff
            fetchPatients();
        }
    }, [userProfile]);

    // Refetch patients when hospital selection changes (for superusers)
    useEffect(() => {
        if (selectedHospitalId) {
            fetchPatients();
        }
    }, [selectedHospitalId]);

    // Auto-refresh when user returns to tab (for Desktop Scanner visibility)
    useEffect(() => {
        const onFocus = () => {
            const token = localStorage.getItem('token');
            if (token) {
                fetchPatients();
            }
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [selectedHospitalId]);

    const fetchUserProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');
        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserProfile(data);
                // If standard user, their ID is fixed
                if (data.hospital_id) setSelectedHospitalId(data.hospital_id);
            }
        } catch (e) { console.error(e); }
    };

    const fetchHospitals = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/hospitals/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setHospitals(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchPatients = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            // Append hospital_id filter if selected (and user is privileged)
            let url = `${API_URL}/patients/`;
            if (selectedHospitalId && (userProfile?.role === 'website_admin' || userProfile?.role === 'website_staff')) {
                url += `?hospital_id=${selectedHospitalId}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
                if (initialPatientId) {
                    const match = data.find((p: any) => p.record_id == initialPatientId);
                    if (match) setSelectedPatient(match);
                }
            }
        } catch (e) { console.error(e); }
    };

    const filteredPatients = patients.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patient_u_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenNativeScanner = () => {
        if (!selectedPatient) {
            alert("Please select a patient first.");
            return;
        }
        const token = localStorage.getItem('token') || '';
        const patientId = selectedPatient?.record_id || '';
        const patientName = selectedPatient?.full_name || '';
        const mrd = selectedPatient?.patient_u_id || '';

        // Protocol: digifort://upload?token=...&patient_id=...&patient_name=...&mrd=...
        const url = `digifort://upload?token=${token}&patient_id=${patientId}&patient_name=${encodeURIComponent(patientName)}&mrd=${encodeURIComponent(mrd)}&api_url=${encodeURIComponent(API_URL)}`;

        window.location.href = url;
        setIsLaunchingDesktopApp(true);
    };

    const handleScannerComplete = (file: File) => {
        const newItem: FileQueueItem = {
            id: Math.random().toString(36).substr(2, 9),
            originalFile: file,
            status: 'pending',
            progress: 0
        };
        setFileQueue(prev => [...prev, newItem]);
        setShowScanner(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                originalFile: file,
                status: 'pending' as UploadStatus,
                progress: 0
            }));
            setFileQueue(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (id: string) => {
        if (isUploadingGlobal) return; // Prevent removing while uploading
        setFileQueue(prev => prev.filter(f => f.id !== id));
    };

    const compressFile = async (file: File): Promise<File> => {
        if (file.type.startsWith('image/')) {
            const options = {
                maxSizeMB: 0.5, // Reduced from 1MB to 0.5MB to stay well under Nginx limits
                maxWidthOrHeight: 1600, // Reduced slightly for better compression
                useWebWorker: true,
                initialQuality: 0.7
            };
            try {
                console.log(`Compresing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
                const compressed = await imageCompression(file, options);
                console.log(`Compressed result: ${(compressed.size / 1024 / 1024).toFixed(2)} MB`);
                return compressed;
            } catch (error) {
                console.error("Compression failed:", error);
                return file; // Fallback to original
            }
        }
        return file; // Return original for non-images (PDFs handled by DigitizationScanner or Backend)
    };

    const uploadSingleFile = (item: FileQueueItem, token: string) => {
        return new Promise<number>((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', item.compressedFile || item.originalFile);

            const xhr = new XMLHttpRequest();
            abortControllers.current[item.id] = xhr;

            xhr.open('POST', `${API_URL}/patients/${selectedPatient.record_id}/upload`, true);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const pct = Math.round((e.loaded / e.total) * 100);
                    setFileQueue(prev => prev.map(f =>
                        f.id === item.id ? { ...f, status: 'uploading', progress: pct } : f
                    ));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.file_id);
                } else {
                    reject(xhr.responseText);
                }
            };

            xhr.onerror = () => reject("Network Error");
            xhr.send(formData);
        });
    };

    const startProcessing = async () => {
        if (fileQueue.length === 0 || !selectedPatient) return;
        setIsUploadingGlobal(true);
        const token = localStorage.getItem('token') || '';

        // Process sequentially
        for (const item of fileQueue) {
            if (item.status === 'completed') continue;

            // 1. Compression
            if (item.status === 'pending') {
                setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'compressing', progress: 0 } : f));
                try {
                    const compressed = await compressFile(item.originalFile);
                    // Update queue with compressed file
                    setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, compressedFile: compressed } : f));
                    item.compressedFile = compressed; // Update local ref
                } catch (e) {
                    console.error("Compression skipped", e);
                }
            }

            // 2. Upload
            try {
                setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading', progress: 0 } : f));
                const fileId = await uploadSingleFile(item, token);

                // 3. Mark Complete (Skip processing polling for MVP speed, assume server handles it)
                setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'completed', progress: 100, backendFileId: fileId } : f));

            } catch (error) {
                setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: String(error) } : f));
            }
        }

        setIsUploadingGlobal(false);
        alert("Queue Processing Finished!");
    };

    // Patient Form Logic (Same as before)
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [newPatient, setNewPatient] = useState({
        full_name: '',
        patient_u_id: '',
        uhid: '',
        age: '',
        gender: '',
        address: '',
        contact_number: '',
        email_id: '',
        aadhaar_number: '',
        dob: '',
        discharge_date: ''
    });
    const [isExisting, setIsExisting] = useState(false);
    const handleCreatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            // Validation
            if (!newPatient.full_name || !newPatient.patient_u_id || !newPatient.age || !newPatient.gender || !newPatient.contact_number) {
                alert("Please fill all required fields (*)");
                return;
            }

            // Check if super admin has selected a hospital
            if ((userProfile?.role === 'website_admin' || userProfile?.role === 'website_staff') && !selectedHospitalId) {
                alert("Please select a hospital first.");
                return;
            }

            // Prepare payload
            const payload: any = { ...newPatient };
            payload.dob = newPatient.dob ? new Date(newPatient.dob).toISOString() : null;
            payload.discharge_date = newPatient.discharge_date ? new Date(newPatient.discharge_date).toISOString() : null;

            // Include hospital_id for super admins
            if (selectedHospitalId && (userProfile?.role === 'website_admin' || userProfile?.role === 'website_staff')) {
                payload.hospital_id = selectedHospitalId;
            }

            const res = await fetch(`${API_URL}/patients/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setPatients(prev => [...prev, data]);
                setSelectedPatient(data);
                setShowPatientModal(false);
                // Reset form
                setNewPatient({
                    full_name: '',
                    patient_u_id: '',
                    uhid: '',
                    age: '',
                    gender: '',
                    address: '',
                    contact_number: '',
                    email_id: '',
                    aadhaar_number: '',
                    dob: '',
                    discharge_date: ''
                });
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to create patient");
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message || "Network error occurred."}`);
        }
    };

    // ... Copy other helpers from previous file if needed ...
    // Using simplified helpers for brevity in this multi-edit
    const checkDuplicateMRD = (mrd: string) => {
        const found = patients.find(p => p.patient_u_id?.toLowerCase() === mrd.toLowerCase());
        if (found) {
            setIsExisting(true); setNewPatient({ ...newPatient, full_name: found.full_name, patient_u_id: found.patient_u_id });
            alert("Patient Found! Selected."); setSelectedPatient(found); setShowPatientModal(false);
        }
    };


    return (
        <div className="w-full mx-auto p-6 md:p-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Upload className="text-indigo-600 w-8 h-8" /> Digitization Studio
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Efficiently digitize and organize patient records.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    {/* Hospital Selector for Platform Users */}
                    {(userProfile?.role === 'website_admin' || userProfile?.role === 'website_staff') && (
                        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm">
                            <Building2 size={18} className="text-slate-400" />
                            <select
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none pr-4"
                                value={selectedHospitalId || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedHospitalId(val ? parseInt(val) : null);
                                    setSelectedPatient(null); // Reset patient on hospital change
                                }}
                            >
                                <option value="">Select Hospital</option>
                                {hospitals.map(h => (
                                    <option key={h.hospital_id} value={h.hospital_id}>{h.legal_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        disabled={!selectedHospitalId}
                        onClick={() => setShowPatientModal(true)}
                        className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl transition-all active:scale-95 ${!selectedHospitalId ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'}`}
                    >
                        <Plus size={20} /> New Patient
                    </button>
                </div>
            </div>

            {/* Scanner Viewport */}
            {showScanner && (
                <DigitizationScanner
                    onComplete={handleScannerComplete}
                    onCancel={() => setShowScanner(false)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Panel: Patient Selection */}
                <div className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-indigo-100/50 overflow-hidden flex flex-col h-[700px]">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Current Patient</label>
                        {selectedPatient ? (
                            <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                                    <FileText size={64} />
                                </div>
                                <h3 className="text-xl font-bold mb-1 relative z-10">{selectedPatient.full_name}</h3>
                                <p className="text-indigo-200 font-mono text-sm relative z-10">{selectedPatient.patient_u_id}</p>
                                <button onClick={() => setSelectedPatient(null)} className="absolute top-3 right-3 text-white/50 hover:text-white p-1 rounded-full bg-black/10 hover:bg-black/20 transition z-20">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                                <p className="text-sm font-semibold">No Patient Selected</p>
                            </div>
                        )}

                        <div className="mt-6 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search Patients..."
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {filteredPatients.map(p => (
                            <div key={p.record_id} onClick={() => setSelectedPatient(p)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border flex items-center justify-between group ${selectedPatient?.record_id === p.record_id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:border-slate-200 hover:shadow-md'}`}>
                                <div>
                                    <p className={`font-bold text-sm ${selectedPatient?.record_id === p.record_id ? 'text-indigo-700' : 'text-slate-700'}`}>{p.full_name}</p>
                                    <p className="text-xs text-slate-400 font-mono">{p.patient_u_id}</p>
                                </div>
                                {selectedPatient?.record_id === p.record_id && <CheckCircle className="text-indigo-600" size={16} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Upload Queue */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Drop Zone */}
                    <div className={`relative group transition-all duration-300 ${!selectedPatient ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[2.5rem] opacity-20 blur-xl group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative bg-white border-4 border-dashed border-slate-100 hover:border-indigo-300 rounded-[2rem] p-10 text-center transition-all cursor-pointer overflow-hidden">
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                onChange={handleFileSelect}
                            />

                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                <Upload className="text-indigo-600" size={32} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Upload Records</h2>
                            <p className="text-slate-500 font-medium">Drag & Drop or Click to Select</p>
                            <div className="flex items-center justify-center gap-3 mt-6">
                                <p className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Supports PDF, Images, Videos</p>
                                <div className="h-4 w-[1px] bg-slate-200"></div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowScanner(true); }}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1.5 transition active:scale-95 relative z-30"
                                >
                                    <Camera size={12} /> Browser Scan
                                </button>
                                <div className="h-4 w-[1px] bg-slate-200"></div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenNativeScanner(); }}
                                    className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1 rounded-full flex items-center gap-1.5 transition active:scale-95 relative z-30"
                                >
                                    <PlayCircle size={12} /> Desktop App
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Queue List */}
                    {fileQueue.length > 0 && (
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex-1 flex flex-col h-[500px]">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    Upload Queue ({fileQueue.filter(f => f.status === 'completed').length}/{fileQueue.length})
                                </h3>
                                {!isUploadingGlobal && (
                                    <button onClick={startProcessing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition active:scale-95">
                                        Start All Uploads
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {fileQueue.map((item) => (
                                    <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">

                                        {/* Progress Bar Background */}
                                        {(item.status === 'uploading' || item.status === 'compressing') && (
                                            <div className="absolute bottom-0 left-0 h-1 bg-indigo-50 w-full">
                                                <div
                                                    className={`h-full transition-all duration-300 ${item.status === 'compressing' ? 'bg-amber-400 w-full animate-pulse' : 'bg-indigo-500'}`}
                                                    style={{ width: item.status === 'uploading' ? `${item.progress}%` : '100%' }}
                                                ></div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 relative z-10">
                                            {/* Icon */}
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                                                {item.originalFile.type.includes('image') ? <FileType size={20} /> : <PlayCircle size={20} />}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-slate-700 truncate">{item.originalFile.name}</p>
                                                    {item.status === 'pending' && <X size={16} className="text-slate-300 cursor-pointer hover:text-red-500" onClick={() => removeFile(item.id)} />}
                                                </div>

                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-mono text-slate-400">{(item.originalFile.size / 1024 / 1024).toFixed(2)} MB</span>

                                                    {/* Status Badges */}
                                                    {item.status === 'pending' && <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wide">Waiting</span>}
                                                    {item.status === 'compressing' && <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full uppercase tracking-wide flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Optimizing</span>}
                                                    {item.status === 'uploading' && <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full uppercase tracking-wide flex items-center gap-1">Uploading {item.progress}%</span>}
                                                    {item.status === 'completed' && <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-600 rounded-full uppercase tracking-wide flex items-center gap-1"><CheckCircle size={10} /> Done</span>}
                                                    {item.status === 'error' && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full uppercase tracking-wide">Error</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Patient Registration Modal */}
            {showPatientModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                    <User className="text-indigo-600" size={24} />
                                    Quick Patient Registration
                                </h2>
                                <button
                                    onClick={() => setShowPatientModal(false)}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleCreatePatient} className="space-y-6">
                                {/* Hospital Selector (for super admins) */}
                                {(userProfile?.role === 'website_admin' || userProfile?.role === 'website_staff') && (
                                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            <Building2 size={16} className="inline mr-2" />
                                            Hospital <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            required
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold"
                                            value={selectedHospitalId || ''}
                                            onChange={(e) => setSelectedHospitalId(e.target.value ? parseInt(e.target.value) : null)}
                                        >
                                            <option value="">Select Hospital</option>
                                            {hospitals.map(h => (
                                                <option key={h.hospital_id} value={h.hospital_id}>{h.legal_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Patient Identity Section */}
                                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Patient Identity</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium"
                                                placeholder="Patient Full Name"
                                                value={newPatient.full_name}
                                                onChange={e => setNewPatient({ ...newPatient, full_name: toTitleCase(e.target.value) })}
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                MRD Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono font-bold"
                                                placeholder="MRD Number"
                                                value={newPatient.patient_u_id}
                                                onChange={e => {
                                                    const v = toUpperCaseMRD(e.target.value);
                                                    setNewPatient({ ...newPatient, patient_u_id: v });
                                                    if (v.length >= 3) checkDuplicateMRD(v);
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Age <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="number"
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                                placeholder="Age"
                                                value={newPatient.age}
                                                onChange={e => setNewPatient({ ...newPatient, age: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Gender <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                                value={newPatient.gender}
                                                onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                Contact Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="tel"
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                                placeholder="Mobile Number"
                                                value={newPatient.contact_number}
                                                onChange={e => setNewPatient({ ...newPatient, contact_number: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowPatientModal(false)}
                                        className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Register Patient
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop App Launch Overlay */}
            {isLaunchingDesktopApp && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-12 max-w-lg w-full text-center shadow-2xl relative overflow-hidden border border-white/20">
                        {/* Decorative background element */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Monitor className="text-indigo-600 animate-pulse" size={40} />
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Scanner App Active</h2>

                            <div className="flex flex-col gap-2 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Session</p>
                                <p className="text-xl font-bold text-slate-800">{selectedPatient?.full_name}</p>
                                <p className="text-sm font-mono font-bold text-indigo-600">{selectedPatient?.patient_u_id}</p>
                            </div>

                            <p className="text-slate-500 font-medium mb-10 leading-relaxed px-4">
                                The desktop scanner app has been launched. Please complete your scanning process there.
                            </p>

                            <button
                                onClick={() => setIsLaunchingDesktopApp(false)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                            >
                                <CheckCircle size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                Finished Scanning
                            </button>

                            <p className="mt-6 text-xs text-slate-400 font-medium">
                                Once you close the app, click the button above to return.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
