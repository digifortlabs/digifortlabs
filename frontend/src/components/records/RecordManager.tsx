"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, FolderOpen, User, FileText, Loader2, RefreshCw, Building2, LayoutGrid, List, Activity, ArrowRight, ArrowUpDown, Pencil, ChevronRight } from 'lucide-react';
import { useTerminology } from '@/hooks/useTerminology';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL, apiFetch } from '@/config/api';
import { toTitleCase, toUpperCaseMRD } from '@/lib/formatters';
import { formatDate } from '@/lib/dateFormatter';
import DashboardPageShell from '@/components/DashboardPageShell';

// Dynamic imports or standardized paths for components
import CameraModal from '@/app/dashboard/records/components/CameraModal';
import PatientDetailView from '@/app/dashboard/records/components/PatientDetailView';
import DentalPatientDetail from '@/app/dashboard/dental/components/PatientDetail';
import PatientCreateModal from '@/app/dashboard/records/components/PatientCreateModal';

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
    mother_record_id: string | number;
    doctor_name: string;
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
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
    const [hospitalDoctors, setHospitalDoctors] = useState<string[]>([]);
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

    const [newPatient, setNewPatient] = useState<PatientState>({
        full_name: '', patient_u_id: '', uhid: '', age: '', gender: '', address: '', contact_number: '', email_id: '',
        aadhaar_number: '', patient_category: config.category, dob: '', admission_date: '', discharge_date: '',
        mother_record_id: '', doctor_name: '', weight: '', mediclaim: '', diagnosis: ''
    });

    // --- Helpers ---
    const resetForm = () => {
        setNewPatient({
            full_name: '', patient_u_id: '', uhid: '', age: '', gender: '', address: '', contact_number: '', email_id: '',
            aadhaar_number: '', patient_category: specialty === 'Dental' ? 'OPD' : config.category, dob: '', admission_date: '', discharge_date: '',
            mother_record_id: '', doctor_name: '', weight: '', mediclaim: '', diagnosis: ''
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
        try {
            const data = await apiFetch(`users/me`);
            if (data) setUserProfile(data);
        } catch (e) { console.error(e); }
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
            let url = `patients/?start_date=${startDate}&end_date=${endDate}`;
            if (mode === 'corporate') url += `&module=corporate`;
            if (specialty === 'Dental') url = `dental/patients?skip=0&limit=100`;

            if (selectedHospitalId && ['superadmin', 'superadmin_staff', 'website_admin', 'website_staff'].includes(userProfile?.role)) {
                url += `&hospital_id=${selectedHospitalId}`;
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
            let url = `patients/doctors`;
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
        fetchUserProfile();
        const saved = localStorage.getItem('globalHospitalId');
        if (saved) setSelectedHospitalId(Number(saved));

        const handleHospitalChanged = (e: any) => setSelectedHospitalId(e.detail ? Number(e.detail) : null);
        window.addEventListener('hospitalChanged', handleHospitalChanged);
        return () => window.removeEventListener('hospitalChanged', handleHospitalChanged);
    }, []);

    useEffect(() => {
        if (userProfile) {
            if (['website_admin', 'website_staff', 'superadmin', 'superadmin_staff'].includes(userProfile.role)) {
                fetchHospitals();
                if (hospitalIdParam) setSelectedHospitalId(parseInt(hospitalIdParam));
            } else {
                if (userProfile.hospital_id) setSelectedHospitalId(userProfile.hospital_id);
                fetchPatients();
            }
        }
    }, [userProfile]);

    useEffect(() => {
        if (selectedHospitalId || (userProfile && !['superadmin', 'superadmin_staff', 'website_admin', 'website_staff'].includes(userProfile.role))) {
            fetchPatients();
            fetchDoctors();
        }
    }, [selectedHospitalId, startDate, endDate]);

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
            if (!newPatient.full_name || !newPatient.patient_u_id || !newPatient.age || !newPatient.gender || !newPatient.contact_number) {
                alert("Please fill all required fields (*).");
                return;
            }

            const body: any = { ...newPatient, age: `${newPatient.age} ${ageUnit}` };
            if (selectedHospitalId) body.hospital_id = selectedHospitalId;

            let data;
            if (isEditing && selectedPatientId) {
                data = await apiFetch(`patients/${selectedPatientId}`, { method: 'PUT', body: JSON.stringify(body) });
            } else {
                data = await apiFetch(`patients/`, { method: 'POST', body: JSON.stringify(body) });
            }

            if (data) {
                if (isEditing) {
                    setPatients(patients.map(p => (p.record_id || p.patient_id) === selectedPatientId ? data : p));
                    alert(`${mode === 'patients' ? terms.patient : 'Document'} Updated Successfully!`);
                    setShowCreateModal(false);
                    resetForm();
                } else {
                    setPatients([data, ...patients]);
                    router.push(`/dashboard/records/view?id=${data.record_id}`);
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
        }));
        setAgeUnit(unit);
        setIsExistingPatient(true);
        setShowSuggestions(false);
        fetchNextMRD();
    };

    const onMRDChange = async (val: string) => {
        const uppercaseVal = toUpperCaseMRD(val);
        setNewPatient(prev => ({ ...prev, patient_u_id: uppercaseVal }));
        if (uppercaseVal.length > 2) {
            const existsLocally = patients.some(p => p.patient_u_id?.toUpperCase() === uppercaseVal);
            if (existsLocally) {
                setIsMRDDuplicate(true);
                return;
            }
            try {
                const res = await apiFetch(`/patients/check-mrd?mrd=${encodeURIComponent(uppercaseVal)}`);
                setIsMRDDuplicate(res?.exists || false);
            } catch (e) {
                console.error(e);
                setIsMRDDuplicate(false);
            }
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
            } catch (e) {
                console.error(e);
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
                <div className="flex gap-2 items-center">
                    {['superadmin', 'superadmin_staff', 'website_admin', 'website_staff'].includes(userProfile?.role) && (
                        <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm flex items-center gap-2">
                            <Building2 size={16} className="text-indigo-600" />
                            <select
                                className="bg-transparent font-bold text-xs text-slate-700 outline-none"
                                value={selectedHospitalId || ''}
                                onChange={(e) => setSelectedHospitalId(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">Select Client</option>
                                {hospitals.map(h => <option key={h.hospital_id} value={h.hospital_id}>{h.legal_name}</option>)}
                            </select>
                        </div>
                    )}
                    <button
                        onClick={() => { resetForm(); setShowCreateModal(true); }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
                    >
                        <Plus size={16} /> New {mode === 'patients' ? terms.patient : 'Document'}
                    </button>
                </div>
            }
        >
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {config.showCategories && (
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['', 'IPD', 'OPD', 'MLC', 'BRT'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {cat || 'All'}
                            </button>
                        ))}
                    </div>
                )}
                
                <div className="flex gap-2 bg-white border border-slate-200 p-1 rounded-xl ml-auto">
                    <input type="date" className="bg-transparent text-[10px] font-black text-slate-500 outline-none px-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <div className="w-[1px] bg-slate-200"></div>
                    <input type="date" className="bg-transparent text-[10px] font-black text-slate-500 outline-none px-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>

                <div className="flex bg-white border border-slate-200 p-1 rounded-xl">
                    <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-lg ${viewMode === 'card' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
                    <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}><List size={16} /></button>
                </div>
            </div>

            {/* List Content */}
            <div className="flex gap-4 items-start">
                <div className={`${selectedPatientId ? 'hidden lg:block lg:w-[350px]' : 'w-full'} transition-all`}>
                    {viewMode === 'card' ? (
                        <div className={`grid gap-4 ${selectedPatientId ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} pb-20`}>
                            {filteredPatients.map((p, i) => (
                                <div
                                    key={p.record_id || i}
                                    onClick={() => setSelectedPatientId(p.record_id)}
                                    className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group ${selectedPatientId === p.record_id ? 'ring-2 ring-indigo-600' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {p.full_name?.[0]}
                                        </div>
                                        <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">{p.patient_category}</span>
                                    </div>
                                    <h3 className="font-black text-slate-900 line-clamp-1 mb-1">{p.full_name}</h3>
                                    <p className="text-xs text-slate-500 font-bold mb-4">{p.patient_u_id} • {p.age}</p>
                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(p.admission_date)}</span>
                                        <div className="flex items-center gap-1 text-indigo-600 font-black text-[10px]">
                                            {p.files?.length || 0} FILES <ArrowRight size={12} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identify</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredPatients.map((p, i) => (
                                        <tr key={i} onClick={() => setSelectedPatientId(p.record_id)} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500">{p.full_name?.[0]}</div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-sm">{p.full_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase">{p.gender} • {p.age}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-mono text-xs font-bold text-slate-600">{p.patient_u_id}</p>
                                                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">{p.uhid || 'NO UHID'}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-bold text-slate-700">{formatDate(p.admission_date)}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase">Admission</p>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setSelectedPatientId(p.record_id); setShowCreateModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                    <Pencil size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {selectedPatientId && (
                    <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-2xl h-[calc(100vh-280px)] overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-500">
                        <PatientDetailView
                            patientId={selectedPatientId}
                            onBack={() => setSelectedPatientId(null)}
                            onDeleteSuccess={() => { setSelectedPatientId(null); fetchPatients(); }}
                            onFileUpdate={fetchPatients}
                        />
                    </div>
                )}
            </div>

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
                onAIExtraction={(file) => console.log('AI Extraction', file)}
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
                onCapture={(file) => console.log('Capture', file)}
            />
        </DashboardPageShell>
    );
}
