"use client";

import React from 'react';
import { User, Shield, Building, MapPin, Globe, Fingerprint } from 'lucide-react';

interface AccountSettingsProps {
    userRole: string;
    profile: any;
    setProfile: (p: any) => void;
    passwordData: any;
    setPasswordData: (p: any) => void;
    handlePasswordChange: (e: React.FormEvent) => void;
    handleSaveProfile: () => void;
    mustChangePassword?: boolean;
}

export default function AccountSettings({
    userRole,
    profile,
    setProfile,
    passwordData,
    setPasswordData,
    handlePasswordChange,
    handleSaveProfile,
    mustChangePassword
}: AccountSettingsProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {mustChangePassword && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
                    <div className="bg-red-100 p-2 rounded-xl text-red-600 shrink-0">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-red-900 text-lg">Action Required: Change Password</h3>
                        <p className="text-red-700 text-sm mt-1 font-medium">For security reasons, you must update your temporary password before accessing other features.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Password Section */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                        <Shield className="text-indigo-600" /> Security Credentials
                    </h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Current Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                                value={passwordData.old}
                                onChange={e => setPasswordData({ ...passwordData, old: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                                    value={passwordData.new}
                                    onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Confirm New</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                                    value={passwordData.confirm}
                                    onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">
                            Update Security Key
                        </button>
                    </form>
                </div>

                {/* Hospital Profile (if Admin) */}
                {userRole === 'hospital_admin' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <Building className="text-indigo-600" /> Hospital Metadata
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Director Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                                    value={profile.director_name}
                                    onChange={e => setProfile({ ...profile, director_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">License Number</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium transition-all"
                                    value={profile.registration_number}
                                    onChange={e => setProfile({ ...profile, registration_number: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button onClick={handleSaveProfile} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                    Sync Profile
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Settings Section */}
            {userRole === 'hospital_admin' && (
                <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
                        <div className="lg:col-span-1">
                            <div className="bg-indigo-500/20 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                                <Globe className="text-white" size={32} />
                            </div>
                            <h2 className="text-3xl font-black tracking-tight mb-2">Intelligence Core</h2>
                            <p className="text-indigo-200 text-sm font-medium leading-relaxed">Power your medical records with Gemini 1.5 Pro for automatic ICD-11 extraction and clinical summaries.</p>
                        </div>
                        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h4 className="font-black text-lg">Extraction Engine</h4>
                                    <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider">Cloud Processing Mode</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={profile.ai_settings.enabled}
                                        onChange={(e) => setProfile((p: any) => ({ ...p, ai_settings: { ...p.ai_settings, enabled: e.target.checked } }))}
                                    />
                                    <div className="w-14 h-8 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>
                            
                            <div className={!profile.ai_settings.enabled ? 'opacity-30 grayscale pointer-events-none transition-all' : 'transition-all'}>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Google AI API Key</label>
                                <div className="relative">
                                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                                    <input
                                        type="password"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-400/50 font-mono text-sm tracking-widest"
                                        placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                                        value={profile.ai_settings.api_key}
                                        onChange={e => setProfile((p: any) => ({ ...p, ai_settings: { ...p.ai_settings, api_key: e.target.value } }))}
                                    />
                                </div>
                                <p className="text-[10px] text-indigo-400 mt-3 font-bold uppercase tracking-widest">⚠️ Key is encrypted and stored in your private vault.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
