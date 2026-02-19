"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_URL } from '../../../config/api';

import { Loader2 } from 'lucide-react';
import CompanyProfileSettings from './components/CompanyProfileSettings';
import LoginActivityPanel from './components/LoginActivityPanel';

export default function SettingsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState({
        director_name: '',
        registration_number: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [subscription, setSubscription] = useState({
        tier: 'Standard',
        is_active: true
    });
    const [hospitalId, setHospitalId] = useState<number | null>(null);
    const [userRole, setUserRole] = useState('');
    const [systemSettings, setSystemSettings] = useState({ maintenance_mode: 'false', announcement: '' });
    const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' });
    const [platformStaff, setPlatformStaff] = useState<any[]>([]);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showEditStaffModal, setShowEditStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [editStaffData, setEditStaffData] = useState({ password: '' });
    const [newStaff, setNewStaff] = useState({ email: '', password: '' });
    const [mustChangePassword, setMustChangePassword] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
                setHospitalId(payload.hospital_id);

                if (payload.role !== 'website_admin' && payload.hospital_id) {
                    fetchProfile(payload.hospital_id, token);
                }
                if (['website_admin', 'superadmin'].includes(payload.role)) {
                    fetchPlatformStaff(token);
                    fetchSystemSettings(token);
                }
                if (payload.force_password_change) {
                    setMustChangePassword(true);
                }
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('token');
                router.push('/login');
            }
        }
    }, []);

    const fetchSystemSettings = async (token: string) => {
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/platform/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSystemSettings({
                    maintenance_mode: data.maintenance_mode || 'false',
                    announcement: data.announcement || ''
                });
            }
        } catch (error) { console.error(error); }
    };

    const updateSystemSetting = async (key: string, value: string) => {
        const token = localStorage.getItem('token');
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/platform/settings/${key}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ value })
            });
            if (res.ok) {
                setSystemSettings(prev => ({ ...prev, [key]: value }));
                // No alert for silent success or maybe a small toast?
            } else {
                alert("Failed to update system setting.");
            }
        } catch (error) {
            console.error(error);
            alert("Connection error while updating settings.");
        }
    };

    // Bulk OCR Logic
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrStats, setOcrStats] = useState({ pending: 0, analyzing: 0, completed: 0 });
    const [ocrLogs, setOcrLogs] = useState<string[]>([]);

    const fetchOcrStats = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/platform/ocr-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOcrStats({
                    pending: data.pending_ocr,
                    analyzing: data.analyzing,
                    completed: data.completed_ocr
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchOcrLogs = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/platform/ocr-logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOcrLogs(data.logs || []);
            }
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if (['website_admin', 'superadmin'].includes(userRole)) {
            fetchOcrStats();
            fetchOcrLogs();
            const interval = setInterval(() => {
                fetchOcrStats();
                fetchOcrLogs();
            }, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
        }
    }, [userRole]);

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
                // No alert, rely on stats update
                // alert(data.message);
                fetchOcrStats();
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

    const fetchPlatformStaff = async (token: string) => {
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/users/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const allUsers = await res.json();
                setPlatformStaff(allUsers.filter((u: any) => u.role === 'superadmin_staff'));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiUrl = API_URL;
            const res = await fetch(`${apiUrl}/users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    email: newStaff.email,
                    password: newStaff.password,
                    role: 'superadmin_staff'
                })
            });

            if (res.ok) {
                alert("Platform Staff created successfully!");
                setShowStaffModal(false);
                setNewStaff({ email: '', password: '' });
                fetchPlatformStaff(token);
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to create staff");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token || !editingStaff) return;

        try {
            const apiUrl = API_URL;
            const body: any = {};
            // Only send password if provided
            if (editStaffData.password) {
                body.password = editStaffData.password;
            } else {
                alert("Please enter a new password to update.");
                return;
            }

            const res = await fetch(`${apiUrl}/users/${editingStaff.user_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                alert("Staff updated successfully!");
                setShowEditStaffModal(false);
                setEditingStaff(null);
                setEditStaffData({ password: '' });
                fetchPlatformStaff(token);
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to update staff");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteStaff = async (staffId: number) => {
        if (!confirm("Are you sure you want to permanently delete this staff member? This action cannot be undone.")) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiUrl = API_URL;
            const res = await fetch(`${apiUrl}/users/${staffId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                alert("Staff member deleted successfully.");
                fetchPlatformStaff(token);
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to delete staff");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openEditModal = (staff: any) => {
        setEditingStaff(staff);
        setEditStaffData({ password: '' });
        setShowEditStaffModal(true);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            alert("New passwords do not match!");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const apiUrl = API_URL;
            const res = await fetch(`${apiUrl}/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    old_password: passwordData.old,
                    new_password: passwordData.new
                })
            });

            if (res.ok) {
                alert("Password changed successfully! You will now be logged out to re-authenticate.");
                localStorage.removeItem('token');
                router.push('/login');
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to change password");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchProfile = async (id: number, token: string) => {
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/hospitals/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile({
                    director_name: data.director_name || '',
                    registration_number: data.registration_number || '',
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    pincode: data.pincode || ''
                });
                setSubscription({
                    tier: data.subscription_tier || 'Standard',
                    is_active: data.is_active !== false
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token || !hospitalId) return;

        try {
            const apiUrl = API_URL;
            const res = await fetch(`${apiUrl}/hospitals/${hospitalId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(profile)
            });

            if (res.ok) {
                alert("Client Profile Updated Successfully!");
            } else {
                alert("Failed to update profile.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex-1 px-8 pt-0">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Settings</h1>

            {mustChangePassword && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-xl">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-red-800">Password Update Required</h3>
                            <p className="text-sm text-red-700 mt-1">
                                Since this is your first login (or requested by admin), you must change your temporary password to continue accessing the dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Hospital Profile Form (Visible ONLY to Hospital Admins) */}
            {userRole === 'hospital_admin' && (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mb-6">
                        <h2 className="text-lg font-semibold mb-4 text-indigo-700">🏥 Client Profile & Compliance</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Client Director / Owner Name</label>
                                <input type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={profile.director_name} onChange={e => setProfile({ ...profile, director_name: e.target.value })}
                                    placeholder="Dr. John Doe"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Registration / License Number</label>
                                <input type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={profile.registration_number} onChange={e => setProfile({ ...profile, registration_number: e.target.value })}
                                    placeholder="REG-2024-XXXX"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Address Line</label>
                                <input type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">State</label>
                                <input type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                                <input type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                    value={profile.pincode} onChange={e => setProfile({ ...profile, pincode: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSaveProfile} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Save Profile</button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mb-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-slate-800">💎 Plan & Subscription</h2>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                {subscription.tier} Plan
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Current Plan Features</h3>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-slate-700">
                                        <span className="text-green-500 font-bold">✓</span>
                                        {subscription.tier === 'Standard' ? '2 User Seats' : subscription.tier === 'Premium' ? '5 User Seats' : '10 User Seats'}
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-700">
                                        <span className="text-green-500 font-bold">✓</span>
                                        {subscription.tier === 'Standard' ? '100GB Storage' : subscription.tier === 'Premium' ? '500GB Storage' : 'Priority Global Support'}
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                                        <span className="text-blue-500">✨</span> Cloud Digitization Active
                                    </li>
                                </ul>
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                                    <p className="text-sm font-bold text-slate-800 mb-1">
                                        {subscription.tier === 'Enterprise' ? 'Scale Further? 🚀' : 'Need More?'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mb-3">
                                        {subscription.tier === 'Enterprise'
                                            ? 'For 10+ users or custom SLA, reach out to us.'
                                            : 'Upgrade for more seats and AI features.'}
                                    </p>
                                    <button className="w-full bg-slate-900 text-white py-2 rounded-md font-bold text-sm hover:bg-slate-800 transition">
                                        Contact Sales
                                    </button>
                                    <p className="text-[9px] text-gray-400 mt-2">Support: sales@dizivault.com</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Platform Settings (Visible ONLY to Super Admin) */}
            {/* Platform Settings (Visible ONLY to Super Admin) */}
            {['website_admin', 'superadmin'].includes(userRole) && (
                <div className="bg-indigo-50 rounded-lg shadow-sm border border-indigo-100 p-6 max-w-2xl mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <span className="text-2xl">⚙️</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-indigo-900">Platform Configuration</h2>
                            <p className="text-xs text-indigo-700">Global settings affecting all tenants.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white p-4 rounded border border-indigo-100">
                            <div>
                                <p className="font-medium text-gray-800">System Maintenance Mode</p>
                                <p className="text-xs text-gray-500">Prevent logins during updates.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={systemSettings.maintenance_mode === 'true'}
                                    onChange={(e) => updateSystemSetting('maintenance_mode', e.target.checked ? 'true' : 'false')}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                        </div>

                        <div className="bg-white p-4 rounded border border-indigo-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Global Announcement Banner</label>
                            <input
                                type="text"
                                className="w-full border rounded p-2 text-sm"
                                placeholder="e.g. Scheduled downtime on Sunday..."
                                value={systemSettings.announcement}
                                onChange={(e) => setSystemSettings({ ...systemSettings, announcement: e.target.value })}
                                onBlur={(e) => updateSystemSetting('announcement', e.target.value)}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Changes are saved automatically on blur.</p>
                        </div>
                    </div>

                    <div className="mt-4 bg-white p-4 rounded border border-indigo-100">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <p className="font-medium text-gray-800">Bulk OCR Utility</p>
                                <p className="text-xs text-gray-500">Scan 50 old files for data extraction.</p>
                                {(ocrStats.analyzing > 0 || ocrStats.pending > 0) && (
                                    <p className="text-xs font-bold text-indigo-600 mt-1">
                                        Processing: {ocrStats.analyzing} | Pending: {ocrStats.pending} | Completed: {ocrStats.completed}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={runBulkOCR}
                                disabled={ocrLoading || ocrStats.analyzing > 0}
                                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {ocrLoading && <Loader2 className="animate-spin" size={16} />}
                                {ocrStats.analyzing > 0 ? 'Processing...' : 'Run Batch'}
                            </button>
                        </div>

                        {/* CLI Log Viewer */}
                        {(ocrStats.analyzing > 0 || ocrLogs.length > 0) && (
                            <div className="bg-black text-green-400 font-mono text-xs p-3 rounded h-48 overflow-y-auto whitespace-pre-wrap">
                                {ocrLogs.length > 0 ? ocrLogs.join('\n') : '> Waiting for logs...'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Platform Company Profile (Visible ONLY to Super Admin) */}
            {['website_admin', 'superadmin'].includes(userRole) && (
                <CompanyProfileSettings />
            )}

            {/* Login Activity (Visible to Admins) */}
            {['website_admin', 'superadmin', 'hospital_admin'].includes(userRole) && (
                <LoginActivityPanel />
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mb-6">
                <h2 className="text-lg font-semibold mb-4">Account Security</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Old Password</label>
                        <input
                            type="password"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            value={passwordData.old}
                            onChange={e => setPasswordData({ ...passwordData, old: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                            <input
                                type="password"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                value={passwordData.new}
                                onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                                value={passwordData.confirm}
                                onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 font-medium">Update Password</button>
                    </div>
                </form>
            </div>

            {
                ['website_admin', 'superadmin'].includes(userRole) && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">🔧 Manage Platform Staff</h2>
                            <button
                                onClick={() => setShowStaffModal(true)}
                                className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-indigo-700"
                            >
                                + Add Platform Staff
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">Staff members who can access and process digitizations for all hospitals.</p>

                        <div className="space-y-2">
                            {platformStaff.length > 0 ? platformStaff.map((staff, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">{staff.email}</span>
                                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">Platform Staff</span>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => openEditModal(staff)}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStaff(staff.user_id)}
                                            className="text-xs text-red-600 hover:text-red-800 font-semibold"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-gray-400 py-4 text-sm">No platform staff created yet.</p>
                            )}
                        </div>
                    </div>
                )
            }

            {
                showStaffModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                            <h2 className="text-xl font-bold mb-4 text-indigo-700">Add Platform Scanning Staff</h2>
                            <form onSubmit={handleCreateStaff}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Email</label>
                                    <input required type="email" className="w-full border rounded p-2"
                                        value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                        placeholder="scanning.staff@dizivault.com"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                                    <input required type="text" className="w-full border rounded p-2"
                                        value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowStaffModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold">Create Staff Account</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {
                showEditStaffModal && editingStaff && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                            <h2 className="text-xl font-bold mb-4 text-indigo-700">Edit Staff: {editingStaff.email}</h2>
                            <form onSubmit={handleUpdateStaff}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password (Reset)</label>
                                    <input required type="text" className="w-full border rounded p-2"
                                        value={editStaffData.password} onChange={e => setEditStaffData({ ...editStaffData, password: e.target.value })}
                                        placeholder="Enter new password"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Updates the user's password immediately.</p>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setShowEditStaffModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold">Update Staff</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl mt-6">
                <h2 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h2>
                <p className="text-sm text-gray-600 mb-4">Clear all local cache and reset default views.</p>
                <button className="border border-red-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-50">Reset Dashboard</button>
            </div>
        </div >

    );
}
