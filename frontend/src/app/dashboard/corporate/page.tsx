"use client";

import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Clock, TrendingUp, Plus, Search, ChevronRight, CheckCircle, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';

export default function CorporateDashboard() {
    const router = useRouter();
    const [employees, setEmployees] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
    const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
    const [empForm, setEmpForm] = useState({ full_name: '', email: '', phone: '', department: '', designation: '', employment_type: 'Full-Time' });
    const [projForm, setProjForm] = useState({ project_name: '', client_name: '', status: 'active', start_date: '', end_date: '', budget: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [e, p] = await Promise.all([
                apiFetch('corporate/employees').catch(() => []),
                apiFetch('corporate/projects').catch(() => []),
            ]);
            setEmployees(e || []);
            setProjects(p || []);
        } finally { setLoading(false); }
    };

    const handleAddEmployee = async () => {
        try {
            await apiFetch('corporate/employees', { method: 'POST', body: JSON.stringify(empForm) });
            setIsAddEmployeeOpen(false);
            setEmpForm({ full_name: '', email: '', phone: '', department: '', designation: '', employment_type: 'Full-Time' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed'); }
    };

    const handleAddProject = async () => {
        try {
            await apiFetch('corporate/projects', { method: 'POST', body: JSON.stringify({ ...projForm, budget: parseFloat(projForm.budget) || 0 }) });
            setIsAddProjectOpen(false);
            setProjForm({ project_name: '', client_name: '', status: 'active', start_date: '', end_date: '', budget: '' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed'); }
    };

    const depts = [...new Set(employees.map(e => e.department).filter(Boolean))];
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const filtered = employees.filter(e =>
        e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { label: 'Total Employees', value: employees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Departments', value: depts.length, icon: Building, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Active Projects', value: activeProjects, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Total Projects', value: projects.length, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Building className="w-8 h-8 text-blue-600" /> Corporate Management
                    </h1>
                    <p className="text-slate-500 mt-1">Manage employees, projects, attendance, and tasks.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsAddEmployeeOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Employee
                    </Button>
                    <Button onClick={() => setIsAddProjectOpen(true)} variant="outline" className="gap-2">
                        <Briefcase className="w-4 h-4" /> New Project
                    </Button>
                    <Button onClick={() => router.push('/dashboard/corporate/attendance')} variant="outline" className="gap-2">
                        <Clock className="w-4 h-4" /> Attendance
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <Card key={i} className="border-slate-200/60 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{s.label}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '–' : s.value}</h3>
                                </div>
                                <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('w-5 h-5', s.color)} /></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Employees</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input placeholder="Search..." className="pl-9 bg-slate-50 border-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {loading ? <div className="p-8 text-center text-slate-500">Loading...</div>
                                    : filtered.length > 0 ? filtered.map(emp => (
                                        <div key={emp.employee_id} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer group transition-colors"
                                            onClick={() => router.push('/dashboard/corporate/attendance')}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {emp.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{emp.full_name}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{emp.designation || 'Staff'} {emp.department ? `• ${emp.department}` : ''}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className="text-xs border-none bg-emerald-100 text-emerald-700">{emp.employment_type || 'Full-Time'}</Badge>
                                                <ChevronRight className="w-4 h-4 text-slate-300" />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-slate-400">
                                            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p>No employees yet.</p>
                                        </div>
                                    )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-600" /> Projects</CardTitle>
                                <Button variant="ghost" size="sm" className="text-blue-600 text-xs" onClick={() => router.push('/dashboard/corporate/projects')}>View all</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {projects.slice(0, 4).map(p => (
                                <div key={p.project_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{p.project_name}</p>
                                        <p className="text-xs text-slate-500">{p.client_name || 'Internal'}</p>
                                    </div>
                                    <Badge className={cn('text-xs border-none', p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                                        {p.status}
                                    </Badge>
                                </div>
                            ))}
                            {projects.length === 0 && <p className="text-sm text-slate-400 text-center py-2">No projects yet.</p>}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {[
                                { label: 'Attendance', icon: Clock, path: '/dashboard/corporate/attendance', color: 'text-blue-600 bg-blue-50' },
                                { label: 'Projects', icon: Briefcase, path: '/dashboard/corporate/projects', color: 'text-emerald-600 bg-emerald-50' },
                                { label: 'Task Board', icon: CheckCircle, path: '/dashboard/corporate/tasks', color: 'text-purple-600 bg-purple-50' },
                            ].map(a => (
                                <button key={a.label} onClick={() => router.push(a.path)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                                    <div className={cn('p-2 rounded-lg', a.color.split(' ')[1])}><a.icon className={cn('w-4 h-4', a.color.split(' ')[0])} /></div>
                                    <span className="text-sm font-medium text-slate-700">{a.label}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Full Name *</Label>
                            <Input placeholder="Employee name" value={empForm.full_name} onChange={e => setEmpForm({ ...empForm, full_name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Phone</Label><Input placeholder="Phone" value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Email</Label><Input placeholder="Email" type="email" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Department</Label><Input placeholder="e.g., Engineering" value={empForm.department} onChange={e => setEmpForm({ ...empForm, department: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Designation</Label><Input placeholder="e.g., Manager" value={empForm.designation} onChange={e => setEmpForm({ ...empForm, designation: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Employment Type</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={empForm.employment_type} onChange={e => setEmpForm({ ...empForm, employment_type: e.target.value })}>
                                <option>Full-Time</option><option>Part-Time</option><option>Contract</option><option>Intern</option>
                            </select></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddEmployee} disabled={!empForm.full_name} className="bg-blue-600">Add Employee</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Project Name *</Label>
                            <Input placeholder="Project name" value={projForm.project_name} onChange={e => setProjForm({ ...projForm, project_name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Client</Label><Input placeholder="Client name" value={projForm.client_name} onChange={e => setProjForm({ ...projForm, client_name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Budget (₹)</Label><Input placeholder="0" type="number" value={projForm.budget} onChange={e => setProjForm({ ...projForm, budget: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={projForm.start_date} onChange={e => setProjForm({ ...projForm, start_date: e.target.value })} /></div>
                            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={projForm.end_date} onChange={e => setProjForm({ ...projForm, end_date: e.target.value })} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddProjectOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddProject} disabled={!projForm.project_name} className="bg-blue-600">Create Project</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
