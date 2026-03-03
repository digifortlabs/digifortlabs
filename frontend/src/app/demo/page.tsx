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
        organization_name: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await apiFetch('/auth/register-demo', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
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
                <p className="text-slate-600 mb-6">Get instant access with limited storage (100MB)</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                        type="tel"
                        placeholder="Phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg"
                    />
                    <input
                        type="text"
                        placeholder="Organization Name"
                        required
                        value={formData.organization_name}
                        onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
                        className="w-full px-4 py-3 border rounded-lg"
                    />

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
