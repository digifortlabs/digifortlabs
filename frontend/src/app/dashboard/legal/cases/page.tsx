"use client";

import React, { useState, useEffect } from 'react';
import { Briefcase, ChevronLeft, Plus, Search, Filter, Calendar, AlertCircle } from 'lucide-react';
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
    pending: 'bg-amber-100 text-amber-700',
    closed: 'bg-slate-100 text-slate-600',
    won: 'bg-blue-100 text-blue-700',
    lost: 'bg-red-100 text-red-700',
};

const TYPE_COLORS: Record<string, string> = {
    Civil: 'bg-blue-100 text-blue-700',
    Criminal: 'bg-red-100 text-red-700',
    Family: 'bg-pink-100 text-pink-700',
    Corporate: 'bg-purple-100 text-purple-700',
    Property: 'bg-amber-100 text-amber-700',
};

export default function LegalCasesPage() {
    const router = useRouter();
    const [cases, setCases] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [form, setForm] = useState({ case_title: '', case_number: '', case_type: 'Civil', court_name: '', client_id: '', status: 'active', description: '', next_hearing_date: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [c, cl] = await Promise.all([
                apiFetch('legal/cases').catch(() => []),
                apiFetch('legal/clients').catch(() => []),
            ]);
            setCases(c || []);
            setClients(cl || []);
        } finally { setLoading(false); }
    };

    const handleAdd = async () => {
        try {
            await apiFetch('legal/cases', { method: 'POST', body: JSON.stringify({ ...form, client_id: parseInt(form.client_id) }) });
            setIsAddOpen(false);
            setForm({ case_title: '', case_number: '', case_type: 'Civil', court_name: '', client_id: '', status: 'active', description: '', next_hearing_date: '' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed'); }
    };

    const filtered = cases.filter(c => {
        const matchSearch = c.case_title?.toLowerCase().includes(search.toLowerCase()) || c.case_number?.toLowerCase().includes(search.toLowerCase()) || c.court_name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getClientName = (id: number) => clients.find(c => c.client_id === id)?.full_name || '–';

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/legal')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Briefcase className="w-6 h-6 text-blue-600" /> Case Management</h1>
                        <p className="text-slate-500 text-sm">All legal cases and their status.</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> New Case
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search cases..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'pending', 'closed', 'won', 'lost'].map(s => (
                        <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'}
                            className={cn('capitalize text-xs', statusFilter === s ? 'bg-blue-600' : '')}
                            onClick={() => setStatusFilter(s)}>
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {loading ? <div className="p-12 text-center text-slate-500">Loading cases...</div>
                    : filtered.length === 0 ? (
                        <Card className="border-slate-200/60 shadow-sm">
                            <CardContent className="p-12 text-center">
                                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="font-semibold text-slate-900">No cases found</h3>
                                <p className="text-slate-500 text-sm mt-1">Add a new case to get started.</p>
                                <Button onClick={() => setIsAddOpen(true)} className="mt-4 bg-blue-600">Add First Case</Button>
                            </CardContent>
                        </Card>
                    ) : filtered.map(c => (
                        <Card key={c.case_id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="font-semibold text-slate-900">{c.case_title}</h3>
                                            <Badge className={cn('text-xs border-none', STATUS_COLORS[c.status] || 'bg-slate-100')}>{c.status}</Badge>
                                            <Badge className={cn('text-xs border-none', TYPE_COLORS[c.case_type] || 'bg-slate-100')}>{c.case_type || 'General'}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-2 flex-wrap">
                                            {c.case_number && <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{c.case_number}</span>}
                                            {c.court_name && <span>{c.court_name}</span>}
                                            {c.client_id && <span>Client: <span className="font-medium text-slate-700">{getClientName(c.client_id)}</span></span>}
                                        </div>
                                        {c.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{c.description}</p>}
                                    </div>
                                    {c.next_hearing_date && (
                                        <div className="flex-shrink-0 text-right">
                                            <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Next: {new Date(c.next_hearing_date).toLocaleDateString('en-IN')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>New Case</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Client *</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
                                <option value="">Select client...</option>
                                {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.full_name}</option>)}
                            </select></div>
                        <div className="space-y-2"><Label>Case Title *</Label>
                            <Input placeholder="Case title" value={form.case_title} onChange={e => setForm({ ...form, case_title: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Case Number</Label>
                                <Input placeholder="e.g., 2024/HC/001" value={form.case_number} onChange={e => setForm({ ...form, case_number: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Case Type</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={form.case_type} onChange={e => setForm({ ...form, case_type: e.target.value })}>
                                    {['Civil', 'Criminal', 'Family', 'Corporate', 'Property', 'Labour', 'Tax'].map(t => <option key={t}>{t}</option>)}
                                </select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Court Name</Label>
                                <Input placeholder="Court name" value={form.court_name} onChange={e => setForm({ ...form, court_name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Next Hearing</Label>
                                <Input type="date" value={form.next_hearing_date} onChange={e => setForm({ ...form, next_hearing_date: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Status</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option value="active">Active</option><option value="pending">Pending</option>
                                <option value="closed">Closed</option><option value="won">Won</option><option value="lost">Lost</option>
                            </select></div>
                        <div className="space-y-2"><Label>Description</Label>
                            <Textarea placeholder="Brief case description..." rows={3} className="resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd} disabled={!form.case_title || !form.client_id} className="bg-blue-600">Create Case</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
