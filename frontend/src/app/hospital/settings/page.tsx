"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/config/api';
import { 
    User as UserIcon, 
    Settings as SettingsIcon, 
    Users, 
    Shield, 
    Activity, 
    LayoutDashboard,
    Loader2
} from 'lucide-react';

// Components
import CompanyProfileSettings from './components/CompanyProfileSettings';
import LoginActivityPanel from './components/LoginActivityPanel';
import AccountSettings from './components/AccountSettings';
import PlatformConfig from './components/PlatformConfig';
import DepartmentSettings from './components/DepartmentSettings';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('account');
    
    // Core State
    const [profile, setProfile] = useState({
        legal_name: '',
        director_name: '',
        registration_number: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        certifications: [] as any[],
        important_documents: [] as any[],
        hospital_slug: '',
        terminology: { logo_url: '' } as any,
        ai_settings: { enabled: false, api_key: '' }
    });
    const [hospitalId, setHospitalId] = useState<number | null>(null);
    const [userRole, setUserRole] = useState('');
    const [systemSettings, setSystemSettings] = useState({ maintenance_mode: 'false', announcement: '', platform_ai_settings: '{"enabled":false,"api_key":""}' });
    const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' });
    const [platformStaff, setPlatformStaff] = useState<any[]>([]);
    const [mustChangePassword, setMustChangePassword] = useState(false);

    // Platform Utilities State
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrStats, setOcrStats] = useState({ pending: 0, analyzing: 0, completed: 0 });
    const [ocrLogs, setOcrLogs] = useState<string[]>([]);
    const [systemErrors, setSystemErrors] = useState<any[]>([]);
    const [loadingErrors, setLoadingErrors] = useState(false);

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole') || '';
        const storedHospitalId = localStorage.getItem('hospital_id') ? parseInt(localStorage.getItem('hospital_id') as string) : null;
        
        if (!storedRole) {
            router.push('/login');
            return;
        }

        setUserRole(storedRole);
        setHospitalId(storedHospitalId);

        if (storedRole !== 'website_admin' && storedHospitalId) {
            fetchProfile(storedHospitalId);
        }
        
        if (['website_admin', 'superadmin'].includes(storedRole)) {
            fetchPlatformStaff();
            fetchSystemSettings();
            fetchOcrStats();
            fetchSystemErrors();
        }

        if (localStorage.getItem('force_password_change') === 'true') {
            setMustChangePassword(true);
        }
    }, []);

    // API Handlers (Simplified for brevity in wrapper)
    const fetchProfile = async (id: number) => {
        try {
            const data = await apiFetch(`hospitals/${id}`);
            if (data) setProfile({
                legal_name: data.legal_name || '',
                director_name: data.director_name || '',
                registration_number: data.registration_number || '',
                address: data.address || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
                phone: data.phone || '',
                email: data.email || '',
                certifications: data.certifications || [],
                important_documents: data.important_documents || [],
                hospital_slug: data.hospital_slug || '',
                terminology: data.terminology || { logo_url: '' },
                ai_settings: data.ai_settings || { enabled: false, api_key: '' }
            });
        } catch (e) { console.error(e); }
    };

    const fetchSystemSettings = async () => {
        try {
            const data = await apiFetch(`platform/settings`);
            if (data) setSystemSettings({
                maintenance_mode: data.maintenance_mode || 'false',
                announcement: data.announcement || '',
                platform_ai_settings: data.platform_ai_settings || '{"enabled":false,"api_key":""}'
            });
        } catch (e) { console.error(e); }
    };

    const updateSystemSetting = async (key: string, value: string) => {
        try {
            await apiFetch(`platform/settings/${key}`, { method: 'POST', body: JSON.stringify({ value }) });
            setSystemSettings(prev => ({ ...prev, [key]: value }));
        } catch (e) { toast.error("Failed to update setting"); }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) return toast.error("Passwords mismatch");
        try {
            await apiFetch(`users/change-password`, { method: 'POST', body: JSON.stringify({ old_password: passwordData.old, new_password: passwordData.new }) });
            toast.success("Success! Re-login required.");
            localStorage.clear();
            router.push('/login');
        } catch (e: any) { toast.error(e.message); }
    };

    const handleSaveProfile = async () => {
        if (!hospitalId) return;
        try {
            await apiFetch(`hospitals/${hospitalId}`, { method: 'PATCH', body: JSON.stringify(profile) });
            toast.error("Profile synced.");
        } catch (e) { toast.error("Update failed"); }
    };

    const fetchPlatformStaff = async () => {
        try {
            const users = await apiFetch(`users/`);
            if (users) setPlatformStaff(users.filter((u: any) => u.role === 'superadmin_staff'));
        } catch (e) { console.error(e); }
    };

    const fetchOcrStats = async () => {
        try {
            const data = await apiFetch(`platform/ocr-status`);
            if (data) setOcrStats({ pending: data.pending_ocr, analyzing: data.analyzing, completed: data.completed_ocr });
            const logs = await apiFetch(`platform/ocr-logs`);
            if (logs) setOcrLogs(logs.logs || []);
        } catch (e) { console.error(e); }
    };

    const runBulkOCR = async () => {
        setOcrLoading(true);
        try {
            await apiFetch(`platform/bulk-ocr?limit=50`, { method: 'POST' });
            fetchOcrStats();
        } catch (e) { console.error(e); }
        finally { setOcrLoading(false); }
    };

    const fetchSystemErrors = async () => {
        setLoadingErrors(true);
        try {
            const data = await apiFetch(`platform/system-error-logs`);
            if (data) setSystemErrors(data);
        } catch (e) { console.error(e); }
        finally { setLoadingErrors(false); }
    };

    const isPlatformAdmin = ['website_admin', 'superadmin'].includes(userRole);

    return (
        <div className="px-4 sm:px-6 pb-20 pt-4 w-full mx-auto min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <SettingsIcon className="text-indigo-600 w-6 h-6" /> 
                    System Control
                </h1>
                <p className="text-slate-500 font-semibold text-xs mt-1">Manage your credentials, platform configuration, and system logs.</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl border border-slate-200/40 w-fit">
                <button
                    onClick={() => setActiveTab('account')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                        activeTab === 'account' 
                            ? 'bg-white text-slate-950 shadow-xs border border-slate-200/20' 
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <UserIcon size={13} /> Account
                </button>
                
                <button
                    onClick={() => setActiveTab('departments')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                        activeTab === 'departments' 
                            ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/20' 
                            : 'text-slate-500 hover:text-indigo-600'
                    }`}
                >
                    <LayoutDashboard size={13} /> Departments
                </button>
                
                {isPlatformAdmin && (
                    <button
                        onClick={() => setActiveTab('platform')}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                            activeTab === 'platform' 
                                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/20' 
                                : 'text-slate-500 hover:text-indigo-600'
                        }`}
                    >
                        <Shield size={13} /> Platform
                    </button>
                )}

                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                        activeTab === 'security' 
                            ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/20' 
                            : 'text-slate-500 hover:text-emerald-600'
                    }`}
                >
                    <Activity size={13} /> Activity & Logs
                </button>
            </div>

            {/* Tab Content */}
            <div className="max-w-6xl">
                {activeTab === 'account' && (
                    <AccountSettings 
                        userRole={userRole}
                        profile={profile}
                        setProfile={setProfile}
                        passwordData={passwordData}
                        setPasswordData={setPasswordData}
                        handlePasswordChange={handlePasswordChange}
                        handleSaveProfile={handleSaveProfile}
                        mustChangePassword={mustChangePassword}
                    />
                )}

                {activeTab === 'departments' && (
                    <DepartmentSettings />
                )}

                {activeTab === 'platform' && isPlatformAdmin && (
                    <PlatformConfig 
                        systemSettings={systemSettings}
                        setSystemSettings={setSystemSettings}
                        updateSystemSetting={updateSystemSetting}
                        runBulkOCR={runBulkOCR}
                        ocrLoading={ocrLoading}
                        ocrStats={ocrStats}
                        ocrLogs={ocrLogs}
                        systemErrors={systemErrors}
                        loadingErrors={loadingErrors}
                        fetchSystemErrors={fetchSystemErrors}
                    />
                )}

                {activeTab === 'security' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {isPlatformAdmin && <CompanyProfileSettings />}
                        <LoginActivityPanel />
                    </div>
                )}
            </div>
        </div>
    );
}
