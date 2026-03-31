"use client";

import React, { useState, useEffect } from 'react';
import { Scale, Users, Briefcase, Calendar, Plus, Search, ChevronRight, Clock, FileText, TrendingUp, AlertCircle } from 'lucide-react';
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

export default function LegalDashboard() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [hearings, setHearings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
    const [clientForm, setClientForm] = useState({ full_name: '', email: '', phone: '', address: '', client_type: 'Individual' });
    const [caseForm, setCaseForm] = useState({ case_title: '', case_number: '', case_type: '', court_name: '', client_id: '', status: 'active', description: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [c, cs, h] = await Promise.all([
                apiFetch('legal/clients').catch(() => []),
                apiFetch('legal/cases').catch(() => []),
                apiFetch('legal/hearings/upcoming').catch(() => []),
            ]);
            setClients(c || []);
            setCases(cs || []);
            setHearings(h || []);
        } finally { setLoading(false); }
    };

    const handleAddClient = async () => {
        try {
            await apiFetch('legal/clients', { method: 'POST', body: JSON.stringify(clientForm) });
            setIsAddClientOpen(false);
            setClientForm({ full_name: '', email: '', phone: '', address: '', client_type: 'Individual' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed to add client'); }
    };

    const handleAddCase = async () => {
        try {
            await apiFetch('legal/cases', { method: 'POST', body: JSON.stringify({ ...caseForm, client_id: parseInt(caseForm.client_id) }) });
            setIsAddCaseOpen(false);
            setCaseForm({ case_title: '', case_number: '', case_type: '', court_name: '', client_id: '', status: 'active', description: '' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed to add case'); }
    };

    const filtered = clients.filter(c => c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm));
    const activeCases = cases.filter(c => c.status === 'active').length;
    const pendingCases = cases.filter(c => c.status === 'pending').length;

    const stats = [
        { label: 'Total Clients', value: clients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Cases', value: activeCases, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pending Cases', value: pendingCases, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Upcoming Hearings', value: hearings.length, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    const caseTypeColors: Record<string, string> = {
        'Civil': 'bg-blue-100 text-blue-700',
        'Criminal': 'bg-red-100 text-red-700',
        'Family': 'bg-pink-100 text-pink-700',
        'Corporate': 'bg-purple-100 text-purple-700',
        'Property': 'bg-amber-100 text-amber-700',
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Scale className="w-8 h-8 text-blue-600" /> Legal Management
                    </h1>
                    <p className="text-slate-500 mt-1">Manage clients, cases, hearings, and legal documents.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsAddClientOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Users className="w-4 h-4 mr-2" /> Add Client
                    </Button>
                    <Button onClick={() => setIsAddCaseOpen(true)} variant="outline" className="gap-2">
                        <Briefcase className="w-4 h-4" /> New Case
                    </Button>
                    <Button onClick={() => router.push('/dashboard/legal/hearings')} variant="outline" className="gap-2">
                        <Calendar className="w-4 h-4" /> Hearings
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <Card key={i} className="border-slate-200/60 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{s.label}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '–' : s.value}</h3>
                                </div>
                                <div className={cn('p-2 rounded-lg', s.bg)}>
                                    <s.icon className={cn('w-5 h-5', s.color)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Clients List */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Clients</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input placeholder="Search clients..." className="pl-9 bg-slate-50 border-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {loading ? (
                                    <div className="p-8 text-center text-slate-500">Loading...</div>
                                ) : filtered.length > 0 ? filtered.map(client => (
                                    <div key={client.client_id} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer group transition-colors"
                                        onClick={() => router.push(`/dashboard/legal/cases?client=${client.client_id}`)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                {client.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{client.full_name}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                    <span>{client.client_type || 'Individual'}</span>
                                                    {client.phone && <><span>•</span><span>{client.phone}</span></>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                                                {cases.filter(c => c.client_id === client.client_id).length} cases
                                            </Badge>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-400">
                                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p>No clients yet. Add your first client.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Cases */}
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Recent Cases</CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/legal/cases')} className="text-blue-600">View all</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {cases.slice(0, 5).map(c => (
                                    <div key={c.case_id} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/dashboard/legal/cases`)}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg"><Briefcase className="w-4 h-4 text-slate-600" /></div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">{c.case_title}</p>
                                                <p className="text-xs text-slate-500">{c.case_number} • {c.court_name}</p>
                                            </div>
                                        </div>
                                        <Badge className={cn('text-xs border-none', caseTypeColors[c.case_type] || 'bg-slate-100 text-slate-600')}>
                                            {c.case_type || 'General'}
                                        </Badge>
                                    </div>
                                ))}
                                {cases.length === 0 && <div className="p-6 text-center text-slate-400 text-sm">No cases yet.</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Upcoming Hearings */}
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-600" /> Upcoming Hearings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {hearings.length > 0 ? hearings.slice(0, 4).map((h: any) => (
                                <div key={h.hearing_id} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                                    <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{h.hearing_type || 'Hearing'}</p>
                                        <p className="text-xs text-slate-500">{h.hearing_date ? new Date(h.hearing_date).toLocaleDateString('en-IN') : 'TBD'}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-slate-400 text-sm py-4">No upcoming hearings</div>
                            )}
                            <Button variant="outline" size="sm" className="w-full" onClick={() => router.push('/dashboard/legal/hearings')}>
                                Schedule Hearing
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {[
                                { label: 'All Cases', icon: Briefcase, path: '/dashboard/legal/cases', color: 'text-blue-600 bg-blue-50' },
                                { label: 'Hearing Calendar', icon: Calendar, path: '/dashboard/legal/hearings', color: 'text-purple-600 bg-purple-50' },
                                { label: 'Billing & Invoices', icon: FileText, path: '/dashboard/legal/billing', color: 'text-emerald-600 bg-emerald-50' },
                            ].map(a => (
                                <button key={a.label} onClick={() => router.push(a.path)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                                    <div className={cn('p-2 rounded-lg', a.color.split(' ')[1])}><a.icon className={cn('w-4 h-4', a.color.split(' ')[0])} /></div>
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{a.label}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Client Modal */}
            <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Client Type</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={clientForm.client_type} onChange={e => setClientForm({ ...clientForm, client_type: e.target.value })}>
                                <option value="Individual">Individual</option>
                                <option value="Corporate">Corporate</option>
                            </select>
                        </div>
                        <div className="space-y-2"><Label>Full Name *</Label>
                            <Input placeholder="Client name" value={clientForm.full_name} onChange={e => setClientForm({ ...clientForm, full_name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Phone</Label>
                                <Input placeholder="Phone" value={clientForm.phone} onChange={e => setClientForm({ ...clientForm, phone: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Email</Label>
                                <Input placeholder="Email" type="email" value={clientForm.email} onChange={e => setClientForm({ ...clientForm, email: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Address</Label>
                            <Textarea placeholder="Address" rows={2} className="resize-none" value={clientForm.address} onChange={e => setClientForm({ ...clientForm, address: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddClient} disabled={!clientForm.full_name} className="bg-blue-600">Add Client</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Case Modal */}
            <Dialog open={isAddCaseOpen} onOpenChange={setIsAddCaseOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>New Case</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Client *</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={caseForm.client_id} onChange={e => setCaseForm({ ...caseForm, client_id: e.target.value })}>
                                <option value="">Select client...</option>
                                {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.full_name}</option>)}
                            </select></div>
                        <div className="space-y-2"><Label>Case Title *</Label>
                            <Input placeholder="e.g., State v. Smith" value={caseForm.case_title} onChange={e => setCaseForm({ ...caseForm, case_title: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Case Number</Label>
                                <Input placeholder="e.g., 2024/HC/001" value={caseForm.case_number} onChange={e => setCaseForm({ ...caseForm, case_number: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Type</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={caseForm.case_type} onChange={e => setCaseForm({ ...caseForm, case_type: e.target.value })}>
                                    <option value="">Select...</option>
                                    {['Civil', 'Criminal', 'Family', 'Corporate', 'Property', 'Labour', 'Tax'].map(t => <option key={t}>{t}</option>)}
                                </select></div>
                        </div>
                        <div className="space-y-2"><Label>Court Name</Label>
                            <Input placeholder="e.g., High Court of Karnataka" value={caseForm.court_name} onChange={e => setCaseForm({ ...caseForm, court_name: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Description</Label>
                            <Textarea placeholder="Brief description..." rows={2} className="resize-none" value={caseForm.description} onChange={e => setCaseForm({ ...caseForm, description: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddCaseOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddCase} disabled={!caseForm.case_title || !caseForm.client_id} className="bg-blue-600">Create Case</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
