"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, FolderOpen, User, FileText, Loader2, RefreshCw, Building2, LayoutGrid, List, Activity, ArrowRight, ArrowUpDown, Pencil, ChevronRight, X, ChevronUp, ChevronDown, Users } from 'lucide-react';
import { useTerminology } from '@/hooks/useTerminology';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL, apiFetch } from '@/config/api';
import { toTitleCase, toUpperCaseMRD } from '@/lib/formatters';
import { formatDate } from '@/lib/dateFormatter';
import DashboardPageShell from '@/components/DashboardPageShell';

// Dynamic imports or standardized paths for components
import CameraModal from '@/app/hospital/records/components/CameraModal';
import PatientDetailView from '@/app/hospital/records/components/PatientDetailView';
import DentalPatientDetail from '@/app/hospital/dental/components/PatientDetail';
import PatientCreateModal from '@/app/hospital/records/components/PatientCreateModal';
import HospitalSelectionPrompt from '@/components/HospitalSelectionPrompt';

interface RecordManagerProps {
    mode: 'patients' | 'corporate';
}

interface PatientState {
    full_name: string;
    patient_u_id: string;
    uhid: string;
    age: string;
    gender: string;
    address: string;
    contact_number: string;
    email_id: string;
    aadhaar_number: string;
    patient_category: string;
    dob: string;
    admission_date: string;
    discharge_date: string;
    doctor_name: string;
    doctor_profile_ids: number[];
    weight: string;
    mediclaim: string;
    diagnosis: string;
}

