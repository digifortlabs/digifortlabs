"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../config/api';
import {
    Plus,
    Search,
    MoreVertical,
    ShieldCheck,
    Building2,
    Stethoscope,
    GraduationCap,
    Hotel,
    CheckCircle2,
    XCircle,
    Loader2,
    Activity,
    Wallet,
    AlertCircle,
    Trash,
    Power,
    Cpu
} from 'lucide-react';

export default function HospitalsPage() {
    const router = useRouter();
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedHospitals, setSelectedHospitals] = useState<number[]>([]);

    // Form State
    const [legalName, setLegalName] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [pincodeLoading, setPincodeLoading] = useState(false);

    const [type, setType] = useState('Private');
    const [specialty, setSpecialty] = useState('General');
    const [plan, setPlan] = useState('Standard');
    const [pricePerFile, setPricePerFile] = useState(100);
    const [includedPages, setIncludedPages] = useState(20);
    const [pricePerExtraPage, setPricePerExtraPage] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Terminology State
    const [patientLabel, setPatientLabel] = useState('Patient');
    const [doctorLabel, setDoctorLabel] = useState('Doctor');

    // Organization Category State
    const [organizationCategory, setOrganizationCategory] = useState('Custom');

    // Presets Configuration
    const ORGANIZATION_PRESETS = [
        { id: 'Dental Clinic', label: 'Dental Clinic', type: 'Clinic', specialty: 'Dental', patient: 'Patient', doctor: 'Dentist' },
        { id: 'Multi-Specialty Hospital', label: 'Multi-Specialty Hospital', type: 'Private', specialty: 'General', patient: 'Patient', doctor: 'Doctor' },
        { id: 'Polyclinic', label: 'Polyclinic', type: 'Polyclinic', specialty: 'General', patient: 'Patient', doctor: 'Consultant' },
        { id: 'Eye Center', label: 'Eye Center', type: 'Center', specialty: 'Ophthalmology', patient: 'Patient', doctor: 'Ophthalmologist' },
        { id: 'Diagnostic Center', label: 'Diagnostic Center', type: 'Center', specialty: 'Radiology', patient: 'Client', doctor: 'Radiologist' },
        { id: 'Law Firm', label: 'Law Firm / Advocate', type: 'Office', specialty: 'Legal', patient: 'Client', doctor: 'Advocate' },
        { id: 'Chartered Accountant', label: 'Chartered Accountant', type: 'Office', specialty: 'Accounting', patient: 'Client', doctor: 'CA' },
        { id: 'Corporate Office', label: 'Corporate Office', type: 'Office', specialty: 'Corporate', patient: 'Employee', doctor: 'Manager' },
        { id: 'Pharma Company', label: 'Pharma Manufacturing', type: 'Industrial', specialty: 'Pharmaceuticals', patient: 'Batch / Product', doctor: 'QA Head' },
        { id: 'Custom', label: 'Custom / Other', type: '', specialty: '', patient: '', doctor: '' }
    ];

    const handleCategoryChange = (catId: string) => {
        setOrganizationCategory(catId);
        const preset = ORGANIZATION_PRESETS.find(p => p.id === catId);
        if (preset && catId !== 'Custom') {
            setType(preset.type);
            setSpecialty(preset.specialty);
            setPatientLabel(preset.patient);
            setDoctorLabel(preset.doctor);
        }
    };

    // Filter & Action State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeActionId, setActiveActionId] = useState<number | null>(null);

    const toTitleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };

    const toggleSelect = (id: number) => {
        if (selectedHospitals.includes(id)) {
            setSelectedHospitals(selectedHospitals.filter(x => x !== id));
        } else {
            setSelectedHospitals([...selectedHospitals, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedHospitals.length === hospitals.length) {
            setSelectedHospitals([]);
        } else {
            setSelectedHospitals(hospitals.map(h => h.hospital_id));
        }
    };

    const handlePincodeBlur = async () => {
        if (pincode.length !== 6) return;
        setPincodeLoading(true);
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await res.json();
            if (data[0].Status === 'Success') {
                const details = data[0].PostOffice[0];
                setCity(toTitleCase(details.District));
                setState(toTitleCase(details.State));
            } else {
                alert('Invalid Pincode');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setPincodeLoading(false);
        }
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        try {
            const res = await fetch(`${API_URL}/hospitals/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHospitals(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Edit Mode State
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentHospitalId, setCurrentHospitalId] = useState<number | null>(null);

    // Secure Delete State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [hospitalToDelete, setHospitalToDelete] = useState<any>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const openEditModal = (hospital: any) => {
        setIsEditMode(true);
        setCurrentHospitalId(hospital.hospital_id);
        setLegalName(hospital.legal_name);
        setEmail(hospital.email);
        setCity(hospital.city || '');
        setState(hospital.state || '');
        setPincode(hospital.pincode || '');
        setType(hospital.hospital_type || 'Private');
        setSpecialty(hospital.specialty || 'General');
        setPlan(hospital.subscription_tier || 'Standard');
        setPricePerFile(hospital.price_per_file || 100);
        setIncludedPages(hospital.included_pages || 20);
        setPricePerExtraPage(hospital.price_per_extra_page || 1);
        setGstNumber((hospital.gst_number || '').toUpperCase());

        // Terminology
        const terms = hospital.terminology || {};
        const pLabel = terms.patient || 'Patient';
        const dLabel = terms.doctor || 'Doctor';
        setPatientLabel(pLabel);
        setDoctorLabel(dLabel);

        // Reverse Match Category
        const match = ORGANIZATION_PRESETS.find(p =>
            p.type === (hospital.hospital_type || 'Private') &&
            p.specialty === (hospital.specialty || 'General')
        );
        setOrganizationCategory(match ? match.id : 'Custom');

        setShowModal(true);
        setActiveActionId(null);
    };


    const confirmDelete = async () => {
        if (!hospitalToDelete) return;
        if (deleteConfirmation !== hospitalToDelete.legal_name) {
            alert('Confirmation name does not match');
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/hospitals/${hospitalToDelete.hospital_id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Client Deleted Successfully');
                setHospitals(prev => prev.filter(h => h.hospital_id !== hospitalToDelete.hospital_id));
                setShowDeleteModal(false);
                setHospitalToDelete(null);
                setDeleteConfirmation('');
                fetchHospitals();
            } else {
                const err = await res.json();
                alert(`Failed to delete: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting hospital');
        }
    };

    // Bulk OCR Logic
    const [ocrLoading, setOcrLoading] = useState(false);
    const runBulkOCR = async () => {
        if (!confirm("This will trigger background OCR for up to 50 pending files. Continue?")) return;
        setOcrLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/platform/bulk-ocr?limit=50`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
            } else {
                alert(`Error: ${data.detail || data.message}`);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to trigger OCR");
        } finally {
            setOcrLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('token');

        const url = isEditMode
            ? `${API_URL}/hospitals/${currentHospitalId}`
            : `${API_URL}/hospitals/`;

        const method = isEditMode ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    legal_name: legalName,
                    email,
                    city,
                    state,
                    pincode,
                    hospital_type: type,
                    specialty: specialty,
                    subscription_tier: plan,
                    price_per_file: pricePerFile,
                    included_pages: includedPages,
                    price_per_extra_page: pricePerExtraPage,
                    gst_number: gstNumber,
                    terminology: {
                        patient: patientLabel,
                        doctor: doctorLabel
                    }
                })
            });

            if (res.ok) {
                setShowModal(false);
                fetchHospitals(); // Refresh list
                const msg = isEditMode
                    ? 'Client Updated Successfully!'
                    : `Client Registered Successfully!\n\nAuto-Generated Logins:\nEmail: ${email}\nPassword: Client@123\n\nPlease share these with the client admin.`;
                alert(msg);

                // Reset form
                setLegalName(''); setEmail(''); setCity(''); setState(''); setPincode(''); setGstNumber('');
                setPatientLabel('Patient'); setDoctorLabel('Doctor');
                setIsEditMode(false);
                setCurrentHospitalId(null);
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save hospital');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate Stats
    const totalHospitals = hospitals.length;
    const activeHospitals = hospitals.filter(h => h.is_active).length;
    const inactiveHospitals = totalHospitals - activeHospitals;
    // Dummy revenue calculation: sum of base price * 10 (avg files)
    const estimatedRevenue = hospitals.reduce((acc, h) => acc + (h.price_per_file || 100) * 10, 0);

    return (
        <div className="min-h-screen bg-slate-50 p-4 lg:p-6 pt-0">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="text-indigo-600" /> Client Management
                    </h1>
                    <p className="text-slate-500 font-medium">Register and manage partner clients.</p>
                </div>
                <button
                    onClick={() => {
                        setIsEditMode(false);
                        setCurrentHospitalId(null);
                        setLegalName(''); setEmail(''); setCity(''); setState(''); setPincode(''); setGstNumber('');
                        setType('Private'); setSpecialty('General'); setPlan('Standard');
                        setPricePerFile(100); setIncludedPages(20); setPricePerExtraPage(1);
                        setPatientLabel('Patient'); setDoctorLabel('Doctor');
                        setOrganizationCategory('Custom');
                        setShowModal(true);
                    }}

                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    <Plus size={20} /> Register New Client
                </button>
            </div>

            {/* System Tools (Admin Only) */}
            <div className="bg-slate-900 rounded-xl p-4 mb-4 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-xl blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h2 className="text-lg font-black flex items-center gap-3">
                            <Cpu className="text-indigo-400" /> System Maintenance
                        </h2>
                        <p className="text-slate-400 mt-1 font-medium text-xs">Perform system-wide diagnostics and batch operations.</p>
                    </div>

                    <button
                        onClick={runBulkOCR}
                        disabled={ocrLoading}
                        className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 text-sm"
                    >
                        {ocrLoading ? <Loader2 className="animate-spin text-indigo-400" /> : <div className="p-1 bg-indigo-500 rounded text-white"><Search size={14} /></div>}
                        <span>Run Bulk OCR (Recover Old Files)</span>
                    </button>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <StatsCard title="Total Clients" value={totalHospitals} icon={Building2} color="indigo" />
                <StatsCard title="Active Licenses" value={activeHospitals} icon={Activity} color="emerald" />
                <StatsCard title="Inactive / Expired" value={inactiveHospitals} icon={AlertCircle} color="red" />
                <StatsCard title="Est. Monthly Revenue" value={`₹${estimatedRevenue.toLocaleString()}`} icon={Wallet} color="amber" />
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-100 flex gap-4 justify-between items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-3 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2 bg-slate-50 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 text-sm"
                        />
                    </div>

                    {/* Bulk Actions Menu */}
                    {selectedHospitals.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                            <span className="text-sm font-bold text-slate-500">{selectedHospitals.length} Selected</span>
                            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-sm transition-colors">
                                <Trash size={16} /> Delete
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold text-sm transition-colors">
                                <Power size={16} /> Deactivate
                            </button>
                        </div>
                    )}
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={hospitals.length > 0 && selectedHospitals.length === hospitals.length}
                                    onChange={toggleSelectAll}
                                    className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Client Name</th>
                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Plan</th>
                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">City</th>
                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Billing</th>
                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center text-slate-400">Loading...</td></tr>
                        ) : hospitals.filter(h =>
                            h.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            h.city?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((h) => (
                            <tr
                                key={h.hospital_id}
                                onClick={() => router.push(`/dashboard?hospital_id=${h.hospital_id}`)}
                                className={`hover:bg-slate-50/50 transition-colors relative group cursor-pointer ${selectedHospitals.includes(h.hospital_id) ? 'bg-indigo-50/30' : ''}`}
                            >
                                <td className="px-4 py-3">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedHospitals.includes(h.hospital_id)}
                                            onChange={() => toggleSelect(h.hospital_id)}
                                            className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                            {h.legal_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{h.legal_name}</p>
                                            <p className="text-xs text-slate-400">{h.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="px-3 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 w-fit">
                                            {h.hospital_type || 'Private'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black border w-fit ${h.specialty === 'Dental' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : h.specialty === 'ENT' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                            {h.specialty || 'General'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <PlanBadge plan={h.subscription_tier} />
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-600">
                                    {h.city || 'N/A'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700">₹{h.price_per_file}/file</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{h.included_pages} pgs inc.</span>
                                        <span className="text-[10px] text-slate-400 font-medium">₹{h.price_per_extra_page}/extra pg</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-xl ${h.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm font-bold text-slate-600">{h.is_active ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="relative inline-block text-left">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveActionId(activeActionId === h.hospital_id ? null : h.hospital_id);
                                            }}
                                            className="text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeActionId === h.hospital_id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(h);
                                                    }}
                                                >
                                                    Edit Details
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setHospitalToDelete(h);
                                                        setDeleteConfirmation('');
                                                        setShowDeleteModal(true);
                                                        setActiveActionId(null);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    Delete Client
                                                </button>
                                            </div>
                                        )}
                                        {/* Overlay to close menu when clicking outside */}
                                        {activeActionId === h.hospital_id && (
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveActionId(null)}></div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Registration/Edit Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-2xl font-black text-slate-800">{isEditMode ? 'Edit Client' : 'Register New Client'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleRegister} className="p-8 space-y-8">

                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider">01. Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">Legal Name</label>
                                            <input required value={legalName} onChange={e => setLegalName(toTitleCase(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. Apollo Main" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">Contact Email</label>
                                            <input required value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full p-3 bg-slate-50 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="admin@hospital.com" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">Pincode</label>
                                            <div className="relative">
                                                <input
                                                    value={pincode}
                                                    onChange={e => setPincode(e.target.value)}
                                                    onBlur={handlePincodeBlur}
                                                    maxLength={6}
                                                    className="w-full p-3 bg-slate-50 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder="110001"
                                                />
                                                {pincodeLoading && <Loader2 className="absolute right-3 top-3 animate-spin text-indigo-600" size={18} />}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">City</label>
                                            <input value={city} onChange={e => setCity(toTitleCase(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Auto-filled" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">State</label>
                                            <input value={state} readOnly className="w-full p-3 bg-slate-100 text-slate-500 rounded-xl border-none font-medium outline-none cursor-not-allowed" placeholder="Auto-filled" />
                                        </div>
                                        {/* Organization Category - Unified Selection */}
                                        <div className="space-y-1 col-span-1 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-600">Organization Category (Auto-Configure)</label>
                                            <select
                                                value={organizationCategory}
                                                onChange={e => handleCategoryChange(e.target.value)}
                                                className="w-full p-3 bg-indigo-50 rounded-xl border-2 border-indigo-100 font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            >
                                                {ORGANIZATION_PRESETS.map(p => (
                                                    <option key={p.id} value={p.id}>{p.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Conditional Fields based on "Custom" */}
                                        {organizationCategory === 'Custom' && (
                                            <>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-600">Facility Type (Manual)</label>
                                                    <select
                                                        value={type}
                                                        onChange={e => setType(e.target.value)}
                                                        className="w-full p-3 bg-slate-50 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    >
                                                        <option value="Private">Private Hospital</option>
                                                        <option value="Government">Government Hospital</option>
                                                        <option value="Clinic">Clinic / Nursing Home</option>
                                                        <option value="Center">Diagnostics Center</option>
                                                        <option value="Medical College">Medical College</option>
                                                        <option value="Polyclinic">Polyclinic</option>
                                                        <option value="Charitable Trust">Charitable Trust</option>
                                                        <option value="Research Institute">Research Institute</option>
                                                        <option value="Military">Military Hospital</option>
                                                        <option value="Office">Corporate / Legal Office</option>
                                                        <option value="Industrial">Industrial / Plant</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-600">Medical/Business Specialty</label>
                                                    <select
                                                        value={specialty}
                                                        onChange={e => setSpecialty(e.target.value)}
                                                        className="w-full p-3 bg-slate-50 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    >
                                                        <option value="General">General (Multi-Specialty)</option>
                                                        <option value="Dental">Dental Clinic</option>
                                                        <option value="ENT">ENT Specialty</option>
                                                        <option value="Cardiology">Cardiology</option>
                                                        <option value="Orthopedics">Orthopedics</option>
                                                        <option value="Pediatrics">Pediatrics</option>
                                                        <option value="Gynecology">Gynecology</option>
                                                        <option value="Dermatology">Dermatology</option>
                                                        <option value="Ophthalmology">Ophthalmology</option>
                                                        <option value="Neurology">Neurology</option>
                                                        <option value="Oncology">Oncology</option>
                                                        <option value="Gastroenterology">Gastroenterology</option>
                                                        <option value="Urology">Urology</option>
                                                        <option value="Nephrology">Nephrology</option>
                                                        <option value="Psychiatry">Psychiatry</option>
                                                        <option value="Plastic Surgery">Plastic Surgery</option>
                                                        <option value="Veterinary">Veterinary</option>
                                                        <option value="Ayurveda">Ayurveda</option>
                                                        <option value="Legal">Legal Services</option>
                                                        <option value="Accounting">Accounting / Tax</option>
                                                        <option value="Corporate">Corporate Management</option>
                                                        <option value="Pharmaceuticals">Pharmaceuticals</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">GST Identification Number (GSTIN)</label>
                                            <input
                                                value={gstNumber}
                                                onChange={e => setGstNumber(e.target.value.toUpperCase())}
                                                className="w-full p-3 bg-indigo-50/50 rounded-xl border-none font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
                                                placeholder="e.g. 07AAAAA0000A1Z5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Plan Selection */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider">02. Select Subscription Plan</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <PlanCard
                                            name="Standard"
                                            selected={plan === 'Standard'}
                                            onClick={() => setPlan('Standard')}
                                        />
                                        <PlanCard
                                            name="Premium"
                                            selected={plan === 'Premium'}
                                            onClick={() => setPlan('Premium')}
                                        />
                                        <PlanCard
                                            name="Enterprise"
                                            selected={plan === 'Enterprise'}
                                            onClick={() => setPlan('Enterprise')}
                                        />
                                    </div>
                                </div>

                                {/* Billing Config */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider">03. Billing Configuration (INR)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">Base Price (₹/File)</label>
                                            <input
                                                type="number"
                                                value={pricePerFile}
                                                onChange={e => setPricePerFile(Number(e.target.value))}
                                                className="w-full p-3 bg-slate-50 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">Included Pages</label>
                                            <input
                                                type="number"
                                                value={includedPages}
                                                onChange={e => setIncludedPages(Number(e.target.value))}
                                                className="w-full p-3 bg-slate-50 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">Extra Page Fee (₹/Pg)</label>
                                            <input
                                                type="number"
                                                value={pricePerExtraPage}
                                                onChange={e => setPricePerExtraPage(Number(e.target.value))}
                                                className="w-full p-3 bg-slate-50 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Terminology Config */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider">04. Terminology Configuration</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">Patient Label</label>
                                            <input
                                                value={patientLabel}
                                                onChange={e => setPatientLabel(e.target.value)}
                                                readOnly={organizationCategory !== 'Custom'}
                                                className={`w-full p-3 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 ${organizationCategory !== 'Custom' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50'}`}
                                                placeholder="e.g. Patient, Client, Resident"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-600">Doctor Label</label>
                                            <input
                                                value={doctorLabel}
                                                onChange={e => setDoctorLabel(e.target.value)}
                                                readOnly={organizationCategory !== 'Custom'}
                                                className={`w-full p-3 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 ${organizationCategory !== 'Custom' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50'}`}
                                                placeholder="e.g. Doctor, Consultant, Dentist"
                                            />
                                        </div>
                                        {organizationCategory !== 'Custom' && (
                                            <div className="col-span-1 md:col-span-2 text-xs text-indigo-500 bg-indigo-50 p-2 rounded-lg font-bold flex items-center gap-2">
                                                <ShieldCheck size={14} />
                                                Terminology is auto-managed by the selected Organization Category. Switch to "Custom" to edit manually.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button disabled={submitting} type="submit" className="flex-1 py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2">
                                        {submitting ? <Loader2 className="animate-spin" /> : isEditMode ? <><CheckCircle2 size={20} /> Update Hospital</> : <><CheckCircle2 size={20} /> Complete Registration</>}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )
            }

            {/* Secure Delete Confirmation Modal */}
            {
                showDeleteModal && hospitalToDelete && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-8 border-b border-slate-100 bg-red-50/50">
                                <h2 className="text-xl font-black text-red-600 flex items-center gap-2">
                                    <ShieldCheck size={24} /> Confirm Deletion
                                </h2>
                                <p className="text-sm text-slate-500 mt-2">
                                    You are about to delete <strong>{hospitalToDelete.legal_name}</strong>.
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Type hospital name to proceed</label>
                                    <input
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                        placeholder={hospitalToDelete.legal_name}
                                        className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-red-500 focus:ring-0 outline-none"
                                    />
                                    <p className="text-xs text-slate-400">
                                        For security, please type the hospital name <strong>{hospitalToDelete.legal_name}</strong> above.
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={deleteConfirmation !== hospitalToDelete.legal_name}
                                        className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200 transition-all"
                                    >
                                        Delete Forever
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
}

const PlanBadge = ({ plan }: { plan: string }) => {
    const styles: any = {
        Standard: 'bg-slate-100 text-slate-600',
        Premium: 'bg-indigo-100 text-indigo-700',
        Enterprise: 'bg-amber-100 text-amber-700'
    };
    return (
        <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${styles[plan] || styles.Standard}`}>
            {plan}
        </span>
    );
};

const PlanCard = ({ name, selected, onClick }: any) => (
    <div
        onClick={onClick}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200'}`}
    >
        <div className="flex justify-between items-center">
            <h4 className={`font-bold ${selected ? 'text-indigo-900' : 'text-slate-700'}`}>{name}</h4>
            {selected && <CheckCircle2 size={16} className="text-indigo-600" />}
        </div>
    </div>
);

const StatsCard = ({ title, value, icon: Icon, color }: any) => {
    const colorStyles: any = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600'
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-lg transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorStyles[color]}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{title}</p>
                <div className="text-xl font-black text-slate-800">{value}</div>
            </div>
        </div>
    );
};
