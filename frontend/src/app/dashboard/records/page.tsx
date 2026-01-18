"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, FileText, ChevronRight, Upload, User, ArrowRight, Pencil, Trash2, Building2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/config/api';
import { toTitleCase, toUpperCaseMRD } from '@/utils/formatters';

export default function RecordsList() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hospitalIdParam = searchParams.get('hospital_id');
    const action = searchParams.get('action'); // ?action=new

    const [patients, setPatients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isMRDDuplicate, setIsMRDDuplicate] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]); // Search suggestions
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isExistingPatient, setIsExistingPatient] = useState(false); // To verify reused details

    const [isEditing, setIsEditing] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

    // Hospital Management (for Super Admins)
    const [userProfile, setUserProfile] = useState<any>(null);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

    // New Patient Form State
    // New Patient Form State
    const [newPatient, setNewPatient] = useState({
        full_name: '',
        patient_u_id: '',
        uhid: '', // New UHID field
        age: '',
        gender: '', // Required
        address: '',
        contact_number: '', // Required
        email_id: '',
        aadhaar_number: '',
        dob: '',
        discharge_date: ''
    });

    const [ageUnit, setAgeUnit] = useState<string>('Years'); // Years, Months, Days

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
            full_name: '', patient_u_id: '', uhid: '', age: '', gender: '', address: '', contact_number: '', email_id: '', aadhaar_number: '', dob: '', discharge_date: ''
        });
        setIsExistingPatient(false);
        setIsMRDDuplicate(false);
        setIsEditing(false);
        setSelectedPatientId(null);
        setLastMRD(null);
    };


    const [lastMRD, setLastMRD] = useState<string | null>(null);

    const parseAgeString = (ageStr: string | number) => {
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
                        dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : ''
                    }));
                    setAgeUnit(unit);
                    setIsExistingPatient(true);
                    if (p.last_mrd) setLastMRD(p.last_mrd);
                } else {
                    setIsExistingPatient(false);
                    setLastMRD(null);
                }
            }
        } catch (err) {
            console.error("Error checking UHID:", err);
        }
    };

    const handleSelectPatient = (p: any) => {
        const { val, unit } = parseAgeString(p.age);
        setNewPatient({
            full_name: p.full_name || '',
            patient_u_id: '', // Must be new
            uhid: p.uhid || '',
            age: val,
            gender: p.gender || '',
            address: p.address || '',
            contact_number: p.contact_number || '',
            email_id: p.email_id || '',
            aadhaar_number: p.aadhaar_number || '',
            dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
            discharge_date: '' // New admission
        });
        setAgeUnit(unit);
        setIsExistingPatient(true);
        setShowSuggestions(false);
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

    useEffect(() => {
        if (action === 'new') {
            setShowCreateModal(true);
        }
        fetchUserProfile();
    }, [action]);

    useEffect(() => {
        if (userProfile) {
            if (userProfile.role === 'website_admin' || userProfile.role === 'website_staff') {
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

    // Refetch patients when hospital selection changes (for super admins)
    useEffect(() => {
        if (selectedHospitalId) {
            fetchPatients();
        }
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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            if (!newPatient.full_name || !newPatient.patient_u_id || !newPatient.age || !newPatient.gender || !newPatient.contact_number) {
                alert("Please fill all required fields (*).");
                return;
            }

            // Check if super admin has selected a hospital
            if ((userProfile?.role === 'website_admin' || userProfile?.role === 'website_staff') && !selectedHospitalId) {
                alert("Please select a hospital first.");
                return;
            }

            const body: any = { ...newPatient };
            body.dob = newPatient.dob ? new Date(newPatient.dob).toISOString() : null;
            body.discharge_date = newPatient.discharge_date ? new Date(newPatient.discharge_date).toISOString() : null;
            // Append Unit to Age
            body.age = `${newPatient.age} ${ageUnit}`;

            // Include hospital_id for super admins
            if (selectedHospitalId && (userProfile?.role === 'website_admin' || userProfile?.role === 'website_staff')) {
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
    const filteredPatients = patients.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patient_u_id?.includes(searchTerm)
    );

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <User className="text-indigo-600" /> Patient Records
                    </h1>
                    <p className="text-slate-500 mt-2">Manage patient files and digital records.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto flex-wrap items-center">
                    {/* Hospital Selector for Platform Admins */}
                    {(userProfile?.role === 'website_admin' || userProfile?.role === 'website_staff') && (
                        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm">
                            <Building2 size={18} className="text-indigo-600" />
                            <select
                                className="bg-transparent font-bold text-slate-700 outline-none pr-2"
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

                    <div className="relative flex-1 md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search Patients..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium transition"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                        >
                            <Plus size={20} /> <span className="hidden md:inline">Add New MRD</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                        <tr>
                            <th className="p-6 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Patient Name</th>
                            <th className="p-6 text-left text-xs font-black text-slate-500 uppercase tracking-wider">MRD / UHID</th>
                            <th className="p-6 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Contact</th>
                            <th className="p-6 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Discharge Date</th>
                            <th className="p-6 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Files</th>
                            <th className="p-6 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="p-6 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="p-12 text-center">Loading Records...</td></tr>
                        ) : filteredPatients.length === 0 ? (
                            <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">No patients found. Create one to get started.</td></tr>
                        ) : (
                            filteredPatients.map(p => (
                                <tr key={p.record_id} className="hover:bg-slate-50/50 transition cursor-pointer" onClick={() => router.push('/dashboard/records/view?id=' + p.record_id)}>
                                    <td className="p-6 font-bold text-slate-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                                            {p.full_name?.[0]}
                                        </div>
                                        {p.full_name}
                                    </td>
                                    <td className="p-6 font-mono text-sm text-slate-600">
                                        <div>{p.patient_u_id}</div>
                                        {p.uhid && <div className="text-xs text-slate-400 mt-1">UHID: {p.uhid}</div>}
                                    </td>
                                    <td className="p-6">
                                        {p.contact_number ? (
                                            <div className="text-sm font-semibold text-slate-700">{p.contact_number}</div>
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">Not provided</span>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        {p.discharge_date ? (
                                            <div className="text-sm font-medium text-slate-700">{new Date(p.discharge_date).toLocaleDateString('en-IN')}</div>
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">—</span>
                                        )}
                                    </td>
                                    <td className="p-6">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                                            <FileText size={12} /> {p.files?.length || 0}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        {p.physical_box_id ? (
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Archived</span>
                                        ) : (
                                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">Digital Only</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right space-x-2">

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
                                                aadhaar_number: p.aadhaar_number || '',
                                                dob: p.dob ? (p.dob.includes('T') ? p.dob.split('T')[0] : p.dob) : '',
                                                discharge_date: p.discharge_date ? (p.discharge_date.includes('T') ? p.discharge_date.split('T')[0] : p.discharge_date) : ''
                                            });
                                            setAgeUnit(unit);
                                            setSelectedPatientId(p.record_id);
                                            setIsEditing(true);
                                            setShowCreateModal(true);
                                        }} className="text-slate-400 hover:text-blue-600 transition p-2 hover:bg-blue-50 rounded-lg" title="Edit Patient">
                                            <Pencil size={18} />
                                        </button>
                                        <ArrowRight size={18} className="text-slate-300 inline-block" />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Patient Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                    <User className="text-indigo-600" /> {isEditing ? 'Edit Patient Details' : 'Register New Patient'}
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={resetForm}
                                        className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-200 transition"
                                    >
                                        Reset Form
                                    </button>
                                    <button
                                        onClick={() => { setShowCreateModal(false); resetForm(); router.replace('/dashboard/records'); }}
                                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-6">
                                {/* Hospital Selection for Super Admins */}
                                {(userProfile?.role === 'website_admin' || userProfile?.role === 'website_staff') && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Select Hospital <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-700"
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
                                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <User size={14} /> Patient Identity (UHID)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">UHID (Permanent Patient ID)</label>
                                            <div className="relative">
                                                <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono text-indigo-700 font-bold"
                                                    value={newPatient.uhid}
                                                    onChange={e => {
                                                        const val = toUpperCaseMRD(e.target.value);
                                                        setNewPatient({ ...newPatient, uhid: val });
                                                    }}
                                                    onBlur={(e) => checkExistingUHID(e.target.value)}
                                                    placeholder="Enter UHID to auto-fill..." />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-400 font-bold pointer-events-none">
                                                    {isExistingPatient ? "FOUND" : "NEW"}
                                                </div>
                                                {lastMRD && (
                                                    <div className="absolute -bottom-5 left-1 text-[10px] font-bold text-slate-500">
                                                        Last MRD: <span className="text-indigo-600">{lastMRD}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-span-2 relative">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-900 transition"
                                                placeholder="Patient Name"
                                                value={newPatient.full_name}
                                                onChange={e => handleNameSearch(e.target.value)}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                autoComplete="off"
                                            />
                                            {showSuggestions && suggestions.length > 0 && (
                                                <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto">
                                                    {suggestions.map((p, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => handleSelectPatient(p)}
                                                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition border-b border-slate-50 last:border-0"
                                                        >
                                                            <p className="font-bold text-slate-800 text-sm">{p.full_name}</p>
                                                            <p className="text-xs text-slate-500 flex gap-2">
                                                                <span>{p.uhid ? `UHID: ${p.uhid}` : `mrd: ${p.patient_u_id}`}</span>
                                                                <span>• {p.gender}, {p.age}y</span>
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Age <span className="text-red-500">*</span></label>
                                            <div className="flex gap-2">
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                                    value={newPatient.age}
                                                    onChange={e => setNewPatient({ ...newPatient, age: e.target.value })}
                                                    placeholder="Val"
                                                />
                                                <select
                                                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-bold text-slate-700"
                                                    value={ageUnit}
                                                    onChange={e => setAgeUnit(e.target.value)}
                                                >
                                                    <option value="Years">Years</option>
                                                    <option value="Months">Months</option>
                                                    <option value="Days">Days</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Gender <span className="text-red-500">*</span></label>
                                            <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                                value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth</label>
                                            <input type="date" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                                value={newPatient.dob} onChange={e => calculateAge(e.target.value)} />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Aadhaar Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                                            <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono tracking-widest"
                                                value={newPatient.aadhaar_number}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                                    setNewPatient({ ...newPatient, aadhaar_number: val });
                                                }}
                                                placeholder="0000 0000 0000"
                                                pattern="\d{12}"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Contact Number <span className="text-red-500">*</span></label>
                                            <input required type="tel" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                                value={newPatient.contact_number} onChange={e => setNewPatient({ ...newPatient, contact_number: e.target.value })} placeholder="Mobile Number" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Email ID</label>
                                            <input type="email" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                                value={newPatient.email_id} onChange={e => setNewPatient({ ...newPatient, email_id: e.target.value })} placeholder="Optional" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                                            <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                                value={newPatient.address}
                                                onChange={e => setNewPatient({ ...newPatient, address: toTitleCase(e.target.value) })}
                                                placeholder="Address..." />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Admission / File Details */}
                                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FileText size={14} /> Visit / File Details (MRD)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">MRD No. (Unique File ID) <span className="text-red-500">*</span></label>
                                            <input required type="text" className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-mono font-black text-slate-800 ${isMRDDuplicate ? 'border-red-500' : 'border-slate-200'}`}
                                                value={newPatient.patient_u_id}
                                                onChange={e => {
                                                    const val = toUpperCaseMRD(e.target.value);
                                                    setNewPatient({ ...newPatient, patient_u_id: val });
                                                    if (val.length >= 3) checkDuplicateMRD(val);
                                                    else setIsMRDDuplicate(false);
                                                }}
                                                placeholder="Enter New MRD Number" />
                                            {isMRDDuplicate && <p className="text-red-500 text-xs mt-1">⚠️ This MRD Number already exists!</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Discharge Date <span className="text-red-500">*</span></label>
                                            <input required type="date" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-amber-500"
                                                value={newPatient.discharge_date} onChange={e => setNewPatient({ ...newPatient, discharge_date: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => { setShowCreateModal(false); router.replace('/dashboard/records'); }} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2">
                                        <Upload size={18} /> Register & Upload
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

