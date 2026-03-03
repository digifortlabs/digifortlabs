"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, apiFetch } from '../../../config/api';
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
    Cpu,
    Archive,
    IndianRupee
} from 'lucide-react';

export default function HospitalsPage() {
    const router = useRouter();
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedHospitals, setSelectedHospitals] = useState<number[]>([]);

    // Wizard State
    const [step, setStep] = useState(1);

    // Step 1: Basic Info
    const [legalName, setLegalName] = useState('');
    const [orgType, setOrgType] = useState('Hospital');
    const [regNumber, setRegNumber] = useState('');
    const [estYear, setEstYear] = useState('');

    // Step 2: Contact & Location
    const [email, setEmail] = useState('');
    const [secondaryEmail, setSecondaryEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [alternatePhone, setAlternatePhone] = useState('');
    const [landline, setLandline] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [country, setCountry] = useState('India');
    const [mapsUrl, setMapsUrl] = useState('');
    const [gstNumber, setGstNumber] = useState('');

    // Step 3: Admin User Setup
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPhone, setAdminPhone] = useState('');
    const [adminDesignation, setAdminDesignation] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 4: Module Selection
    const [enabledModules, setEnabledModules] = useState<string[]>(['core']);
    const [industry, setIndustry] = useState('Healthcare');

    // Step 5: Pricing Configuration
    const [mrdPricingModel, setMrdPricingModel] = useState('per_file');
    const [mrdBaseRate, setMrdBaseRate] = useState(100);
    const [mrdThreshold, setMrdThreshold] = useState(40);
    const [mrdStandardRate, setMrdStandardRate] = useState(1.0);
    const [mrdPremiumRate, setMrdPremiumRate] = useState(1.5);
    const [mrdDiscounts, setMrdDiscounts] = useState<any[]>([]);
    const [modulePricing, setModulePricing] = useState<any>({});
    const [retentionYears, setRetentionYears] = useState(5);
    const [pricingEffectiveDate, setPricingEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [pricingNotes, setPricingNotes] = useState('');

    // Step 6: Review & Submit
    const [expectedVolume, setExpectedVolume] = useState('');
    const [expectedUsers, setExpectedUsers] = useState('');
    const [storageReqs, setStorageReqs] = useState('Medium');
    const [specialReqs, setSpecialReqs] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptMarketing, setAcceptMarketing] = useState(false);

    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const toggleModule = (modId: string) => {
        if (modId === 'core') return; // Core cannot be disabled
        if (enabledModules.includes(modId)) {
            setEnabledModules(enabledModules.filter(m => m !== modId));
        } else {
            setEnabledModules([...enabledModules, modId]);
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
        try {
            const data = await apiFetch(`hospitals/`);
            if (data) {
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
        setStep(1); // Reset to first step

        // Basic Info
        setLegalName(hospital.legal_name);
        setOrgType(hospital.organization_type || 'Hospital');
        setRegNumber(hospital.registration_number || '');
        setEstYear(hospital.established_year?.toString() || '');

        // Contact
        setEmail(hospital.email);
        setSecondaryEmail(hospital.secondary_email || '');
        setPhone(hospital.phone || '');
        setAlternatePhone(hospital.alternate_phone || '');
        setLandline(hospital.landline || '');
        setAddress1(hospital.address || '');
        setAddress2(hospital.address_line2 || '');
        setCity(hospital.city || '');
        setState(hospital.state || '');
        setPincode(hospital.pincode || '');
        setCountry(hospital.country || 'India');
        setMapsUrl(hospital.google_maps_url || '');
        setGstNumber((hospital.gst_number || '').toUpperCase());

        // Admin (usually not editable for security in some systems, but let's map what we have)
        setAdminName(hospital.admin_full_name || '');
        setAdminEmail(hospital.admin_email || '');

        // Modules & Industry
        setEnabledModules(hospital.enabled_modules || ['core']);
        setIndustry(hospital.specialty || 'Healthcare');

        // Pricing
        const pricing = hospital.custom_pricing || {};
        const mrd = pricing.mrd || {};
        setMrdPricingModel(mrd.model || 'per_file');
        setMrdBaseRate(mrd.base_rate || 100);
        setMrdThreshold(mrd.threshold || 40);
        setMrdStandardRate(mrd.standard_rate || 1.0);
        setMrdPremiumRate(mrd.premium_rate || 1.5);
        setModulePricing(pricing.modules || {});
        setRetentionYears(hospital.retention_years || 5);

        setShowModal(true);
        setActiveActionId(null);
    };


    const confirmDelete = async () => {
        if (!hospitalToDelete) return;
        if (deleteConfirmation !== hospitalToDelete.legal_name) {
            alert('Confirmation name does not match');
            return;
        }

        // Token is handled by HttpOnly cookies
        try {
            const res = await apiFetch(`hospitals/${hospitalToDelete.hospital_id}`, {
                method: 'DELETE'
            });
            if (res !== null) { // Expecting OK from apiFetch
                alert('Client Deleted Successfully');
                setHospitals(prev => prev.filter(h => h.hospital_id !== hospitalToDelete.hospital_id));
                setShowDeleteModal(false);
                setHospitalToDelete(null);
                setDeleteConfirmation('');
                fetchHospitals();
            }
        } catch (error: any) {
            console.error(error);
            alert(`Failed to delete: ${error.message || 'Error deleting hospital'}`);
        }
    };

    // Bulk OCR Logic
    const [ocrLoading, setOcrLoading] = useState(false);
    const runBulkOCR = async () => {
        if (!confirm("This will trigger background OCR for up to 50 pending files. Continue?")) return;
        setOcrLoading(true);
        // Token is handled by HttpOnly cookies
        try {
            const data = await apiFetch(`platform/bulk-ocr?limit=50`, {
                method: 'POST'
            });
            if (data) {
                alert(data.message);
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

        const url = isEditMode
            ? `hospitals/${currentHospitalId}`
            : `hospitals/`;

        const method = isEditMode ? 'PATCH' : 'POST';

        try {
            const bodyPayload = {
                legal_name: legalName,
                organization_type: orgType,
                registration_number: regNumber,
                established_year: estYear ? parseInt(estYear) : null,
                email,
                secondary_email: secondaryEmail,
                phone,
                alternate_phone: alternatePhone,
                landline,
                address: address1,
                address_line2: address2,
                city,
                state,
                pincode,
                country,
                google_maps_url: mapsUrl,
                gst_number: gstNumber,

                admin_full_name: adminName,
                admin_email: adminEmail,
                admin_phone: adminPhone,
                admin_designation: adminDesignation,
                admin_password: adminPassword,

                specialty: industry,
                enabled_modules: enabledModules,
                custom_pricing: {
                    mrd: {
                        model: mrdPricingModel,
                        base_rate: mrdBaseRate,
                        threshold: mrdThreshold,
                        standard_rate: mrdStandardRate,
                        premium_rate: mrdPremiumRate,
                        discounts: mrdDiscounts
                    },
                    modules: modulePricing,
                    effective_date: pricingEffectiveDate,
                    notes: pricingNotes
                },
                retention_years: retentionYears,

                expected_volume: expectedVolume ? parseInt(expectedVolume) : null,
                expected_users: expectedUsers ? parseInt(expectedUsers) : null,
                storage_requirements: storageReqs,
                special_requirements: specialReqs
            };

            const data = await apiFetch(url, {
                method: method,
                body: JSON.stringify(bodyPayload)
            });

            if (data) {
                setShowModal(false);
                fetchHospitals();
                const msg = isEditMode
                    ? 'Organization Updated Successfully!'
                    : `Organization Registered Successfully!`;
                alert(msg);

                // Reset form
                setStep(1);
                setLegalName(''); setOrgType('Hospital'); setRegNumber(''); setEstYear('');
                setEmail(''); setSecondaryEmail(''); setPhone(''); setAlternatePhone(''); setLandline('');
                setAddress1(''); setAddress2(''); setCity(''); setState(''); setPincode('');
                setCountry('India'); setMapsUrl(''); setGstNumber('');
                setAdminName(''); setAdminEmail(''); setAdminPhone(''); setAdminDesignation('');
                setAdminPassword(''); setConfirmPassword('');
                setEnabledModules(['core']); setIndustry('Healthcare');
            }
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message || 'Failed to save organization'}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate Stats
    const totalHospitals = hospitals.length;
    const activeHospitals = hospitals.filter(h => h.is_active).length;
    const inactiveHospitals = totalHospitals - activeHospitals;
    // Use mrd pricing model if available
    const estimatedRevenue = hospitals.reduce((acc, h) => {
        const mrd = h.custom_pricing?.mrd || {};
        return acc + (mrd.base_rate || 100) * 10;
    }, 0);

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
                        setStep(1);
                        setLegalName(''); setOrgType('Hospital'); setRegNumber(''); setEstYear('');
                        setEmail(''); setSecondaryEmail(''); setPhone(''); setAlternatePhone(''); setLandline('');
                        setAddress1(''); setAddress2(''); setCity(''); setState(''); setPincode('');
                        setCountry('India'); setMapsUrl(''); setGstNumber('');
                        setAdminName(''); setAdminEmail(''); setAdminPhone(''); setAdminDesignation('');
                        setAdminPassword(''); setConfirmPassword('');
                        setEnabledModules(['core']); setIndustry('Healthcare');
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
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black border w-fit ${h.specialty === 'Dental' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : h.specialty === 'Legal' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
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
                                        <span className="text-xs font-bold text-slate-700">
                                            ₹{h.custom_pricing?.mrd?.base_rate || h.price_per_file || 100}/file
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {h.custom_pricing?.mrd?.threshold || h.included_pages} pgs inc.
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            ₹{h.custom_pricing?.mrd?.standard_rate || h.price_per_extra_page}/extra pg
                                        </span>
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
                        <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">{isEditMode ? 'Edit Client' : 'Scale New Industry Client'}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        {[1, 2, 3, 4, 5, 6].map(s => (
                                            <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${s <= step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                        ))}
                                        <span className="text-[10px] font-black text-indigo-600 ml-2 uppercase tracking-widest">Step {step} of 6</span>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleRegister} className="flex-1 overflow-y-auto p-8">
                                {step === 1 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                <Building2 />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800">Basic Information</h3>
                                                <p className="text-xs text-slate-500 font-medium">Core identity of the organization.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput label="Official Legal Name" value={legalName} onChange={setLegalName} required placeholder="e.g. Apollo Hospitals" />
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Organization Type</label>
                                                <select value={orgType} onChange={e => setOrgType(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20">
                                                    <option>Hospital</option>
                                                    <option>Clinic</option>
                                                    <option>Dental Clinic</option>
                                                    <option>Law Firm</option>
                                                    <option>Corporate Office</option>
                                                    <option>Pharma Manufacturing</option>
                                                </select>
                                            </div>
                                            <FormInput label="Registration Number" value={regNumber} onChange={setRegNumber} placeholder="License or Govt ID" />
                                            <FormInput label="Established Year" value={estYear} onChange={setEstYear} type="number" placeholder="e.g. 1995" />
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                <Activity />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800">Contact & location</h3>
                                                <p className="text-xs text-slate-500 font-medium">Where is this organization based?</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput label="Primary Email" value={email} onChange={setEmail} type="email" required placeholder="admin@org.com" />
                                            <FormInput label="Secondary Email" value={secondaryEmail} onChange={setSecondaryEmail} type="email" placeholder="billing@org.com" />
                                            <FormInput label="Primary Phone" value={phone} onChange={setPhone} required placeholder="+91..." />
                                            <FormInput label="Alternate Phone" value={alternatePhone} onChange={setAlternatePhone} placeholder="+91..." />
                                            <FormInput label="Landline" value={landline} onChange={setLandline} placeholder="022-..." />
                                            <FormInput label="Pincode" value={pincode} onChange={setPincode} placeholder="110001" onBlur={handlePincodeBlur} />
                                            <FormInput label="Address Line 1" value={address1} onChange={setAddress1} required placeholder="Street, Building" />
                                            <FormInput label="Address Line 2" value={address2} onChange={setAddress2} placeholder="Landmark, Area" />
                                            <FormInput label="City" value={city} onChange={setCity} required placeholder="Auto-filled" />
                                            <FormInput label="State" value={state} onChange={setState} required placeholder="Auto-filled" />
                                            <FormInput label="GSTIN" value={gstNumber} onChange={setGstNumber} placeholder="GST Number" />
                                            <FormInput label="Google Maps URL" value={mapsUrl} onChange={setMapsUrl} placeholder="Link to location" />
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                                                <ShieldCheck />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800">Administrator Setup</h3>
                                                <p className="text-xs text-slate-500 font-medium">Primary user who will manage the account.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormInput label="Admin Full Name" value={adminName} onChange={setAdminName} required placeholder="e.g. Raj Patel" />
                                            <FormInput label="Admin Email" value={adminEmail} onChange={setAdminEmail} type="email" required placeholder="raj@org.com" />
                                            <FormInput label="Admin Phone" value={adminPhone} onChange={setAdminPhone} required placeholder="+91..." />
                                            <FormInput label="Designation" value={adminDesignation} onChange={setAdminDesignation} placeholder="e.g. Director" />
                                            <FormInput label="Set Password" value={adminPassword} onChange={setAdminPassword} type="password" required placeholder="••••••••" />
                                            <FormInput label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} type="password" required placeholder="••••••••" />
                                        </div>
                                        {adminPassword && adminPassword !== confirmPassword && (
                                            <p className="text-xs text-red-500 font-bold">Passwords do not match</p>
                                        )}
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                                <Cpu />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800">Module Configuration</h3>
                                                <p className="text-xs text-slate-500 font-medium">Select industry-specific engines.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ModuleCard id="core" label="AIO Core Warehouse" icon={<Archive size={18} />} desc="Base data processor & cloud storage (Always Active)." active={true} fixed={true} />
                                            <ModuleCard id="hms" label="HMS Pro" icon={<Hotel size={18} />} desc="IPD, Wards, OT and billing." active={enabledModules.includes('hms')} onClick={() => toggleModule('hms')} />
                                            <ModuleCard id="dental" label="Dental Engine" icon={<span>🦷</span>} desc="3D Charting & clinical records." active={enabledModules.includes('dental')} onClick={() => toggleModule('dental')} />
                                            <ModuleCard id="legal" label="Law Discovery" icon={<ShieldCheck size={18} />} desc="Case tracking and evidence vault." active={enabledModules.includes('legal')} onClick={() => toggleModule('legal')} />
                                            <ModuleCard id="pharma" label="Pharma Ops" icon={<span>🧪</span>} desc="Manufacturing and batch tracing." active={enabledModules.includes('pharma')} onClick={() => toggleModule('pharma')} />
                                            <ModuleCard id="accounting" label="Financial Ledger" icon={<IndianRupee size={18} />} desc="GST invoicing and P&L tracking." active={enabledModules.includes('accounting')} onClick={() => toggleModule('accounting')} />
                                        </div>
                                    </div>
                                )}

                                {step === 5 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                                <Wallet />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800">Commercial Pricing</h3>
                                                <p className="text-xs text-slate-500 font-medium">Configure customized billing rates.</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">MRD Pricing Model</h4>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['per_file', 'per_page', 'flat_monthly'].map(m => (
                                                        <button key={m} type="button" onClick={() => setMrdPricingModel(m)} className={`py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest ${mrdPricingModel === m ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                                                            {m.replace('_', ' ')}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <FormInput label="Base Price (₹)" value={mrdBaseRate} onChange={setMrdBaseRate} type="number" />
                                                    <FormInput label="Page Threshold" value={mrdThreshold} onChange={setMrdThreshold} type="number" />
                                                    <FormInput label="Extra Page (₹)" value={mrdStandardRate} onChange={setMrdStandardRate} type="number" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormInput label="Retention Years" value={retentionYears} onChange={setRetentionYears} type="number" />
                                                <FormInput label="Effective Date" value={pricingEffectiveDate} onChange={setPricingEffectiveDate} type="date" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pricing Notes</label>
                                                <textarea value={pricingNotes} onChange={e => setPricingNotes(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20" rows={2} placeholder="Negotiation details..." />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 6 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                                <CheckCircle2 />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800">Review & Submit</h3>
                                                <p className="text-xs text-slate-500 font-medium">Finalize and agree to terms.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormInput label="Exp. Monthly Vol" value={expectedVolume} onChange={setExpectedVolume} type="number" placeholder="Files" />
                                            <FormInput label="Exp. Users" value={expectedUsers} onChange={setExpectedUsers} type="number" placeholder="Count" />
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Storage Req</label>
                                                <select value={storageReqs} onChange={e => setStorageReqs(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 outline-none">
                                                    <option>Small</option>
                                                    <option>Medium</option>
                                                    <option>Large</option>
                                                    <option>Enterprise</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl">
                                                <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm font-bold text-indigo-900">I accept all Term & Conditions and Data Privacy Agreements.</span>
                                            </div>
                                            <div className="flex items-center gap-3 p-4">
                                                <input type="checkbox" checked={acceptMarketing} onChange={e => setAcceptMarketing(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm font-bold text-slate-600">I agree to receive product updates and newsletters.</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100 flex justify-between gap-4 bg-slate-50/50">
                                <button
                                    type="button"
                                    onClick={() => step > 1 ? setStep(step - 1) : setShowModal(false)}
                                    className="px-8 py-3 rounded-xl font-black text-slate-500 hover:bg-white transition-all uppercase tracking-widest text-[10px] border border-slate-200"
                                >
                                    {step === 1 ? 'Cancel' : 'Back'}
                                </button>

                                {step < 6 ? (
                                    <button
                                        type="button"
                                        onClick={() => setStep(step + 1)}
                                        className="px-10 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 uppercase tracking-widest text-[10px] transition-all active:scale-95"
                                    >
                                        Next Phase
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRegister}
                                        disabled={submitting || !acceptTerms}
                                        className="px-10 py-4 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={16} /> Deploy Implementation</>}
                                    </button>
                                )}
                            </div>
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

const FormInput = ({ label, value, onChange, type = "text", required = false, placeholder = "", onBlur }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{label} {required && '*'}</label>
        <input
            type={type}
            required={required}
            value={value}
            onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
            onBlur={onBlur}
            className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder={placeholder}
        />
    </div>
);

const ModuleCard = ({ id, label, icon, desc, active, onClick, fixed = false }: any) => (
    <div
        onClick={onClick}
        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${active ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'} ${fixed ? 'opacity-80 active:scale-100' : 'active:scale-98'}`}
    >
        <div className="flex justify-between items-start mb-2">
            <div className={`flex items-center gap-2 font-black ${active ? 'text-indigo-900' : 'text-slate-600'}`}>
                {icon} {label}
            </div>
            {active && <CheckCircle2 size={16} className="text-indigo-600" />}
        </div>
        <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">{desc}</p>
    </div>
);

