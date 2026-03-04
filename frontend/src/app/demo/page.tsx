"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

export default function DemoRegistration() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        organization_name: '',
        target_module: 'mrd'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await apiFetch('/auth/register-demo', {
                method: 'POST',
                body: formData as any
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Registration failed');
            }

            alert('Demo account created! Check your email for login credentials.');
            router.push('/login');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Try Demo Account</h1>
                <p className="text-slate-600 mb-6">Experience DIGIFORT LABS instantly with a fully-featured, limited-time trial (100MB storage, 2 users).</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                        type="tel"
                        placeholder="Phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                        type="text"
                        placeholder="Organization Name"
                        required
                        value={formData.organization_name}
                        onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                    />

                    <select
                        value={formData.target_module}
                        onChange={(e) => setFormData({ ...formData, target_module: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg bg-white text-slate-700"
                        required
                    >
                        <option value="mrd">Medical Record Digitization (MRD)</option>
                        <option value="hms">Hospital Management System (HMS)</option>
                        <option value="clinic">Clinic OPD Management</option>
                        <option value="dental">Dental OPD Module</option>
                        <option value="ent">ENT OPD Module</option>
                        <option value="pharma">Pharma & Medical Store</option>
                        <option value="legal">Law Firm Management</option>
                        <option value="corporate">Corporate Management</option>
                    </select>

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Demo Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-600 mt-6">
                    Already have an account? <Link href="/login" className="text-blue-600 font-bold">Login</Link>
                </p>
            </div>
        </div>
    );
}
