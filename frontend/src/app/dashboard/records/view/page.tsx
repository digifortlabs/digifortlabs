'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { Upload, X, Loader2, PlayCircle, FileType, CheckCircle, Stethoscope, Activity, Plus, Trash2, Search, Syringe, Camera, Sparkles, Monitor, Download } from 'lucide-react';
import DigitizationScanner from '@/components/Scanner/DigitizationScanner';

import { API_URL } from '@/config/api';

interface FileData {
    file_id: number;
    filename: string;
    upload_date: string;
    file_size_mb: number;
    upload_status: string;
    is_searchable: boolean;
    tags?: string;
    ocr_text?: string;
    is_deletion_pending?: boolean;
    page_count?: number;
    price_per_file?: number;
    included_pages?: number;
    price_per_extra_page?: number;
    processing_stage?: string;
}

interface PatientDetail {
    record_id: number;
    patient_u_id: string; // MRD
    uhid?: string;
    full_name: string;
    age?: number;
    gender?: string;
    contact_number?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    email_id?: string;
    aadhaar_number?: string;
    discharge_date?: string;
    files: FileData[];
    physical_box_id?: number;
    box_label?: string;
    box_location_code?: string;
    price_per_file: number;
    included_pages: number;
    price_per_extra_page: number;
}

interface Box {
    box_id: number;
    label: string;
    location_code: string;
}

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

interface ICD11Code {
    code: string;
    description: string;
    chapter?: string;
}

interface Diagnosis {
    diagnosis_id: number;
    code: string;
    description: string;
    notes?: string;
    diagnosed_at: string;
    diagnosed_by_name?: string;
}

interface ICD11Procedure {
    code: string;
    description: string;
}

interface Procedure {
    procedure_id: number;
    code: string;
    description: string;
    notes?: string;
    performed_at: string;
    performed_by_name?: string;
}

function PatientDetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [viewTextFile, setViewTextFile] = useState<FileData | null>(null);

    const [patient, setPatient] = useState<PatientDetail | null>(null);
    const [userRole, setUserRole] = useState('');

    // File Queue System
    const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const abortControllers = useRef<{ [key: string]: XMLHttpRequest }>({});

    // ICD-11 State
    const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
    const [showDiagModal, setShowDiagModal] = useState(false);
    const [diagSearch, setDiagSearch] = useState('');
    const [diagResults, setDiagResults] = useState<ICD11Code[]>([]);
    const [selectedCode, setSelectedCode] = useState<ICD11Code | null>(null);
    const [diagNotes, setDiagNotes] = useState('');

    // Procedures State
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [showProcModal, setShowProcModal] = useState(false);
    const [procSearch, setProcSearch] = useState('');
    const [procResults, setProcResults] = useState<ICD11Procedure[]>([]);
    const [selectedProcCode, setSelectedProcCode] = useState<ICD11Procedure | null>(null);
    const [procNotes, setProcNotes] = useState('');

    // Scanner State
    const [showScanner, setShowScanner] = useState(false);





    // ... (existing useEffects)

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
        if (isUploading) return;
        setFileQueue(prev => prev.filter(f => f.id !== id));
    };

    const compressFile = async (file: File): Promise<File> => {
        if (file.type.startsWith('image/')) {
            try {
                return await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
            } catch (error) { console.error("Compression failed", error); return file; }
        }
        return file;
    };

    const uploadSingleFile = (item: FileQueueItem, token: string) => {
        return new Promise<number>((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', item.compressedFile || item.originalFile);

            const xhr = new XMLHttpRequest();
            abortControllers.current[item.id] = xhr;

            xhr.open('POST', `${API_URL}/patients/${id}/upload`, true);
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
        if (fileQueue.length === 0) return;
        setIsUploading(true);
        const token = localStorage.getItem('token') || '';

        for (const item of fileQueue) {
            if (item.status === 'completed') continue;

            // 1. Compression
            if (item.status === 'pending') {
                setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'compressing', progress: 0 } : f));
                try {
                    const compressed = await compressFile(item.originalFile);
                    setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, compressedFile: compressed } : f));
                    item.compressedFile = compressed;
                } catch (e) { console.error(e); }
            }

            // 2. Upload
            try {
                setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading', progress: 0 } : f));
                const fileId = await uploadSingleFile(item, token);
                setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'completed', progress: 100, backendFileId: fileId } : f));
            } catch (error) {
                setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: String(error) } : f));
            }
        }

        setIsUploading(false);
        alert("Batch Upload Complete!");
        setFileQueue([]); // Clear queue or keep completed? Let's clear for now to refresh list
        if (id) {
            fetchPatient(token, id);
            fetchDiagnoses(token);
            fetchProcedures(token);
        }
    };

    // ICD-11 Helpers
    const fetchDiagnoses = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/icd11/diagnoses/patients/${id}/diagnoses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setDiagnoses(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchProcedures = async (token: string) => {
        try {
            const res = await fetch(`${API_URL}/icd11/patients/${id}/procedures`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setProcedures(await res.json());
        } catch (e) { console.error(e); }
    };

    const searchDiagnoses = async (q: string) => {
        setDiagSearch(q);
        if (q.length < 2) { setDiagResults([]); return; }
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/icd11/diagnoses/search?q=${q}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setDiagResults(await res.json());
        } catch (e) { console.error(e); }
    };

    const searchProcedures = async (q: string) => {
        setProcSearch(q);
        if (q.length < 2) { setProcResults([]); return; }
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/icd11/procedures/search?q=${q}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setProcResults(await res.json());
        } catch (e) { console.error(e); }
    };

    const addDiagnosis = async () => {
        if (!selectedCode) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/icd11/diagnoses/patients/${id}/diagnoses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ code: selectedCode.code, notes: diagNotes })
            });
            if (res.ok) {
                setShowDiagModal(false);
                setSelectedCode(null);
                setDiagNotes('');
                setDiagSearch('');
                fetchDiagnoses(token || '');
                alert("Diagnosis Added!");
            }
        } catch (e) { console.error(e); }
    };

    const addProcedure = async () => {
        if (!selectedProcCode) return;
        const token = localStorage.getItem('token') || '';
        try {
            const res = await fetch(`${API_URL}/icd11/patients/${id}/procedures`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    code: selectedProcCode.code,
                    notes: procNotes
                })
            });
            if (res.ok) {
                setShowProcModal(false);
                setSelectedProcCode(null);
                setProcNotes('');
                setProcSearch('');
                fetchProcedures(token);
                alert("Procedure Added!");
            }
        } catch (e) { console.error(e); }
    };

    const deleteProcedure = async (procId: number) => {
        if (!confirm("Are you sure you want to delete this procedure?")) return;
        const token = localStorage.getItem('token') || '';
        try {
            const res = await fetch(`${API_URL}/icd11/patients/${id}/procedures/${procId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchProcedures(token);
                alert("Procedure Removed.");
            }
        } catch (e) { console.error(e); }
    };

    const deleteDiagnosis = async (diagId: number) => {
        if (!confirm("Remove this diagnosis?")) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/icd11/diagnoses/patients/${id}/diagnoses/${diagId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDiagnoses(token || '');
        } catch (e) { console.error(e); }
    };

    // ... (rest of render logic, replace old upload section)
    // IMPORTANT: I need to replace the old state declarations too.



    // Storage Assign
    const [showBoxModal, setShowBoxModal] = useState(false);
    const [availableBoxes, setAvailableBoxes] = useState<Box[]>([]);
    const [selectedBoxId, setSelectedBoxId] = useState<string>('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Get Role
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);

        if (id) {
            fetchPatient(token, id);
            fetchDiagnoses(token);
        }
    }, [router, id]);


    const [error, setError] = useState<string | null>(null);

    const fetchPatient = async (token: string, patientId: string) => {
        const apiUrl = API_URL;
        setError(null);
        try {
            const res = await fetch(`${apiUrl}/patients/${patientId}?t=${new Date().getTime()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setPatient(await res.json());
            } else {
                const errDetail = await res.text();
                console.error("Fetch Error:", errDetail);
                setError("Patient not found or access denied.");
                // router.push('/dashboard/records'); // Optional: redirect or show error
            }
        } catch (error) {
            console.error(error);
            setError("Failed to load patient data. Please check network connection.");
        }
    };

    // Added Polling for OCR/Processing Stages - Moved here to ensure fetchPatient is defined
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !id || !patient) return;

        const hasProcessing = patient.files.some(f => f.processing_stage === 'analyzing' || f.upload_status === 'draft');

        if (hasProcessing) {
            const interval = setInterval(() => {
                fetchPatient(token, id);
            }, 5000); // Poll every 5 seconds
            return () => clearInterval(interval);
        }
    }, [patient, id]);

    // Auto-refresh when user returns to tab (for Desktop Scanner visibility)
    useEffect(() => {
        const onFocus = () => {
            const token = localStorage.getItem('token');
            if (token && id) {
                console.log("Tab focused, refreshing patient data...");
                fetchPatient(token, id);
            }
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [id]);





    const handleRequestDeletion = async (fileId: number) => {
        const isDirectDelete = userRole === 'hospital_admin' || userRole === 'website_admin';
        const confirmMsg = isDirectDelete
            ? "ARNING: This will PERMANENTLY delete the file. This action cannot be undone. Continue?"
            : "Request deletion for this file? This will require Admin approval.";

        if (!confirm(confirmMsg)) return;

        const token = localStorage.getItem('token');
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/patients/files/${fileId}/request-deletion`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                alert(data.message || "Operation successful.");
                if (id) fetchPatient(token || '', id);
            } else {
                alert(`Failed: ${data.detail || "Unknown error"}`);
            }
        } catch (e) {
            console.error(e);
        }
    }


    const handleConfirmUpload = async (fileId: number) => {
        if (!confirm("Confirm this file for final upload? It will become visible to Admins.")) return;
        const token = localStorage.getItem('token');
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/patients/files/${fileId}/confirm`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                alert("File confirmed and published!");
                if (id) fetchPatient(token || '', id);
            }
        } catch (e) { console.error(e); }
    };

    const handleDiscardDraft = async (fileId: number) => {
        if (!confirm("Discard this draft? This action cannot be undone.")) return;
        const token = localStorage.getItem('token');
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/patients/files/${fileId}/draft`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Draft discarded successfully");
                if (id) fetchPatient(token || '', id);
            }
        } catch (e) { console.error(e); }
    };

    const fetchBoxes = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/storage/boxes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setAvailableBoxes(await res.json());
        } catch (e) { console.error(e); }
    };

    const handleAssignBox = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBoxId) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        const apiUrl = API_URL;

        try {
            const res = await fetch(`${apiUrl}/storage/patients/${id}/assign-box`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ box_id: parseInt(selectedBoxId) })
            });

            if (res.ok) {
                alert("Assigned to Box Successfully");
                setShowBoxModal(false);
                if (id) fetchPatient(token, id);
            } else {
                alert("Failed to assign box");
            }
        } catch (e) { console.error(e); }
    };

    const handleRequestPhysicalFile = async () => {
        if (!patient?.physical_box_id) {
            alert("This patient is not assigned to any physical box.");
            return;
        }
        if (!confirm("Request the physical box containing this file?")) return;

        const token = localStorage.getItem('token');
        const apiUrl = API_URL;

        try {
            const res = await fetch(`${apiUrl}/storage/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    box_id: patient.physical_box_id,
                    requester_name: "Auto"
                })
            });

            if (res.ok) {
                alert("Request sent successfully! Check the 'File Requests' page.");
            } else {
                const data = await res.json();
                alert(`Failed: ${data.detail || "Could not send request"}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network error");
        }
    };



    const handleDeletePatient = async () => {
        const input = prompt(`DANGER ZONE \n\nTo PERMANENTLY delete this patient and ALL their files, type "delete" below:`);
        if (input !== "delete") {
            if (input !== null) alert("Deletion cancelled. You must type 'delete' exactly.");
            return;
        }

        const token = localStorage.getItem('token');
        const apiUrl = API_URL;

        try {
            const res = await fetch(`${apiUrl}/patients/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                alert("Patient record deleted successfully.");
                router.replace('/dashboard/records');
            } else {
                const data = await res.json();
                alert(`Failed: ${data.detail || "Unknown error"}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network error.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="text-red-500 font-bold mb-4">⚠️ Error Loading Patient</div>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!patient) return <div className="p-8 text-center text-slate-500 font-medium">Loading patient record...</div>;

    return (
        <div className="flex-1 p-8">
            <div className="mb-6 flex justify-between items-start">
                <div className="flex-1">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 mb-2 font-medium">← Back to List</button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight">{patient.full_name}</h1>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                            {patient.patient_u_id}
                        </span>
                    </div>

                    {/* Patient Details Grid */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-4 gap-x-8 text-sm border-t border-gray-100 pt-4">
                        {patient.uhid && (
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">UHID</span>
                                <p className="font-bold text-gray-700 font-mono">{patient.uhid}</p>
                            </div>
                        )}
                        {patient.aadhaar_number && (
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Aadhaar No.</span>
                                <p className="font-bold text-gray-700 font-mono tracking-wider">{patient.aadhaar_number.replace(/(\d{4})(?=\d)/g, "$1 ")}</p>
                            </div>
                        )}
                        {(patient.age || patient.gender) && (
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Demographics</span>
                                <p className="font-semibold text-gray-700">
                                    {patient.age ? `${patient.age} Y` : ''}
                                    {patient.age && patient.gender ? ' / ' : ''}
                                    {patient.gender || ''}
                                </p>
                            </div>
                        )}
                        {patient.contact_number && (
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Contact</span>
                                <p className="font-semibold text-gray-700 font-mono">{patient.contact_number}</p>
                            </div>
                        )}
                        {patient.address && (
                            <div className="col-span-2">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Address</span>
                                <p className="font-semibold text-gray-700 truncate" title={patient.address}>
                                    {patient.address} {patient.city ? `, ${patient.city}` : ''}
                                </p>
                            </div>
                        )}
                        {patient.discharge_date && (
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-0.5">Discharged</span>
                                <p className="font-semibold text-gray-700">{new Date(patient.discharge_date).toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Physical Storage - Hidden for Hospital Admin & MRD */}
                {!['hospital_admin', 'mrd_staff'].includes(userRole) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-4 shadow-sm">
                        <div>
                            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">Physical Storage</p>
                            {patient.box_label ? (
                                <div>
                                    <p className="text-lg font-black text-amber-900 flex items-center gap-2">
                                        📦 {patient.box_label}
                                    </p>
                                    {patient.box_location_code && (
                                        <p className="text-xs font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                                            📍 {patient.box_location_code}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Not Assigned</p>
                            )}
                        </div>
                        {(userRole === 'mrd_staff' || userRole === 'website_admin') && (
                            <button
                                onClick={() => {
                                    fetchBoxes();
                                    setShowBoxModal(true);
                                }}
                                className="mt-1 text-xs bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-bold transition-all shadow-sm"
                            >
                                {patient.box_label ? 'Change' : 'Assign'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Digitized Files Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 border-b pb-2">Digitized Files ({patient.files.length})</h2>

                {patient.files.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {patient.files.map((file) => (
                            <div key={file.file_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-2 rounded-lg ${file.upload_status === 'draft' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-600'}`}>
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 block">{new Date(file.upload_date).toLocaleDateString()}</span>
                                        {file.upload_status === 'draft' && <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">DRAFT</span>}
                                    </div>
                                </div>
                                <h3 className="font-medium text-gray-800 truncate" title={file.filename}>{file.filename}</h3>
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs text-gray-500">{file.file_size_mb ? file.file_size_mb.toFixed(2) : 0} MB</p>
                                    <p className="text-xs font-bold text-slate-700">{file.page_count || 0} Pages</p>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                        {(() => {
                                            const basePrice = file.price_per_file ?? patient.price_per_file ?? 100;
                                            const included = file.included_pages ?? patient.included_pages ?? 20;
                                            const extraFee = file.price_per_extra_page ?? patient.price_per_extra_page ?? 1;
                                            const pages = file.page_count || 0;
                                            const extraPages = Math.max(0, pages - included);
                                            const totalCost = basePrice + (extraPages * extraFee);
                                            return `₹${totalCost.toFixed(2)}`;
                                        })()}
                                    </p>
                                    {file.is_searchable && (
                                        <span
                                            className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer hover:bg-green-200"
                                            onClick={() => setViewTextFile(file)}
                                            title="Text Extracted & Indexed"
                                        >
                                            🔍 SEARCHABLE
                                        </span>
                                    )}
                                    {file.upload_status === 'confirmed' && !file.is_searchable && file.processing_stage === 'analyzing' && (
                                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                            <Loader2 size={10} className="animate-spin" /> ANALYZING OCR...
                                        </span>
                                    )}
                                </div>

                                {/* Tags Section */}
                                <div className="mb-3">
                                    <div className="flex flex-wrap gap-1 mb-1">
                                        {file.tags ? file.tags.split(',').map(t => (
                                            <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg border border-indigo-100 flex items-center gap-1">
                                                {file.is_searchable && <Sparkles size={8} className="text-indigo-400" />}
                                                #{t.trim()}
                                            </span>
                                        )) : (
                                            <span className="text-[10px] text-gray-300 italic">No tags identified</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center w-full">
                                        <button
                                            onClick={() => {
                                                const newTags = prompt("Enter tags (comma separated):", file.tags || "");
                                                if (newTags !== null) {
                                                    fetch(`${API_URL}/patients/files/${file.file_id}/tags`, {
                                                        method: 'PUT',
                                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                                                        body: JSON.stringify({ tags: newTags })
                                                    }).then(res => {
                                                        if (res.ok) alert("Tags saved!");
                                                        window.location.reload();
                                                    });
                                                }
                                            }}
                                            className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition"
                                        >
                                            ✏️ Edit Tags
                                        </button>

                                        <button
                                            onClick={async () => {
                                                const issue = prompt("Issue Type (e.g. Blurry Scan, Missing Page):");
                                                if (!issue) return;
                                                const details = prompt("Details:");
                                                if (!details) return;

                                                try {
                                                    const res = await fetch(`${API_URL}/qa/report`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                                                        body: JSON.stringify({
                                                            file_id: file.file_id,
                                                            issue_type: issue,
                                                            details: details,
                                                            severity: 'medium'
                                                        })
                                                    });
                                                    if (res.ok) alert("Issue reported to QA Monitor");
                                                } catch (e) { console.error(e); }
                                            }}
                                            className="text-[10px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1 transition"
                                        >
                                            ⚠️ Report Issue
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={async () => {
                                            const token = localStorage.getItem('token');
                                            const apiUrl = API_URL;
                                            if (!token) return;
                                            try {
                                                const res = await fetch(`${apiUrl}/patients/files/${file.file_id}/url`, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    window.open(`${data.url}?token=${token}`, '_blank');
                                                } else {
                                                    alert("Could not access file");
                                                }
                                            } catch (e) { console.error(e); }
                                        }}
                                        className="w-full py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100"
                                    >
                                        View Document
                                    </button>

                                    {/* Request Physical File Button */}
                                    {patient.physical_box_id && (
                                        <button
                                            onClick={handleRequestPhysicalFile}
                                            className="w-full py-2 bg-purple-50 text-purple-600 rounded-md text-sm font-medium hover:bg-purple-100 flex items-center justify-center gap-2"
                                        >
                                            Request Physical File
                                        </button>
                                    )}

                                    {file.upload_status === 'draft' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleConfirmUpload(file.file_id)}
                                                className="flex-1 py-1.5 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 transition"
                                            >
                                                ✅ Confirm
                                            </button>
                                            <button
                                                onClick={() => handleDiscardDraft(file.file_id)}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-md text-xs font-bold hover:bg-gray-200 transition"
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    ) : (
                                        file.is_deletion_pending ? (
                                            <div className="text-center py-2 bg-amber-50 text-amber-700 rounded-md text-[10px] font-bold border border-amber-200">
                                                ⏳ Deletion Pending Approval
                                            </div>
                                        ) : (
                                            userRole !== 'mrd_staff' && (
                                                <button
                                                    onClick={() => handleRequestDeletion(file.file_id)}
                                                    className={`w-full py-1.5 rounded-md text-xs font-semibold border transition ${userRole === 'hospital_admin'
                                                        ? 'text-red-600 hover:bg-red-50 border-red-200'
                                                        : 'text-amber-600 hover:bg-amber-50 border-amber-200'
                                                        }`}
                                                >
                                                    {userRole === 'hospital_admin' || userRole === 'website_admin' ? '🗑️ Delete File' : '🗑️ Request Deletion'}
                                                </button>
                                            )
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p>No files uploaded for this patient.</p>
                    </div>
                )}
                {/* Upload Section for Staff */}
                {(userRole === 'website_staff' || userRole === 'data_uploader' || userRole === 'website_admin' || userRole === 'hospital_admin' || userRole === 'mrd_staff') && (
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase">📤 Digitization Upload</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg shadow-purple-500/30 flex items-center gap-2"
                                >
                                    <Camera size={14} /> Live Scanner
                                </button>
                                <button
                                    onClick={() => {
                                        const token = localStorage.getItem('token');
                                        const protocolUrl = `digifort://upload?token=${token}&patient_id=${patient.record_id}&patient_name=${encodeURIComponent(patient.full_name)}&mrd=${patient.patient_u_id}&api_url=${API_URL}`;
                                        window.open(protocolUrl, '_self');
                                    }}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center gap-2"
                                >
                                    <Monitor size={14} /> Desktop App
                                </button>
                                <a
                                    href="/scanner_app.zip"
                                    download="DigifortScanner_Install.zip"
                                    className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition flex items-center gap-2"
                                >
                                    <Download size={14} /> Install App
                                </a>
                                {fileQueue.length > 0 && !isUploading && (
                                    <button
                                        onClick={startProcessing}
                                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                                    >
                                        <PlayCircle size={14} /> Start Batch ({fileQueue.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Drop Zone */}
                        <div className={`relative group transition-all duration-300 ${isUploading ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-20 blur group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-white border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-6 text-center transition-all cursor-pointer overflow-hidden">
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf, .mp4, .mov, .avi, .mkv"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    onChange={handleFileSelect}
                                    disabled={isUploading}
                                />
                                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <Upload className="text-indigo-600" size={20} />
                                </div>
                                <h4 className="text-sm font-black text-slate-700 mb-1">Click to Select Files</h4>
                                <p className="text-[10px] text-slate-400 font-medium whitespace-pre-wrap">PDF, MP4, MOV, MKV (Max 100MB)</p>

                                <div className="flex items-center justify-center gap-3 mt-4 relative z-30 pointer-events-none">
                                    {/* Divider */}
                                    <div className="h-4 w-[1px] bg-slate-200"></div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowScanner(true);
                                        }}
                                        className="pointer-events-auto text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95 border border-indigo-100"
                                    >
                                        <Camera size={14} /> Live Scan
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* File Queue List */}
                        {fileQueue.length > 0 && (
                            <div className="mt-6 space-y-3">
                                {fileQueue.map((item) => (
                                    <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">

                                        {/* Progress Bar Background */}
                                        {(item.status === 'uploading' || item.status === 'compressing') && (
                                            <div className="absolute bottom-0 left-0 h-1 bg-indigo-50 w-full">
                                                <div
                                                    className={`h-full transition-all duration-300 ${item.status === 'compressing' ? 'bg-amber-400 w-full animate-pulse' : 'bg-indigo-500'}`}
                                                    style={{ width: item.status === 'uploading' ? `${item.progress}%` : '100%' }}
                                                ></div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                                                {item.originalFile.type.includes('image') ? <FileType size={16} /> : <PlayCircle size={16} />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-xs text-slate-700 truncate">{item.originalFile.name}</p>
                                                    {item.status === 'pending' && (
                                                        <button onClick={() => removeFile(item.id)} className="text-slate-300 hover:text-red-500">
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-mono text-slate-400">{(item.originalFile.size / 1024 / 1024).toFixed(2)} MB</span>

                                                    {/* Status Badges */}
                                                    {item.status === 'pending' && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] uppercase tracking-wide">Pending</span>}
                                                    {item.status === 'compressing' && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[9px] uppercase tracking-wide flex items-center gap-1"><Loader2 size={8} className="animate-spin" /> Optimizing</span>}
                                                    {item.status === 'uploading' && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-[9px] uppercase tracking-wide flex items-center gap-1">Uploading {item.progress}%</span>}
                                                    {item.status === 'completed' && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-600 rounded text-[9px] uppercase tracking-wide flex items-center gap-1"><CheckCircle size={8} /> Done</span>}
                                                    {item.status === 'error' && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[9px] uppercase tracking-wide">Error</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Clinical Diagnoses Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Stethoscope className="text-indigo-600" size={20} /> Clinical Diagnoses
                    </h2>
                    {(userRole === 'hospital_admin' || userRole === 'website_admin' || userRole === 'website_staff') && (
                        <button
                            onClick={() => setShowDiagModal(true)}
                            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 font-bold transition-all flex items-center gap-1"
                        >
                            <Plus size={14} /> Add Diagnosis
                        </button>
                    )}
                </div>

                {diagnoses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {diagnoses.map(diag => (
                            <div key={diag.diagnosis_id} className="group p-4 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-slate-100/50">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500">
                                            <Activity size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 rounded">{diag.code}</span>
                                                <span className="font-semibold text-slate-700">{diag.description}</span>
                                            </div>
                                            {diag.notes && <p className="text-sm text-slate-500 mt-1 italic">"{diag.notes}"</p>}
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Diagnosed {new Date(diag.diagnosed_at).toLocaleDateString()} by {diag.diagnosed_by_name}
                                            </p>
                                        </div>
                                    </div>
                                    {(userRole === 'hospital_admin' || userRole === 'website_admin') && (
                                        <button
                                            onClick={() => deleteDiagnosis(diag.diagnosis_id)}
                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            title="Remove Diagnosis"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                        <Activity className="mx-auto mb-2 opacity-20" size={32} />
                        <p className="text-sm">No clinical diagnoses recorded.</p>
                    </div>
                )}
            </div>

            {/* Clinical Procedures Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden mb-8">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <Syringe className="text-emerald-600" size={24} />
                            Clinical Procedures
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">ICD-11 Interventions & Surgeries</p>
                    </div>
                    {(userRole === 'hospital_admin' || userRole === 'website_admin' || userRole === 'doctor') && (
                        <button
                            onClick={() => setShowProcModal(true)}
                            className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Procedure
                        </button>
                    )}
                </div>

                {procedures.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Syringe className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-slate-400 font-medium">No procedures recorded.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {procedures.map((proc, idx) => (
                            <div key={idx} className="group p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-sm">
                                                {proc.code}
                                            </span>
                                            <span className="font-bold text-slate-800">{proc.description}</span>
                                        </div>
                                        {proc.notes && (
                                            <p className="text-sm text-slate-600 pl-2 border-l-2 border-slate-200 mt-2 italic">
                                                {proc.notes}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <span className="flex items-center gap-1">
                                                <Activity size={12} />
                                                {new Date(proc.performed_at).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Stethoscope size={12} />
                                                {proc.performed_by_name || 'System'}
                                            </span>
                                        </div>
                                    </div>
                                    {(userRole === 'hospital_admin' || userRole === 'website_admin') && (
                                        <button
                                            onClick={() => deleteProcedure(proc.procedure_id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Remove Procedure"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


            {/* Text View Modal */}

            {/* Text View Modal */}
            {
                viewTextFile && (
                    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
                        <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center border-b pb-4 mb-4">
                                <h3 className="font-bold text-lg text-slate-800">📄 Extracted Text Content</h3>
                                <button onClick={() => setViewTextFile(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 whitespace-pre-wrap">
                                {viewTextFile.ocr_text || "No text content found."}
                            </div>
                            <div className="pt-4 text-right">
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setViewTextFile(null);
                                        // Trigger download logic or close
                                    }}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                >
                                    Close Viewer
                                </a>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Box Assignment Modal */}
            {/* Box Assignment Modal */}
            {
                showBoxModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                            <h2 className="text-lg font-bold mb-4">Assign Physical Box</h2>
                            <form onSubmit={handleAssignBox}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Box</label>
                                    <select
                                        required
                                        className="w-full border rounded p-2"
                                        value={selectedBoxId}
                                        onChange={e => setSelectedBoxId(e.target.value)}
                                    >
                                        <option value="">-- Choose Box --</option>
                                        {availableBoxes.map(b => (
                                            <option key={b.box_id} value={b.box_id}>
                                                {b.label} ({b.location_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowBoxModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold">Save Assignment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Add Diagnosis Modal */}
            {
                showDiagModal && (
                    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-[80] backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    <Stethoscope size={18} className="text-indigo-600" /> Add Clinical Diagnosis (ICD-11)
                                </h3>
                                <button onClick={() => setShowDiagModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {!selectedCode ? (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Search Code / Disease</label>
                                        <div className="relative">
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="e.g. Cholera, 1A00..."
                                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                                value={diagSearch}
                                                onChange={(e) => searchDiagnoses(e.target.value)}
                                            />
                                            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        </div>

                                        {/* Results List */}
                                        <div className="mt-2 max-h-60 overflow-y-auto border border-slate-100 rounded-lg">
                                            {diagResults.length > 0 ? (
                                                diagResults.map(code => (
                                                    <div
                                                        key={code.code}
                                                        onClick={() => setSelectedCode(code)}
                                                        className="p-3 border-b border-slate-50 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group transition-colors"
                                                    >
                                                        <div>
                                                            <span className="font-mono font-bold text-indigo-600 text-sm block">{code.code}</span>
                                                            <span className="text-sm text-slate-700">{code.description}</span>
                                                        </div>
                                                        <Plus size={16} className="text-indigo-400 group-hover:text-indigo-600" />
                                                    </div>
                                                ))
                                            ) : (
                                                diagSearch.length > 1 && (
                                                    <div className="p-4 text-center text-slate-400 text-sm">
                                                        No matching codes found.
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-right-4 duration-300">
                                        <div className="bg-indigo-50 p-4 rounded-lg mb-4 flex items-start gap-3 border border-indigo-100">
                                            <div className="bg-white p-2 rounded text-indigo-600 shadow-sm">
                                                <Activity size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-indigo-900">{selectedCode.code}</h4>
                                                <p className="text-sm text-indigo-700">{selectedCode.description}</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedCode(null)}
                                                className="ml-auto text-indigo-400 hover:text-indigo-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Clinical Notes (Optional)</label>
                                            <textarea
                                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[100px]"
                                                placeholder="Add specific details, severity, or observations..."
                                                value={diagNotes}
                                                onChange={(e) => setDiagNotes(e.target.value)}
                                            ></textarea>
                                        </div>

                                        <button
                                            onClick={addDiagnosis}
                                            className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={18} /> Confirm Diagnosis
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Procedure Modal */}
            {
                showProcModal && (
                    <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center p-4 z-[90] backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                            <div className="px-6 py-4 border-b bg-emerald-50 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-emerald-900 flex items-center gap-2">
                                    <Syringe size={18} className="text-emerald-600" /> Add Procedure (ICD-11)
                                </h3>
                                <button onClick={() => setShowProcModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {!selectedProcCode ? (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Search Procedure</label>
                                        <div className="relative">
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="e.g. Appendectomy, P01A..."
                                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                                                value={procSearch}
                                                onChange={(e) => searchProcedures(e.target.value)}
                                            />
                                            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                        </div>

                                        <div className="mt-2 max-h-60 overflow-y-auto border border-slate-100 rounded-lg">
                                            {procResults.length > 0 ? (
                                                procResults.map((proc, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => setSelectedProcCode(proc)}
                                                        className="p-3 border-b border-slate-50 hover:bg-emerald-50 cursor-pointer flex items-center justify-between group transition-colors"
                                                    >
                                                        <div>
                                                            <span className="font-mono font-bold text-emerald-600 text-sm block">{proc.code}</span>
                                                            <span className="text-sm text-slate-700">{proc.description}</span>
                                                        </div>
                                                        <Plus size={16} className="text-emerald-400 group-hover:text-emerald-600" />
                                                    </div>
                                                ))
                                            ) : (
                                                procSearch.length > 1 && (
                                                    <div className="p-4 text-center text-slate-400 text-sm">
                                                        No matching procedures found.
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-right-4 duration-300">
                                        <div className="bg-emerald-50 p-4 rounded-lg mb-4 flex items-start gap-3 border border-emerald-100">
                                            <div className="bg-white p-2 rounded text-emerald-600 shadow-sm">
                                                <Syringe size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-emerald-900">{selectedProcCode.code}</h4>
                                                <p className="text-sm text-emerald-700">{selectedProcCode.description}</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedProcCode(null)}
                                                className="ml-auto text-emerald-400 hover:text-emerald-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Procedure Notes (Optional)</label>
                                            <textarea
                                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[100px]"
                                                placeholder="Outcome, complications, etc..."
                                                value={procNotes}
                                                onChange={(e) => setProcNotes(e.target.value)}
                                            ></textarea>
                                        </div>

                                        <button
                                            onClick={addProcedure}
                                            className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus size={18} /> Record Procedure
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Live Scanner Modal */}
            {
                showScanner && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="w-full h-full max-w-7xl max-h-[95vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
                            <DigitizationScanner
                                onComplete={async (pdfFile) => {
                                    // Add PDF to queue
                                    const queueItem: FileQueueItem = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        originalFile: pdfFile,
                                        status: 'pending',
                                        progress: 0
                                    };
                                    setFileQueue(prev => [...prev, queueItem]);
                                    setShowScanner(false);
                                    alert(`Scanned PDF added to queue! Click "Start Batch" to upload.`);
                                }}
                                onCancel={() => setShowScanner(false)}
                            />
                        </div>
                    </div>
                )
            }

            <div className="mt-12 pt-8 border-t border-red-100 flex justify-center">
                <button
                    onClick={handleDeletePatient}
                    className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all flex items-center gap-2"
                >
                    <Trash2 size={18} /> Delete Patient Record
                </button>
            </div>
        </div >
    );
}

export default function PatientDetailPage() {
    return (
        <Suspense fallback={<div className="p-8 font-bold text-gray-500">Loading Patient Details...</div>}>
            <PatientDetailContent />
        </Suspense>
    );
}


