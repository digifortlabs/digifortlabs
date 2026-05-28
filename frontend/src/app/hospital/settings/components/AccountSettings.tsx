"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
    User, Shield, Building, MapPin, Globe, Fingerprint, ImagePlus, 
    CheckCircle, XCircle, Loader2, Pencil, Trash2, Plus, FileText, 
    Mail, Phone, MapPinned, FileCheck, Save, RefreshCw, Eye, Lock, Unlock, 
    Download, X, Tag, FileUp, Info
} from 'lucide-react';
import { apiFetch, getCsrfToken } from '@/config/api';

interface AccountSettingsProps {
    userRole: string;
    profile: any;
    setProfile: (p: any) => void;
    passwordData: any;
    setPasswordData: (p: any) => void;
    handlePasswordChange: (e: React.FormEvent) => void;
    handleSaveProfile: () => void;
    mustChangePassword?: boolean;
    view?: 'profile' | 'vault';
}

interface UploadQueueItem {
    id: string;
    file: File;
    customName: string;
    tag: string;
}

export default function AccountSettings({
    userRole,
    profile,
    setProfile,
    passwordData,
    setPasswordData,
    handlePasswordChange,
    handleSaveProfile,
    mustChangePassword,
    view = 'profile'
}: AccountSettingsProps) {
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [domainStatus, setDomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [domainMessage, setDomainMessage] = useState('');
    
    // Lock-toggle editing state for Profile Details only
    const [isEditing, setIsEditing] = useState(false);
    const [backupProfile, setBackupProfile] = useState<any>(null);

    // Multi-File Upload Modal States
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [activeVault, setActiveVault] = useState<'certifications' | 'important_documents'>('certifications');
    const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
    const [batchUploading, setBatchUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [syncingProfile, setSyncingProfile] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [deletingDocIndex, setDeletingDocIndex] = useState<{type: 'certifications' | 'important_documents', index: number} | null>(null);

    // Per-file upload progress tracking
    const [uploadProgress, setUploadProgress] = useState<Record<string, 'pending' | 'uploading' | 'done' | 'error'>>({});

    const getUploadBaseUrl = () => {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname.includes('digifortlabs.com')) {
                return 'https://digifortlabs.com/api';
            }
        }
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    };

    const getLogoUrl = (logoPath: string) => {
        if (!logoPath) return '';
        if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
            return logoPath;
        }
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname.includes('digifortlabs.com')) {
                return `https://digifortlabs.com${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
            }
        }
        return `http://localhost:8000${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const hospitalId = localStorage.getItem('hospital_id');
        if (!hospitalId) return alert('Hospital ID missing');
        
        const formData = new FormData();
        formData.append('file', file);
        
        setUploadingLogo(true);
        try {
            const token = localStorage.getItem('access_token');
            const csrfToken = await getCsrfToken();
            const baseUrl = getUploadBaseUrl();
            
            const headers: Record<string, string> = {
                'Authorization': `Bearer ${token}`
            };
            if (csrfToken) {
                headers['X-CSRF-Token'] = csrfToken;
            }

            const res = await fetch(`${baseUrl}/hospitals/${hospitalId}/logo`, {
                method: 'POST',
                credentials: 'include',
                headers: headers,
                body: formData
            });
            if (!res.ok) throw new Error("Failed to upload logo");
            const data = await res.json();
            
            // update profile terminology logo_url
            setProfile({ ...profile, terminology: { ...profile.terminology, logo_url: data.logo_url } });
            // update localStorage so navbar updates
            localStorage.setItem('hospitalLogo', getLogoUrl(data.logo_url));
            
            alert('Logo uploaded successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to upload logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    // Debounced domain check
    useEffect(() => {
        if (!profile.hospital_slug || profile.hospital_slug.length < 3) {
            setDomainStatus('idle');
            setDomainMessage('');
            return;
        }
        
        setDomainStatus('checking');
        const timeoutId = setTimeout(async () => {
            try {
                const res = await apiFetch(`hospitals/check-domain?slug=${profile.hospital_slug}`);
                if (res.available) {
                    setDomainStatus('available');
                    setDomainMessage(res.message);
                } else {
                    setDomainStatus('taken');
                    setDomainMessage(res.message);
                }
            } catch (e) {
                setDomainStatus('idle');
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [profile.hospital_slug]);

    // Handle Edit State Toggles
    const startEditing = () => {
        setBackupProfile(JSON.parse(JSON.stringify(profile)));
        setIsEditing(true);
    };

    const cancelEditing = () => {
        if (backupProfile) {
            setProfile(backupProfile);
        }
        setIsEditing(false);
    };

    const saveEditing = async () => {
        setSyncingProfile(true);
        try {
            await handleSaveProfile();
            setIsEditing(false);
        } catch (error) {
            console.error(error);
        } finally {
            setSyncingProfile(false);
        }
    };

    const onPasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingPassword(true);
        try {
            await handlePasswordChange(e);
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingPassword(false);
        }
    };

    // Helper to open a document — fetches a fresh presigned URL from the backend
    const openDocument = async (doc: any) => {
        if (!doc.s3_key) {
            // Legacy doc without s3_key — try direct URL
            const url = doc.url || doc.presigned_url || '#';
            if (url !== '#') window.open(url, '_blank');
            return;
        }
        const hospitalId = localStorage.getItem('hospital_id');
        if (!hospitalId) return;
        try {
            const res = await apiFetch(
                `hospitals/${hospitalId}/documents/presign?s3_key=${encodeURIComponent(doc.s3_key)}`
            );
            if (res?.url) window.open(res.url, '_blank');
        } catch (e) {
            console.error('Presign error', e);
            alert('Could not open document. Please try again.');
        }
    };

    // Queue files for batch upload
    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newItems: UploadQueueItem[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            // Prefill title with filename minus extension
            const defaultName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            newItems.push({
                id: Math.random().toString(36).substring(2, 9),
                file: file,
                customName: defaultName,
                tag: activeVault === 'certifications' ? 'Compliance' : 'Operations'
            });
        }
        setUploadQueue(prev => [...prev, ...newItems]);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    };

    const updateQueueItem = (id: string, field: 'customName' | 'tag', value: string) => {
        setUploadQueue(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const removeQueueItem = (id: string) => {
        setUploadQueue(prev => prev.filter(item => item.id !== id));
    };

    // Real S3 batch upload — uploads each file individually via the API
    const executeBatchUpload = async () => {
        if (uploadQueue.length === 0) return;
        const hospitalId = localStorage.getItem('hospital_id');
        if (!hospitalId) { alert('Hospital ID missing'); return; }

        setBatchUploading(true);

        // Initialise all items as 'pending'
        const initialProgress: Record<string, 'pending' | 'uploading' | 'done' | 'error'> = {};
        uploadQueue.forEach(item => { initialProgress[item.id] = 'pending'; });
        setUploadProgress(initialProgress);

        const uploadedDocs: any[] = [];
        const token = localStorage.getItem('access_token');
        const csrfToken = await getCsrfToken();
        const baseUrl = getUploadBaseUrl();

        for (const item of uploadQueue) {
            setUploadProgress(prev => ({ ...prev, [item.id]: 'uploading' }));
            try {
                const formData = new FormData();
                formData.append('file', item.file);
                formData.append('vault', activeVault);
                formData.append('custom_name', item.customName);
                formData.append('tag', item.tag);

                const headers: Record<string, string> = {
                    'Authorization': `Bearer ${token}`
                };
                if (csrfToken) {
                    headers['X-CSRF-Token'] = csrfToken;
                }

                const res = await fetch(
                    `${baseUrl}/hospitals/${hospitalId}/documents/upload`,
                    {
                        method: 'POST',
                        credentials: 'include',
                        headers: headers,
                        body: formData,
                    }
                );

                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(errText);
                }

                const data = await res.json();
                uploadedDocs.push(data);
                setUploadProgress(prev => ({ ...prev, [item.id]: 'done' }));
            } catch (err) {
                console.error(`[DocVault] Upload failed for ${item.file.name}:`, err);
                setUploadProgress(prev => ({ ...prev, [item.id]: 'error' }));
            }
        }

        // Merge successfully uploaded docs into the profile state
        if (uploadedDocs.length > 0) {
            const updatedList = [...(profile[activeVault] || []), ...uploadedDocs];
            setProfile({ ...profile, [activeVault]: updatedList });
        }

        setBatchUploading(false);

        // Keep modal open briefly to show final statuses, then close
        setTimeout(() => {
            setUploadQueue([]);
            setUploadProgress({});
            setUploadModalOpen(false);
        }, 1200);
    };

    const openUploader = (vault: 'certifications' | 'important_documents') => {
        setActiveVault(vault);
        setUploadQueue([]);
        setUploadModalOpen(true);
    };

    const removeDocument = async (type: 'certifications' | 'important_documents', index: number) => {
        setDeletingDocIndex({ type, index });
        const doc = (profile[type] || [])[index];
        try {
            const hospitalId = localStorage.getItem('hospital_id');
            if (!hospitalId) throw new Error('Hospital ID missing');

            if (doc?.s3_key) {
                // Real S3-backed document — delete via API (removes from S3 + DB JSON)
                await apiFetch(`hospitals/${hospitalId}/documents`, {
                    method: 'DELETE',
                    body: JSON.stringify({ vault: type, s3_key: doc.s3_key })
                });
            } else {
                // Legacy doc without s3_key — just PATCH the list
                const updatedList = [...(profile[type] || [])];
                updatedList.splice(index, 1);
                await apiFetch(`hospitals/${hospitalId}`, { 
                    method: 'PATCH', 
                    body: JSON.stringify({ ...profile, [type]: updatedList }) 
                });
            }

            // Remove from local state
            const updatedList = [...(profile[type] || [])];
            updatedList.splice(index, 1);
            setProfile({ ...profile, [type]: updatedList });
        } catch (e) {
            console.error("Document deletion failed", e);
            alert("Failed to delete document. Please try again.");
        } finally {
            setDeletingDocIndex(null);
        }
    };

    const getFileIcon = (filename: string) => {
        const ext = filename?.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">PDF</span>;
        if (ext === 'doc' || ext === 'docx') return <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">DOC</span>;
        if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext || '')) return <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">IMG</span>;
        return <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">FILE</span>;
    };

    // Helper to render tag badge
    const getTagBadge = (tag: string) => {
        const cleanTag = tag || 'General';
        const colors: Record<string, string> = {
            'Compliance': 'bg-purple-50 text-purple-700 border-purple-100',
            'Accreditation': 'bg-blue-50 text-blue-700 border-blue-100',
            'Legal': 'bg-amber-50 text-amber-700 border-amber-100',
            'Operations': 'bg-slate-50 text-slate-700 border-slate-200/80',
            'Finance': 'bg-emerald-50 text-emerald-700 border-emerald-100',
            'Tax': 'bg-rose-50 text-rose-700 border-rose-100',
        };
        const style = colors[cleanTag] || 'bg-slate-50 text-slate-600 border-slate-100';
        return <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${style}`}>{cleanTag}</span>;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {mustChangePassword && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex gap-4 items-start shadow-xs">
                    <div className="bg-red-100 p-2 rounded-xl text-red-600 shrink-0">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 className="font-black text-red-900 text-base">Action Required: Change Password</h3>
                        <p className="text-red-700 text-xs mt-0.5 font-medium">For security reasons, you must update your temporary password before accessing other features.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left Column: Profile Settings & Document Vault (2/3 width on desktop) */}
                {userRole === 'hospital_admin' && (
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* FORM 1: Hospital Details & Settings */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 relative">
                            
                            {/* Profile Card Header with Lock Control */}
                            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                                        <Building size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-950 tracking-tight">Hospital Details</h2>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                            {isEditing ? (
                                                <>
                                                    <Unlock size={10} className="text-emerald-500" />
                                                    <span className="text-emerald-500 font-black">Unlocked Mode</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Lock size={10} className="text-slate-400" />
                                                    <span>Locked Mode</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <button 
                                                onClick={cancelEditing}
                                                disabled={syncingProfile}
                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Discard
                                            </button>
                                            <button 
                                                onClick={saveEditing}
                                                disabled={syncingProfile}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {syncingProfile ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={12} />
                                                        <span>Syncing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save size={12} /> Sync Profile
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={startEditing}
                                            className="px-4 py-2 bg-slate-950 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md"
                                        >
                                            <Pencil size={12} /> Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Interactive Logo Uploader Section (Compact) */}
                            <div className="flex items-center gap-5 bg-slate-50/50 rounded-xl p-4 border border-slate-100/80">
                                <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden group shadow-xs shrink-0">
                                    {profile.terminology?.logo_url ? (
                                        <img 
                                            src={getLogoUrl(profile.terminology.logo_url)} 
                                            alt="Hospital Logo" 
                                            className="w-full h-full object-contain p-1.5" 
                                        />
                                    ) : (
                                        <Building className="text-slate-300" size={28} />
                                    )}
                                    <label className={`absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isEditing && !uploadingLogo ? 'cursor-pointer' : 'pointer-events-none'}`}>
                                        {uploadingLogo ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />}
                                        <span className="text-[8px] font-black uppercase tracking-wider mt-1">{uploadingLogo ? 'Uploading' : 'Upload'}</span>
                                        {isEditing && (
                                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                                        )}
                                    </label>
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm">Official Logo</h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal max-w-md font-medium">
                                        Branding asset used on patient statements, reports, and invoices. Clear PNG/JPG up to 2MB.
                                    </p>
                                </div>
                            </div>

                            {/* Profile Fields Grouped (Lockable) */}
                            <div className="space-y-5">
                                
                                {/* General Parameters */}
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-1.5 border-b border-indigo-50 pb-1.5">
                                        <Fingerprint size={12} /> General Identity
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">Hospital Name</label>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                className={`w-full border rounded-xl px-3 py-2 outline-none font-semibold text-xs transition-all ${
                                                    isEditing 
                                                        ? 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 text-slate-900' 
                                                        : 'bg-slate-50 border-slate-200/80 text-slate-600'
                                                }`}
                                                value={profile.legal_name}
                                                onChange={e => setProfile({ ...profile, legal_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">Director Name</label>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                className={`w-full border rounded-xl px-3 py-2 outline-none font-semibold text-xs transition-all ${
                                                    isEditing 
                                                        ? 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 text-slate-900' 
                                                        : 'bg-slate-50 border-slate-200/80 text-slate-600'
                                                }`}
                                                value={profile.director_name}
                                                onChange={e => setProfile({ ...profile, director_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">License / Reg No.</label>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                className={`w-full border rounded-xl px-3 py-2 outline-none font-semibold text-xs transition-all ${
                                                    isEditing 
                                                        ? 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 text-slate-900' 
                                                        : 'bg-slate-50 border-slate-200/80 text-slate-600'
                                                }`}
                                                value={profile.registration_number}
                                                onChange={e => setProfile({ ...profile, registration_number: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">Subdomain</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    disabled={true} 
                                                    className="w-full bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-2 pr-8 outline-none font-semibold text-slate-500 text-xs cursor-not-allowed"
                                                    value={profile.hospital_slug}
                                                    placeholder="e.g. cityhospital"
                                                />
                                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                                                    <Lock className="text-slate-400" size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Details */}
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-1.5 border-b border-indigo-50 pb-1.5">
                                        <Phone size={12} /> Contacts & Communications
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">Contact Phone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                                <input
                                                    type="tel"
                                                    disabled={!isEditing}
                                                    className={`w-full border rounded-xl pl-9 pr-3 py-2 outline-none font-semibold text-xs transition-all ${
                                                        isEditing 
                                                            ? 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 text-slate-900' 
                                                            : 'bg-slate-50 border-slate-200/80 text-slate-600'
                                                    }`}
                                                    placeholder="+91 98765 43210"
                                                    value={profile.phone}
                                                    onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">Contact Email ID</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                                <input
                                                    type="email"
                                                    disabled={!isEditing}
                                                    className={`w-full border rounded-xl pl-9 pr-3 py-2 outline-none font-semibold text-xs transition-all ${
                                                        isEditing 
                                                            ? 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 text-slate-900' 
                                                            : 'bg-slate-50 border-slate-200/80 text-slate-600'
                                                    }`}
                                                    placeholder="info@hospital.com"
                                                    value={profile.email}
                                                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Details */}
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-1.5 border-b border-indigo-50 pb-1.5">
                                        <MapPinned size={12} /> Postal Address
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">Address Line</label>
                                            <input
                                                type="text"
                                                disabled={!isEditing}
                                                className={`w-full border rounded-xl px-3 py-2 outline-none font-semibold text-xs transition-all ${
                                                    isEditing 
                                                        ? 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 text-slate-900' 
                                                        : 'bg-slate-50 border-slate-200/80 text-slate-600'
                                                }`}
                                                placeholder="123 Hospital Road, District"
                                                value={profile.address}
                                                onChange={e => setProfile({ ...profile, address: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">City</label>
                                                <input
                                                    type="text"
                                                    disabled={!isEditing}
                                                    className={`w-full border rounded-xl px-3 py-2 outline-none font-semibold text-xs transition-all ${
                                                        isEditing 
                                                            ? 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 text-slate-900' 
                                                            : 'bg-slate-50 border-slate-200/80 text-slate-600'
                                                    }`}
                                                    placeholder="City"
                                                    value={profile.city}
                                                    onChange={e => setProfile({ ...profile, city: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">State</label>
                                                <input
                                                    type="text"
                                                    disabled={!isEditing}
                                                    className={`w-full border rounded-xl px-3 py-2 outline-none font-semibold text-xs transition-all ${
                                                        isEditing 
                                                            ? 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 text-slate-900' 
                                                            : 'bg-slate-50 border-slate-200/80 text-slate-600'
                                                    }`}
                                                    placeholder="State"
                                                    value={profile.state}
                                                    onChange={e => setProfile({ ...profile, state: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">Pincode</label>
                                                <input
                                                    type="text"
                                                    disabled={!isEditing}
                                                    className={`w-full border rounded-xl px-3 py-2 outline-none font-semibold text-xs transition-all ${
                                                        isEditing 
                                                            ? 'bg-white border-indigo-200 focus:ring-2 focus:ring-indigo-500/20 text-slate-900' 
                                                            : 'bg-slate-50 border-slate-200/80 text-slate-600'
                                                }`}
                                                placeholder="Pincode"
                                                value={profile.pincode}
                                                onChange={e => setProfile({ ...profile, pincode: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ID Generation Configurations */}
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-1.5 border-b border-indigo-50 pb-1.5 mt-5">
                                        <Fingerprint size={12} /> ID Generation Formats
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {['uhid', 'opd', 'ipd', 'mrd'].map((type) => (
                                            <div key={type} className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/50 space-y-2 shadow-sm">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{type} Format</div>
                                                <div className="flex flex-col gap-2">
                                                    <div>
                                                        <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 ml-0.5">Prefix (e.g. DF-)</label>
                                                        <input
                                                            type="text"
                                                            disabled={!isEditing}
                                                            className={`w-full border rounded-lg px-2.5 py-1.5 outline-none font-semibold text-xs transition-all ${isEditing ? 'bg-white border-indigo-200 text-slate-900 focus:ring-2 focus:ring-indigo-500/20' : 'bg-slate-50 border-slate-200/80 text-slate-600'}`}
                                                            value={profile.id_generation_settings?.[`${type}_prefix`] || ''}
                                                            onChange={e => setProfile({ ...profile, id_generation_settings: { ...(profile.id_generation_settings || {}), [`${type}_prefix`]: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 ml-0.5">Padding Digits</label>
                                                            <input
                                                                type="number"
                                                                disabled={!isEditing}
                                                                className={`w-full border rounded-lg px-2.5 py-1.5 outline-none font-semibold text-xs transition-all ${isEditing ? 'bg-white border-indigo-200 text-slate-900 focus:ring-2 focus:ring-indigo-500/20' : 'bg-slate-50 border-slate-200/80 text-slate-600'}`}
                                                                value={profile.id_generation_settings?.[`${type}_padding`] || 4}
                                                                onChange={e => setProfile({ ...profile, id_generation_settings: { ...(profile.id_generation_settings || {}), [`${type}_padding`]: parseInt(e.target.value) || 4 } })}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5 ml-0.5">Postfix</label>
                                                            <input
                                                                type="text"
                                                                disabled={!isEditing}
                                                                className={`w-full border rounded-lg px-2.5 py-1.5 outline-none font-semibold text-xs transition-all ${isEditing ? 'bg-white border-indigo-200 text-slate-900 focus:ring-2 focus:ring-indigo-500/20' : 'bg-slate-50 border-slate-200/80 text-slate-600'}`}
                                                                value={profile.id_generation_settings?.[`${type}_postfix`] || ''}
                                                                onChange={e => setProfile({ ...profile, id_generation_settings: { ...(profile.id_generation_settings || {}), [`${type}_postfix`]: e.target.value } })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* FORM 2: STANDALONE DOCUMENT & CREDENTIALS VAULT */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                        
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                                    <FileCheck size={20} />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-lg font-black text-slate-950 tracking-tight leading-none">Document Vault</h2>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mt-1">Manage official compliance & operational files</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            
                            {/* Column 1: Hospital Certifications */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Compliance Certificates</label>
                                    
                                    <button 
                                        onClick={() => openUploader('certifications')}
                                        className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-0.5 rounded-lg hover:scale-105 duration-100 transition-all select-none"
                                    >
                                        <Plus size={10} />
                                        <span>Add Certificate</span>
                                    </button>
                                </div>

                                {/* Certification List */}
                                <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-3 rounded-xl min-h-[110px] flex flex-col justify-start">
                                    {(!profile.certifications || profile.certifications.length === 0) ? (
                                        <div className="m-auto text-center py-4 text-slate-400 font-semibold text-[10px]">
                                            <Building size={20} className="mx-auto text-slate-300 mb-1" />
                                            No certificates uploaded.
                                        </div>
                                    ) : (
                                        profile.certifications.map((cert: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between bg-white border border-slate-200/60 p-2.5 rounded-lg shadow-xs group/item hover:border-indigo-100 transition-all">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {getFileIcon(cert.originalName || cert.name)}
                                                    <div className="text-left overflow-hidden">
                                                        <p className="text-[11px] font-black text-slate-800 truncate max-w-[130px] sm:max-w-[160px]">{cert.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            {getTagBadge(cert.tag)}
                                                            {cert.uploadedAt && <span className="text-[8px] text-slate-400 font-bold tracking-wide">{cert.uploadedAt}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5 shrink-0">
                                                    <button 
                                                        onClick={() => openDocument(cert)}
                                                        disabled={deletingDocIndex !== null}
                                                        className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title="View"
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => removeDocument('certifications', index)}
                                                        disabled={deletingDocIndex !== null}
                                                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title="Remove"
                                                    >
                                                        {deletingDocIndex?.type === 'certifications' && deletingDocIndex?.index === index ? (
                                                            <Loader2 size={12} className="animate-spin text-red-500" />
                                                        ) : (
                                                            <Trash2 size={12} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Column 2: Important Documents */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Important Legal / Ops Documents</label>
                                    
                                    <button 
                                        onClick={() => openUploader('important_documents')}
                                        className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-0.5 rounded-lg hover:scale-105 duration-100 transition-all select-none"
                                    >
                                        <Plus size={10} />
                                        <span>Add Document</span>
                                    </button>
                                </div>

                                {/* Documents List */}
                                <div className="space-y-2 bg-slate-50/50 border border-slate-100 p-3 rounded-xl min-h-[110px] flex flex-col justify-start">
                                    {(!profile.important_documents || profile.important_documents.length === 0) ? (
                                        <div className="m-auto text-center py-4 text-slate-400 font-semibold text-[10px]">
                                            <FileText size={20} className="mx-auto text-slate-300 mb-1" />
                                            No documents uploaded.
                                        </div>
                                    ) : (
                                        profile.important_documents.map((doc: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between bg-white border border-slate-200/60 p-2.5 rounded-lg shadow-xs group/item hover:border-indigo-100 transition-all">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {getFileIcon(doc.originalName || doc.name)}
                                                    <div className="text-left overflow-hidden">
                                                        <p className="text-[11px] font-black text-slate-800 truncate max-w-[130px] sm:max-w-[160px]">{doc.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            {getTagBadge(doc.tag)}
                                                            {doc.uploadedAt && <span className="text-[8px] text-slate-400 font-bold tracking-wide">{doc.uploadedAt}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-0.5 shrink-0">
                                                    <button 
                                                        onClick={() => openDocument(doc)}
                                                        disabled={deletingDocIndex !== null}
                                                        className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title="View"
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => removeDocument('important_documents', index)}
                                                        disabled={deletingDocIndex !== null}
                                                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                        title="Remove"
                                                    >
                                                        {deletingDocIndex?.type === 'important_documents' && deletingDocIndex?.index === index ? (
                                                            <Loader2 size={12} className="animate-spin text-red-500" />
                                                        ) : (
                                                            <Trash2 size={12} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

                {/* Right Side: Security, AI Settings & Info stacked (1/3 width on desktop) */}
                <div className="space-y-6 lg:col-span-1">
                    
                    {/* Security Credentials Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-8 -mt-8 -z-10"></div>
                        <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                            <Shield className="text-indigo-600" size={18} /> Security Credentials
                        </h2>
                        <form onSubmit={onPasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all text-xs"
                                    value={passwordData.old}
                                    onChange={e => setPasswordData({ ...passwordData, old: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all text-xs"
                                        value={passwordData.new}
                                        onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-0.5">Confirm New</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all text-xs"
                                        value={passwordData.confirm}
                                        onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={updatingPassword}
                                className="w-full bg-slate-950 hover:bg-indigo-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updatingPassword ? (
                                    <>
                                        <Loader2 className="animate-spin text-white" size={12} />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={12} /> Update Security Key
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* AI Settings Section (Intelligence Core) */}
                    {userRole === 'hospital_admin' && (
                        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xs border border-slate-800">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                            
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-indigo-500/20 w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                                    <Globe className="text-white" size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black tracking-tight leading-none">Intelligence Core</h3>
                                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider mt-1">Cloud AI Processing</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-xl">
                                    <div>
                                        <h4 className="text-[11px] font-black">ICD-11 Extraction</h4>
                                        <p className="text-[9px] text-slate-400">Gemini 1.5 Pro summaries</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            disabled={!isEditing}
                                            checked={profile.ai_settings.enabled}
                                            onChange={(e) => setProfile((p: any) => ({ ...p, ai_settings: { ...p.ai_settings, enabled: e.target.checked } }))}
                                        />
                                        <div className={`w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-4 text-xs after:w-4 after:transition-all peer-checked:bg-indigo-500 ${!isEditing ? 'opacity-40 cursor-not-allowed' : ''}`}></div>
                                    </label>
                                </div>
                                
                                <div className={!profile.ai_settings.enabled ? 'opacity-30 grayscale pointer-events-none transition-all' : 'transition-all'}>
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-indigo-300 mb-1 ml-0.5">Google AI API Key</label>
                                    <div className="relative">
                                        <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/80" size={14} />
                                        <input
                                            type="password"
                                            disabled={!isEditing}
                                            className={`w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 outline-none font-mono text-[11px] tracking-widest focus:ring-2 focus:ring-indigo-400/50 ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                            placeholder="AIzaSy..."
                                            value={profile.ai_settings.api_key}
                                            onChange={e => setProfile((p: any) => ({ ...p, ai_settings: { ...p.ai_settings, api_key: e.target.value } }))}
                                        />
                                    </div>
                                    <p className="text-[8px] text-indigo-400/80 mt-1.5 font-bold uppercase tracking-wider">🔒 Stored in your encrypted tenant vault.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Tracker Widget */}
                    <div className="bg-slate-950 rounded-2xl p-6 text-white relative overflow-hidden shadow-xs border border-slate-900">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                            <Lock size={12} className="text-emerald-400 animate-pulse" /> Active Guard
                        </h3>
                        <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                            Tenant operations are isolated. Editing billing counters requires platform security clearance.
                        </p>
                    </div>
                </div>
            </div>

            {/* HIGH-FIDELITY BATCH UPLOAD MODAL */}
            {uploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                    <FileUp size={18} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-base font-black text-slate-900 leading-none">Upload Document Vault</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                        Adding to {activeVault === 'certifications' ? 'Compliance Certificates' : 'Important Operational Documents'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setUploadModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {/* Drag and Drop Zone */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group select-none"
                            >
                                <div className="p-3 bg-white rounded-full border border-slate-200 shadow-2xs group-hover:scale-110 duration-100 transition-all text-slate-400 group-hover:text-indigo-600">
                                    <FileUp size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-700">Click to select multiple files</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DOCX, JPEG, PNG — up to 50 MB per file</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    multiple 
                                    onChange={handleFileSelection}
                                />
                            </div>

                            {/* Selection Queue List */}
                            {uploadQueue.length > 0 && (
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Selected Files Metadata Editor ({uploadQueue.length})</label>
                                    <div className="space-y-2 border border-slate-100 p-2.5 rounded-xl bg-slate-50/20 max-h-[220px] overflow-y-auto">
                                        {uploadQueue.map((item) => (
                                            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white border border-slate-200/80 p-3 rounded-lg shadow-2xs">
                                                {/* File Details */}
                                                <div className="sm:col-span-4 flex items-center gap-2 overflow-hidden text-left">
                                                    {getFileIcon(item.file.name)}
                                                    <div className="overflow-hidden">
                                                        <p className="text-[11px] font-black text-slate-800 truncate" title={item.file.name}>{item.file.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                    </div>
                                                </div>

                                                {/* Document Name input */}
                                                <div className="sm:col-span-4">
                                                    <input 
                                                        type="text"
                                                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-200 rounded-lg px-2.5 py-1.5 outline-none font-semibold text-xs focus:ring-2 focus:ring-indigo-500/10 text-slate-800"
                                                        placeholder="Custom display name"
                                                        value={item.customName}
                                                        onChange={(e) => updateQueueItem(item.id, 'customName', e.target.value)}
                                                    />
                                                </div>

                                                {/* Document Tag selector */}
                                                <div className="sm:col-span-3">
                                                    <select
                                                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-200 rounded-lg px-2 py-1.5 outline-none font-semibold text-xs text-slate-700"
                                                        value={item.tag}
                                                        onChange={(e) => updateQueueItem(item.id, 'tag', e.target.value)}
                                                    >
                                                        <option value="Compliance">Compliance</option>
                                                        <option value="Accreditation">Accreditation</option>
                                                        <option value="Legal">Legal</option>
                                                        <option value="Operations">Operations</option>
                                                        <option value="Finance">Finance</option>
                                                        <option value="Tax">Tax</option>
                                                    </select>
                                                </div>

                                                {/* Discard item or progress status */}
                                                <div className="sm:col-span-1 flex justify-end">
                                                    {uploadProgress[item.id] === 'uploading' ? (
                                                        <Loader2 size={14} className="animate-spin text-indigo-500 m-1.5" />
                                                    ) : uploadProgress[item.id] === 'done' ? (
                                                        <CheckCircle size={14} className="text-emerald-500 m-1.5" />
                                                    ) : uploadProgress[item.id] === 'error' ? (
                                                        <XCircle size={14} className="text-red-500 m-1.5" />
                                                    ) : (
                                                        <button 
                                                            onClick={() => removeQueueItem(item.id)}
                                                            disabled={batchUploading}
                                                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors disabled:opacity-40"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {uploadQueue.length === 0 && (
                                <div className="text-center py-8 text-slate-400 bg-slate-50/30 border border-slate-100 rounded-xl">
                                    <Info className="mx-auto text-slate-300 mb-1.5" size={24} />
                                    <p className="text-xs font-semibold">Select files from your device to configure names and tags</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
                            <button 
                                onClick={() => setUploadModalOpen(false)}
                                disabled={batchUploading}
                                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeBatchUpload}
                                disabled={uploadQueue.length === 0 || batchUploading}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {batchUploading ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin text-white" />
                                        <span>Uploading to S3...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={12} />
                                        <span>Confirm Batch Upload</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
