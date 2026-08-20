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
    Globe,
    LayoutGrid,
    CheckCircle2,
    Settings,
    Pill,
    Baby,
    TestTube,
    ShieldCheck,
    FileText,
    Download
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
    group_id?: number;
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

const SPECIALTY_OPTIONS: Record<string, {value: string, label: string}[]> = {
    'Multi-Specialty Hospital': [
        {value: 'General', label: 'General / Multi-Specialty'},
        {value: 'Corporate', label: 'Corporate Hospital'},
        {value: 'Trust', label: 'Trust / NGO Hospital'}
    ],
    'Single-Specialty Hospital': [
        {value: 'Cardiology', label: 'Cardiology'},
        {value: 'Orthopedics', label: 'Orthopedics'},
        {value: 'Neurology', label: 'Neurology'},
        {value: 'Oncology', label: 'Oncology'},
        {value: 'Pediatrics', label: 'Pediatrics / Neonatal'},
        {value: 'Maternity', label: 'Maternity / Gynecology'}
    ],
    'Polyclinic / Day Care Center': [
        {value: 'Polyclinic', label: 'General Polyclinic'},
        {value: 'Dental', label: 'Dental Care'},
        {value: 'Eye', label: 'Eye / Vision Center'},
        {value: 'Skin', label: 'Skin / Dermatology'}
    ],
    'Diagnostic Center (Lab/Imaging)': [
        {value: 'Pathology', label: 'Pathology Laboratory'},
        {value: 'Radiology', label: 'Radiology / Imaging (X-Ray, MRI)'},
        {value: 'Complete_Diagnostics', label: 'Complete Diagnostic Center'}
    ],
    'Independent Doctor Clinic': [
        {value: 'Doctor', label: 'Independent Doctor / Consultant'},
        {value: 'Physiotherapy', label: 'Physiotherapy Clinic'},
        {value: 'Homeopathy', label: 'Homeopathy / Ayurveda'}
    ],
    'Pharmacy / Medical Store': [
        {value: 'Retail_Pharmacy', label: 'Retail Pharmacy'},
        {value: 'Wholesale_Pharmacy', label: 'Wholesale Distributor'},
        {value: '24x7_Pharmacy', label: '24x7 Emergency Pharmacy'}
    ]
};
const defaultSpecialties = [{value: 'General', label: 'General / Multi-Specialty'}];

