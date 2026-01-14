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
    Loader2
} from 'lucide-react';

export default function HospitalsPage() {
    const router = useRouter();
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [legalName, setLegalName] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [pincodeLoading, setPincodeLoading] = useState(false);

    const [type, setType] = useState('Private');
    const [plan, setPlan] = useState('Standard');
    const [pricePerFile, setPricePerFile] = useState(100);
    const [includedPages, setIncludedPages] = useState(20);
    const [pricePerExtraPage, setPricePerExtraPage] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Filter & Action State
    const [searchTerm, setSearchTerm] = useState('');
    const [activeActionId, setActiveActionId] = useState<number | null>(null);

    const toTitleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
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
        setPlan(hospital.subscription_tier || 'Standard');
        setPricePerFile(hospital.price_per_file || 100);
        setIncludedPages(hospital.included_pages || 20);
        setPricePerExtraPage(hospital.price_per_extra_page || 1);
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
                alert('Hospital Deleted Successfully');
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
                    subscription_tier: plan,
                    price_per_file: pricePerFile,
                    included_pages: includedPages,
                    price_per_extra_page: pricePerExtraPage
                })
            });

            if (res.ok) {
                setShowModal(false);
                fetchHospitals(); // Refresh list
                const msg = isEditMode
                    ? 'Hospital Updated Successfully!'
                    : `Hospital Registered Successfully!\n\nAuto-Generated Logins:\nEmail: ${email}\nPassword: Hospital@123\n\nPlease share these with the hospital admin.`;
                alert(msg);

                // Reset form
                setLegalName(''); setEmail(''); setCity(''); setState(''); setPincode('');
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

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen pb-20">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="text-indigo-600" /> Hospital Management
                    </h1>
                    <p className="text-slate-500 font-medium">Register and manage partner hospitals.</p>
                </div>
                <button
                    onClick={() => {
                        setIsEditMode(false);
                        setCurrentHospitalId(null);
                        setLegalName(''); setEmail(''); setCity(''); setState(''); setPincode('');
                        setType('Private'); setPlan('Standard');
                        setPricePerFile(100); setIncludedPages(20); setPricePerExtraPage(1);
                        setShowModal(true);
                    }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    <Plus size={20} /> Register New Hospital
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-3 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search hospitals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Hospital Name</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Plan</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">City</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Billing</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td></tr>
                        ) : hospitals.filter(h =>
                            h.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            h.city?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((h) => (
                            <tr
                                key={h.hospital_id}
                                onClick={() => router.push(`/dashboard?hospital_id=${h.hospital_id}`)}
                                className="hover:bg-slate-50/50 transition-colors relative group cursor-pointer"
                            >
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                            {h.legal_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{h.legal_name}</p>
                                            <p className="text-xs text-slate-400">{h.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        {h.hospital_type || 'Private'}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <PlanBadge plan={h.subscription_tier} />
                                </td>
                                <td className="px-8 py-5 text-sm font-medium text-slate-600">
                                    {h.city || 'N/A'}
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700">₹{h.price_per_file}/file</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{h.included_pages} pgs inc.</span>
                                        <span className="text-[10px] text-slate-400 font-medium">₹{h.price_per_extra_page}/extra pg</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${h.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm font-bold text-slate-600">{h.is_active ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="relative inline-block text-left">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveActionId(activeActionId === h.hospital_id ? null : h.hospital_id);
                                            }}
                                            className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {activeActionId === h.hospital_id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <button
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                                    onClick={() => openEditModal(h)}
                                                >
                                                    Edit Details
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setHospitalToDelete(h);
                                                        setDeleteConfirmation('');
                                                        setShowDeleteModal(true);
                                                        setActiveActionId(null);
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    Delete Hospital
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
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-2xl font-black text-slate-800">{isEditMode ? 'Edit Hospital' : 'Register New Hospital'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors">
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
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-600">Hospital Type</label>
                                        <input
                                            value={type}
                                            onChange={e => setType(toTitleCase(e.target.value))}
                                            className="w-full p-3 bg-slate-50 rounded-xl border-none font-medium outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="e.g. Private, Clinic, etc."
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
            )}

            {/* Secure Delete Confirmation Modal */}
            {showDeleteModal && hospitalToDelete && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
            )}

        </div>
    );
}

const PlanBadge = ({ plan }: { plan: string }) => {
    const styles: any = {
        Standard: 'bg-slate-100 text-slate-600',
        Premium: 'bg-indigo-100 text-indigo-700',
        Enterprise: 'bg-amber-100 text-amber-700'
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${styles[plan] || styles.Standard}`}>
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
