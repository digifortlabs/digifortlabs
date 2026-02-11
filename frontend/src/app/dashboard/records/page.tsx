"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Eye, Trash2, Edit, ChevronLeft, ChevronRight, X, Upload, Sparkles, FolderOpen, Calendar, User, FileText, Loader2, RefreshCw, Camera, Building2, ArrowRight, ArrowUpDown, Pencil } from 'lucide-react';
import CameraModal from './components/CameraModal';
import PatientDetailView from './components/PatientDetailView';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '../../../config/api';
import { toTitleCase, toUpperCaseMRD } from '@/lib/formatters';
import { formatDate } from '@/lib/dateFormatter';

export default function RecordsList() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hospitalIdParam = searchParams.get('hospital_id');
    const action = searchParams.get('action'); // ?action=new

    interface NewPatientState {
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

    const [patients, setPatients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [ageUnit, setAgeUnit] = useState<'Years' | 'Months' | 'Days'>('Years');
    const [isMRDDuplicate, setIsMRDDuplicate] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]); // Search suggestions
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isExistingPatient, setIsExistingPatient] = useState(false); // To verify reused details

    const [isEditing, setIsEditing] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Date Filtering
    const getMonthRange = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    };

    const monthRange = getMonthRange();
    const [startDate, setStartDate] = useState(monthRange.start);
    const [endDate, setEndDate] = useState(monthRange.end);

    const [hospitalDoctors, setHospitalDoctors] = useState<string[]>([]);
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Hospital Management (for Super Admins)
    const [userProfile, setUserProfile] = useState<any>(null);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

    // New Patient Form State
    const [newPatient, setNewPatient] = useState<NewPatientState>({
        full_name: '',
        patient_u_id: '',
        uhid: '', // New UHID field
        age: '',
        gender: '', // Required
        address: '',
        contact_number: '', // Required
        email_id: '',
        aadhaar_number: '',
        patient_category: 'STANDARD', // STANDARD, MLC, BIRTH, DEATH
        dob: '',
        admission_date: '',
        discharge_date: '',
        mother_record_id: '' as string | number, // Store ID if linked
        doctor_name: '',
        weight: '',
        mediclaim: '',
        diagnosis: ''
    });

    const calculateAge = (dob: string) => {
        if (!dob) return;
        const birthDate = new Date(dob);
        const today = new Date();

        // Calculate difference in months and years
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        const days = today.getDate() - birthDate.getDate();

        // Adjust for negative months (meaning birth month hasn't happened yet this year)
        if (months < 0 || (months === 0 && days < 0)) {
            years--;
            months += 12;
        }

        if (days < 0) {
            months--;
            // If months becomes negative after day adjustment, wrap around
            if (months < 0) {
                months += 12;
                years--;
            }
        }

        // Logic: < 1 Year -> Use Months. >= 1 Year -> Use Years
        if (years >= 1) {
            setNewPatient(prev => ({ ...prev, dob: dob, age: years.toString() }));
            setAgeUnit('Years');
        } else {
            // Baby Case
            // If month is 0 (less than a month old), maybe Days? But user asked for Month.
            // Let's default to Months. If 0 months, show 1 Month or Days?
            // Let's stick to user request "baby also in month"
            let finalMonths = Math.max(0, months);
            if (finalMonths === 0 && years === 0) {
                // Very new born, maybe days? But standardizing to Months for now unless requested.
                finalMonths = 1; // Default to 1 month or 0? 0 Months looks weird.
            }
            setNewPatient(prev => ({ ...prev, dob: dob, age: finalMonths.toString() }));
            setAgeUnit('Months');
        }
    };

    const checkDuplicateMRD = (mrd: string) => {
        const found = patients.find(p => p.patient_u_id?.toLowerCase() === mrd.toLowerCase());
        if (found) {
            setIsMRDDuplicate(true);
            // alert("⚠️ Patient Found! \nDetails have been auto-filled. You cannot create a duplicate.");
            // We only warn for MRD duplicate. We don't auto-fill here because MRD duplicate blocks creation anyway.
        } else {
            setIsMRDDuplicate(false);
        }
    };

    const resetForm = () => {
        setNewPatient({
            full_name: '', patient_u_id: '', uhid: '', age: '', gender: '', address: '', contact_number: '', email_id: '',
            aadhaar_number: '', patient_category: 'IPD', dob: '', admission_date: '', discharge_date: '',
            mother_record_id: '', doctor_name: '', weight: '', mediclaim: '', diagnosis: ''
        });
        setIsExistingPatient(false);
        setMotherSearchTerm('');
        setMotherSuggestions([]);
        setSelectedMother(null);
        setIsMRDDuplicate(false);
        setIsEditing(false);
        setSelectedPatientId(null);
        setLastMRD(null);
    };


    const [lastMRD, setLastMRD] = useState<string | null>(null);
    const [lastAssignedMRD, setLastAssignedMRD] = useState<string | null>(null);

    const handleAIExtraction = async (file: File) => {
        setIsExtracting(true);
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/patients/extract-details`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                const { val, unit } = parseAgeString(data.age || '');

                setNewPatient(prev => ({
                    ...prev,
                    full_name: data.full_name || prev.full_name,
                    age: val || prev.age,
                    gender: data.gender || prev.gender,
                    address: data.address || prev.address,
                    contact_number: data.contact_number || prev.contact_number,
                    aadhaar_number: data.aadhaar_number || prev.aadhaar_number,
                    dob: data.dob || prev.dob,
                    diagnosis: data.diagnosis || prev.diagnosis,
                    uhid: data.uhid || prev.uhid
                }));
                if (unit) setAgeUnit(unit);
                alert("✨ AI Magic complete! Fields have been auto-filled.");
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || "Failed to extract details"}`);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to connect to AI service.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleCameraCapture = (file: File) => {
        handleAIExtraction(file); // Reuse the existing extraction logic
    };

    const parseAgeString = (ageStr: string | number): { val: string, unit: 'Years' | 'Months' | 'Days' } => {
        if (!ageStr) return { val: '', unit: 'Years' };
        const s = ageStr.toString();
        if (s.toLowerCase().includes('month')) return { val: s.replace(/\D/g, ''), unit: 'Months' };
        if (s.toLowerCase().includes('day')) return { val: s.replace(/\D/g, ''), unit: 'Days' };
        return { val: s.replace(/\D/g, ''), unit: 'Years' }; // Default to Years or strip 'Years' text
    };

    // Check if UHID exists and auto-fill
    const checkExistingUHID = async (uhid: string) => {
        if (!uhid || uhid.length < 3) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/patients/check/uhid/${uhid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.exists) {
                    const p = data.patient;
                    const { val, unit } = parseAgeString(p.age);
                    setNewPatient(prev => ({
                        ...prev,
                        full_name: p.full_name || '',
                        age: val,
                        gender: p.gender || '',
                        address: p.address || '',
                        contact_number: p.contact_number || '',
                        email_id: p.email_id || '',
                        aadhaar_number: p.aadhaar_number || '',
                        patient_category: p.patient_category || 'STANDARD',
                        dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : ''
                    }));
                    setAgeUnit(unit);
                    setIsExistingPatient(true);
                    if (p.last_mrd) setLastMRD(p.last_mrd);
                    fetchNextMRD(); // Auto-fill next MRD for existing patient too
                } else {
                    setIsExistingPatient(false);
                    setLastMRD(null);
                }
            }
        } catch (err) {
            console.error("Error checking UHID:", err);
        }
    };

    const fetchNextMRD = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Prevent 400 Bad Request for Super Admins if no hospital selected
        // We assume 'userProfile' is available in scope (used elsewhere in component)
        const role = userProfile?.role;
        if ((role === 'superadmin' || role === 'superadmin_staff') && !selectedHospitalId) {
            return;
        }

        // For superadmins, we need to pass the selected hospital
        let url = `${API_URL}/patients/next-id`;
        if (selectedHospitalId) {
            url += `?hospital_id=${selectedHospitalId}`;
        }

        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // User Request: Remove auto-fill. Only show helper text.
                // if (data.next_id) {
                //    setNewPatient(prev => ({ ...prev, patient_u_id: data.next_id }));
                // }
                if (data.last_id) {
                    setLastAssignedMRD(data.last_id);
                }
            } else {
                console.warn("Next ID fetch failed", res.status);
            }
        } catch (e) { console.error("Failed to fetch next MRD", e); }
    };

    const handleSelectPatient = (p: any) => {
        const { val, unit } = parseAgeString(p.age);
        setNewPatient(prev => ({ // Updated to functional state update for safety
            ...prev,
            full_name: p.full_name || '',
            patient_u_id: '', // Will fetch next ID below
            uhid: p.uhid || '',
            age: val,
            gender: p.gender || '',
            address: p.address || '',
            contact_number: p.contact_number || '',
            email_id: p.email_id || '',
            aadhaar_number: p.aadhaar_number || '',
            patient_category: 'STANDARD',
            dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
            admission_date: '',
            discharge_date: '',
            mother_record_id: '',
            doctor_name: p.doctor_name || '',
            weight: p.weight || '',
            mediclaim: p.mediclaim || '',
            diagnosis: p.diagnosis || ''
        }));
        setAgeUnit(unit);
        setIsExistingPatient(true);
        setShowSuggestions(false);

        // Auto-fetch next MRD ID for the New Visit
        fetchNextMRD();
    };

    const handleNameSearch = (val: string) => {
        setNewPatient(prev => ({ ...prev, full_name: toTitleCase(val) }));
        if (val.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        // Filter unique patients by UHID or Name (to avoid listing every admission of same patient multiple times, we'd need grouping, but simple filter is fine for MVP)
        // Actually, we want to suggest *Identities*.
        const matches = patients.filter(p =>
            p.full_name?.toLowerCase().includes(val.toLowerCase()) ||
            p.uhid?.toLowerCase().includes(val.toLowerCase()) ||
            p.contact_number?.includes(val)
        ).slice(0, 5); // Limit 5

        setSuggestions(matches);
        setShowSuggestions(true);
    };

    // --- Mother Search Logic ---
    const [motherSearchTerm, setMotherSearchTerm] = useState('');
    const [motherSuggestions, setMotherSuggestions] = useState<any[]>([]);
    const [selectedMother, setSelectedMother] = useState<any>(null);

    const handleMotherSearch = (val: string) => {
        setMotherSearchTerm(val);
        if (val.length < 2) {
            setMotherSuggestions([]);
            return;
        }
        // Filter females
        const matches = patients.filter(p =>
            (p.gender === 'Female' || p.gender?.toLowerCase() === 'f') &&
            (p.full_name?.toLowerCase().includes(val.toLowerCase()) ||
                p.uhid?.toLowerCase().includes(val.toLowerCase()) ||
                p.patient_u_id?.toLowerCase().includes(val.toLowerCase()))
        ).slice(0, 5);
        setMotherSuggestions(matches);
    };

    const selectMother = (m: any) => {
        setNewPatient(prev => ({ ...prev, mother_record_id: m.record_id }));
        setSelectedMother(m);
        setMotherSearchTerm('');
        setMotherSuggestions([]);
    };

    const removeMother = () => {
        setNewPatient(prev => ({ ...prev, mother_record_id: '' }));
        setSelectedMother(null);
    };

    useEffect(() => {
        if (action === 'new') {
            setShowCreateModal(true);
        }
        fetchUserProfile();
    }, [action]);

    useEffect(() => {
        if (userProfile) {
            if (['website_admin', 'website_staff', 'superadmin', 'superadmin_staff'].includes(userProfile.role)) {
                fetchHospitals();
                if (hospitalIdParam) {
                    setSelectedHospitalId(parseInt(hospitalIdParam));
                }
            } else {
                // Regular hospital staff - set their hospital ID
                if (userProfile.hospital_id) {
                    setSelectedHospitalId(userProfile.hospital_id);
                }
                fetchPatients();
            }
        }
    }, [userProfile]);

    // Refetch patients when hospital selection or dates change
    useEffect(() => {
        if (selectedHospitalId) {
            fetchPatients();
            fetchDoctors();
        } else if (userProfile && ['website_admin', 'website_staff', 'superadmin', 'superadmin_staff'].includes(userProfile.role)) {
            setPatients([]); // Clear list if deselecting
            setHospitalDoctors([]);
        } else if (userProfile && !['website_admin', 'website_staff', 'superadmin', 'superadmin_staff'].includes(userProfile.role)) {
            // Regular hospital user - fetch based on dates
            fetchPatients();
        }
    }, [selectedHospitalId, userProfile, startDate, endDate]);

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
        setLoading(true);
        try {
            // Append hospital_id and date filters
            let url = `${API_URL}/patients/?start_date=${startDate}&end_date=${endDate}`;
            if (selectedHospitalId && (userProfile?.role === 'superadmin' || userProfile?.role === 'superadmin_staff')) {
                url += `&hospital_id=${selectedHospitalId}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setPatients(await res.json());
            } else if (res.status === 401) {
                const errData = await res.json();
                const msg = errData.detail || "Session expired";
                window.location.href = `/login?error=${encodeURIComponent(msg)}`;
            }
        } catch (err: any) {
            console.error(err);
            alert("Failed to load records. Check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            let url = `${API_URL}/patients/doctors`;
            if (selectedHospitalId && (userProfile?.role === 'superadmin' || userProfile?.role === 'superadmin_staff')) {
                url += `?hospital_id=${selectedHospitalId}`;
            }
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setHospitalDoctors(await res.json());
        } catch (e) { console.error("Failed to fetch doctors", e); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            if (!newPatient.full_name || !newPatient.patient_u_id || !newPatient.age || !newPatient.gender || !newPatient.contact_number) {
                alert("Please fill all required fields (*).");
                return;
            }

            // Check if super admin has selected a hospital
            if ((userProfile?.role === 'superadmin' || userProfile?.role === 'superadmin_staff') && !selectedHospitalId) {
                alert("Please select a hospital first.");
                return;
            }

            const body: any = { ...newPatient };
            body.dob = newPatient.dob || null;
            body.admission_date = newPatient.admission_date || null;
            body.discharge_date = newPatient.discharge_date || null;
            body.mother_record_id = newPatient.mother_record_id || null;
            body.uhid = newPatient.uhid || null;
            // Append Unit to Age
            body.age = `${newPatient.age} ${ageUnit}`;

            // Include hospital_id for super admins
            if (selectedHospitalId && (userProfile?.role === 'superadmin' || userProfile?.role === 'superadmin_staff')) {
                body.hospital_id = selectedHospitalId;
            }

            let res;
            if (isEditing && selectedPatientId) {
                // Update Existing
                res = await fetch(`${API_URL}/patients/${selectedPatientId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                });
            } else {
                // Create New
                res = await fetch(`${API_URL}/patients/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                });
            }

            if (res.ok) {
                const data = await res.json();
                fetchDoctors(); // Refresh suggestions
                if (isEditing) {
                    setPatients(patients.map(p => p.record_id === selectedPatientId ? data : p));
                    alert("Patient Details Updated Successfully!");
                    setShowCreateModal(false);
                    resetForm();
                } else {
                    setPatients([data, ...patients]);
                    router.push(`/dashboard/records/view?id=${data.record_id}`);
                }
            }
        } catch (err: any) {
            console.error(err);
            alert(`Error: ${err.message || "Network error occurred."}`);
        }
    };

    // Filter Logic
    // Filter Logic
    const filteredPatients = React.useMemo(() => {
        let filtered = patients.filter(p =>
            p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.patient_u_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.uhid?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig) {
            filtered = [...filtered].sort((a, b) => {
                let aValue = a[sortConfig.key] || '';
                let bValue = b[sortConfig.key] || '';

                // Handle date sorting specifically if keys match date fields
                if (sortConfig.key === 'dates') {
                    // Sort by discharge date, then admission date
                    aValue = a.discharge_date || a.admission_date || '';
                    bValue = b.discharge_date || b.admission_date || '';
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [patients, searchTerm, sortConfig]);

    return (
        <div className="w-full mx-auto px-4 sm:px-6 pb-6 pt-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <User className="text-indigo-600" /> Patient Records
                    </h1>
                    <p className="text-slate-500 mt-2">Manage patient files and digital records.</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto flex-wrap items-center">
                    {/* Hospital Selector for Platform Admins */}
                    {(userProfile?.role === 'superadmin' || userProfile?.role === 'superadmin_staff') && (
                        <div className="flex flex-1 md:flex-none items-center gap-2 bg-white border border-slate-200 px-3 md:px-4 py-3 rounded-xl shadow-sm min-w-[200px]">
                            <Building2 size={18} className="text-indigo-600 flex-shrink-0" />
                            <select
                                className="bg-transparent font-bold text-slate-700 outline-none pr-2 text-sm md:text-base w-full"
                                value={selectedHospitalId || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedHospitalId(val ? parseInt(val) : null);
                                }}
                            >
                                <option value="">Select Hospital</option>
                                {hospitals.map(h => (
                                    <option key={h.hospital_id} value={h.hospital_id}>{h.legal_name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="relative flex-1 md:w-80 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search Patients..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
                        <div className="flex flex-col px-2">
                            <label className="text-[10px] uppercase font-black text-slate-400 mb-0.5 ml-1">From</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                            />
                        </div>
                        <div className="w-px h-8 bg-slate-100 mx-1"></div>
                        <div className="flex flex-col px-2">
                            <label className="text-[10px] uppercase font-black text-slate-400 mb-0.5 ml-1">To</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                            />
                        </div>
                    </div>

                    {/* Filtered Stats */}
                    <div className="flex gap-2 bg-indigo-50/50 border border-indigo-100 p-1.5 rounded-xl shadow-sm">
                        <div className="flex flex-col px-3 border-r border-indigo-100">
                            <label className="text-[10px] uppercase font-black text-indigo-400 mb-0.5">Total Patients</label>
                            <span className="text-sm font-black text-indigo-700 leading-none">{filteredPatients.length}</span>
                        </div>
                        <div className="flex flex-col px-3">
                            <label className="text-[10px] uppercase font-black text-indigo-400 mb-0.5">Total Files</label>
                            <span className="text-sm font-black text-indigo-700 leading-none">
                                {filteredPatients.reduce((acc, p) => acc + (p.files?.length || 0), 0)}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setShowCreateModal(true);
                                fetchNextMRD(); // Auto-fill next MRD
                            }}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                        >
                            <Plus size={20} /> <span className="hidden md:inline">Add New MRD</span>
                        </button>
                    </div>
                </div>
            </div>



            {(!selectedHospitalId && (userProfile?.role === 'superadmin' || userProfile?.role === 'superadmin_staff')) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hospitals.map(h => (
                        <button
                            key={h.hospital_id}
                            onClick={() => setSelectedHospitalId(h.hospital_id)}
                            className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left group"
                        >
                            <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                                <Building2 className="text-indigo-600 group-hover:text-white transition-colors" size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{h.legal_name}</h3>
                            <p className="text-slate-500 text-sm font-medium">{h.city}, {h.state}</p>
                            <div className="mt-6 flex items-center gap-2 text-indigo-600 font-bold text-sm group-hover:gap-3 transition-all">
                                View Records <ArrowRight size={16} />
                            </div>
                        </button>
                    ))}
                    {hospitals.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-400">
                            No hospitals found.
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex gap-6 items-start">
                    {/* Master List */}
                    <div className={`${selectedPatientId ? 'hidden lg:block lg:w-1/3' : 'w-full'} transition-all`}>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                            <div className="overflow-x-auto h-full">
                                <table className="w-full text-left">
                                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort('record_id')}>
                                                <div className="flex items-center gap-1">RID <ArrowUpDown size={12} className="text-slate-300" /></div>
                                            </th>
                                            <th className="p-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort('uhid')}>
                                                <div className="flex items-center gap-1">UHID <ArrowUpDown size={12} className="text-slate-300" /></div>
                                            </th>
                                            <th className="p-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('full_name')}>
                                                <div className="flex items-center gap-1">Name <ArrowUpDown size={12} className="text-slate-300" /></div>
                                            </th>
                                            <th className="p-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort('patient_u_id')}>
                                                <div className="flex items-center gap-1">MRD (IPD) <ArrowUpDown size={12} className="text-slate-300" /></div>
                                            </th>
                                            <th className="p-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort('admission_date')}>
                                                <div className="flex items-center gap-1">Adm. Date <ArrowUpDown size={12} className="text-slate-300" /></div>
                                            </th>
                                            <th className="p-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort('discharge_date')}>
                                                <div className="flex items-center gap-1">Disch. Date <ArrowUpDown size={12} className="text-slate-300" /></div>
                                            </th>
                                            <th className="p-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort('doctor_name')}>
                                                <div className="flex items-center gap-1">Doctor <ArrowUpDown size={12} className="text-slate-300" /></div>
                                            </th>
                                            <th className="p-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Status</th>
                                            <th className="p-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            // Skeleton Loader
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="p-3"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                                                    <td className="p-3"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                                                    <td className="p-3"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                                                    <td className="p-3"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                                    <td className="p-3"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                                    <td className="p-3 hidden md:table-cell"><div className="h-6 bg-slate-200 rounded w-16"></div></td>
                                                    <td className="p-3 text-right"><div className="h-8 w-8 bg-slate-200 rounded-lg ml-auto"></div></td>
                                                </tr>
                                            ))
                                        ) : filteredPatients.length === 0 ? (
                                            <tr><td colSpan={9} className="p-12 text-center text-slate-400 italic">No patients found.</td></tr>
                                        ) : (
                                            filteredPatients.map(p => (
                                                <tr
                                                    key={p.record_id}
                                                    className={`hover:bg-slate-50/80 transition cursor-pointer ${selectedPatientId === p.record_id ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : ''}`}
                                                    onClick={() => setSelectedPatientId(p.record_id)}
                                                >
                                                    {/* RID */}
                                                    <td className="p-3 align-middle">
                                                        <span className="text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-600 font-mono font-black border border-indigo-100">#{p.record_id}</span>
                                                    </td>

                                                    {/* UHID */}
                                                    <td className="p-3 align-middle">
                                                        {p.uhid ? (
                                                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono font-bold">{p.uhid}</span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs italic">—</span>
                                                        )}
                                                    </td>

                                                    {/* Name */}
                                                    <td className="p-3 align-middle">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-black border
                                                        ${p.patient_category === 'MCL' ? 'bg-red-50 text-red-600 border-red-200' :
                                                                    p.patient_category === 'BRT' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                                        p.patient_category === 'DHT' ? 'bg-slate-900 text-white border-slate-700' :
                                                                            'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                                                {p.full_name?.[0]}
                                                            </div>
                                                            <span className={`text-sm font-bold text-slate-900 truncate max-w-[12rem] ${p.patient_category === 'MCL' ? 'text-red-700' : ''}`}>
                                                                {p.full_name}
                                                                {p.patient_category === 'MCL' && <span className="ml-1 text-[9px] bg-red-100 text-red-700 px-1 rounded border border-red-200">MCL</span>}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* MRD ID */}
                                                    <td className="p-3 align-middle">
                                                        <span className="text-xs text-slate-600 font-mono font-medium">{p.patient_u_id}</span>
                                                        {p.files?.length > 0 && (
                                                            <span className="ml-2 text-[9px] bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded font-bold inline-flex items-center gap-0.5">
                                                                <FileText size={8} /> {p.files.length}
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Admission Date */}
                                                    <td className="p-3 align-middle whitespace-nowrap">
                                                        {p.admission_date ? (
                                                            <span className="text-xs text-slate-500 font-medium">{formatDate(p.admission_date)}</span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    {/* Discharge Date */}
                                                    <td className="p-3 align-middle whitespace-nowrap">
                                                        {p.discharge_date ? (
                                                            <span className="text-xs font-bold text-slate-700">{formatDate(p.discharge_date)}</span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">—</span>
                                                        )}
                                                    </td>

                                                    {/* Doctor */}
                                                    <td className="p-3 align-middle">
                                                        <div className="flex flex-wrap gap-1 max-w-[12rem]">
                                                            {p.doctor_name ? p.doctor_name.split(',').map((d: string) => d.trim()).filter(Boolean).map((doc: string, idx: number) => (
                                                                <span key={idx} className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 whitespace-nowrap">
                                                                    {doc.startsWith('Dr.') ? doc : `Dr. ${doc}`}
                                                                </span>
                                                            )) : (
                                                                <span className="text-slate-300 text-[10px] italic">Not assigned</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="p-3 hidden md:table-cell align-middle">
                                                        {p.physical_box_id ? (
                                                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">Archived</span>
                                                        ) : p.files && p.files.length > 0 ? (
                                                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wide">Digital</span>
                                                        ) : (
                                                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wide">Physical</span>
                                                        )}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="p-3 text-right align-middle">
                                                        <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            const { val, unit } = parseAgeString(p.age);
                                                            setNewPatient({
                                                                full_name: p.full_name,
                                                                patient_u_id: p.patient_u_id,
                                                                uhid: p.uhid || '',
                                                                age: val,
                                                                gender: p.gender || '',
                                                                address: p.address || '',
                                                                contact_number: p.contact_number || '',
                                                                email_id: p.email_id || '',
                                                                aadhaar_number: p.aadhaar_number || '',
                                                                patient_category: p.patient_category || 'STANDARD',
                                                                dob: p.dob ? (p.dob.includes('T') ? p.dob.split('T')[0] : p.dob) : '',
                                                                admission_date: p.admission_date ? (p.admission_date.includes('T') ? p.admission_date.split('T')[0] : p.admission_date) : '',
                                                                discharge_date: p.discharge_date ? (p.discharge_date.includes('T') ? p.discharge_date.split('T')[0] : p.discharge_date) : '',
                                                                mother_record_id: p.mother_record_id || '',
                                                                doctor_name: p.doctor_name || '',
                                                                weight: p.weight || '',
                                                                mediclaim: p.mediclaim || '',
                                                                diagnosis: p.diagnosis || ''
                                                            });
                                                            if (p.mother_record_id && p.mother_details) {
                                                                setSelectedMother(p.mother_details);
                                                            } else {
                                                                setSelectedMother(null);
                                                            }

                                                            setAgeUnit(unit);
                                                            setSelectedPatientId(p.record_id);
                                                            setIsEditing(true);
                                                            setShowCreateModal(true);

                                                        }} className="text-slate-400 hover:text-blue-600 transition p-2 hover:bg-blue-50 rounded-lg" title="Edit Patient">
                                                            <Pencil size={16} />
                                                        </button>

                                                        <div className="md:hidden mt-2">
                                                            <ChevronRight size={20} className="text-slate-300 ml-auto" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Detail View Pane */}
                    {selectedPatientId && (
                        <div className="w-full lg:w-2/3 h-[calc(100vh-200px)] flex flex-col animate-in slide-in-from-right-10 duration-300">
                            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden h-full flex flex-col">
                                <PatientDetailView
                                    patientId={selectedPatientId}
                                    onBack={() => setSelectedPatientId(null)}
                                    onDeleteSuccess={() => {
                                        setSelectedPatientId(null);
                                        fetchPatients();
                                    }}
                                    onFileUpdate={fetchPatients}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create Patient Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-[1.5rem] max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative max-h-[95vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-5 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <User className="text-indigo-600" size={20} /> {isEditing ? 'Edit Patient' : 'Register New Patient'}
                                </h2>
                                <div className="flex gap-2">
                                    {/* AI Features - Restricted to Authorized Roles */}
                                    {(['superadmin', 'platform_staff', 'website_admin'].includes(userProfile?.role)) && (
                                        <>
                                            <label className={`flex items-center gap-2 px-3 py-1 rounded-lg border cursor-pointer transition-all ${isExtracting ? 'bg-indigo-50 border-indigo-200 cursor-wait' : 'bg-indigo-50/20 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'}`}>
                                                {isExtracting ? (
                                                    <>
                                                        <Loader2 size={12} className="text-indigo-600 animate-spin" />
                                                        <span className="text-[10px] font-bold text-indigo-600">AI Processing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={12} className="text-indigo-600" />
                                                        <span className="text-[10px] font-bold text-indigo-600">Magic AI</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*,.pdf"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleAIExtraction(file);
                                                                e.target.value = '';
                                                            }}
                                                            disabled={isExtracting}
                                                        />
                                                    </>
                                                )
                                                }
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => setShowCameraModal(true)}
                                                disabled={isExtracting}
                                                className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${isExtracting ? 'bg-indigo-50 border-indigo-200 cursor-wait' : 'bg-indigo-50/20 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'}`}
                                            >
                                                <Camera size={12} className="text-indigo-600" />
                                                <span className="text-[10px] font-bold text-indigo-600">Camera</span>
                                            </button>
                                        </>
                                    )}

                                    <button
                                        onClick={resetForm}
                                        className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-200 transition"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={() => { setShowCreateModal(false); resetForm(); router.replace('/dashboard/records'); }}
                                        className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* Form Content */}

                            <form onSubmit={handleCreate} className="space-y-4">
                                {/* Hospital Selection for Super Admins */}
                                {(userProfile?.role === 'superadmin' || userProfile?.role === 'superadmin_staff') && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Select Hospital <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <select
                                                required
                                                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-700 text-sm"
                                                value={selectedHospitalId || ''}
                                                onChange={(e) => setSelectedHospitalId(Number(e.target.value))}
                                            >
                                                <option value="">-- Choose Hospital --</option>
                                                {hospitals.map(h => (
                                                    <option key={h.hospital_id} value={h.hospital_id}>{h.legal_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {/* Section 1: Patient Identity */}
                                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <User size={12} /> Patient Identity (UHID)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                        <div className="md:col-span-4">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">UHID</label>
                                            <div className="relative">
                                                <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono text-indigo-700 font-bold text-sm"
                                                    value={newPatient.uhid}
                                                    onChange={e => {
                                                        const val = toUpperCaseMRD(e.target.value);
                                                        setNewPatient({ ...newPatient, uhid: val });
                                                    }}
                                                    onBlur={(e) => checkExistingUHID(e.target.value)}
                                                    placeholder="Auto-fill..." />
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-indigo-400 font-bold pointer-events-none">
                                                    {isExistingPatient ? "FOUND" : "NEW"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-8 relative">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-900 text-sm"
                                                placeholder="Patient Name"
                                                value={newPatient.full_name}
                                                onChange={e => handleNameSearch(e.target.value)}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                autoComplete="off"
                                            />
                                            {showSuggestions && suggestions.length > 0 && (
                                                <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-40 overflow-y-auto">
                                                    {suggestions.map((p, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => handleSelectPatient(p)}
                                                            className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition border-b border-slate-50 last:border-0"
                                                        >
                                                            <p className="font-bold text-slate-800 text-xs">{p.full_name}</p>
                                                            <p className="text-[10px] text-slate-500 flex gap-2">
                                                                <span>{p.uhid ? `UHID:${p.uhid}` : `mrd:${p.patient_u_id}`}</span>
                                                                <span>• {p.gender}, {p.age}</span>
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Age <span className="text-red-500">*</span></label>
                                            <div className="flex gap-1">
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                                    value={newPatient.age}
                                                    onChange={e => setNewPatient({ ...newPatient, age: e.target.value })}
                                                    placeholder="00"
                                                />
                                                <select
                                                    className="px-1 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs font-bold text-slate-700"
                                                    value={ageUnit}
                                                    onChange={e => setAgeUnit(e.target.value as any)}
                                                >
                                                    <option value="Years">Yr</option>
                                                    <option value="Months">Mo</option>
                                                    <option value="Days">Dy</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Gender <span className="text-red-500">*</span></label>
                                            <select required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                                value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-5">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">DOB</label>
                                            <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                                value={newPatient.dob} onChange={e => calculateAge(e.target.value)} />
                                        </div>

                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile <span className="text-red-500">*</span></label>
                                            <input required type="tel" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm font-mono"
                                                value={newPatient.contact_number} onChange={e => setNewPatient({ ...newPatient, contact_number: e.target.value })} placeholder="Mobile Number" />
                                        </div>

                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                                            <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                                value={newPatient.address}
                                                onChange={e => setNewPatient({ ...newPatient, address: toTitleCase(e.target.value) })}
                                                placeholder="City / Area" />
                                        </div>
                                    </div>
                                </div>



                                {/* Section 2: Admission / File Details */}
                                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FileText size={12} /> Visit Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">MRD No. <span className="text-red-500">*</span></label>
                                            <input required type="text" className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 font-mono font-black text-slate-800 text-sm ${isMRDDuplicate ? 'border-red-500' : 'border-slate-200'}`}
                                                value={newPatient.patient_u_id}
                                                onChange={e => {
                                                    const val = toUpperCaseMRD(e.target.value);
                                                    setNewPatient({ ...newPatient, patient_u_id: val });
                                                    if (val.length >= 3) checkDuplicateMRD(val);
                                                    else setIsMRDDuplicate(false);
                                                }}
                                                placeholder="New MRD" />
                                            {isMRDDuplicate && <p className="text-red-500 text-[10px] mt-0.5">⚠️ Exists!</p>}
                                            {(lastAssignedMRD || lastMRD) && !isMRDDuplicate && (
                                                <div className="flex gap-3 mt-1">
                                                    {lastAssignedMRD && (
                                                        <p className="text-slate-400 text-[10px] italic">
                                                            Global Last: <span className="font-bold text-slate-600">{lastAssignedMRD}</span>
                                                        </p>
                                                    )}
                                                    {lastMRD && (
                                                        <p className="text-indigo-400 text-[10px] italic">
                                                            Patient Previous: <span className="font-bold text-indigo-600">{lastMRD}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
                                            <select
                                                required
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 font-bold text-slate-700 text-sm"
                                                value={newPatient.patient_category}
                                                onChange={e => setNewPatient({ ...newPatient, patient_category: e.target.value })}
                                            >
                                                <option value="IPD">IPD</option>
                                                <option value="OPD">OPD</option>
                                                <option value="MCL">MCL (Medico-Legal)</option>
                                                <option value="BRT">Birth</option>
                                                <option value="DHT">Death</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Admission Date</label>
                                            <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm"
                                                value={newPatient.admission_date} onChange={e => setNewPatient(prev => ({ ...prev, admission_date: e.target.value }))} />
                                        </div>

                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Discharge Date <span className="text-red-500">*</span></label>
                                            <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm"
                                                value={newPatient.discharge_date} onChange={e => setNewPatient(prev => ({ ...prev, discharge_date: e.target.value }))} />
                                        </div>

                                        {/* New Medical Fields */}
                                        <div className="col-span-12">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name(s)</label>
                                            <input
                                                type="text"
                                                list="hospital-doctors-list"
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm font-bold"
                                                placeholder="e.g. Dr. Dixit, Dr. Shah"
                                                value={newPatient.doctor_name || ''}
                                                onChange={e => setNewPatient(prev => ({ ...prev, doctor_name: e.target.value }))}
                                            />
                                            <datalist id="hospital-doctors-list">
                                                {hospitalDoctors.map((doc, idx) => (
                                                    <option key={idx} value={doc} />
                                                ))}
                                            </datalist>
                                        </div>

                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Weight</label>
                                            <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm"
                                                placeholder="e.g. 65kg"
                                                value={newPatient.weight || ''}
                                                onChange={e => setNewPatient(prev => ({ ...prev, weight: e.target.value }))} />
                                        </div>

                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Mediclaim</label>
                                            <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm"
                                                placeholder="Yes / No"
                                                value={newPatient.mediclaim || ''}
                                                onChange={e => setNewPatient(prev => ({ ...prev, mediclaim: e.target.value }))} />
                                        </div>

                                        <div className="col-span-12">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Diagnosis / Notes</label>
                                            <textarea className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm h-20"
                                                placeholder="Provisional diagnosis or medical notes..."
                                                value={newPatient.diagnosis || ''}
                                                onChange={e => setNewPatient(prev => ({ ...prev, diagnosis: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3 sticky bottom-0 bg-white z-10 pb-2">
                                    <button type="button" onClick={() => { setShowCreateModal(false); router.replace('/dashboard/records'); }} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm">
                                        <Upload size={16} /> Save & Upload
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <CameraModal
                isOpen={showCameraModal}
                onClose={() => setShowCameraModal(false)}
                onCapture={handleCameraCapture}
            />
        </div>
    );
}

