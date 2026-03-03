"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Building2, Bed, UserPlus, Plus, Search } from 'lucide-react';

export default function HMSDashboard() {
    const [wards, setWards] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [stats, setStats] = useState({ total_wards: 0, total_beds: 0, occupied_beds: 0, admissions_today: 0 });
    const [loading, setLoading] = useState(true);
    const [showWardModal, setShowWardModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [wardsRes, admissionsRes] = await Promise.all([
                apiFetch('/hms/wards'),
                apiFetch('/hms/admissions')
            ]);
            setWards(wardsRes);
            setAdmissions(admissionsRes);
            
            const totalBeds = wardsRes.reduce((sum: number, w: any) => sum + (w.total_beds || 0), 0);
            const occupiedBeds = wardsRes.reduce((sum: number, w: any) => sum + (w.occupied_beds || 0), 0);
            
            setStats({
                total_wards: wardsRes.length,
                total_beds: totalBeds,
                occupied_beds: occupiedBeds,
                admissions_today: admissionsRes.filter((a: any) => a.status === 'admitted').length
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWard = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        
        try {
            await apiFetch('/hms/wards', {
                method: 'POST',
                body: JSON.stringify({
                    ward_name: formData.get('name'),
                    total_beds: parseInt(formData.get('beds') as string),
                    ward_type: formData.get('type')
                })
            });
            setShowWardModal(false);
            loadData();
        } catch (err) {
            alert('Failed to add ward');
        }
    };

    const filteredWards = wards.filter((w: any) => 
        w.ward_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Hospital Management System</h1>
                    <p className="text-slate-600">Manage wards, beds, and patient admissions</p>
                </div>
                <button onClick={() => setShowWardModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus size={20} /> Add Ward
                </button>
            </div>

            <div className="grid grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow">
                    <Building2 className="text-blue-600 mb-2" size={32} />
                    <p className="text-2xl font-bold">{stats.total_wards}</p>
                    <p className="text-slate-600">Total Wards</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <Bed className="text-green-600 mb-2" size={32} />
                    <p className="text-2xl font-bold">{stats.total_beds}</p>
                    <p className="text-slate-600">Total Beds</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <Bed className="text-orange-600 mb-2" size={32} />
                    <p className="text-2xl font-bold">{stats.occupied_beds}</p>
                    <p className="text-slate-600">Occupied Beds</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <UserPlus className="text-purple-600 mb-2" size={32} />
                    <p className="text-2xl font-bold">{stats.admissions_today}</p>
                    <p className="text-slate-600">Active Admissions</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Wards</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search wards..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {filteredWards.map((ward: any) => (
                        <div key={ward.ward_id} className="p-4 border rounded-lg hover:bg-slate-50">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-lg">{ward.ward_name}</p>
                                    <p className="text-sm text-slate-600">{ward.ward_type || 'General'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">{ward.occupied_beds || 0}/{ward.total_beds || 0}</p>
                                    <p className="text-xs text-slate-600">Beds Occupied</p>
                                </div>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${((ward.occupied_beds || 0) / (ward.total_beds || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showWardModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Add New Ward</h2>
                        <form onSubmit={handleAddWard} className="space-y-4">
                            <input name="name" placeholder="Ward Name" required className="w-full px-4 py-2 border rounded-lg" />
                            <input name="beds" type="number" placeholder="Total Beds" required className="w-full px-4 py-2 border rounded-lg" />
                            <select name="type" className="w-full px-4 py-2 border rounded-lg">
                                <option value="General">General</option>
                                <option value="ICU">ICU</option>
                                <option value="Private">Private</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Add Ward</button>
                                <button type="button" onClick={() => setShowWardModal(false)} className="flex-1 bg-slate-200 py-2 rounded-lg hover:bg-slate-300">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
