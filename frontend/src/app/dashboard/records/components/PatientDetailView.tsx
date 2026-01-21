'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { Upload, X, Loader2, PlayCircle, FileType, CheckCircle, Stethoscope, Activity, Plus, Trash2, Search, Syringe, Camera, Sparkles, Monitor, Download } from 'lucide-react';
import DigitizationScanner from '@/components/Scanner/DigitizationScanner'; // Ensure this path is correct relative to this file
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
    age?: string | number;
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
    patient_category?: string;
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

interface PatientDetailViewProps {
    patientId: number | string;
    onBack?: () => void;
    onDeleteSuccess?: () => void;
}

export default function PatientDetailView({ patientId, onBack, onDeleteSuccess }: PatientDetailViewProps) {
    const router = useRouter();
    const id = String(patientId);

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

    // OCR Editing State
    const [isEditingOCR, setIsEditingOCR] = useState(false);
    const [editedOCRText, setEditedOCRText] = useState("");

    // When opening a text file, initialize the edit state
    useEffect(() => {
        if (viewTextFile) {
            setEditedOCRText(viewTextFile.ocr_text || "");
            setIsEditingOCR(false);
        }
    }, [viewTextFile]);
    const [selectedProcCode, setSelectedProcCode] = useState<ICD11Procedure | null>(null);
    const [procNotes, setProcNotes] = useState('');

    // Scanner State
    const [showScanner, setShowScanner] = useState(false);

    // Storage Assign
    const [showBoxModal, setShowBoxModal] = useState(false);
    const [availableBoxes, setAvailableBoxes] = useState<Box[]>([]);
    const [selectedBoxId, setSelectedBoxId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Get Role
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserRole(payload.role);
        } catch (e) { console.error("Token parse error", e); }

        if (id) {
            fetchPatient(token, id);
            fetchDiagnoses(token);
            fetchProcedures(token);
        }
    }, [id, router]);


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
            }
        } catch (error) {
            console.error(error);
            setError("Failed to load patient data. Please check network connection.");
        }
    };

    // Auto-refresh polling
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !id || !patient) return;

        const hasProcessing = patient.files.some(f => f.processing_stage === 'analyzing' || f.upload_status === 'draft');

        if (hasProcessing) {
            const interval = setInterval(() => {
                fetchPatient(token, id);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [patient, id]);

    // Handlers (Copy-pasted logic mostly)
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
            if (item.status === 'pending') {
                setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'compressing', progress: 0 } : f));
                try {
                    const compressed = await compressFile(item.originalFile);
                    setFileQueue(prev => prev.map(f => f.id === item.id ? { ...f, compressedFile: compressed } : f));
                    item.compressedFile = compressed;
                } catch (e) { console.error(e); }
            }
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
        setFileQueue([]);
        if (id) {
            fetchPatient(token, id);
            fetchDiagnoses(token);
            fetchProcedures(token);
        }
    };

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
                body: JSON.stringify({ code: selectedProcCode.code, notes: procNotes })
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

    const handleRequestDeletion = async (fileId: number) => {
        const isDirectDelete = userRole === 'hospital_admin' || userRole === 'superadmin';
        const confirmMsg = isDirectDelete
            ? "WARNING: This will PERMANENTLY delete the file. This action cannot be undone. Continue?"
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
        } catch (e) { console.error(e); }
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

    const saveOCRText = async () => {
        if (!viewTextFile) return;
        const token = localStorage.getItem('token');
        const apiUrl = API_URL;

        try {
            const res = await fetch(`${apiUrl}/patients/files/${viewTextFile.file_id}/ocr`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ocr_text: editedOCRText })
            });

            if (res.ok) {
                alert("OCR Text Updated Successfully!");
                setIsEditingOCR(false);
                // Update local state to reflect change immediately
                setViewTextFile({ ...viewTextFile, ocr_text: editedOCRText });
                if (id && token) fetchPatient(token, id); // Refresh user data to persist in list
            } else {
                alert("Failed to update text.");
            }
        } catch (e) { console.error(e); alert("Network Error"); }
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ box_id: patient.physical_box_id, requester_name: "Auto" })
            });

            if (res.ok) {
                alert("Request sent successfully! Check the 'File Requests' page.");
            } else {
                const data = await res.json();
                alert(`Failed: ${data.detail || "Could not send request"}`);
            }
        } catch (e) { console.error(e); alert("Network error"); }
    };

    const handleDeletePatient = async () => {
        const input = prompt(`DANGER ZONE \n\nTo PERMANENTLY delete this patient and ALL their files, type "delete" below:`);
        if (input !== "delete") return;

        const token = localStorage.getItem('token');
        const apiUrl = API_URL;

        try {
            const res = await fetch(`${apiUrl}/patients/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                alert("Patient record deleted successfully.");
                if (onDeleteSuccess) onDeleteSuccess();
                else if (onBack) onBack();
            } else {
                const data = await res.json();
                alert(`Failed: ${data.detail || "Unknown error"}`);
            }
        } catch (e) { console.error(e); alert("Network error."); }
    };

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="text-red-500 font-bold mb-4">⚠️ Error Loading Patient</div>
                <p className="text-gray-600 mb-6">{error}</p>
                {onBack && (
                    <button onClick={onBack} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                        Go Back
                    </button>
                )}
            </div>
        );
    }

    if (!patient) return <div className="p-8 text-center text-slate-500 font-medium">Loading patient record...</div>;

    return (
        <div className="flex-1 bg-white h-full overflow-y-auto">
            <div className="p-6">
                <div className="mb-6 flex justify-between items-start">
                    <div className="flex-1">
                        {onBack && (
                            <button onClick={onBack} className="text-gray-500 hover:text-gray-700 mb-2 font-medium flex items-center gap-1">
                                ← Back to List
                            </button>
                        )}
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight">{patient.full_name}</h1>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                                {patient.patient_u_id}
                            </span>
                            {patient.patient_category && patient.patient_category !== 'STANDARD' && (
                                <span className={`px-2 py-0.5 text-xs font-black rounded-full border uppercase tracking-wide
                                    ${patient.patient_category === 'MLC' ? 'bg-red-50 text-red-600 border-red-200' :
                                        patient.patient_category === 'BIRTH' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                            'bg-slate-900 text-white border-slate-700'}`}>
                                    {patient.patient_category}
                                </span>
                            )}
                        </div>

                        {/* Patient Details Grid */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm border-t border-gray-100 pt-4">
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
                                        {patient.age ? (typeof patient.age === 'number' || !isNaN(Number(patient.age)) ? `${patient.age} Y` : patient.age) : ''}
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
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex flex-col items-start gap-2 shadow-sm min-w-[150px]">
                            <div>
                                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">Physical Storage</p>
                                {patient.box_label ? (
                                    <div>
                                        <p className="text-lg font-black text-amber-900 flex items-center gap-2">
                                            📦 {patient.box_label}
                                        </p>
                                        <p className="text-xs font-bold text-amber-600 mt-0.5">
                                            📍 {patient.box_location_code}
                                        </p>
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
                                    className="text-xs bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-bold transition-all shadow-sm w-full"
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {patient.files.map((file) => (
                                <div key={file.file_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-2 rounded-lg ${file.upload_status === 'draft' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-600'}`}>
                                            <FileType size={20} />
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

                                    {/* Action Buttons */}
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

                                        {file.upload_status === 'draft' ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleConfirmUpload(file.file_id)} className="flex-1 py-1.5 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 transition">Confirm</button>
                                                <button onClick={() => handleDiscardDraft(file.file_id)} className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-md text-xs font-bold hover:bg-gray-200 transition">Discard</button>
                                            </div>
                                        ) : (
                                            userRole !== 'mrd_staff' && (
                                                <button
                                                    onClick={() => handleRequestDeletion(file.file_id)}
                                                    className={`w-full py-1.5 rounded-md text-xs font-semibold border transition ${userRole === 'hospital_admin' ? 'text-red-600 hover:bg-red-50 border-red-200' : 'text-amber-600 hover:bg-amber-50 border-amber-200'}`}
                                                >
                                                    {userRole === 'hospital_admin' || userRole === 'website_admin' ? 'Delete File' : 'Request Deletion'}
                                                </button>
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
                    {(userRole === 'website_staff' || userRole === 'data_uploader' || userRole === 'website_admin' || userRole === 'hospital_admin' || userRole === 'mrd_staff' || userRole === 'superadmin' || userRole === 'superadmin_staff') && (
                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                                <h3 className="text-sm font-bold text-gray-400 uppercase">Input Files</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowScanner(true)}
                                        className="bg-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-purple-700 flex items-center gap-2"
                                    >
                                        <Camera size={14} /> Scan
                                    </button>
                                    <button
                                        onClick={() => {
                                            const token = localStorage.getItem('token');
                                            const protocolUrl = `digifort://upload?token=${token}&patient_id=${patient.record_id}&patient_name=${encodeURIComponent(patient.full_name)}&mrd=${patient.patient_u_id}&api_url=${API_URL}`;
                                            window.open(protocolUrl, '_self');
                                        }}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <Monitor size={14} /> Desktop App
                                    </button>
                                    {fileQueue.length > 0 && !isUploading && (
                                        <button
                                            onClick={startProcessing}
                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-700 flex items-center gap-2"
                                        >
                                            <PlayCircle size={14} /> Upload All
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className={`relative group transition-all duration-300 ${isUploading ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                                <div className="relative bg-white border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-6 text-center transition-all cursor-pointer overflow-hidden">
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf, .mp4, .mov, .avi, .mkv"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        onChange={handleFileSelect}
                                        disabled={isUploading}
                                    />
                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Upload className="text-indigo-600" size={20} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-700 mb-1">Click to Select Files</h4>
                                </div>
                            </div>

                            {/* File Queue List */}
                            {fileQueue.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    {fileQueue.map((item) => (
                                        <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm relative overflow-hidden">
                                            {(item.status === 'uploading' || item.status === 'compressing') && (
                                                <div className="absolute bottom-0 left-0 h-1 bg-indigo-50 w-full">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${item.status === 'compressing' ? 'bg-amber-400 w-full animate-pulse' : 'bg-indigo-500'}`}
                                                        style={{ width: item.status === 'uploading' ? `${item.progress}%` : '100%' }}
                                                    ></div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                                                    {item.originalFile.type.includes('image') ? <FileType size={14} /> : <PlayCircle size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className="font-bold text-xs text-slate-700 truncate">{item.originalFile.name}</p>
                                                        {item.status === 'pending' && (
                                                            <button onClick={() => removeFile(item.id)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {item.status === 'compressing' && <span className="text-[10px] text-amber-600 flex items-center gap-1"><Loader2 size={8} className="animate-spin" /> Optimizing</span>}
                                                        {item.status === 'uploading' && <span className="text-[10px] text-indigo-600">Uploading {item.progress}%</span>}
                                                        {item.status === 'completed' && <span className="text-[10px] text-green-600 flex items-center gap-1"><CheckCircle size={8} /> Done</span>}
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
                                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 font-bold"
                            >
                                <Plus size={14} /> Add
                            </button>
                        )}
                    </div>
                    {diagnoses.length > 0 ? (
                        <div className="space-y-2">
                            {diagnoses.map(diag => (
                                <div key={diag.diagnosis_id} className="p-3 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-slate-100 flex justify-between">
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 rounded text-xs">{diag.code}</span>
                                            <span className="font-semibold text-slate-700 text-sm">{diag.description}</span>
                                        </div>
                                        {diag.notes && <p className="text-xs text-slate-500 mt-1 italic">"{diag.notes}"</p>}
                                    </div>
                                    {(userRole === 'hospital_admin' || userRole === 'superadmin') && (
                                        <button onClick={() => deleteDiagnosis(diag.diagnosis_id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-slate-400 italic">No diagnoses recorded.</p>}
                </div>

                {/* Clinical Procedures Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Syringe className="text-emerald-600" size={20} /> Procedures
                        </h2>
                        {(userRole === 'hospital_admin' || userRole === 'website_admin') && (
                            <button
                                onClick={() => setShowProcModal(true)}
                                className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 font-bold"
                            >
                                <Plus size={14} /> Add
                            </button>
                        )}
                    </div>
                    {procedures.length > 0 ? (
                        <div className="space-y-2">
                            {procedures.map((proc, idx) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-xl hover:bg-white hover:shadow-md transition-all border border-slate-100 flex justify-between">
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 rounded text-xs">{proc.code}</span>
                                            <span className="font-semibold text-slate-700 text-sm">{proc.description}</span>
                                        </div>
                                        {proc.notes && <p className="text-xs text-slate-500 mt-1 italic">"{proc.notes}"</p>}
                                    </div>
                                    {(userRole === 'hospital_admin' || userRole === 'superadmin') && (
                                        <button onClick={() => deleteProcedure(proc.procedure_id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                                    )}
                                </div>
                            ))}
                        </div>

                    ) : <p className="text-sm text-slate-400 italic">No procedures recorded.</p>}
                </div>

                <div className="mt-12 pt-8 border-t border-red-100 flex justify-center">
                    <button
                        onClick={handleDeletePatient}
                        className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all flex items-center gap-2"
                    >
                        <Trash2 size={18} /> Delete Patient Record
                    </button>
                </div>
            </div>

            {/* Modals (Text View, Box, Diagnosis, Procedure, Scanner) - Reduced boilerplate for brevity, assuming standard implementations similar to original */}
            {viewTextFile && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center p-4 z-[70]">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">OCR Text Content</h3>
                            <button onClick={() => setViewTextFile(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col">
                            {isEditingOCR ? (
                                <textarea
                                    className="flex-1 w-full p-4 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    value={editedOCRText}
                                    onChange={(e) => setEditedOCRText(e.target.value)}
                                />
                            ) : (
                                <div className="flex-1 overflow-auto bg-slate-50 p-4 text-xs font-mono rounded-lg border border-slate-100 whitespace-pre-wrap">
                                    {viewTextFile.ocr_text || <span className="text-gray-400 italic">No text content found. Click Edit to add text manually.</span>}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
                            {isEditingOCR ? (
                                <>
                                    <button
                                        onClick={() => setIsEditingOCR(false)}
                                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveOCRText}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm"
                                    >
                                        Save Changes
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditingOCR(true)}
                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-sm font-bold hover:bg-indigo-100"
                                >
                                    Edit Text
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showBoxModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h2 className="text-lg font-bold mb-4">Assign Box</h2>
                        <select className="w-full border p-2 mb-4" value={selectedBoxId} onChange={e => setSelectedBoxId(e.target.value)}>
                            <option value="">Select Box</option>
                            {availableBoxes.map(b => <option key={b.box_id} value={b.box_id}>{b.label}</option>)}
                        </select>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowBoxModal(false)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                            <button onClick={handleAssignBox} className="px-3 py-1 bg-indigo-600 text-white rounded">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {showDiagModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-[80]">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-lg font-bold mb-4">Add Diagnosis</h2>
                        {!selectedCode ? (
                            <>
                                <input autoFocus className="w-full border p-2 mb-2" placeholder="Search..." value={diagSearch} onChange={e => searchDiagnoses(e.target.value)} />
                                <div className="max-h-60 overflow-auto">
                                    {diagResults.map(r => <div key={r.code} onClick={() => setSelectedCode(r)} className="p-2 hover:bg-gray-100 cursor-pointer">{r.code} - {r.description}</div>)}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-indigo-50 p-2 mb-2"><strong>{selectedCode.code}</strong><p>{selectedCode.description}</p></div>
                                <textarea className="w-full border p-2 mb-2" placeholder="Notes" value={diagNotes} onChange={e => setDiagNotes(e.target.value)} />
                                <div className="flex gap-2"><button onClick={addDiagnosis} className="bg-indigo-600 text-white px-4 py-2 rounded w-full">Confirm</button><button onClick={() => setSelectedCode(null)} className="text-gray-500 w-full">Cancel</button></div>
                            </>
                        )}
                        <button onClick={() => setShowDiagModal(false)} className="absolute top-2 right-2">✕</button>
                    </div>
                </div>
            )}

            {showProcModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-[80]">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-lg font-bold mb-4">Add Procedure</h2>
                        {!selectedProcCode ? (
                            <>
                                <input autoFocus className="w-full border p-2 mb-2" placeholder="Search..." value={procSearch} onChange={e => searchProcedures(e.target.value)} />
                                <div className="max-h-60 overflow-auto">
                                    {procResults.map(r => <div key={r.code} onClick={() => setSelectedProcCode(r)} className="p-2 hover:bg-gray-100 cursor-pointer">{r.code} - {r.description}</div>)}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="bg-emerald-50 p-2 mb-2"><strong>{selectedProcCode.code}</strong><p>{selectedProcCode.description}</p></div>
                                <textarea className="w-full border p-2 mb-2" placeholder="Notes" value={procNotes} onChange={e => setProcNotes(e.target.value)} />
                                <div className="flex gap-2"><button onClick={addProcedure} className="bg-emerald-600 text-white px-4 py-2 rounded w-full">Confirm</button><button onClick={() => setSelectedProcCode(null)} className="text-gray-500 w-full">Cancel</button></div>
                            </>
                        )}
                        <button onClick={() => setShowProcModal(false)} className="absolute top-2 right-2">✕</button>
                    </div>
                </div>
            )}

            {showScanner && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="w-full h-full max-w-7xl max-h-[95vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
                        <DigitizationScanner
                            onComplete={async (pdfFile) => {
                                const queueItem: FileQueueItem = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    originalFile: pdfFile,
                                    status: 'pending',
                                    progress: 0
                                };
                                setFileQueue(prev => [...prev, queueItem]);
                                setShowScanner(false);
                                alert(`Scanned PDF added to queue!`);
                            }}
                            onCancel={() => setShowScanner(false)}
                        />
                    </div>
                </div>
            )}

        </div>
    );
}