export default function RecordManager({ mode }: RecordManagerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { terms, specialty } = useTerminology();
    const hospitalIdParam = searchParams.get('hospital_id');
    const action = searchParams.get('action');

    const config = {
        title: mode === 'patients' ? `${terms.patient} Records` : 'Company Documents',
        description: mode === 'patients' ? 'Manage patient files and digital records.' : 'Manage corporate documents and company data.',
        icon: mode === 'patients' ? User : FolderOpen,
        showCategories: mode === 'patients',
        category: mode === 'patients' ? 'IPD' : 'CORPORATE'
    };

    // --- State ---
    const [patients, setPatients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [ageUnit, setAgeUnit] = useState<'Years' | 'Months' | 'Days'>('Years');
    const [isMRDDuplicate, setIsMRDDuplicate] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isExistingPatient, setIsExistingPatient] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'discharge_date', direction: 'desc' });
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');
    const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [userRole, setUserRole] = useState<string>('');
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
    const [hospitalDoctors, setHospitalDoctors] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'identity' | 'admission' | 'clinical'>('identity');

    // Date Range Logic
    const getMonthRange = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const formatDateLocal = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        return { start: formatDateLocal(start), end: formatDateLocal(end) };
    };

    const monthRange = getMonthRange();
    const [startDate, setStartDate] = useState(monthRange.start);
    const [endDate, setEndDate] = useState(monthRange.end);
    const [showAllDates, setShowAllDates] = useState(false);

    const [newPatient, setNewPatient] = useState<PatientState>({
        full_name: '', patient_u_id: '', uhid: '', age: '', gender: '', address: '', contact_number: '', email_id: '',
        aadhaar_number: '', patient_category: config.category, dob: '', admission_date: '', discharge_date: '',
        doctor_name: '', doctor_profile_ids: [], weight: '', mediclaim: '', diagnosis: ''
    });

    // --- Helpers ---
    const resetForm = () => {
        setNewPatient({
            full_name: '', patient_u_id: '', uhid: '', age: '', gender: '', address: '', contact_number: '', email_id: '',
            aadhaar_number: '', patient_category: specialty === 'Dental' ? 'OPD' : config.category, dob: '', admission_date: '', discharge_date: '',
            doctor_name: '', doctor_profile_ids: [], weight: '', mediclaim: '', diagnosis: ''
        });
        setIsExistingPatient(false);
        setIsMRDDuplicate(false);
        setIsEditing(false);
        setSelectedPatientId(null);
        setActiveTab('identity');
    };

    const parseAgeString = (ageStr: string | number): { val: string, unit: 'Years' | 'Months' | 'Days' } => {
        if (!ageStr) return { val: '', unit: 'Years' };
        const s = ageStr.toString();
        if (s.toLowerCase().includes('month')) return { val: s.replace(/\D/g, ''), unit: 'Months' };
        if (s.toLowerCase().includes('day')) return { val: s.replace(/\D/g, ''), unit: 'Days' };
        return { val: s.replace(/\D/g, ''), unit: 'Years' };
    };

    // --- API Interactions ---
    const fetchUserProfile = async () => {
        // Retry once after a short delay to handle auth token race condition on page load
        const attempt = async () => {
            const data = await apiFetch(`users/me`);
            if (data) setUserProfile(data);
        };
        try {
            await attempt();
        } catch (e: any) {
            if (e?.status === 401) {
                await new Promise(r => setTimeout(r, 500));
                try { await attempt(); } catch (e2) { console.error('Auth failed after retry', e2); }
            } else {
                console.error(e);
            }
        }
    };

    const fetchHospitals = async () => {
        try {
            const data = await apiFetch(`hospitals/`);
            if (data) setHospitals(data);
        } catch (e) { console.error(e); }
    };

    const fetchPatients = async () => {
        setLoading(true);
        try {
            let url = showAllDates ? `patients/?` : `patients/?start_date=${startDate}&end_date=${endDate}&`;
            if (mode === 'corporate') url += `module=corporate&`;
            if (specialty === 'Dental') url = `dental/patients?skip=0&limit=100`;

            if (selectedHospitalId && ['superadmin', 'superadmin_staff', 'website_admin', 'website_staff'].includes(userProfile?.role)) {
                url += `hospital_id=${selectedHospitalId}`;
            }

            const data = await apiFetch(url);
            if (data) setPatients(data);
        } catch (err: any) {
            console.error(err);
            if (err.status === 401) window.location.href = `/login?error=${encodeURIComponent(err.message || "Session expired")}`;
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            let url = `doctors/`;
            if (selectedHospitalId && ['superadmin', 'superadmin_staff'].includes(userProfile?.role)) {
                url += `?hospital_id=${selectedHospitalId}`;
            }
            const data = await apiFetch(url);
            if (data) setHospitalDoctors(data);
        } catch (e) { console.error("Failed to fetch doctors", e); }
    };

    const fetchNextMRD = async () => {
        if (['superadmin', 'superadmin_staff'].includes(userProfile?.role) && !selectedHospitalId) return;
        let url = `patients/next-id`;
        if (selectedHospitalId) url += `?hospital_id=${selectedHospitalId}`;
        try {
            const data = await apiFetch(url);
            if (data?.next_id) setNewPatient(prev => ({ ...prev, patient_u_id: data.next_id }));
        } catch (e) { console.error("Failed to fetch next MRD", e); }
    };

    // --- Lifecycle ---
    useEffect(() => {
        setUserRole(localStorage.getItem('userRole') || '');
        fetchUserProfile();
        const saved = localStorage.getItem('mrd_hospital_id');
        if (saved) setSelectedHospitalId(Number(saved));

        const handleHospitalChanged = (e: any) => {
            if (e.detail?.storageKey === 'mrd_hospital_id') {
                setSelectedHospitalId(e.detail.hospitalId ? Number(e.detail.hospitalId) : null);
            } else if (typeof e.detail === 'string' || typeof e.detail === 'number') {
                // Backward compatibility
                setSelectedHospitalId(e.detail ? Number(e.detail) : null);
            }
        };
        window.addEventListener('hospitalChanged', handleHospitalChanged);
        return () => window.removeEventListener('hospitalChanged', handleHospitalChanged);
    }, []);

    useEffect(() => {
        if (userProfile) {
            if (['website_admin', 'website_staff', 'superadmin', 'superadmin_staff'].includes(userProfile.role)) {
                fetchHospitals();
                if (hospitalIdParam) {
                    setSelectedHospitalId(parseInt(hospitalIdParam));
                } else {
                    // Use already-set mrd_hospital_id from localStorage (set on mount above)
                    const saved = localStorage.getItem('mrd_hospital_id');
                    if (!saved) setLoading(false); // no hospital selected yet — show picker
                }
            } else {
                if (userProfile.hospital_id) setSelectedHospitalId(userProfile.hospital_id);
                fetchPatients();
            }
        }
    }, [userProfile]);

    // Fallback: if userProfile never loads, stop the spinner after 5s
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading) setLoading(false);
        }, 5000);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (selectedHospitalId || (userProfile && !['superadmin', 'superadmin_staff', 'website_admin', 'website_staff'].includes(userProfile.role))) {
            fetchPatients();
            fetchDoctors();
        }
    }, [selectedHospitalId, startDate, endDate, showAllDates]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (globalSearchTerm.length > 2) {
                const searchAPI = async () => {
                    setIsSearchingGlobal(true);
                    try {
                        let url = `patients/search/?q=${encodeURIComponent(globalSearchTerm)}`;
                        if (selectedHospitalId) url += `&hospital_id=${selectedHospitalId}`;
                        const data = await apiFetch(url);
                        if (data) setGlobalSearchResults(data);
                    } catch (e) { console.error(e) }
                    finally { setIsSearchingGlobal(false) }
                }
                searchAPI();
            } else {
                setGlobalSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [globalSearchTerm, selectedHospitalId]);

    // --- Handlers ---
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const missing = [];
            if (!newPatient.full_name) missing.push('Full Name');
            if (!newPatient.patient_u_id) missing.push('MRD Number');
            if (!newPatient.age) missing.push('Age');
            if (!newPatient.gender) missing.push('Gender');
            if (!newPatient.contact_number) missing.push('Contact Number');
            if (missing.length > 0) {
                setActiveTab('identity');
                alert(`Please fill required fields in Identity tab:\n• ${missing.join('\n• ')}`);
                return;
            }

            const body: any = { ...newPatient, age: `${newPatient.age} ${ageUnit}` };
            if (selectedHospitalId) body.hospital_id = selectedHospitalId;

            // Clean up empty strings to null for optional fields to pass backend validation
            for (const key in body) {
                if (body[key] === '') {
                    body[key] = null;
                }
            }

            let data;
            const patientPayload = { ...body };
            delete patientPayload.doctor_profile_ids; // Backend POST /patients/ might not expect this yet
            
            if (isEditing && selectedPatientId) {
                data = await apiFetch(`patients/${selectedPatientId}`, { method: 'PUT', body: patientPayload });
            } else {
                data = await apiFetch(`patients/`, { method: 'POST', body: patientPayload });
            }

            if (data) {
                // Now assign doctors
                if (body.doctor_profile_ids && body.doctor_profile_ids.length > 0) {
                    // Quick loop to assign
                    for (const pid of body.doctor_profile_ids) {
                        try {
                            await apiFetch(`patients/${data.record_id}/assign-doctor`, {
                                method: 'POST',
                                body: { profile_id: pid }
                            });
                        } catch(e) { console.error("Doctor assignment error", e) }
                    }
                }

                if (isEditing) {
                    setPatients(patients.map(p => (p.record_id || p.patient_id) === selectedPatientId ? data : p));
                    alert(`${mode === 'patients' ? terms.patient : 'Document'} Updated Successfully!`);
                    setShowCreateModal(false);
                    resetForm();
                } else {
                    setPatients([data, ...patients]);
                    router.push(`${window.location.pathname}/view?id=${data.record_id}`);
                }
            }
        } catch (err: any) {
            alert(`Error: ${err.message || "Network error occurred."}`);
        }
    };

    const handleNameSearch = (val: string) => {
        setNewPatient(prev => ({ ...prev, full_name: toTitleCase(val) }));
        if (val.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const matches = patients.filter(p =>
            p.full_name?.toLowerCase().includes(val.toLowerCase()) ||
            p.uhid?.toLowerCase().includes(val.toLowerCase()) ||
            p.contact_number?.includes(val)
        ).slice(0, 5);
        setSuggestions(matches);
        setShowSuggestions(true);
    };

    const handleSelectPatient = (p: any) => {
        const { val, unit } = parseAgeString(p.age);
        setNewPatient(prev => ({
            ...prev,
            full_name: p.full_name || '',
            patient_u_id: '',
            uhid: p.uhid || '',
            age: val,
            gender: p.gender || '',
            address: p.address || '',
            contact_number: p.contact_number || '',
            email_id: p.email_id || '',
            aadhaar_number: p.aadhaar_number || '',
            patient_category: config.category,
            dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
            doctor_profile_ids: p.assigned_doctors?.map((d:any) => d.profile_id) || []
        }));
        setAgeUnit(unit);
        setIsExistingPatient(true);
        setShowSuggestions(false);
        fetchNextMRD();
    };

    const onMRDChange = (val: string) => {
        const uppercaseVal = toUpperCaseMRD(val);
        setNewPatient(prev => ({ ...prev, patient_u_id: uppercaseVal }));
        if (uppercaseVal.length > 2) {
            const exists = patients.some(p => p.patient_u_id?.toUpperCase() === uppercaseVal);
            setIsMRDDuplicate(exists);
        } else {
            setIsMRDDuplicate(false);
        }
    };

    const checkExistingUHID = async (uhid: string) => {
        if (!uhid) return;
        const normalized = uhid.toUpperCase().trim();
        const match = patients.find(p => p.uhid?.toUpperCase() === normalized);
        if (match) {
            handleSelectPatient(match);
        } else {
            try {
                const res = await apiFetch(`/patients/check/uhid/${encodeURIComponent(normalized)}`);
                if (res && res.exists && res.patient) {
                    handleSelectPatient({
                        ...res.patient,
                        uhid: normalized
                    });
                }
            } catch (e: any) {
                console.error('UHID check failed:', e?.message || e);
            }
        }
    };

    const calculateAge = (dobString: string) => {
        if (!dobString) return;
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        setNewPatient(prev => ({
            ...prev,
            dob: dobString,
            age: age >= 0 ? age.toString() : '0'
        }));
        setAgeUnit('Years');
    };

    const filteredPatients = useMemo(() => {
        let filtered = patients.filter(p => {
            if (categoryFilter && categoryFilter !== p.patient_category) return false;
            const search = searchTerm.toLowerCase();
            return (
                p.full_name?.toLowerCase().includes(search) ||
                p.patient_u_id?.toLowerCase().includes(search) ||
                p.uhid?.toLowerCase().includes(search)
            );
        });

        if (sortConfig) {
            filtered.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [patients, searchTerm, categoryFilter, sortConfig]);

    return (
        <DashboardPageShell
            title={config.title}
            description={config.description}
            icon={config.icon}
            loading={loading}
            searchTerm={globalSearchTerm}
            onSearchChange={(val) => { setGlobalSearchTerm(val); setSearchTerm(val); }}
            isSearching={isSearchingGlobal}
            actions={
                <div className="flex gap-3 items-center">
                    {['superadmin', 'superadmin_staff', 'website_admin', 'website_staff'].includes(userRole) && selectedHospitalId && (
                        <div className="bg-white/80 backdrop-blur border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm flex items-center gap-3">
                            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Building2 size={12} className="text-indigo-600" />
                            </div>
                            <span className="font-black text-[11px] text-slate-700 uppercase tracking-widest">
                                {hospitals.find(h => h.hospital_id === selectedHospitalId)?.legal_name}
                            </span>
                            <button
                                onClick={() => {
                                    setSelectedHospitalId(null);
                                    localStorage.removeItem('mrd_hospital_id');
                                }}
                                className="ml-2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                                title="Change Client"
                            >
                                <X size={12} strokeWidth={3} />
                            </button>
                        </div>
                    )}
                    {(!['superadmin', 'superadmin_staff', 'website_admin', 'website_staff'].includes(userRole) || selectedHospitalId) && (
                        <button
                            onClick={() => { resetForm(); setShowCreateModal(true); }}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <Plus size={16} strokeWidth={3} /> New {mode === 'patients' ? terms.patient : 'Document'}
                        </button>
                    )}
                </div>
            }
        >
            {/* No hospital selected — prompt superadmin to pick one */}
            {!selectedHospitalId && ['website_admin', 'website_staff', 'superadmin', 'superadmin_staff'].includes(userRole) ? (
                <div className="mt-2 pb-20">
                    <HospitalSelectionPrompt 
                        requiredModule={mode === 'corporate' ? 'corporate' : 'core'} 
                        storageKey="mrd_hospital_id"
                        onSelect={setSelectedHospitalId} 
                    />
                </div>
            ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200/80 p-2 rounded-2xl shadow-sm">
                        {config.showCategories && (
                            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto gap-0.5">
                                {['', 'IPD', 'OPD', 'MLC', 'BRT'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${categoryFilter === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {cat || 'All'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Record count */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <Users size={12} className="text-slate-400" />
                            <span className="text-[11px] font-black text-slate-600">{filteredPatients.length}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">records</span>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setShowAllDates(v => !v)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${showAllDates ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    All
                                </button>
                                <div className={`flex items-center bg-white rounded-lg px-3 py-1.5 shadow-sm gap-2 transition-opacity ${showAllDates ? 'opacity-30 pointer-events-none' : ''}`}>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">From</span>
                                    <input type="date" className="bg-transparent text-[11px] font-bold text-slate-700 outline-none w-[110px] cursor-pointer" value={startDate} onChange={e => { setShowAllDates(false); setStartDate(e.target.value); }} />
                                </div>
                                <div className={`flex items-center bg-white rounded-lg px-3 py-1.5 shadow-sm gap-2 transition-opacity ${showAllDates ? 'opacity-30 pointer-events-none' : ''}`}>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">To</span>
                                    <input type="date" className="bg-transparent text-[11px] font-bold text-slate-700 outline-none w-[110px] cursor-pointer" value={endDate} onChange={e => { setShowAllDates(false); setEndDate(e.target.value); }} />
                                </div>
                            </div>

                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-lg transition-all duration-200 ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={15} strokeWidth={2.5} /></button>
                                <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all duration-200 ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={15} strokeWidth={2.5} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start h-[calc(100vh-220px)]">
                        <div className={`${selectedPatientId ? 'hidden lg:flex lg:w-[350px] lg:flex-col' : 'w-full'} transition-all h-full overflow-y-auto`}>
                            {viewMode === 'card' ? (
                                <div className={`grid gap-4 ${selectedPatientId ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} pb-4`}>
                                    {filteredPatients.map((p, i) => {
                                        const visitCount = patients.filter(x => x.uhid && x.uhid === p.uhid).length;
                                        const avatarColor = p.gender?.toLowerCase().startsWith('f')
                                            ? 'bg-pink-50 text-pink-600 group-hover:bg-pink-500 group-hover:text-white'
                                            : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white';
                                        return (
                                            <div
                                                key={p.record_id || i}
                                                onClick={() => setSelectedPatientId(p.record_id)}
                                                className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group ${selectedPatientId === p.record_id ? 'ring-2 ring-indigo-500 border-indigo-200' : 'hover:border-slate-300'}`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${avatarColor}`}>
                                                        {p.full_name?.[0]}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {visitCount > 1 && (
                                                            <span className="text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-md">{visitCount}V</span>
                                                        )}
                                                        <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">{p.patient_category}</span>
                                                    </div>
                                                </div>
                                                <h3 className="font-black text-slate-900 line-clamp-1 mb-1 text-sm">{p.full_name}</h3>
                                                <p className="text-xs text-slate-500 font-bold mb-4">{p.patient_u_id} • {p.age}</p>
                                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(p.admission_date)}</span>
                                                    <div className="flex items-center gap-1 text-indigo-600 font-black text-[10px]">
                                                        {p.files?.length || 0} FILES <ArrowRight size={12} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                                    <table className="w-full text-left min-w-[900px]">
                                        <thead className="bg-slate-50/80 border-b border-slate-100">
                                            <tr>
                                                {[
                                                    { key: 'record_id', label: 'RID' },
                                                    { key: 'uhid', label: 'UHID' },
                                                    { key: 'full_name', label: 'Name' },
                                                    { key: 'patient_u_id', label: 'MRD (IPD)' },
                                                    { key: 'admission_date', label: 'Admission Date' },
                                                    { key: 'discharge_date', label: 'Disch. Date' },
                                                    { key: 'doctor_name', label: 'Doctor' },
                                                    { key: 'status', label: 'Status' },
                                                ].map(col => (
                                                    <th
                                                        key={col.key}
                                                        onClick={() => handleSort(col.key)}
                                                        className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-700 select-none group whitespace-nowrap"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {col.label}
                                                            {sortConfig?.key === col.key
                                                                ? (sortConfig.direction === 'asc' ? <ChevronUp size={11} className="text-indigo-500" /> : <ChevronDown size={11} className="text-indigo-500" />)
                                                                : <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                        </div>
                                                    </th>
                                                ))}
                                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredPatients.map((p, i) => {
                                                const visitCount = patients.filter(x => x.uhid && x.uhid === p.uhid).length;
                                                const isFemale = p.gender?.toLowerCase().startsWith('f');
                                                const avatarBg = isFemale ? 'bg-pink-50 text-pink-600' : 'bg-indigo-50 text-indigo-600';
                                                const catColors: Record<string, string> = {
                                                    IPD: 'bg-blue-50 text-blue-700 border-blue-100',
                                                    OPD: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                                    MLC: 'bg-red-50 text-red-700 border-red-100',
                                                    BRT: 'bg-purple-50 text-purple-700 border-purple-100',
                                                };
                                                const catStyle = catColors[p.patient_category] || 'bg-slate-100 text-slate-500 border-slate-200';
                                                const fileCount = p.files?.length || 0;
                                                return (
                                                    <tr
                                                        key={p.record_id || i}
                                                        onClick={() => setSelectedPatientId(p.record_id)}
                                                        className={`cursor-pointer group transition-colors ${selectedPatientId === p.record_id ? 'bg-indigo-50/60' : 'hover:bg-slate-50/80'}`}
                                                    >
                                                        {/* RID */}
                                                        <td className="px-4 py-3">
                                                            <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg">#{p.record_id}</span>
                                                        </td>

                                                        {/* UHID */}
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono text-xs font-bold text-slate-500">{p.uhid || '—'}</span>
                                                            {visitCount > 1 && (
                                                                <span className="ml-1.5 text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-md">{visitCount}V</span>
                                                            )}
                                                        </td>

                                                        {/* Name */}
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${avatarBg}`}>
                                                                    {p.full_name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900 text-sm leading-tight whitespace-nowrap max-w-[180px] truncate">{p.full_name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-semibold">{isFemale ? 'Female' : 'Male'} · {p.age}</p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* MRD (IPD) */}
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-mono text-xs font-bold text-slate-700">{p.patient_u_id}</span>
                                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${catStyle}`}>{p.patient_category}</span>
                                                            </div>
                                                        </td>

                                                        {/* Admission Date */}
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-slate-700 whitespace-nowrap">{formatDate(p.admission_date) || '—'}</p>
                                                        </td>

                                                        {/* Discharge Date */}
                                                        <td className="px-4 py-3">
                                                            <p className="text-sm font-bold text-slate-500 whitespace-nowrap">{p.discharge_date ? formatDate(p.discharge_date) : <span className="text-slate-300">—</span>}</p>
                                                        </td>

                                                        {/* Doctor */}
                                                        <td className="px-4 py-3">
                                                            {p.doctor_name
                                                                ? <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg whitespace-nowrap">Dr. {p.doctor_name}</span>
                                                                : <span className="text-slate-300 text-xs">—</span>}
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-4 py-3">
                                                            {fileCount > 0
                                                                ? <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg whitespace-nowrap">DIGITAL ({fileCount})</span>
                                                                : <span className="text-[10px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">PENDING</span>}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const { val, unit } = parseAgeString(p.age);
                                                                    setNewPatient({
                                                                        full_name: p.full_name || '',
                                                                        patient_u_id: p.patient_u_id || '',
                                                                        uhid: p.uhid || '',
                                                                        age: val,
                                                                        gender: p.gender || '',
                                                                        address: p.address || '',
                                                                        contact_number: p.contact_number || '',
                                                                        email_id: p.email_id || '',
                                                                        aadhaar_number: p.aadhaar_number || '',
                                                                        patient_category: p.patient_category || 'IPD',
                                                                        dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
                                                                        admission_date: p.admission_date ? new Date(p.admission_date).toISOString().split('T')[0] : '',
                                                                        discharge_date: p.discharge_date ? new Date(p.discharge_date).toISOString().split('T')[0] : '',
                                                                        doctor_name: p.doctor_name || '',
                                                                        doctor_profile_ids: p.assigned_doctors?.map((d:any) => d.profile_id) || [],
                                                                        weight: p.weight || '',
                                                                        mediclaim: p.mediclaim || '',
                                                                        diagnosis: p.diagnosis || '',
                                                                    });
                                                                    setAgeUnit(unit);
                                                                    setIsEditing(true);
                                                                    setSelectedPatientId(p.record_id);
                                                                    setShowCreateModal(true);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            >
                                                                <Pencil size={13} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {filteredPatients.length === 0 && (
                                        <div className="py-16 text-center text-slate-400">
                                            <User size={32} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-sm font-bold">No records found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedPatientId && (
                            <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-2xl h-full overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-500">
                                <PatientDetailView
                                    patientId={selectedPatientId}
                                    onBack={() => setSelectedPatientId(null)}
                                    onDeleteSuccess={() => { setSelectedPatientId(null); fetchPatients(); }}
                                    onFileUpdate={fetchPatients}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            <PatientCreateModal
                show={showCreateModal}
                onClose={() => { setShowCreateModal(false); resetForm(); }}
                isEditing={isEditing}
                newPatient={newPatient}
                setNewPatient={setNewPatient}
                activeTab={activeTab}
                setActiveTab={(val) => setActiveTab(val as 'identity' | 'admission' | 'clinical')}
                isExtracting={isExtracting}
                onAIExtraction={(file) => {}}
                onOpenCamera={() => setShowCameraModal(true)}
                onReset={resetForm}
                onSubmit={handleCreate}
                terms={terms}
                specialty={specialty}
                userProfile={userProfile}
                hospitalDoctors={hospitalDoctors}
                isMRDDuplicate={isMRDDuplicate}
                onMRDChange={onMRDChange}
                checkExistingUHID={checkExistingUHID}
                isExistingPatient={isExistingPatient}
                suggestions={suggestions}
                showSuggestions={showSuggestions}
                setShowSuggestions={setShowSuggestions}
                onNameSearch={handleNameSearch}
                onSelectPatient={handleSelectPatient}
                ageUnit={ageUnit}
                setAgeUnit={setAgeUnit}
                calculateAge={calculateAge}
                toUpperCaseMRD={toUpperCaseMRD}
                toTitleCase={toTitleCase}
            />

            <CameraModal
                isOpen={showCameraModal}
                onClose={() => setShowCameraModal(false)}
                onCapture={(file) => {}}
            />
        </DashboardPageShell>
    );
}
