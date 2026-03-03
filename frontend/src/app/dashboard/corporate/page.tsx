"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Users, Briefcase, Calendar, Plus, Search } from 'lucide-react';

export default function CorporateDashboard() {
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState({ total_employees: 0, active_projects: 0, attendance_today: 0 });
    const [loading, setLoading] = useState(true);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [employeesRes, projectsRes] = await Promise.all([
                apiFetch('/corporate/employees'),
                apiFetch('/corporate/projects')
            ]);
            setEmployees(employeesRes);
            setProjects(projectsRes);
            setStats({
                total_employees: employeesRes.length,
                active_projects: projectsRes.filter((p: any) => p.status === 'active').length,
                attendance_today: 0
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        
        try {
            await apiFetch('/corporate/employees', {
                method: 'POST',
                body: JSON.stringify({
                    full_name: formData.get('name'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    department: formData.get('department'),
                    designation: formData.get('position')
                })
            });
            setShowEmployeeModal(false);
            loadData();
        } catch (err) {
            alert('Failed to add employee');
        }
    };

    const filteredEmployees = employees.filter((e: any) => 
        e.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Corporate Management</h1>
                    <p className="text-slate-600">Manage employees, projects, and attendance</p>
                </div>
                <button onClick={() => setShowEmployeeModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    <Plus size={20} /> Add Employee
                </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow">
                    <Users className="text-blue-600 mb-2" size={32} />
                    <p className="text-2xl font-bold">{stats.total_employees}</p>
                    <p className="text-slate-600">Total Employees</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <Briefcase className="text-green-600 mb-2" size={32} />
                    <p className="text-2xl font-bold">{stats.active_projects}</p>
                    <p className="text-slate-600">Active Projects</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                    <Calendar className="text-orange-600 mb-2" size={32} />
                    <p className="text-2xl font-bold">{stats.attendance_today}</p>
                    <p className="text-slate-600">Present Today</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Employees</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    {filteredEmployees.map((employee: any) => (
                        <div key={employee.employee_id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-slate-50">
                            <div>
                                <p className="font-bold">{employee.full_name}</p>
                                <p className="text-sm text-slate-600">{employee.department} • {employee.designation}</p>
                            </div>
                            <button className="text-blue-600 hover:underline">View Details</button>
                        </div>
                    ))}
                </div>
            </div>

            {showEmployeeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Add New Employee</h2>
                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <input name="name" placeholder="Employee Name" required className="w-full px-4 py-2 border rounded-lg" />
                            <input name="email" type="email" placeholder="Email" required className="w-full px-4 py-2 border rounded-lg" />
                            <input name="phone" placeholder="Phone" required className="w-full px-4 py-2 border rounded-lg" />
                            <input name="department" placeholder="Department" required className="w-full px-4 py-2 border rounded-lg" />
                            <input name="position" placeholder="Position" required className="w-full px-4 py-2 border rounded-lg" />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Add Employee</button>
                                <button type="button" onClick={() => setShowEmployeeModal(false)} className="flex-1 bg-slate-200 py-2 rounded-lg hover:bg-slate-300">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
