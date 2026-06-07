"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Building2, 
    Archive, 
    Activity, 
    DollarSign, 
    Search, 
    Plus, 
    Trash2, 
    RotateCcw, 
    Edit2, 
    X, 
    Sparkles, 
    MapPin, 
    User, 
    Mail, 
    Phone, 
    Lock, 
    Check,
    AlertCircle,
    BadgeAlert,
    ShieldAlert,
    LayoutGrid,
    CheckCircle2,
    Settings,
    Pill
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import toast from 'react-hot-toast';

// Platform Statistics Type
interface PlatformStats {
    total_hospitals: number;
    active_hospitals: number;
    total_users: number;
    pending_approvals: number;
    system_status: string;
    tier_distribution: Record<string, number>;
    total_files: number;
    total_gb: number;
    top_consumers: Array<{ name: string; usage_mb: number }>;
    projected_revenue: number;
}

// Client Hospital Type
interface Hospital {
    hospital_id: number;
    legal_name: string;
    hospital_slug?: string;
    subscription_tier: string;
    organization_type?: string;
    specialty?: string;
    mrd_service_type?: string;
    established_year?: number;
    terminology?: Record<string, any>;
    enabled_modules?: string[];
    email: string;
    director_name?: string;
    registration_number?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    gst_number?: string;
    price_per_file: number;
    included_pages: number;
    price_per_extra_page: number;
    custom_pricing?: Record<string, any>;
    expected_monthly_volume?: number;
    expected_users?: number;
    storage_requirements?: string;
    is_active: boolean;
    is_deleted?: boolean;
    pending_updates?: string;
}

