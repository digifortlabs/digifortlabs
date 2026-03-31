"use client";

import React, { useState, useEffect } from 'react';
import { Briefcase, ChevronLeft, Plus, Search, DollarSign, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    on_hold: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-slate-100 text-slate-600',
};

export default function CorporateProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [form, setForm] = useState({ project_name: '', client_name: '', description: '', budget: '', start_date: '', end_date: '', status: 'active', manager_id: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [p, e] = await Promise.all([
                apiFetch('corporate/projects').catch(() => []),
                apiFetch('corporate/employees').catch(() => []),
            ]);
            setProjects(p || []);
            setEmployees(e || []);
        } finally { setLoading(false); }
    };

    const handleAdd = async () => {
        try {
            await apiFetch('corporate/projects', { method: 'POST', body: JSON.stringify({ ...form, budget: parseFloat(form.budget) || 0, manager_id: form.manager_id ? parseInt(form.manager_id) : undefined }) });
            setIsAddOpen(false);
            setForm({ project_name: '', client_name: '', description: '', budget: '', start_date: '', end_date: '', status: 'active', manager_id: '' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed'); }
    };

    const filtered = projects.filter(p => {
        const matchSearch = p.project_name?.toLowerCase().includes(search.toLowerCase()) || p.client_name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getManagerName = (id: number) => employees.find(e => e.employee_id === id)?.full_name || '';

    const getDuration = (start: string, end: string) => {
        if (!start) return '';
        const s = new Date(start);
        const e = end ? new Date(end) : new Date();
        const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
        return days < 30 ? `${days}d` : `${Math.round(days / 30)}mo`;
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/corporate')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Briefcase className="w-6 h-6 text-emerald-600" /> Projects</h1>
                        <p className="text-slate-500 text-sm">{projects.filter(p => p.status === 'active').length} active projects.</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" /> New Project
                </Button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search projects..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'completed', 'on_hold', 'cancelled'].map(s => (
                        <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'}
                            className={cn('capitalize text-xs', statusFilter === s ? 'bg-emerald-600' : '')}
                            onClick={() => setStatusFilter(s)}>
                            {s.replace('_', ' ')}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? <div className="col-span-3 p-12 text-center text-slate-500">Loading...</div>
                    : filtered.length === 0 ? (
                        <Card className="col-span-3 border-slate-200/60">
                            <CardContent className="p-12 text-center">
                                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="font-semibold text-slate-900">No projects found</h3>
                                <Button onClick={() => setIsAddOpen(true)} className="mt-4 bg-emerald-600">Create First Project</Button>
                            </CardContent>
                        </Card>
                    ) : filtered.map(p => (
                        <Card key={p.project_id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 truncate">{p.project_name}</h3>
                                        {p.client_name && <p className="text-sm text-slate-500 mt-0.5">{p.client_name}</p>}
                                    </div>
                                    <Badge className={cn('text-xs border-none ml-2 flex-shrink-0', STATUS_COLORS[p.status] || 'bg-slate-100')}>
                                        {p.status?.replace('_', ' ')}
                                    </Badge>
                                </div>
                                {p.description && <p className="text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                                <div className="space-y-2 text-xs text-slate-500">
                                    {p.budget > 0 && (
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Budget: <span className="font-semibold text-slate-700">₹{p.budget?.toLocaleString()}</span></span>
                                        </div>
                                    )}
                                    {p.start_date && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{new Date(p.start_date).toLocaleDateString('en-IN')}
                                                {p.end_date && ` → ${new Date(p.end_date).toLocaleDateString('en-IN')}`}
                                                {' '}({getDuration(p.start_date, p.end_date)})
                                            </span>
                                        </div>
                                    )}
                                    {p.manager_id && (
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            <span>PM: {getManagerName(p.manager_id)}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Project Name *</Label>
                            <Input placeholder="Project name" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Client</Label>
                                <Input placeholder="Client name" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Budget (₹)</Label>
                                <Input type="number" placeholder="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Project Manager</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })}>
                                <option value="">None</option>
                                {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>)}
                            </select></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Start Date</Label>
                                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                            <div className="space-y-2"><Label>End Date</Label>
                                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Description</Label>
                            <Textarea placeholder="Project description..." rows={2} className="resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd} disabled={!form.project_name} className="bg-emerald-600">Create Project</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
