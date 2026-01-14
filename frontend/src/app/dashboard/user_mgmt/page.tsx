"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../config/api';

interface User {
    user_id: number;
    email: string;
    role: string;
}



export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'mrd_staff' });
    const [currentUserRole, setCurrentUserRole] = useState('');
    const [hospitalInfo, setHospitalInfo] = useState<any>(null);
    const [planLimits] = useState({ 'Standard': 2, 'Premium': 5, 'Enterprise': 10 });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Basic Role Check
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserRole(payload.role);
        if (payload.role !== 'hospital_admin' && payload.role !== 'website_admin') {
            alert("Unauthorized Access");
            router.push('/dashboard');
            return;
        }

        fetchUsers(token);
        fetchHospitalPlan(token);
    }, [router]);

    const fetchHospitalPlan = async (token: string) => {
        const apiUrl = API_URL;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const res = await fetch(`${apiUrl}/hospitals/${payload.hospital_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setHospitalInfo(await res.json());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUsers = async (token: string) => {
        const apiUrl = API_URL;
        try {
            const res = await fetch(`${apiUrl}/users/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateUser = async () => {
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
                body: JSON.stringify(newUser)
            });

            if (res.ok) {
                setShowModal(false);
                setNewUser({ email: '', password: '', role: 'mrd_staff' });
                fetchUsers(token);
                alert("User Created Successfully!");
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail}`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    return (
        <div className="flex-1 p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
                    {hospitalInfo && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">
                                Subscription: <span className="font-bold text-indigo-600">{hospitalInfo.subscription_tier}</span>
                            </span>
                            <span className="text-sm font-medium text-gray-400">•</span>
                            <span className={`text-sm font-bold ${users.length >= planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits] ? 'text-red-500' : 'text-gray-600'}`}>
                                {users.length} / {planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits]} Seats Used
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex gap-4 items-center">
                    {hospitalInfo && users.length >= planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits] && (
                        <Link href="/dashboard/settings" className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded hover:bg-indigo-100 transition">
                            🚀 Upgrade Plan
                        </Link>
                    )}
                    <button
                        onClick={() => setShowModal(true)}
                        disabled={hospitalInfo && users.length >= planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits]}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${hospitalInfo && users.length >= planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits]
                            ? 'bg-amber-100 text-amber-700 cursor-default border border-amber-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {hospitalInfo && users.length >= planLimits[hospitalInfo.subscription_tier as keyof typeof planLimits]
                            ? '📞 Contact Sales to Add'
                            : '+ Add Member'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                        <tr>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Password</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {users.map((u) => (
                            <tr key={u.user_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{u.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${u.role === 'hospital_admin' ? 'bg-purple-100 text-purple-700' :
                                            u.role === 'data_uploader' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {u.role.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400">••••••••</td>
                                <td className="px-6 py-4 text-green-600">Active</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {/* Add User Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
                            <h2 className="text-xl font-bold mb-4">Add New Team Member</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border border-gray-300 rounded-md p-2 mt-1"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        className="w-full border border-gray-300 rounded-md p-2 mt-1"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-md p-2 mt-1"
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="mrd_staff">MRD Staff (Warehouse Only)</option>
                                        <option value="data_uploader">Data Uploader (Records Only)</option>
                                        <option value="hospital_admin">Hospital Admin (Full Access)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateUser}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Create Account
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