export default function ManageClientsPage() {
    const router = useRouter();
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedTier, setSelectedTier] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<'active' | 'suspended' | 'pending' | 'bin'>('active');
    
    // Onboard Wizard Modal State
    const [isOnboardOpen, setIsOnboardOpen] = useState<boolean>(false);
    const [onboardStep, setOnboardStep] = useState<number>(1);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [successMsg, setSuccessMsg] = useState<string>('');
    const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
    
    // Onboard Form Data
    const [newHospital, setNewHospital] = useState({
        // Profile
        legal_name: '',
        organization_type: 'Hospital',
        established_year: new Date().getFullYear(),
        registration_number: '',
        director_name: '',
        specialty: 'General',
        mrd_service_type: 'PORTAL_ONLY',
        address: '',
        city: '',
        state: '',
        pincode: '',
        
        // Tenant Setup
        subdomain: '',
        email: '',
        gst_number: '',
        
        // Admin user credentials
        admin_full_name: '',
        admin_email: '',
        admin_phone: '',
        password: '',
        
        // Subscription & Pricing
        subscription_tier: 'Standard',
        price_per_file: 100.0,
        included_pages: 20,
        price_per_extra_page: 1.0,
        enabled_modules: ['core']
    });

    // Configure / Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
    const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
    const [editTab, setEditTab] = useState<'profile' | 'modules' | 'billing'>('profile');

    // Review Pending Updates State
    const [reviewHospital, setReviewHospital] = useState<Hospital | null>(null);
    const [reviewingUpdates, setReviewingUpdates] = useState<boolean>(false);

    // Permanent Delete (purge) confirmation state
    const [purgeTarget, setPurgeTarget] = useState<Hospital | null>(null);
    const [purgeConfirmText, setPurgeConfirmText] = useState<string>('');
    const [purgeBusy, setPurgeBusy] = useState<boolean>(false);
    const [purgeError, setPurgeError] = useState<string>('');

    // Dynamic Host Suffix Builder for Subdomains
    const [hostSuffix, setHostSuffix] = useState<string>('.localhost:3000');
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.host;
            const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';
            if (host.includes('localhost')) {
                setHostSuffix('.localhost:3000');
            } else {
                setHostSuffix(`.${rootDomain}`);
            }
        }
        fetchData();
    }, [statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch List (include_deleted dynamically based on tab status)
            const includeDeleted = statusFilter === 'bin';
            const listRes = await apiFetch(`/hospitals/?include_deleted=${includeDeleted}`);
            if (listRes.ok) {
                const listData = await listRes.json();
                setHospitals(listData);
            }

            // Fetch Stats
            const statsRes = await apiFetch('/hospitals/stats/platform');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (err) {
            console.error("Failed to load platform data", err);
        } finally {
            setLoading(false);
        }
    };

    // Subdomain Validation Helper
    const handleSubdomainChange = (val: string) => {
        const cleanVal = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setNewHospital(prev => ({ ...prev, subdomain: cleanVal }));
        
        // Automatically sync email & admin credentials if empty
        if (cleanVal) {
            setNewHospital(prev => ({
                ...prev,
                email: prev.email || `contact@${cleanVal}.com`,
                admin_email: prev.admin_email || `admin@${cleanVal}.com`
            }));
            setSubdomainAvailable(cleanVal.length > 2);
        } else {
            setSubdomainAvailable(null);
        }
    };

    // Module Matrix Translation & Available Options
    const MODULE_OPTIONS = [
        { id: 'core', label: 'Core Patient Records (MRD)', desc: 'Document management & patient files storage', icon: Archive, color: 'text-violet-400 bg-violet-950/40 border-violet-800' },
        { id: 'hms', label: 'IPD Data Management', desc: 'Inpatient admissions, real-time beds, ward tracking', icon: Building2, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800' },
        { id: 'inventory', label: 'Hospital Asset Management', desc: 'Supply chain inventory, machine logs & assets', icon: LayoutGrid, color: 'text-amber-400 bg-amber-950/40 border-amber-800' },
        { id: 'accounting', label: 'SaaS Accounting & Ledger', desc: 'Billing invoices, payments, financial control', icon: DollarSign, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800' },
        { id: 'clinic', label: 'Outpatient Clinic (OPD)', desc: 'Appointments scheduling, lightweight clinic EMR', icon: Activity, color: 'text-rose-400 bg-rose-950/40 border-rose-800' },
        { id: 'dental', label: 'Dental Specialty Module', desc: 'Tooth mapping, dental treatments charting', icon: Sparkles, color: 'text-sky-400 bg-sky-950/40 border-sky-800' },
        { id: 'ent', label: 'ENT Specialty Module', desc: 'Ear, Nose & Throat custom diagnostics panel', icon: Settings, color: 'text-teal-400 bg-teal-950/40 border-teal-800' },
        { id: 'pharmacy', label: 'Pharmacy & Prescriptions', desc: 'Standalone medicine dispensing & pharmacy', icon: Pill, color: 'text-pink-400 bg-pink-950/40 border-pink-800' }
    ];

    const toggleModuleOnboard = (moduleId: string) => {
        setNewHospital(prev => {
            let current = [...prev.enabled_modules];
            
            if (current.includes(moduleId)) {
                if (moduleId === 'core' && current.includes('hms')) {
                    toast.error('MRD (Core) is compulsory when HMS is enabled.');
                    return prev;
                }
                current = current.filter(m => m !== moduleId);
                
                if (moduleId === 'hms' && current.includes('clinic') && current.includes('core')) {
                    current = current.filter(m => m !== 'core');
                }
            } else {
                if (moduleId === 'core' && current.includes('clinic') && !current.includes('hms')) {
                    toast.error('MRD is not applicable for Outpatient Clinics.');
                    return prev;
                }
                current = [...current, moduleId];
                
                if (moduleId === 'hms' && !current.includes('core')) {
                    current.push('core');
                    toast.success('MRD automatically enabled (Compulsory for HMS).');
                }
                if (moduleId === 'clinic' && current.includes('core') && !current.includes('hms')) {
                    current = current.filter(m => m !== 'core');
                }
            }
            return { ...prev, enabled_modules: current };
        });
    };

    const toggleModuleEdit = (moduleId: string) => {
        if (!editingHospital) return;
        let current = [...(editingHospital.enabled_modules || [])];
        
        if (current.includes(moduleId)) {
            if (moduleId === 'core' && current.includes('hms')) {
                toast.error('MRD (Core) is compulsory when HMS is enabled.');
                return;
            }
            current = current.filter(m => m !== moduleId);
            
            if (moduleId === 'hms' && current.includes('clinic') && current.includes('core')) {
                current = current.filter(m => m !== 'core');
            }
        } else {
            if (moduleId === 'core' && current.includes('clinic') && !current.includes('hms')) {
                toast.error('MRD is not applicable for Outpatient Clinics.');
                return;
            }
            current = [...current, moduleId];
            
            if (moduleId === 'hms' && !current.includes('core')) {
                current.push('core');
                toast.success('MRD automatically enabled (Compulsory for HMS).');
            }
            if (moduleId === 'clinic' && current.includes('core') && !current.includes('hms')) {
                current = current.filter(m => m !== 'core');
            }
        }
        setEditingHospital({ ...editingHospital, enabled_modules: current });
    };

    // Client Onboarding Trigger
    const handleOnboardSubmit = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        
        // Basic Validations
        if (!newHospital.legal_name || !newHospital.subdomain || !newHospital.admin_full_name || !newHospital.admin_email || !newHospital.password) {
            setErrorMsg("Please complete all mandatory setup steps.");
            return;
        }

        try {
            // Build Create Payload matching backend HospitalCreate model
            const payload = {
                legal_name: newHospital.legal_name,
                subscription_tier: newHospital.subscription_tier,
                organization_type: "Hospital",
                specialty: newHospital.specialty,
                mrd_service_type: newHospital.mrd_service_type,
                terminology: {},
                enabled_modules: newHospital.enabled_modules,
                email: newHospital.email,
                registration_number: newHospital.registration_number || null,
                established_year: parseInt(newHospital.established_year.toString()) || null,
                address: newHospital.address || null,
                city: newHospital.city || null,
                state: newHospital.state || null,
                pincode: newHospital.pincode || null,
                phone: newHospital.admin_phone || null,
                admin_full_name: newHospital.admin_full_name,
                admin_email: newHospital.admin_email,
                admin_phone: newHospital.admin_phone,
                password: newHospital.password,
                price_per_file: parseFloat(newHospital.price_per_file.toString()) || 100.0,
                included_pages: parseInt(newHospital.included_pages.toString()) || 20,
                price_per_extra_page: parseFloat(newHospital.price_per_extra_page.toString()) || 1.0,
                gst_number: newHospital.gst_number || null
            };

            const res = await apiFetch('/hospitals/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccessMsg("Client Hospital successfully onboarded & Admin created!");
                setTimeout(() => {
                    setIsOnboardOpen(false);
                    setOnboardStep(1);
                    setNewHospital({
                        legal_name: '',
                        organization_type: 'Hospital',
                        established_year: new Date().getFullYear(),
                        registration_number: '',
                        director_name: '',
                        specialty: 'General',
                        address: '',
                        city: '',
                        state: '',
                        pincode: '',
                        subdomain: '',
                        email: '',
                        gst_number: '',
                        admin_full_name: '',
                        admin_email: '',
                        admin_phone: '',
                        password: '',
                        subscription_tier: 'Standard',
                        price_per_file: 100.0,
                        included_pages: 20,
                        price_per_extra_page: 1.0,
                        mrd_service_type: 'PORTAL_ONLY',
                        enabled_modules: ['core']
                    });
                    fetchData();
                }, 2000);
            } else {
                const data = await res.json();
                setErrorMsg(data.detail || "Failed to register hospital.");
            }
        } catch (err) {
            setErrorMsg("A system error occurred. Please check connectivity.");
        }
    };

    // Client Config Update Trigger
    const handleEditSubmit = async () => {
        if (!editingHospital) return;
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const payload = {
                director_name: editingHospital.director_name || null,
                registration_number: editingHospital.registration_number || null,
                address: editingHospital.address || null,
                city: editingHospital.city || null,
                state: editingHospital.state || null,
                pincode: editingHospital.pincode || null,
                phone: editingHospital.phone || null,
                email: editingHospital.email,
                gst_number: editingHospital.gst_number || null,
                
                // Super Admin settings
                legal_name: editingHospital.legal_name,
                hospital_slug: editingHospital.hospital_slug || editingHospital.legal_name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                subscription_tier: editingHospital.subscription_tier,
                specialty: editingHospital.specialty,
                mrd_service_type: editingHospital.mrd_service_type,
                enabled_modules: editingHospital.enabled_modules,
                is_active: editingHospital.is_active,
                price_per_file: parseFloat(editingHospital.price_per_file.toString()) || 0,
                included_pages: parseInt(editingHospital.included_pages.toString()) || 0,
                price_per_extra_page: parseFloat(editingHospital.price_per_extra_page.toString()) || 0
            };

            const res = await apiFetch(`/hospitals/${editingHospital.hospital_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccessMsg("Hospital configurations updated successfully!");
                setTimeout(() => {
                    setIsEditOpen(false);
                    setEditingHospital(null);
                    fetchData();
                }, 1500);
            } else {
                const data = await res.json();
                setErrorMsg(data.detail || "Failed to update configs.");
            }
        } catch (err) {
            setErrorMsg("Failed to write updates.");
        }
    };

    // Client Status Toggle Switch
    const toggleStatus = async (hospital: Hospital) => {
        try {
            const res = await apiFetch(`/hospitals/${hospital.hospital_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !hospital.is_active })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error("Status toggle failed", err);
        }
    };

    // Recycle Bin: Soft Delete Client
    const handleDeleteClick = async (hospitalId: number) => {
        if (!confirm("Are you sure you want to suspend this client and send them to the Recycle Bin? All active users & patient records will lose platform authorization until restored.")) {
            return;
        }

        try {
            const res = await apiFetch(`/hospitals/${hospitalId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error("Soft-delete failed", err);
        }
    };

    // Recycle Bin: Restore Client
    const handleRestoreClick = async (hospitalId: number) => {
        try {
            const res = await apiFetch(`/hospitals/${hospitalId}/restore`, { method: 'POST' });
            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error("Restoring hospital failed", err);
        }
    };

    // Recycle Bin: Permanently Delete (irreversible purge of entire data subtree)
    const handlePermanentDelete = async () => {
        if (!purgeTarget) return;
        if (purgeConfirmText.trim().toLowerCase() !== purgeTarget.legal_name.trim().toLowerCase()) return;

        setPurgeBusy(true);
        setPurgeError('');
        try {
            const res = await apiFetch(`/hospitals/${purgeTarget.hospital_id}/permanent`, { method: 'DELETE' });
            if (res.ok) {
                setPurgeTarget(null);
                setPurgeConfirmText('');
                fetchData();
            } else {
                const data = await res.json().catch(() => ({}));
                setPurgeError(data.detail || `Deletion failed (HTTP ${res.status})`);
            }
        } catch (err: any) {
            setPurgeError(err?.message || 'Permanent deletion failed.');
        } finally {
            setPurgeBusy(false);
        }
    };

    // Review Pending Updates Handlers
    const handleApproveUpdate = async (hospitalId: number) => {
        setReviewingUpdates(true);
        try {
            const res = await apiFetch(`/hospitals/${hospitalId}/approve`, { method: 'POST' });
            if (res.ok) {
                setReviewHospital(null);
                fetchData();
            } else {
                toast.error("Failed to approve updates.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error.");
        } finally {
            setReviewingUpdates(false);
        }
    };

    const handleRejectUpdate = async (hospitalId: number) => {
        setReviewingUpdates(true);
        try {
            const res = await apiFetch(`/hospitals/${hospitalId}/reject`, { method: 'POST' });
            if (res.ok) {
                setReviewHospital(null);
                fetchData();
            } else {
                toast.error("Failed to reject updates.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Network error.");
        } finally {
            setReviewingUpdates(false);
        }
    };


    // Filtering & Searching Logic
    const filteredHospitals = hospitals.filter(h => {
        const matchesSearch = 
            h.legal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (h.registration_number && h.registration_number.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesTier = selectedTier === 'All' || h.subscription_tier === selectedTier;
        
        const isBinItem = h.is_deleted === true;
        
        if (statusFilter === 'bin') {
            return isBinItem && matchesSearch && matchesTier;
        } else {
            if (isBinItem) return false; // Hide trash in normal tabs
            if (statusFilter === 'suspended') return h.is_active === false && matchesSearch && matchesTier;
            if (statusFilter === 'pending') return !!h.pending_updates && matchesSearch && matchesTier;
            return h.is_active !== false && matchesSearch && matchesTier;
        }
    });

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                        Manage Clients
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Platform Administration Cockpit — Onboard hospitals, manage modular SaaS licenses, recycle bin, and audit MRD billing.
                    </p>
                </div>
                
                <button
                    onClick={() => {
                        setIsOnboardOpen(true);
                        setOnboardStep(1);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-black shadow-lg shadow-indigo-900/25 active:scale-95 transition-all uppercase tracking-wider border border-indigo-500/25"
                >
                    <Plus className="w-4 h-4" />
                    Onboard Client
                </button>
            </div>

            {/* Premium Analytics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Clients Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Clients</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {loading ? '...' : stats?.total_hospitals || 0}
                            </h3>
                        </div>
                        <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
                            <Building2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <span className="text-emerald-600 font-black">{stats?.active_hospitals || 0} Active</span>
                        <span>•</span>
                        <span>{hospitals.filter(h => h.is_deleted).length} In Recycle Bin</span>
                    </div>
                </div>

                {/* Storage & Scale Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Storage & Scale</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {loading ? '...' : `${stats?.total_gb || 0} GB`}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Archive className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <span className="text-amber-600 font-black">{stats?.total_files || 0} Digitised Files</span>
                        <span>across platform</span>
                    </div>
                </div>

                {/* Live Activity Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Activity</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {loading ? '...' : stats?.total_users || 0}
                            </h3>
                        </div>
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                            <Activity className="w-5 h-5 animate-pulse" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <span className="text-rose-600 font-black">Online Now</span>
                        <span>• Last 5 minutes metrics</span>
                    </div>
                </div>

                {/* projected Revenue Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Projected MRR</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                                {loading ? '...' : `₹${stats?.projected_revenue?.toLocaleString('en-IN') || 0}`}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                        <span className="text-emerald-600 font-black">Estimated Platform MRR</span>
                        <span>based on tiers</span>
                    </div>
                </div>
            </div>

            {/* Advanced Control & Search Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                {/* Search query input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search client by Name, Email, Registration..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs text-slate-700 bg-slate-50/50"
                    />
                </div>

                {/* Filter Controls Row */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Subscription Tier Selector Tabs */}
                    <div className="flex border border-slate-200 rounded-xl overflow-hidden p-1 bg-slate-50">
                        {['All', 'Enterprise', 'Professional', 'Standard', 'Starter'].map((tier) => (
                            <button
                                key={tier}
                                onClick={() => setSelectedTier(tier)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                                    selectedTier === tier 
                                        ? 'bg-white text-slate-950 shadow-sm border border-slate-200/50' 
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tier}
                            </button>
                        ))}
                    </div>

                    {/* Status Tabs */}
                    <div className="flex border border-slate-200 rounded-xl overflow-hidden p-1 bg-slate-50">
                        {[
                            { id: 'active', label: 'Active' },
                            { id: 'suspended', label: 'Suspended' },
                            { id: 'pending', label: 'Pending Updates' },
                            { id: 'bin', label: 'Bin Recycle' }
                        ].map((status) => (
                            <button
                                key={status.id}
                                onClick={() => setStatusFilter(status.id as any)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                    statusFilter === status.id 
                                        ? status.id === 'bin'
                                            ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                                            : 'bg-white text-slate-950 shadow-sm border border-slate-200/50' 
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {status.id === 'bin' && <Trash2 className="w-3 h-3 text-red-500" />}
                                {status.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Client Directory Data Grid Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs text-slate-400 mt-3 font-semibold">Fetching Client directory...</p>
                    </div>
                ) : filteredHospitals.length === 0 ? (
                    <div className="py-20 text-center">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-500 mt-3 font-black uppercase">No Clients Found</p>
                        <p className="text-[11px] text-slate-400 mt-1">Try resetting your search query or filter criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="py-4 px-6">Client Profile</th>
                                    <th className="py-4 px-4">Subdomain & Contact</th>
                                    <th className="py-4 px-4">Module Matrix</th>
                                    <th className="py-4 px-4">SaaS Tier & Billing</th>
                                    <th className="py-4 px-4">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredHospitals.map((hospital) => {
                                    // Visual color identifiers for Subscription Tier
                                    const tierColors: Record<string, string> = {
                                        'Enterprise': 'bg-violet-50 text-violet-700 border border-violet-200',
                                        'Professional': 'bg-blue-50 text-blue-700 border border-blue-200',
                                        'Standard': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                                        'Starter': 'bg-slate-50 text-slate-700 border border-slate-200'
                                    };

                                    return (
                                        <tr key={hospital.hospital_id} className="hover:bg-slate-50/50 transition-colors">
                                            {/* Profile column */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                                                        {hospital.legal_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-sm tracking-tight">{hospital.legal_name}</h4>
                                                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                                            {hospital.specialty} • Est. {hospital.established_year || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Subdomain & Contact */}
                                            <td className="py-4 px-4">
                                                <div>
                                                    <a
                                                        href={`http://${hospital.hospital_slug || hospital.legal_name.toLowerCase().replace(/[^a-z0-9]/g, '')}${hostSuffix}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-bold text-indigo-600 hover:underline block text-xs tracking-tight"
                                                    >
                                                        {hospital.hospital_slug || hospital.legal_name.toLowerCase().replace(/[^a-z0-9]/g, '')}{hostSuffix}
                                                    </a>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{hospital.email}</p>
                                                </div>
                                            </td>

                                            {/* Module Matrix badges */}
                                            <td className="py-4 px-4">
                                                <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                                    {MODULE_OPTIONS.map(opt => {
                                                        const isEnabled = hospital.enabled_modules?.includes(opt.id);
                                                        const Icon = opt.icon;
                                                        return (
                                                            <div 
                                                                key={opt.id}
                                                                title={opt.label}
                                                                className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
                                                                    isEnabled 
                                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                                                                        : 'bg-slate-50 border-slate-100 text-slate-300'
                                                                }`}
                                                            >
                                                                <Icon className="w-3.5 h-3.5" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </td>

                                            {/* Pricing & Billing */}
                                            <td className="py-4 px-4">
                                                <div>
                                                    <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${tierColors[hospital.subscription_tier] || 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                                                        {hospital.subscription_tier}
                                                    </span>
                                                    <p className="text-[10px] font-bold text-slate-800 mt-1">
                                                        ₹{hospital.price_per_file || 0} / MRD File
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-4 px-4">
                                                {hospital.is_deleted ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
                                                        <Trash2 className="w-3 h-3" />
                                                        Deleted
                                                    </span>
                                                ) : hospital.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                                                        Suspended
                                                    </span>
                                                )}
                                                {hospital.pending_updates && (
                                                    <span className="block mt-1 text-[9px] text-amber-600 font-extrabold animate-pulse">
                                                        Pending Approval
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions Panel */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    {hospital.is_deleted ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleRestoreClick(hospital.hospital_id)}
                                                                className="p-1.5 hover:bg-slate-100 text-indigo-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider border border-slate-200"
                                                                title="Restore from Recycle Bin"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                                Restore
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setPurgeTarget(hospital);
                                                                    setPurgeConfirmText('');
                                                                    setPurgeError('');
                                                                }}
                                                                className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider border border-red-500/30"
                                                                title="Permanently delete this client and ALL associated data"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Delete Permanently
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {hospital.pending_updates && (
                                                                <button
                                                                    onClick={() => setReviewHospital(hospital)}
                                                                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors text-[10px] font-black uppercase tracking-wider border border-amber-200"
                                                                >
                                                                    Review
                                                                </button>
                                                            )}
                                                            
                                                            <button
                                                                onClick={() => {
                                                                    setEditingHospital(hospital);
                                                                    setIsEditOpen(true);
                                                                    setEditTab('profile');
                                                                }}
                                                                className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
                                                                title="Configure Subscription & Profile"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            
                                                            <button
                                                                onClick={() => toggleStatus(hospital)}
                                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                                                    hospital.is_active 
                                                                        ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border-slate-200 hover:border-red-200' 
                                                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/20'
                                                                }`}
                                                            >
                                                                {hospital.is_active ? 'Suspend' : 'Activate'}
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteClick(hospital.hospital_id)}
                                                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
                                                                title="Send to Recycle Bin"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Permanent Delete Confirmation Modal (type-the-name to confirm) */}
            {purgeTarget && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white border border-red-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-red-100 bg-red-50/60 flex items-start gap-3">
                            <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl shrink-0">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-red-900 tracking-tight">Permanently Delete Client</h3>
                                <p className="text-[11px] text-red-700/80 mt-0.5 font-semibold">This action is irreversible.</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 text-xs text-slate-700">
                            <p className="font-semibold leading-relaxed">
                                This will permanently erase <span className="font-black text-slate-900">{purgeTarget.legal_name}</span> and
                                <span className="font-black text-red-700"> all associated data</span> — patient records, digitised files,
                                invoices, appointments, staff accounts and more. This cannot be undone and the data cannot be recovered.
                            </p>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                    Type <span className="text-red-600 font-black normal-case text-xs">{purgeTarget.legal_name}</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={purgeConfirmText}
                                    onChange={(e) => setPurgeConfirmText(e.target.value)}
                                    placeholder={purgeTarget.legal_name}
                                    className="w-full p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-semibold"
                                />
                            </div>

                            {purgeError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-2 font-semibold">
                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                    <span>{purgeError}</span>
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => { setPurgeTarget(null); setPurgeConfirmText(''); setPurgeError(''); }}
                                    disabled={purgeBusy}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePermanentDelete}
                                    disabled={purgeBusy || purgeConfirmText.trim().toLowerCase() !== purgeTarget.legal_name.trim().toLowerCase()}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {purgeBusy ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Purging...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete Forever
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🧙 Onboard Client Wizard Modal */}
            {isOnboardOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    Onboard New Client Hospital
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Step {onboardStep} of 3 — Configure medical platform tenant parameters.</p>
                            </div>
                            <button 
                                onClick={() => setIsOnboardOpen(false)}
                                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Step Visualizer */}
                        <div className="flex border-b border-slate-100">
                            {[
                                { id: 1, label: "Hospital Profile" },
                                { id: 2, label: "Tenant & Credentials" },
                                { id: 3, label: "Billing & Modules" }
                            ].map((step) => (
                                <div 
                                    key={step.id}
                                    className={`flex-1 text-center py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-colors ${
                                        onboardStep === step.id 
                                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' 
                                            : 'border-transparent text-slate-400'
                                    }`}
                                >
                                    {step.id}. {step.label}
                                </div>
                            ))}
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
                            {errorMsg && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-2.5 font-semibold">
                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}
                            {successMsg && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-2.5 font-semibold">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                    <span>{successMsg}</span>
                                </div>
                            )}

                            {/* STEP 1: Hospital Profile */}
                            {onboardStep === 1 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Legal Name *</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Fortis Healthcare"
                                                value={newHospital.legal_name}
                                                onChange={(e) => setNewHospital({...newHospital, legal_name: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Organization Type *</label>
                                            <select
                                                value={newHospital.organization_type}
                                                onChange={(e) => setNewHospital({...newHospital, organization_type: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none"
                                            >
                                                <option value="Hospital">Hospital</option>
                                                <option value="Clinic">Clinic</option>
                                                <option value="Dental Clinic">Dental Clinic</option>
                                                <option value="Independent Doctor">Independent Doctor</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Primary Specialty *</label>
                                            <select
                                                value={newHospital.specialty}
                                                onChange={(e) => setNewHospital({...newHospital, specialty: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none"
                                            >
                                                <option value="General">General / Multi-Specialty</option>
                                                <option value="Doctor">Independent Doctor / Consultant</option>
                                                <option value="Dental">Dental Care Clinic</option>
                                                <option value="ENT">ENT Diagnostics</option>
                                                <option value="Clinic">Outpatient Clinic</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registration Number</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. REG-776182-A"
                                                value={newHospital.registration_number}
                                                onChange={(e) => setNewHospital({...newHospital, registration_number: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Established Year</label>
                                            <input 
                                                type="number" 
                                                value={newHospital.established_year}
                                                onChange={(e) => setNewHospital({...newHospital, established_year: parseInt(e.target.value) || 2026})}
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Director / CEO Full Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="Dr. Aditya Sharma"
                                            value={newHospital.director_name}
                                            onChange={(e) => setNewHospital({...newHospital, director_name: e.target.value})}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Hospital Physical Address</label>
                                        <input 
                                            type="text" 
                                            placeholder="Main Outer Ring Road, Sector 5"
                                            value={newHospital.address}
                                            onChange={(e) => setNewHospital({...newHospital, address: e.target.value})}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">City</label>
                                            <input 
                                                type="text" 
                                                value={newHospital.city}
                                                onChange={(e) => setNewHospital({...newHospital, city: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">State</label>
                                            <input 
                                                type="text" 
                                                value={newHospital.state}
                                                onChange={(e) => setNewHospital({...newHospital, state: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pincode</label>
                                            <input 
                                                type="text" 
                                                value={newHospital.pincode}
                                                onChange={(e) => setNewHospital({...newHospital, pincode: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Subdomain Selector & Admin credentials */}
                            {onboardStep === 2 && (
                                <div className="space-y-4">
                                    {/* Subdomain Input with Dynamic Suffix */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Subdomain *</label>
                                        <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                            <input 
                                                type="text" 
                                                placeholder="e.g. dixithospital"
                                                value={newHospital.subdomain}
                                                onChange={(e) => handleSubdomainChange(e.target.value)}
                                                className="flex-1 p-3 focus:outline-none text-right font-black tracking-tight"
                                            />
                                            <span className="p-3 bg-slate-100 border-l border-slate-200 text-slate-500 font-bold text-xs flex items-center select-none">
                                                {hostSuffix}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-slate-400 mt-1 block font-semibold leading-relaxed">
                                            This subdomain will be the direct URL slug that users access (e.g. <span className="text-indigo-600 font-black">https://{newHospital.subdomain || '[slug]'}{hostSuffix}</span>).
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contact Email Address *</label>
                                            <input 
                                                type="email" 
                                                value={newHospital.email}
                                                onChange={(e) => setNewHospital({...newHospital, email: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">GST Identification Number</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. 29GGGGG1314R9Z8"
                                                value={newHospital.gst_number}
                                                onChange={(e) => setNewHospital({...newHospital, gst_number: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 uppercase"
                                            />
                                        </div>
                                    </div>

                                    {/* Platform Admin Credentials seed */}
                                    <div className="bg-slate-50/80 border border-slate-200/50 rounded-2xl p-4 space-y-3.5">
                                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                            <ShieldAlert className="w-4 h-4 text-indigo-600" />
                                            Tenant Admin Credentials
                                        </h4>
                                        <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                                            These credentials will seed the initial <span className="text-slate-800 font-bold">HOSPITAL_ADMIN</span> account for the client. They can sign in instantly to configure staff roles.
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Full Name *</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Aditya Sharma"
                                                    value={newHospital.admin_full_name}
                                                    onChange={(e) => setNewHospital({...newHospital, admin_full_name: e.target.value})}
                                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Phone Number *</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="+91 99009 88123"
                                                    value={newHospital.admin_phone}
                                                    onChange={(e) => setNewHospital({...newHospital, admin_phone: e.target.value})}
                                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Login Email *</label>
                                                <input 
                                                    type="email" 
                                                    value={newHospital.admin_email}
                                                    onChange={(e) => setNewHospital({...newHospital, admin_email: e.target.value})}
                                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Secure Password *</label>
                                                <input 
                                                    type="password" 
                                                    value={newHospital.password}
                                                    onChange={(e) => setNewHospital({...newHospital, password: e.target.value})}
                                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Modules & Billing */}
                            {onboardStep === 3 && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Subscription Tier */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subscription Tier</label>
                                            <select
                                                value={newHospital.subscription_tier}
                                                onChange={(e) => setNewHospital({...newHospital, subscription_tier: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none"
                                            >
                                                <option value="Starter">Starter (Basic MRD)</option>
                                                <option value="Standard">Standard (MRD + Outpatient)</option>
                                                <option value="Professional">Professional (Full HMS Clinic)</option>
                                                <option value="Enterprise">Enterprise (IPD + Asset + High SLA)</option>
                                            </select>
                                        </div>

                                        {/* MRD Service Type */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">MRD Service Type</label>
                                            <select
                                                value={newHospital.mrd_service_type}
                                                onChange={(e) => setNewHospital({...newHospital, mrd_service_type: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none"
                                            >
                                                <option value="PORTAL_ONLY">Portal Only (Self Storage)</option>
                                                <option value="SCANNING_SUPPORT">Scanning Support (Digifort Scans)</option>
                                                <option value="FULL_MANAGED">Fully Managed (Digifort Stores)</option>
                                            </select>
                                        </div>

                                        {/* Price per patient MRD file */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price per Patient MRD File (Patient ID)</label>
                                            <input 
                                                type="number" 
                                                value={newHospital.price_per_file}
                                                onChange={(e) => setNewHospital({...newHospital, price_per_file: parseFloat(e.target.value) || 0})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Pages configs */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Included Pages per File</label>
                                            <input 
                                                type="number" 
                                                value={newHospital.included_pages}
                                                onChange={(e) => setNewHospital({...newHospital, included_pages: parseInt(e.target.value) || 20})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price per Extra Page (₹)</label>
                                            <input 
                                                type="number" 
                                                value={newHospital.price_per_extra_page}
                                                onChange={(e) => setNewHospital({...newHospital, price_per_extra_page: parseFloat(e.target.value) || 1.0})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Interactive Module Card Selector Grid */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Select Subscribed Modules *</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                            {MODULE_OPTIONS.map((opt) => {
                                                const isEnabled = newHospital.enabled_modules.includes(opt.id);
                                                const Icon = opt.icon;
                                                return (
                                                    <div 
                                                        key={opt.id}
                                                        onClick={() => toggleModuleOnboard(opt.id)}
                                                        className={`border p-3.5 rounded-2xl cursor-pointer transition-all flex items-start gap-3 relative ${
                                                            isEnabled 
                                                                ? `${opt.color} ring-2 ring-indigo-500 shadow-md` 
                                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className={`p-2 rounded-xl border ${isEnabled ? 'bg-indigo-600 text-white border-transparent' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h5 className="font-black text-slate-900 text-xs">{opt.label}</h5>
                                                            <p className="text-[10px] text-slate-400 mt-0.5 leading-normal font-semibold">{opt.desc}</p>
                                                        </div>
                                                        {isEnabled && (
                                                            <div className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center absolute top-3 right-3 text-[9px] font-bold">
                                                                ✓
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <button
                                disabled={onboardStep === 1}
                                onClick={() => setOnboardStep(prev => Math.max(1, prev - 1))}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                                    onboardStep === 1 
                                        ? 'text-slate-300 bg-transparent cursor-not-allowed' 
                                        : 'text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                Back
                            </button>

                            {onboardStep < 3 ? (
                                <button
                                    onClick={() => setOnboardStep(prev => Math.min(3, prev + 1))}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md"
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    onClick={handleOnboardSubmit}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5"
                                >
                                    <Check className="w-4 h-4" />
                                    Complete Onboard
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 📋 Configure / Edit Client drawer */}
            {isEditOpen && editingHospital && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-black text-slate-950 tracking-tight flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-indigo-600" />
                                    Configure Subscriptions & Billing
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">Editing: {editingHospital.legal_name}</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsEditOpen(false);
                                    setEditingHospital(null);
                                }}
                                className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Config Tabs */}
                        <div className="flex border-b border-slate-100">
                            {[
                                { id: 'profile', label: "Client Details" },
                                { id: 'modules', label: "SaaS Modules Control" },
                                { id: 'billing', label: "MRD File Billing" }
                            ].map((tab) => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setEditTab(tab.id as any)}
                                    className={`flex-1 text-center py-3 text-[10px] font-black uppercase tracking-wider border-b-2 transition-colors focus:outline-none ${
                                        editTab === tab.id 
                                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' 
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
                            {errorMsg && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-2.5 font-semibold">
                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}
                            {successMsg && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-2.5 font-semibold">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                    <span>{successMsg}</span>
                                </div>
                            )}

                            {/* TAB 1: Profile Details */}
                            {editTab === 'profile' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Legal Name</label>
                                            <input
                                                type="text"
                                                value={editingHospital.legal_name}
                                                onChange={(e) => setEditingHospital({...editingHospital, legal_name: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subdomain</label>
                                            <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                                                <input
                                                    type="text"
                                                    value={editingHospital.hospital_slug || editingHospital.legal_name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                                                    onChange={(e) => setEditingHospital({...editingHospital, hospital_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                                                    className="flex-1 p-3 text-sm font-mono focus:outline-none bg-white"
                                                    placeholder="slug"
                                                />
                                                <span className="px-2 text-[11px] text-slate-400 bg-slate-50 border-l border-slate-200 whitespace-nowrap">{hostSuffix}</span>
                                            </div>
                                            <p className="text-[10px] text-amber-600">Changing this updates the hospital login URL</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Specialty</label>
                                            <input
                                                type="text"
                                                value={editingHospital.specialty || ''}
                                                onChange={(e) => setEditingHospital({...editingHospital, specialty: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Director / CEO Name</label>
                                            <input
                                                type="text"
                                                value={editingHospital.director_name || ''}
                                                onChange={(e) => setEditingHospital({...editingHospital, director_name: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">GST Registration Number</label>
                                            <input
                                                type="text"
                                                value={editingHospital.gst_number || ''}
                                                onChange={(e) => setEditingHospital({...editingHospital, gst_number: e.target.value.toUpperCase()})}
                                                className="w-full p-3 rounded-xl border border-slate-200 uppercase"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Contact Email</label>
                                            <input 
                                                type="email" 
                                                value={editingHospital.email}
                                                onChange={(e) => setEditingHospital({...editingHospital, email: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                                            <input 
                                                type="text" 
                                                value={editingHospital.phone || ''}
                                                onChange={(e) => setEditingHospital({...editingHospital, phone: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Address Details</label>
                                        <input 
                                            type="text" 
                                            value={editingHospital.address || ''}
                                            onChange={(e) => setEditingHospital({...editingHospital, address: e.target.value})}
                                            className="w-full p-3 rounded-xl border border-slate-200"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Modules Toggle Grid */}
                            {editTab === 'modules' && (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Modify Enabled Modules</label>
                                        <p className="text-[10px] text-slate-400 leading-normal font-semibold">Toggling these parameters instantly updates client access authorizations across their custom subdomains.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {MODULE_OPTIONS.map((opt) => {
                                            const isEnabled = editingHospital.enabled_modules?.includes(opt.id);
                                            const Icon = opt.icon;
                                            return (
                                                <div 
                                                    key={opt.id}
                                                    onClick={() => toggleModuleEdit(opt.id)}
                                                    className={`border p-3.5 rounded-2xl cursor-pointer transition-all flex items-start gap-3 relative ${
                                                        isEnabled 
                                                            ? `${opt.color} ring-2 ring-indigo-500 shadow-md` 
                                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className={`p-2 rounded-xl border ${isEnabled ? 'bg-indigo-600 text-white border-transparent' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="font-black text-slate-900 text-xs">{opt.label}</h5>
                                                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal font-semibold">{opt.desc}</p>
                                                    </div>
                                                    {isEnabled && (
                                                        <div className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center absolute top-3 right-3 text-[9px] font-bold">
                                                            ✓
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: Billing Adjustments */}
                            {editTab === 'billing' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subscription Plan Tier</label>
                                            <select
                                                value={editingHospital.subscription_tier}
                                                onChange={(e) => setEditingHospital({...editingHospital, subscription_tier: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                                            >
                                                <option value="Starter">Starter (Basic MRD)</option>
                                                <option value="Standard">Standard (MRD + Outpatient)</option>
                                                <option value="Professional">Professional (Full HMS Clinic)</option>
                                                <option value="Enterprise">Enterprise (IPD + Asset + High SLA)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">MRD Service Type</label>
                                            <select
                                                value={editingHospital.mrd_service_type}
                                                onChange={(e) => setEditingHospital({...editingHospital, mrd_service_type: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 bg-white"
                                            >
                                                <option value="PORTAL_ONLY">Portal Only (Self Storage)</option>
                                                <option value="SCANNING_SUPPORT">Scanning Support (Digifort Scans)</option>
                                                <option value="FULL_MANAGED">Fully Managed (Digifort Stores)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price per Patient MRD File (Patient ID)</label>
                                            <input 
                                                type="number" 
                                                value={editingHospital.price_per_file}
                                                onChange={(e) => setEditingHospital({...editingHospital, price_per_file: parseFloat(e.target.value) || 0})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Included Pages</label>
                                            <input 
                                                type="number" 
                                                value={editingHospital.included_pages}
                                                onChange={(e) => setEditingHospital({...editingHospital, included_pages: parseInt(e.target.value) || 0})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Price per Extra Page (₹)</label>
                                            <input 
                                                type="number" 
                                                value={editingHospital.price_per_extra_page}
                                                onChange={(e) => setEditingHospital({...editingHospital, price_per_extra_page: parseFloat(e.target.value) || 0})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <button
                                onClick={() => {
                                    setIsEditOpen(false);
                                    setEditingHospital(null);
                                }}
                                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleEditSubmit}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5"
                            >
                                Save Configurations
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Pending Updates Modal */}
            {reviewHospital && reviewHospital.pending_updates && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50/50">
                            <div>
                                <h3 className="text-lg font-black text-amber-950 tracking-tight flex items-center gap-2">
                                    <BadgeAlert className="w-5 h-5 text-amber-600" />
                                    Review Pending Updates
                                </h3>
                                <p className="text-[11px] text-amber-700/70 mt-0.5">Requested by {reviewHospital.legal_name}</p>
                            </div>
                            <button 
                                onClick={() => setReviewHospital(null)}
                                className="p-2 hover:bg-amber-100 text-amber-600 rounded-xl transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-slate-700">
                            <p className="text-xs text-slate-500 font-semibold mb-2">
                                The client has requested to modify protected configurations. Please review these changes before applying them.
                            </p>
                            
                            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                                {Object.entries(JSON.parse(reviewHospital.pending_updates)).map(([key, value]) => (
                                    <div key={key} className="p-3.5 border-b border-slate-100 last:border-b-0 flex justify-between items-start">
                                        <div className="font-bold text-xs uppercase text-slate-400 tracking-wide mt-0.5 w-1/3">
                                            {key.replace(/_/g, ' ')}
                                        </div>
                                        <div className="font-black text-slate-900 w-2/3 break-words bg-white p-2 rounded-xl border border-slate-100 shadow-sm text-xs">
                                            {Array.isArray(value) ? value.join(', ') : String(value)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                            <button
                                onClick={() => handleRejectUpdate(reviewHospital.hospital_id)}
                                disabled={reviewingUpdates}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleApproveUpdate(reviewHospital.hospital_id)}
                                disabled={reviewingUpdates}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {reviewingUpdates ? 'Processing...' : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Approve Updates
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