export default function ManageClientsPage() {
    const router = useRouter();
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [hospitalGroups, setHospitalGroups] = useState<any[]>([]);
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
        total_bed_capacity: 50,
        nabh_accredited: 'Full NABH',
        address: '',
        city: 'Vapi',
        state: 'Gujarat',
        pincode: '',
        regulatory_compliance_preset: 'gujarat_cea',
        whatsapp_dispatch_mode: 'wa_me_link',
        
        // Group Setup
        is_group: false,
        group_id: null as number | null,
        new_group_name: '',
        new_group_location: '',
        new_group_email: '',
        add_branch_later: false,
        
        // Tenant Setup
        subdomain: '',
        email: '',
        gst_number: '',
        
        // Admin user credentials
        admin_full_name: '',
        admin_email: '',
        admin_phone: '',
        
        
        // Subscription & Pricing
        billing_cycle: 'Monthly',
        platform_base_price: 5000,
        extra_user_price: 500,
        price_per_file: 100.0,
        included_pages: 20,
        price_per_extra_page: 1.0,
        enabled_modules: ['core']
    });

    // Configure / Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
    const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
    const [editTab, setEditTab] = useState<'profile' | 'modules' | 'billing'>('profile');

    // Group Management Modal State
    const [isGroupManageOpen, setIsGroupManageOpen] = useState<boolean>(false);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [groupManageTab, setGroupManageTab] = useState<'profile' | 'branches' | 'billing' | 'modules'>('profile');
    const [editGroupForm, setEditGroupForm] = useState({
        group_name: '',
        location: '',
        admin_email: ''
    });
    const [groupBulkBilling, setGroupBulkBilling] = useState({
        subscription_tier: 'Standard',
        price_per_file: 100.0,
        included_pages: 20,
        price_per_extra_page: 1.0,
        enabled_modules: ['core']
    });

    // Review Pending Updates State
    const [reviewHospital, setReviewHospital] = useState<Hospital | null>(null);
    const [reviewingUpdates, setReviewingUpdates] = useState<boolean>(false);

    // Permanent Delete (purge) confirmation state
    const [purgeTarget, setPurgeTarget] = useState<Hospital | null>(null);
    const [purgeConfirmText, setPurgeConfirmText] = useState<string>('');
    const [purgeBusy, setPurgeBusy] = useState<boolean>(false);
    const [purgeError, setPurgeError] = useState<string>('');

    // Dynamic Host Suffix Builder for Subdomains
    const [hostSuffix, setHostSuffix] = useState<string>('.digifortlabs.com');
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const host = window.location.host;
            const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';
            if (host.includes('localhost')) {
                setHostSuffix('.digifortlabs.com');
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

            // Fetch Groups
            const groupsRes = await apiFetch('/superadmin/groups/');
            if (groupsRes.ok) {
                const groupsData = await groupsRes.json();
                setHospitalGroups(groupsData);
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

        if (cleanVal) {
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
        { id: 'pharmacy', label: 'Pharmacy & Prescriptions', desc: 'Standalone medicine dispensing & pharmacy', icon: Pill, color: 'text-pink-400 bg-pink-950/40 border-pink-800' },
        { id: 'maternity', label: 'Maternity & Obstetrics', desc: 'ANC tracking, labor ward logs & birth records', icon: Baby, color: 'text-purple-400 bg-purple-950/40 border-purple-800' },
        { id: 'lab', label: 'Pathology & LIS Analyzer', desc: 'Lab test reporting, machine auto-capture', icon: TestTube, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800' },
        { id: 'tpa', label: 'TPA & Cashless Claims', desc: 'Insurance claims, pre-authorization & cashless settlement', icon: ShieldCheck, color: 'text-blue-400 bg-blue-950/40 border-blue-800' }
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
        
        try {
            let finalGroupId = newHospital.group_id;

            if (newHospital.is_group && newHospital.group_id === -1) {
                // Create New Group
                if (!newHospital.new_group_name) {
                    setErrorMsg("Please provide a name for the new Hospital Group.");
                    return;
                }
                const groupPayload = {
                    group_name: newHospital.new_group_name,
                    location: newHospital.new_group_location,
                    admin_email: newHospital.new_group_email
                };
                const groupRes = await apiFetch('/superadmin/groups/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(groupPayload)
                });
                
                if (groupRes.ok) {
                    const groupData = await groupRes.json();
                    finalGroupId = groupData.group_id;
                    // Refresh groups list in background
                    apiFetch('/superadmin/groups/').then(r => r.json()).then(setHospitalGroups).catch(console.error);
                } else {
                    const errorData = await groupRes.json();
                    setErrorMsg(errorData.detail || "Failed to create new Hospital Group.");
                    return;
                }
            }

            if (newHospital.is_group && newHospital.add_branch_later) {
                // Stop here, group created, no branch
                setSuccessMsg("Hospital Group created successfully! You can add branches later.");
                setTimeout(() => {
                    setIsOnboardOpen(false);
                    setOnboardStep(1);
                    fetchData();
                }, 2000);
                return;
            }

            // Basic Validations for Branch
            if (!newHospital.legal_name || !newHospital.subdomain || !newHospital.admin_full_name || !newHospital.admin_email) {
                setErrorMsg("Please complete all mandatory setup steps for the branch.");
                return;
            }

            // Build Create Payload matching backend HospitalCreate model
            const payload = {
                legal_name: newHospital.legal_name,
                group_id: newHospital.is_group ? finalGroupId : null,
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
                        mrd_service_type: 'PORTAL_ONLY',
                        total_bed_capacity: 50,
                        nabh_accredited: 'Full NABH',
                        address: '',
                        city: 'Vapi',
                        state: 'Gujarat',
                        pincode: '',
                        regulatory_compliance_preset: 'gujarat_cea',
                        whatsapp_dispatch_mode: 'wa_me_link',
                        
                        is_group: false,
                        group_id: null,
                        new_group_name: '',
                        new_group_location: '',
                        new_group_email: '',
                        add_branch_later: false,
                        
                        subdomain: '',
                        email: '',
                        gst_number: '',
                        admin_full_name: '',
                        admin_email: '',
                        admin_phone: '',
                        
                        billing_cycle: 'Monthly',
                        platform_base_price: 5000,
                        extra_user_price: 500,
                        price_per_file: 100.0,
                        included_pages: 20,
                        price_per_extra_page: 1.0,
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

    // Group Config Update Trigger
    const handleGroupEditSubmit = async () => {
        if (!selectedGroup) return;
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await apiFetch(`/superadmin/groups/${selectedGroup.group_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editGroupForm)
            });

            if (res.ok) {
                setSuccessMsg("Group configurations updated successfully!");
                setTimeout(() => {
                    setIsGroupManageOpen(false);
                    setSelectedGroup(null);
                    fetchData();
                }, 1500);
            } else {
                const data = await res.json();
                setErrorMsg(data.detail || "Failed to update group.");
            }
        } catch (err) {
            setErrorMsg("Failed to write group updates.");
        }
    };

    // Delete Hospital Group
    const handleGroupDelete = async (groupId: number, groupName: string) => {
        if (!confirm(`Are you sure you want to delete group "${groupName}"? All member branch hospitals will be unlinked and retained as individual clients.`)) {
            return;
        }

        try {
            const res = await apiFetch(`/superadmin/groups/${groupId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setIsGroupManageOpen(false);
                setSelectedGroup(null);
                fetchData();
            } else {
                alert("Failed to delete group.");
            }
        } catch (err) {
            console.error("Error deleting group:", err);
        }
    };

    // Group-Wide Bulk Billing & Module Config Submit
    const handleGroupBulkConfigSubmit = async () => {
        if (!selectedGroup) return;
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await apiFetch(`/superadmin/groups/${selectedGroup.group_id}/bulk-config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(groupBulkBilling)
            });

            if (res.ok) {
                setSuccessMsg(`SaaS & Billing settings applied across all branches in ${selectedGroup.group_name}!`);
                setTimeout(() => {
                    setIsGroupManageOpen(false);
                    setSelectedGroup(null);
                    fetchData();
                }, 1500);
            } else {
                const data = await res.json();
                setErrorMsg(data.detail || "Failed to update group branches billing.");
            }
        } catch (err) {
            setErrorMsg("Network error updating group billing.");
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
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
            (h.legal_name && h.legal_name.toLowerCase().includes(query)) ||
            (h.email && h.email.toLowerCase().includes(query)) ||
            (h.hospital_slug && h.hospital_slug.toLowerCase().includes(query)) ||
            (h.city && h.city.toLowerCase().includes(query)) ||
            (h.registration_number && h.registration_number.toLowerCase().includes(query));
        
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
                        setSuccessMsg("");
                        setErrorMsg("");
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
                                                        {hospital.group_id && (
                                                            <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 uppercase mt-0.5">
                                                                <Building2 className="w-3 h-3" />
                                                                {hospitalGroups.find(g => g.group_id === hospital.group_id)?.group_name || 'Group Member'}
                                                            </div>
                                                        )}
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
                                                <div className="grid grid-cols-6 gap-1 w-fit">
                                                    {MODULE_OPTIONS.map(opt => {
                                                        const isEnabled = hospital.enabled_modules?.includes(opt.id);
                                                        const Icon = opt.icon;
                                                        return (
                                                            <div 
                                                                key={opt.id}
                                                                title={`${opt.label}: ${isEnabled ? 'Active' : 'Disabled'}`}
                                                                className={`w-5.5 h-5.5 rounded-md flex items-center justify-center border transition-all ${
                                                                    isEnabled 
                                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold' 
                                                                        : 'bg-slate-50 border-slate-100 text-slate-300'
                                                                }`}
                                                            >
                                                                <Icon className="w-3 h-3" />
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
                                                                    const targetUrl = `http://${hospital.hospital_slug || hospital.legal_name.toLowerCase().replace(/[^a-z0-9]/g, '')}${hostSuffix}`;
                                                                    window.open(targetUrl, '_blank');
                                                                }}
                                                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-[11px] font-bold border border-blue-200 flex items-center gap-1"
                                                                title="Launch Client Portal"
                                                            >
                                                                <Globe className="w-3.5 h-3.5" /> Launch
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setEditingHospital(hospital);
                                                                    setIsEditOpen(true);
                                                                    setEditTab('profile');
                                                                }}
                                                                className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors border border-slate-200"
                                                                title="Configure SaaS Licenses & Modules"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
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

                        {/* Hospital Groups Table */}
            <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Hospital Groups / Networks</h3>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Parent organizations overseeing multiple branches.</p>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Building2 className="w-5 h-5" />
                    </div>
                </div>
                
                {hospitalGroups.length === 0 ? (
                    <div className="py-12 text-center">
                        <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-500 mt-3 font-black uppercase">No Hospital Groups Found</p>
                        <p className="text-[11px] text-slate-400 mt-1">Create a new group during the onboarding process.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="py-4 px-6">Group Profile</th>
                                    <th className="py-4 px-4">Contact Email</th>
                                    <th className="py-4 px-4">HQ Location</th>
                                    <th className="py-4 px-4">Branches</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {hospitalGroups.map(group => (
                                    <tr key={group.group_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs shadow-sm">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-sm tracking-tight">{group.group_name}</h4>
                                                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">ID: {group.group_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 font-semibold text-slate-600">{group.admin_email || 'N/A'}</td>
                                        <td className="py-4 px-4 font-semibold text-slate-600">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                {group.location || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 font-black text-indigo-600">
                                            {hospitals.filter(h => h.group_id === group.group_id).length} Branches
                                        </td>
                                        <td className="py-4 px-6 text-right flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => {
                                                    setSelectedGroup(group);
                                                    setEditGroupForm({
                                                        group_name: group.group_name || '',
                                                        location: group.location || '',
                                                        admin_email: group.admin_email || ''
                                                    });
                                                    setIsGroupManageOpen(true);
                                                    setGroupManageTab('profile');
                                                }}
                                                className="text-indigo-600 font-bold hover:underline text-[10px] uppercase tracking-wider"
                                            >
                                                Manage
                                            </button>
                                            <button 
                                                onClick={() => handleGroupDelete(group.group_id, group.group_name)}
                                                className="text-red-600 hover:text-red-700 font-bold text-[10px] uppercase tracking-wider p-1"
                                                title="Delete Group"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Group Management Modal */}
            {isGroupManageOpen && selectedGroup && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Manage Group</h3>
                                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{selectedGroup.group_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    type="button"
                                    onClick={() => handleGroupDelete(selectedGroup.group_id, selectedGroup.group_name)}
                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Group
                                </button>
                                <button onClick={() => setIsGroupManageOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-6 pt-4 border-b border-slate-200 gap-6">
                            <button
                                onClick={() => setGroupManageTab('profile')}
                                className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 ${
                                    groupManageTab === 'profile' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => setGroupManageTab('branches')}
                                className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 ${
                                    groupManageTab === 'branches' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Branches
                            </button>
                            <button
                                onClick={() => setGroupManageTab('billing')}
                                className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 ${
                                    groupManageTab === 'billing' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Billing & Tier
                            </button>
                            <button
                                onClick={() => setGroupManageTab('modules')}
                                className={`pb-3 text-xs font-black uppercase tracking-wider transition-colors border-b-2 ${
                                    groupManageTab === 'modules' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Group Modules
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            {groupManageTab === 'profile' && (
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Group Name</label>
                                        <input 
                                            type="text" 
                                            value={editGroupForm.group_name} 
                                            onChange={(e) => setEditGroupForm({...editGroupForm, group_name: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Location</label>
                                            <input 
                                                type="text" 
                                                value={editGroupForm.location} 
                                                onChange={(e) => setEditGroupForm({...editGroupForm, location: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Admin Email</label>
                                            <input 
                                                type="email" 
                                                name="edit_group_admin_email_no_autofill"
                                                autoComplete="off"
                                                value={editGroupForm.admin_email} 
                                                onChange={(e) => setEditGroupForm({...editGroupForm, admin_email: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            onClick={handleGroupEditSubmit}
                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95"
                                        >
                                            Save Group Profile
                                        </button>
                                    </div>
                                </div>
                            )}

                            {groupManageTab === 'billing' && (
                                <div className="space-y-5">
                                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                        Manage subscription tiers and digitisation rates applied across all branches in <span className="font-bold text-slate-900">{selectedGroup.group_name}</span>.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subscription Tier</label>
                                            <select
                                                value={groupBulkBilling.subscription_tier}
                                                onChange={(e) => setGroupBulkBilling({...groupBulkBilling, subscription_tier: e.target.value})}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                                            >
                                                <option value="Enterprise">Enterprise</option>
                                                <option value="Professional">Professional</option>
                                                <option value="Standard">Standard</option>
                                                <option value="Starter">Starter</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Base Rate / File (₹)</label>
                                            <input 
                                                type="number"
                                                value={groupBulkBilling.price_per_file}
                                                onChange={(e) => setGroupBulkBilling({...groupBulkBilling, price_per_file: parseFloat(e.target.value) || 0})}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Included Pages / File</label>
                                            <input 
                                                type="number"
                                                value={groupBulkBilling.included_pages}
                                                onChange={(e) => setGroupBulkBilling({...groupBulkBilling, included_pages: parseInt(e.target.value) || 0})}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Extra Page Rate (₹)</label>
                                            <input 
                                                type="number"
                                                step="0.5"
                                                value={groupBulkBilling.price_per_extra_page}
                                                onChange={(e) => setGroupBulkBilling({...groupBulkBilling, price_per_extra_page: parseFloat(e.target.value) || 0})}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            onClick={handleGroupBulkConfigSubmit}
                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95"
                                        >
                                            Apply Billing To All Branches
                                        </button>
                                    </div>
                                </div>
                            )}

                            {groupManageTab === 'modules' && (
                                <div className="space-y-5">
                                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                                        Configure operational module permissions for all branch hospitals in this group network.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'core', label: 'Core EMR & Digital Files' },
                                            { id: 'hms', label: 'HMS & IPD Bed Management' },
                                            { id: 'accounting', label: 'Accounting & Daily Invoicing' },
                                            { id: 'pharmacy', label: 'POS Pharmacy Management' },
                                            { id: 'lab', label: 'Diagnostics & Pathology Lab' },
                                            { id: 'dental', label: 'Dental Specialty Cockpit' },
                                            { id: 'ent', label: 'ENT Specialty Cockpit' },
                                            { id: 'emergency', label: 'Emergency & Triage' }
                                        ].map((module) => {
                                            const isChecked = groupBulkBilling.enabled_modules.includes(module.id);
                                            return (
                                                <label 
                                                    key={module.id} 
                                                    className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                                                        isChecked ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600'
                                                    }`}
                                                >
                                                    <input 
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setGroupBulkBilling(prev => ({
                                                                ...prev,
                                                                enabled_modules: checked
                                                                    ? [...prev.enabled_modules, module.id]
                                                                    : prev.enabled_modules.filter(m => m !== module.id)
                                                            }));
                                                        }}
                                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-xs font-semibold">{module.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button 
                                            onClick={handleGroupBulkConfigSubmit}
                                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95"
                                        >
                                            Update Group Module Permissions
                                        </button>
                                    </div>
                                </div>
                            )}

                            {groupManageTab === 'branches' && (
                                <div className="space-y-4">
                                    {/* Actions Header */}
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                                            Group Branches ({hospitals.filter(h => h.group_id === selectedGroup.group_id).length})
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            {/* Add Existing Hospital Dropdown */}
                                            {hospitals.filter(h => !h.group_id || h.group_id !== selectedGroup.group_id).length > 0 && (
                                                <select
                                                    onChange={async (e) => {
                                                        const hId = e.target.value;
                                                        if (!hId) return;
                                                        try {
                                                            const res = await apiFetch(`/superadmin/groups/${hId}/assign-group/${selectedGroup.group_id}`, {
                                                                method: 'POST'
                                                            });
                                                            if (res.ok) {
                                                                fetchData();
                                                            } else {
                                                                alert('Failed to link hospital to group');
                                                            }
                                                        } catch (err) {
                                                            console.error('Error linking hospital:', err);
                                                        }
                                                        e.target.value = '';
                                                    }}
                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all focus:outline-none cursor-pointer"
                                                >
                                                    <option value="">+ Link Existing Client...</option>
                                                    {hospitals
                                                        .filter(h => !h.group_id || h.group_id !== selectedGroup.group_id)
                                                        .map(h => (
                                                            <option key={h.hospital_id} value={h.hospital_id}>
                                                                {h.legal_name} ({h.city})
                                                            </option>
                                                        ))}
                                                </select>
                                            )}

                                            {/* Add New Hospital Branch Button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsGroupManageOpen(false);
                                                    setNewHospital(prev => ({
                                                        ...prev,
                                                        is_group: false,
                                                        group_id: selectedGroup.group_id
                                                    }));
                                                    setOnboardStep(1);
                                                    setIsOnboardOpen(true);
                                                }}
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Add New Branch
                                            </button>
                                        </div>
                                    </div>

                                    {hospitals.filter(h => h.group_id === selectedGroup.group_id).length === 0 ? (
                                        <div className="text-center py-10 space-y-3">
                                            <p className="text-slate-400 text-xs font-semibold">No branches linked to this hospital group yet.</p>
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsGroupManageOpen(false);
                                                        setNewHospital(prev => ({
                                                            ...prev,
                                                            is_group: false,
                                                            group_id: selectedGroup.group_id
                                                        }));
                                                        setOnboardStep(1);
                                                        setIsOnboardOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
                                                >
                                                    + Onboard New Branch Hospital
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        hospitals.filter(h => h.group_id === selectedGroup.group_id).map(hospital => (
                                            <div key={hospital.hospital_id} className="p-4 border border-slate-200/70 rounded-2xl flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                                                        {hospital.legal_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm">{hospital.legal_name}</h4>
                                                        <p className="text-[11px] text-slate-400 font-semibold">{hospital.email} • {hospital.city}, {hospital.state}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${hospital.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                        {hospital.is_active ? 'Active' : 'Suspended'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        title="Unlink from group"
                                                        onClick={async () => {
                                                            if (!confirm(`Unlink ${hospital.legal_name} from this group?`)) return;
                                                            try {
                                                                const res = await apiFetch(`/superadmin/groups/${hospital.hospital_id}/assign-group/0`, {
                                                                    method: 'POST'
                                                                });
                                                                if (res.ok) {
                                                                    fetchData();
                                                                }
                                                            } catch (err) {
                                                                console.error('Error unlinking hospital:', err);
                                                            }
                                                        }}
                                                        className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors p-1"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

            {/* 🧙 Premium Onboard Client Wizard Modal */}
            {isOnboardOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row max-h-[95vh] lg:h-[800px] border border-white/20">
                        
                        {/* LEFT PANEL - Gradient Sidebar */}
                        <div className="lg:w-80 bg-slate-900 p-8 flex flex-col justify-between text-white shrink-0 relative overflow-hidden hidden lg:flex">
                            {/* Decorative background blurbs */}
                            <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-fuchsia-400/20 rounded-full blur-2xl"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-12">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight">Onboard Client</h3>
                                </div>

                                {/* Vertical Stepper */}
                                <div className="space-y-8">
                                    {[
                                        { id: 1, label: "Hospital Profile", desc: "Basic details & identity" },
                                        { id: 2, label: "Tenant Access", desc: "Subdomain & Admin config" },
                                        { id: 3, label: "Billing & Modules", desc: "Subscription packages" }
                                    ].map((step) => (
                                        <div key={step.id} className="flex gap-4 relative">
                                            {/* Connector line */}
                                            {step.id !== 3 && (
                                                <div className={`absolute top-8 left-[1.1rem] w-0.5 h-10 transition-colors duration-500 ${onboardStep > step.id ? 'bg-white/50' : 'bg-white/10'}`}></div>
                                            )}
                                            
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-all duration-500 z-10 ${
                                                onboardStep === step.id 
                                                    ? 'bg-white text-indigo-600 shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-110' 
                                                    : onboardStep > step.id 
                                                        ? 'bg-white/30 text-white border border-white/50'
                                                        : 'bg-white/10 text-slate-400 border border-white/20'
                                            }`}>
                                                {onboardStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                                            </div>
                                            <div className={`pt-1 transition-all duration-300 ${onboardStep === step.id ? 'opacity-100 translate-x-1' : 'opacity-60'}`}>
                                                <p className="font-black text-sm uppercase tracking-wider">{step.label}</p>
                                                <p className="text-sm text-white/70 mt-0.5 font-semibold">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="relative z-10">
                                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                                    This wizard provisions a fully isolated tenant instance on the Digifort Cloud.
                                </p>
                            </div>
                        </div>

                        {/* RIGHT PANEL - Content Area */}
                        <div className="flex-1 flex flex-col bg-slate-50 relative">
                            {/* Mobile Header (Hidden on LG) */}
                            <div className="lg:hidden p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    <span className="font-black text-sm text-slate-900">Step {onboardStep} of 3</span>
                                </div>
                                <button onClick={() => setIsOnboardOpen(false)} className="p-2 bg-slate-100 rounded-full">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Main Form Scroll Area */}
                            <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 animate-in slide-in-from-right-4 duration-500">
                                
                                {errorMsg && (
                                    <div className="p-4 bg-red-50/80 backdrop-blur border border-red-200 text-red-800 rounded-2xl flex items-start gap-3 font-semibold shadow-sm animate-in fade-in zoom-in-95">
                                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                        <span className="text-sm">{errorMsg}</span>
                                    </div>
                                )}
                                {successMsg && (
                                    <div className="p-4 bg-emerald-50/80 backdrop-blur border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3 font-semibold shadow-sm animate-in fade-in zoom-in-95">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <span className="text-sm">{successMsg}</span>
                                    </div>
                                )}

                                {/* STEP 1 */}
                                {onboardStep === 1 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        
                                        {/* Hospital Group Setup Premium Toggle */}
                                        <div className="p-6 bg-white border border-slate-200/60 shadow-sm rounded-3xl transition-all duration-300 hover:shadow-md">
                                            <div className="flex items-center justify-between cursor-pointer" onClick={() => setNewHospital(p => ({...p, is_group: !p.is_group}))}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-14 rounded-2xl flex items-center justify-center transition-colors ${newHospital.is_group ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        <Building2 className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-black text-slate-900 tracking-tight">Hospital Group / Chain</h4>
                                                        <p className="text-xs text-slate-500 mt-0.5 font-semibold">Is this branch part of a larger multi-hospital group?</p>
                                                    </div>
                                                </div>
                                                <div className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${newHospital.is_group ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${newHospital.is_group ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </div>
                                            </div>

                                            {/* Expandable Group Details */}
                                            {newHospital.is_group && (
                                                <div className="mt-6 pt-6 border-t border-slate-100 space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
                                                    
                                                    {/* Group Selector Cards */}
                                                    <div>
                                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider block mb-3">Group Affiliation</label>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div 
                                                                onClick={() => setNewHospital({...newHospital, group_id: -1})}
                                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${newHospital.group_id === -1 ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}
                                                            >
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${newHospital.group_id === -1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>+</div>
                                                                    <span className={`font-black text-sm ${newHospital.group_id === -1 ? 'text-indigo-900' : 'text-slate-700'}`}>Create New Group</span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 font-semibold pl-8">Register a completely new hospital network</p>
                                                            </div>
                                                            <div 
                                                                onClick={() => setNewHospital({...newHospital, group_id: hospitalGroups.length > 0 ? hospitalGroups[0].group_id : null})}
                                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${newHospital.group_id !== -1 && newHospital.group_id !== null ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}
                                                            >
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${newHospital.group_id !== -1 && newHospital.group_id !== null ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Building2 className="w-3 h-3"/></div>
                                                                    <span className={`font-black text-sm ${newHospital.group_id !== -1 && newHospital.group_id !== null ? 'text-indigo-900' : 'text-slate-700'}`}>Existing Group</span>
                                                                </div>
                                                                {newHospital.group_id !== -1 && newHospital.group_id !== null ? (
                                                                    <select
                                                                        value={newHospital.group_id ?? ''}
                                                                        onChange={(e) => setNewHospital({...newHospital, group_id: parseInt(e.target.value)})}
                                                                        className="w-full text-xs font-bold p-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                    >
                                                                        {hospitalGroups.map(g => (
                                                                            <option key={g.group_id} value={g.group_id}>{g.group_name}</option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <p className="text-xs text-slate-500 font-semibold pl-8 mt-[-4px]">Add branch to an existing network</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* New Group Fields */}
                                                    {newHospital.group_id === -1 && (
                                                        <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200 space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Group Name *</label>
                                                                    <div className="relative">
                                                                        <input 
                                                                            type="text" placeholder="e.g. Apollo Group"
                                                                            value={newHospital.new_group_name} onChange={(e) => setNewHospital({...newHospital, new_group_name: e.target.value})}
                                                                            className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-semibold transition-all shadow-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Headquarters</label>
                                                                    <div className="relative">
                                                                        <input 
                                                                            type="text" placeholder="e.g. Mumbai"
                                                                            value={newHospital.new_group_location} onChange={(e) => setNewHospital({...newHospital, new_group_location: e.target.value})}
                                                                            className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-semibold transition-all shadow-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5 md:col-span-2">
                                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Group Admin Email</label>
                                                                    <div className="relative">
                                                                        <input 
                                                                            type="email" placeholder="admin@group.com"
                                                                            value={newHospital.new_group_email} onChange={(e) => setNewHospital({...newHospital, new_group_email: e.target.value})}
                                                                            className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-semibold transition-all shadow-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <label className="flex items-center gap-3 cursor-pointer mt-4 p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={newHospital.add_branch_later}
                                                                    onChange={(e) => setNewHospital({...newHospital, add_branch_later: e.target.checked})}
                                                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                                                />
                                                                <div>
                                                                    <span className="text-xs font-black text-slate-800 block">Create Group Only (Skip Branch setup)</span>
                                                                    <span className="text-xs font-semibold text-slate-500">You can add branches to this group later.</span>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Hide Branch profile if just creating group */}
                                        {!(newHospital.is_group && newHospital.group_id === -1 && newHospital.add_branch_later) && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Branch Details</span>
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Legal Name *</label>
                                                <input 
                                                    type="text" placeholder="e.g. Fortis Healthcare - Vashi"
                                                    value={newHospital.legal_name} onChange={(e) => setNewHospital({...newHospital, legal_name: e.target.value})}
                                                    className="w-full px-4 py-3.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-black text-slate-900 transition-all shadow-sm"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Organization Type *</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['Multi-Specialty Hospital', 'Single-Specialty Hospital', 'Polyclinic / Day Care Center', 'Diagnostic Center (Lab/Imaging)', 'Independent Doctor Clinic', 'Pharmacy / Medical Store'].map(type => (
                                                            <div 
                                                                key={type}
                                                                onClick={() => setNewHospital({...newHospital, organization_type: type, specialty: (SPECIALTY_OPTIONS[type] || defaultSpecialties)[0].value})}
                                                                className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${newHospital.organization_type === type ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 font-semibold'} text-sm`}
                                                            >
                                                                {type}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Primary Specialty *</label>
                                                    <div className="relative">
                                                        <select
                                                            value={newHospital.specialty}
                                                            onChange={(e) => setNewHospital({...newHospital, specialty: e.target.value})}
                                                            className="w-full px-4 py-3.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm font-semibold shadow-sm"
                                                        >
                                                            {(SPECIALTY_OPTIONS[newHospital.organization_type || 'Multi-Specialty Hospital'] || defaultSpecialties).map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Registration Number</label>
                                                    <input 
                                                        type="text" placeholder="e.g. REG-776182-A"
                                                        value={newHospital.registration_number} onChange={(e) => setNewHospital({...newHospital, registration_number: e.target.value})}
                                                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Total Bed Capacity</label>
                                                    <input 
                                                        type="number" placeholder="50"
                                                        value={newHospital.total_bed_capacity} onChange={(e) => setNewHospital({...newHospital, total_bed_capacity: parseInt(e.target.value) || 0})}
                                                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">NABH Status</label>
                                                    <select
                                                        value={newHospital.nabh_accredited} onChange={(e) => setNewHospital({...newHospital, nabh_accredited: e.target.value})}
                                                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                    >
                                                        <option value="Full NABH">Full NABH Accredited</option>
                                                        <option value="Entry Level NABH">Entry Level NABH</option>
                                                        <option value="In Process">NABH In Process</option>
                                                        <option value="Not Applied">Not Applied</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Director / CEO Full Name</label>
                                                <input 
                                                    type="text" placeholder="Dr. Aditya Sharma"
                                                    value={newHospital.director_name} onChange={(e) => setNewHospital({...newHospital, director_name: e.target.value})}
                                                    className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                 <div className="space-y-1.5 md:col-span-3">
                                                     <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Hospital Physical Address</label>
                                                     <input 
                                                         type="text" placeholder="Main Outer Ring Road, Sector 5"
                                                         value={newHospital.address} onChange={(e) => setNewHospital({...newHospital, address: e.target.value})}
                                                         className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                     />
                                                 </div>
                                                 <div className="space-y-1.5">
                                                     <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">City *</label>
                                                     <input 
                                                         type="text" placeholder="e.g. Vapi / Valsad"
                                                         value={newHospital.city} onChange={(e) => setNewHospital({...newHospital, city: e.target.value})}
                                                         className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                     />
                                                 </div>
                                                 <div className="space-y-1.5">
                                                     <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">State Regulatory Preset *</label>
                                                     <select 
                                                         value={newHospital.regulatory_compliance_preset} 
                                                         onChange={(e) => {
                                                             const val = e.target.value;
                                                             const stateName = val.includes('gujarat') ? 'Gujarat' : val.includes('maharashtra') ? 'Maharashtra' : val.includes('daman') ? 'DNH & Daman' : 'Pan-India Standard';
                                                             setNewHospital({...newHospital, regulatory_compliance_preset: val, state: stateName});
                                                         }}
                                                         className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                     >
                                                         <option value="gujarat_cea">Gujarat CEA (Vapi/Valsad/Surat)</option>
                                                         <option value="maharashtra_nursing">Maharashtra Nursing Homes Act</option>
                                                         <option value="daman_ut">DNH & Daman Diu UT Framework</option>
                                                         <option value="national_standard">National CEA Regulatory Standard</option>
                                                     </select>
                                                 </div>
                                                 <div className="space-y-1.5">
                                                     <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Pincode</label>
                                                     <input 
                                                         type="text" placeholder="396191"
                                                         value={newHospital.pincode} onChange={(e) => setNewHospital({...newHospital, pincode: e.target.value})}
                                                         className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                     />
                                                 </div>
                                             </div>

                                             {/* 📄 Download Rules & Regulations PDF Banner */}
                                             <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between gap-4">
                                                 <div className="flex items-center gap-3">
                                                     <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                                                         <FileText className="w-5 h-5" />
                                                     </div>
                                                     <div>
                                                         <h5 className="text-xs font-black text-slate-900">Healthcare Statutory Compliance Handbook</h5>
                                                         <p className="text-[11px] text-indigo-700/80 font-semibold mt-0.5">DPDP 2023, NABH Standards, Fire NOC & AERB legal checklist PDF.</p>
                                                     </div>
                                                 </div>
                                                 <button 
                                                     type="button"
                                                     onClick={() => {
                                                         const printWindow = window.open('', '_blank');
                                                         if (!printWindow) return;
                                                         printWindow.document.write(`
                                                             <html>
                                                             <head>
                                                                 <title>Digifort Labs - Healthcare Rules and Statutory Regulations Guide</title>
                                                                 <style>
                                                                     body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
                                                                     h1 { color: #4338ca; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 24px; }
                                                                     h2 { color: #1e293b; font-size: 16px; margin-top: 25px; border-left: 4px solid #4338ca; padding-left: 10px; }
                                                                     table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                                                                     th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
                                                                     th { background-color: #f1f5f9; font-weight: bold; }
                                                                     .badge { background: #dbeafe; color: #1e40af; padding: 4px 8px; rounded: 4px; font-size: 11px; font-weight: bold; }
                                                                     .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
                                                                 </style>
                                                             </head>
                                                             <body>
                                                                 <h1>🏥 Digifort Labs — Healthcare Statutory Rules & Regulations Compliance Guide</h1>
                                                                 <p><strong>Selected Region Framework:</strong> ${newHospital.state} (${newHospital.regulatory_compliance_preset.toUpperCase()})</p>
                                                                 <p><strong>Target Facility:</strong> ${newHospital.legal_name || 'Hospital Client'} — ${newHospital.total_bed_capacity} Beds (${newHospital.nabh_accredited})</p>
                                                                 
                                                                 <h2>1. Digital Personal Data Protection (DPDP Act 2023)</h2>
                                                                 <ul>
                                                                     <li><strong>AES-256 Medical Records Encryption:</strong> All scanned patient files & prescription notes encrypted at rest.</li>
                                                                     <li><strong>Explicit Patient Consent Logs:</strong> Mandatory digital consent capture before WhatsApp prescription dispatch.</li>
                                                                     <li><strong>ABHA M1/M2 Gateway Interoperability:</strong> Seamless linking with Ayushman Bharat Digital Mission IDs.</li>
                                                                 </ul>

                                                                 <h2>2. NABH Accreditation Standards (5th Edition)</h2>
                                                                 <ul>
                                                                     <li><strong>Patient Safety & Infection Control (AAC & COP):</strong> Standardized IPD admission & emergency triage logs.</li>
                                                                     <li><strong>Medication Safety (MOM):</strong> Pharmacy double-verification for high-alert medications.</li>
                                                                     <li><strong>Continuous Quality Monitoring (CQI):</strong> Automated OPD wait-time & bed turnaround telemetry.</li>
                                                                 </ul>

                                                                 <h2>3. Statutory State Licenses & NOC Checklist</h2>
                                                                 <table>
                                                                     <tr><th>License / Certificate</th><th>Regulatory Authority</th><th>Mandatory Renewal Cycle</th></tr>
                                                                     <tr><td>Clinical Establishment Act License</td><td>District Health Office (DHO / Chief Medical Officer)</td><td>Every 3 Years</td></tr>
                                                                     <tr><td>Fire Safety NOC</td><td>State Fire & Emergency Services</td><td>Annual Renewal</td></tr>
                                                                     <tr><td>Biomedical Waste (BMW) Authorization</td><td>State Pollution Control Board (GPCB/MPCB)</td><td>Every 5 Years</td></tr>
                                                                     <tr><td>AERB X-Ray / CT Registration</td><td>Atomic Energy Regulatory Board (eLORA Portal)</td><td>Every 5 Years</td></tr>
                                                                     <tr><td>Pharmacy Retail / Wholesale License</td><td>State Food & Drugs Laboratory (FDCA)</td><td>Every 5 Years</td></tr>
                                                                 </table>

                                                                 <div className="footer">
                                                                     Issued by Digifort Labs Platform Admin Control | Verified for ${newHospital.legal_name || 'Hospital Client'} | ${new Date().toLocaleDateString('en-IN')}
                                                                 </div>
                                                                 <script>window.print();</script>
                                                             </body>
                                                             </html>
                                                         `);
                                                         printWindow.document.close();
                                                     }}
                                                     className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0 active:scale-95"
                                                 >
                                                     <Download className="w-3.5 h-3.5" /> Download PDF Guide
                                                 </button>
                                             </div>
                                        </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 2 */}
                                {onboardStep === 2 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        
                                        <div className="p-6 bg-indigo-50/50 rounded-3xl border border-slate-200 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                                    <Globe className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-indigo-950 tracking-tight">Tenant Domain Routing</h4>
                                                    <p className="text-xs text-indigo-700/70 font-semibold mt-0.5">Isolated URL for patient and staff login.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-indigo-800 uppercase tracking-wider block">Subdomain Slug *</label>
                                                <div className="flex rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 transition-all">
                                                    <div className="bg-white flex-1 relative">
                                                        <input 
                                                            type="text" 
                                                            placeholder="e.g. apollo-vashi"
                                                            value={newHospital.subdomain}
                                                            onChange={(e) => handleSubdomainChange(e.target.value)}
                                                            className="w-full px-4 py-4 focus:outline-none text-right font-black text-indigo-950 tracking-tight placeholder-slate-300"
                                                        />
                                                    </div>
                                                    <div className="px-5 bg-indigo-900 text-indigo-100 font-bold text-sm flex items-center select-none border-l border-indigo-800">
                                                        {hostSuffix}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* WhatsApp E-Rx & OPD Messaging Configuration */}
                                        <div className="p-5 bg-emerald-50/60 rounded-3xl border border-emerald-200 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-xs shadow-sm">
                                                    WA
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-emerald-950 tracking-tight">WhatsApp Patient Messaging Mode</h4>
                                                    <p className="text-xs text-emerald-700/80 font-semibold">Pre-configured wa.me link integration for local web.whatsapp.com</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                <div 
                                                    onClick={() => setNewHospital({...newHospital, whatsapp_dispatch_mode: 'wa_me_link'})}
                                                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                                        newHospital.whatsapp_dispatch_mode === 'wa_me_link'
                                                            ? 'bg-white border-emerald-600 shadow-sm ring-1 ring-emerald-500'
                                                            : 'bg-white/60 border-slate-200 hover:border-emerald-300'
                                                    }`}
                                                >
                                                    <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                                        <span>💬 Direct wa.me Web Link</span>
                                                        <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">Default</span>
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Launches web.whatsapp.com directly in browser with pre-filled E-Rx text. Zero API fee.</p>
                                                </div>

                                                <div 
                                                    onClick={() => setNewHospital({...newHospital, whatsapp_dispatch_mode: 'desktop_pairing'})}
                                                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                                        newHospital.whatsapp_dispatch_mode === 'desktop_pairing'
                                                            ? 'bg-white border-emerald-600 shadow-sm ring-1 ring-emerald-500'
                                                            : 'bg-white/60 border-slate-200 hover:border-emerald-300'
                                                    }`}
                                                >
                                                    <p className="text-xs font-black text-slate-900">💻 Desktop Worker Pairing</p>
                                                    <p className="text-[11px] text-slate-500 mt-1 font-medium">Dispatches background messages via local Windows Desktop pairing worker.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Official Email Address *</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                                                    <input 
                                                        type="email" placeholder="contact@hospital.com"
                                                        name="hospital_official_email_no_autofill"
                                                        autoComplete="off"
                                                        value={newHospital.email} onChange={(e) => setNewHospital({...newHospital, email: e.target.value})}
                                                        className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">GST Identification</label>
                                                <input 
                                                    type="text" placeholder="29GGGGG1314R9Z8"
                                                    value={newHospital.gst_number} onChange={(e) => setNewHospital({...newHospital, gst_number: e.target.value})}
                                                    className="w-full px-4 py-3.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold uppercase shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6 relative overflow-hidden">
                                            {/* Decorative element */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0"></div>
                                            
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center">
                                                        <ShieldAlert className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 tracking-tight">Root Admin Credentials</h4>
                                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Seeds the initial HOSPITAL_ADMIN account.</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Admin Full Name *</label>
                                                        <div className="relative">
                                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                                                            <input 
                                                                type="text" placeholder="Aditya Sharma"
                                                                value={newHospital.admin_full_name} onChange={(e) => setNewHospital({...newHospital, admin_full_name: e.target.value})}
                                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-semibold transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Admin Phone *</label>
                                                        <div className="relative">
                                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                                                            <input 
                                                                type="text" placeholder="+91 99009 88123"
                                                                value={newHospital.admin_phone} onChange={(e) => setNewHospital({...newHospital, admin_phone: e.target.value})}
                                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-semibold transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Login Email *</label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                                                            <input 
                                                                type="email" placeholder="admin@domain.com"
                                                                name="hospital_admin_email_no_autofill"
                                                                autoComplete="off"
                                                                value={newHospital.admin_email} onChange={(e) => setNewHospital({...newHospital, admin_email: e.target.value})}
                                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-semibold transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2 mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                                                        <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">Admin Password Setup</p>
                                                            <p className="text-xs text-slate-500 mt-1">A secure setup link will be emailed to <span className="font-bold text-indigo-600">{newHospital.admin_email || 'the admin email'}</span> once onboarding is complete. They will set their own password.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3 */}
                                {onboardStep === 3 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        
                                        {/* Billing Cycle & Licensing */}
                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Billing Cycle *</label>
                                                <div className="flex gap-2">
                                                    {['Monthly', 'Yearly'].map(cycle => (
                                                        <button
                                                            key={cycle}
                                                            onClick={() => setNewHospital({ ...newHospital, billing_cycle: cycle })}
                                                            className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${newHospital.billing_cycle === cycle ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                                        >
                                                            {cycle}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Platform Base Price (₹) *</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                    <input type="text"
                                                        value={newHospital.platform_base_price}
                                                        onChange={(e) => setNewHospital({ ...newHospital, platform_base_price: e.target.value as any })}
                                                        className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-bold text-slate-800"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Included Users</label>
                                                <input type="text" disabled value="First 5 Users Free" className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Extra User Price (₹/user) *</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                    <input type="text"
                                                        value={newHospital.extra_user_price}
                                                        onChange={(e) => setNewHospital({ ...newHospital, extra_user_price: e.target.value as any })}
                                                        className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-bold text-slate-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <div className="space-y-1.5 md:col-span-2">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">MRD Service Type</label>
                                                <div className="relative">
                                                    <select
                                                        value={newHospital.mrd_service_type}
                                                        onChange={(e) => setNewHospital({...newHospital, mrd_service_type: e.target.value})}
                                                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm font-semibold shadow-sm"
                                                    >
                                                        <option value="PORTAL_ONLY">Portal Only (Self Storage)</option>
                                                        <option value="SCANNING_SUPPORT">Scanning Support (Digifort Scans)</option>
                                                        <option value="FULL_MANAGED">Fully Managed (Digifort Stores)</option>
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Price per MRD (₹)</label>
                                                <input 
                                                    type="text" 
                                                    value={newHospital.price_per_file}
                                                    onChange={(e) => setNewHospital({...newHospital, price_per_file: e.target.value as any})}
                                                    className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-black text-slate-900 shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Included Pages / File</label>
                                                <input 
                                                    type="text" 
                                                    value={newHospital.included_pages}
                                                    onChange={(e) => setNewHospital({...newHospital, included_pages: e.target.value as any})}
                                                    className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Extra Page Price (₹)</label>
                                                <input 
                                                    type="text" 
                                                    value={newHospital.price_per_extra_page}
                                                    onChange={(e) => setNewHospital({...newHospital, price_per_extra_page: e.target.value as any})}
                                                    className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Subscribed Modules Matrix</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
                                                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <div className={`p-2 rounded-xl border ${isEnabled ? 'bg-indigo-600 text-white border-transparent' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h5 className="font-black text-slate-900 text-xs">{opt.label}</h5>
                                                                <p className="text-xs text-slate-400 mt-0.5 leading-normal font-semibold">{opt.desc}</p>
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

                            {/* Sticky Footer */}
                            <div className="p-6 border-t border-slate-200 bg-white flex justify-between items-center rounded-br-[2rem]">
                                <button
                                    disabled={onboardStep === 1}
                                    onClick={() => setOnboardStep(prev => Math.max(1, prev - 1))}
                                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                                        onboardStep === 1 
                                            ? 'text-slate-300 bg-transparent opacity-50 cursor-not-allowed' 
                                            : 'text-slate-600 hover:bg-slate-100 active:scale-95'
                                    }`}
                                >
                                    Go Back
                                </button>

                                {onboardStep < 3 ? (
                                    <button
                                        onClick={() => setOnboardStep(prev => Math.min(3, prev + 1))}
                                        className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 active:scale-95 flex items-center gap-2"
                                    >
                                        Continue <Sparkles className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleOnboardSubmit}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 active:scale-95 flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Complete Onboarding
                                    </button>
                                )}
                            </div>
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
                                <p className="text-sm text-slate-400 mt-0.5">Editing: {editingHospital.legal_name}</p>
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
                                    className={`flex-1 text-center py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors focus:outline-none ${
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
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Legal Name</label>
                                            <input
                                                type="text"
                                                value={editingHospital.legal_name}
                                                onChange={(e) => setEditingHospital({...editingHospital, legal_name: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Subdomain</label>
                                            <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                                                <input
                                                    type="text"
                                                    value={editingHospital.hospital_slug || editingHospital.legal_name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                                                    onChange={(e) => setEditingHospital({...editingHospital, hospital_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                                                    className="flex-1 p-3 text-sm font-mono focus:outline-none bg-white"
                                                    placeholder="slug"
                                                />
                                                <span className="px-2 text-sm text-slate-400 bg-slate-50 border-l border-slate-200 whitespace-nowrap">{hostSuffix}</span>
                                            </div>
                                            <p className="text-xs text-amber-600">Changing this updates the hospital login URL</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Organization Type *</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Multi-Specialty Hospital', 'Single-Specialty Hospital', 'Polyclinic / Day Care Center', 'Diagnostic Center (Lab/Imaging)', 'Independent Doctor Clinic', 'Pharmacy / Medical Store'].map(type => (
                                                    <div 
                                                        key={type}
                                                        onClick={() => setEditingHospital({...editingHospital, organization_type: type, specialty: (SPECIALTY_OPTIONS[type] || defaultSpecialties)[0].value})}
                                                        className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${editingHospital.organization_type === type ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 font-semibold'} text-xs`}
                                                    >
                                                        {type}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Primary Specialty *</label>
                                            <div className="relative">
                                                <select
                                                    value={editingHospital.specialty || ''}
                                                    onChange={(e) => setEditingHospital({...editingHospital, specialty: e.target.value})}
                                                    className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm font-semibold shadow-sm"
                                                >
                                                    {(SPECIALTY_OPTIONS[editingHospital.organization_type || 'Multi-Specialty Hospital'] || defaultSpecialties).map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Director / CEO Name</label>
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
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">GST Registration Number</label>
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
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Contact Email</label>
                                            <input 
                                                type="email" 
                                                autoComplete="new-password"
                                                value={editingHospital.email}
                                                onChange={(e) => setEditingHospital({...editingHospital, email: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                                            <input 
                                                type="text" 
                                                value={editingHospital.phone || ''}
                                                onChange={(e) => setEditingHospital({...editingHospital, phone: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Address Details</label>
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
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Modify Enabled Modules</label>
                                        <p className="text-xs text-slate-400 leading-normal font-semibold">Toggling these parameters instantly updates client access authorizations across their custom subdomains.</p>
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
                                                        <p className="text-xs text-slate-400 mt-0.5 leading-normal font-semibold">{opt.desc}</p>
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
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Subscription Plan Tier</label>
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
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">MRD Service Type</label>
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
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Price per Patient MRD File (Patient ID)</label>
                                            <input 
                                                type="text" 
                                                value={editingHospital.price_per_file}
                                                onChange={(e) => setEditingHospital({...editingHospital, price_per_file: e.target.value as any})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Included Pages</label>
                                            <input 
                                                type="text" 
                                                value={editingHospital.included_pages}
                                                onChange={(e) => setEditingHospital({...editingHospital, included_pages: e.target.value as any})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Price per Extra Page (₹)</label>
                                            <input 
                                                type="text" 
                                                value={editingHospital.price_per_extra_page}
                                                onChange={(e) => setEditingHospital({...editingHospital, price_per_extra_page: e.target.value as any})}
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
                                <p className="text-sm text-amber-700/70 mt-0.5">Requested by {reviewHospital.legal_name}</p>
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
