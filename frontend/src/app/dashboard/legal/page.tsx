"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Scale, Users, Briefcase, Calendar, Plus, Search } from 'lucide-react';

export default function LegalDashboard() {
    const [clients, setClients] = useState([]);
    const [cases, setCases] = useState([]);
    const [stats, setStats] = useState({ total_clients: 0, active_cases: 0, upcoming_hearings: 0 });
    const [loading, setLoading] = useState(true);
    const [showClientModal, setShowClientModal] = useState(false);
    const [showCaseModal, setShowCaseModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [clientsRes, casesRes] = await Promise.all([
                apiFetch('/legal/clients'),
                apiFetch('/legal/cases')
            ]);
            setClients(clientsRes);
            setCases(casesRes);
            setStats({
                total_clients: clientsRes.length,
                active_cases: casesRes.filter((c: any) => c.status === 'active').length,
                upcoming_hearings: 0
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        
        try {
            await apiFetch('/legal/clients', {
                method: 'POST',
                body: JSON.stringify({
                    client_type: 'Individual',
                    full_name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    address: formData.get('address')
                })
            });
            setShowClientModal(false);
            loadData();
        } catch (err) {
            alert('Failed to add client');
        }
    };

    const filteredClients = clients.filter((c: any) => 
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Legal Management</h1>
                    <p className="text-slate-600">Manage clients, cases, and hearings</p>
                </div>
                <button onClick={() => setShowClientModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus size={20} /> Add Client
                </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow">
                    <Users className="text-blue-600 mb-2" size={32} />
                    <p className="text-2xl font-bold">{stats.total_clients}</p>
                    <p className="text-slate-600">Total Clients</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <Briefcase className="text-green-600 mb-2" size={32} />
                    <p className="text-2xl font-bold">{stats.active_cases}</p>
                    <p className="text-slate-600">Active Cases</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <Calendar className="text-orange-600 mb-2" size={32} />
                    <p className="text-2xl font-bold">{stats.upcoming_hearings}</p>
                    <p className="text-slate-600">Upcoming Hearings</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Clients</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    {filteredClients.map((client: any) => (
                        <div key={client.client_id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-slate-50">
                            <div>
                                <p className="font-bold">{client.full_name}</p>
                                <p className="text-sm text-slate-600">{client.email} • {client.phone}</p>
                            </div>
                            <button className="text-blue-600 hover:underline">View Cases</button>
                        </div>
                    ))}
                </div>
            </div>

            {showClientModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Add New Client</h2>
                        <form onSubmit={handleAddClient} className="space-y-4">
                            <input name="name" placeholder="Client Name" required className="w-full px-4 py-2 border rounded-lg" />
                            <input name="email" type="email" placeholder="Email" required className="w-full px-4 py-2 border rounded-lg" />
                            <input name="phone" placeholder="Phone" required className="w-full px-4 py-2 border rounded-lg" />
                            <textarea name="address" placeholder="Address" className="w-full px-4 py-2 border rounded-lg" rows={3} />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Add Client</button>
                                <button type="button" onClick={() => setShowClientModal(false)} className="flex-1 bg-slate-200 py-2 rounded-lg hover:bg-slate-300">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
