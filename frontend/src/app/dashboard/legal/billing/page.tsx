"use client";

import React, { useState, useEffect } from 'react';
import { FileText, ChevronLeft, Plus, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
    paid: 'bg-emerald-100 text-emerald-700',
    unpaid: 'bg-red-100 text-red-700',
    partial: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-slate-100 text-slate-600',
};

export default function LegalBillingPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [form, setForm] = useState({ client_id: '', case_id: '', amount: '', description: '', due_date: '', status: 'unpaid' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [inv, cl, ca] = await Promise.all([
                apiFetch('legal/invoices').catch(() => []),
                apiFetch('legal/clients').catch(() => []),
                apiFetch('legal/cases').catch(() => []),
            ]);
            setInvoices(inv || []);
            setClients(cl || []);
            setCases(ca || []);
        } finally { setLoading(false); }
    };

    const handleAdd = async () => {
        try {
            await apiFetch('legal/invoices', { method: 'POST', body: JSON.stringify({ ...form, client_id: parseInt(form.client_id), case_id: form.case_id ? parseInt(form.case_id) : undefined, amount: parseFloat(form.amount) || 0 }) });
            setIsAddOpen(false);
            setForm({ client_id: '', case_id: '', amount: '', description: '', due_date: '', status: 'unpaid' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed'); }
    };

    const markPaid = async (id: number) => {
        try {
            await apiFetch(`legal/invoices/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) });
            loadData();
        } catch { }
    };

    const totalBilled = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
    const totalPending = totalBilled - totalPaid;
    const overdue = invoices.filter(i => i.status === 'unpaid' && i.due_date && new Date(i.due_date) < new Date()).length;

    const getClientName = (id: number) => clients.find(c => c.client_id === id)?.full_name || '–';
    const getCaseTitle = (id: number) => cases.find(c => c.case_id === id)?.case_title || '';

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/legal')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><FileText className="w-6 h-6 text-emerald-600" /> Billing & Invoices</h1>
                        <p className="text-slate-500 text-sm">{invoices.length} invoices total.</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" /> New Invoice
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Billed', value: `₹${totalBilled.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Collected', value: `₹${totalPaid.toLocaleString()}`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Pending', value: `₹${totalPending.toLocaleString()}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Overdue', value: overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((s, i) => (
                    <Card key={i} className="border-slate-200/60 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500">{s.label}</p>
                                    <h3 className="text-xl font-bold text-slate-900 mt-1">{loading ? '–' : s.value}</h3>
                                </div>
                                <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('w-4 h-4', s.color)} /></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Invoice List */}
            <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="border-b"><CardTitle className="text-lg">Invoices</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {loading ? <div className="p-8 text-center text-slate-500">Loading...</div>
                        : invoices.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>No invoices yet.</p>
                                <Button onClick={() => setIsAddOpen(true)} className="mt-4 bg-emerald-600">Create First Invoice</Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {invoices.map(inv => {
                                    const isOverdue = inv.status === 'unpaid' && inv.due_date && new Date(inv.due_date) < new Date();
                                    return (
                                        <div key={inv.invoice_id} className={cn('p-4 flex items-center justify-between gap-4', isOverdue ? 'bg-red-50/30' : 'hover:bg-slate-50')}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-slate-900">{getClientName(inv.client_id)}</p>
                                                    {isOverdue && <Badge className="text-xs border-none bg-red-100 text-red-600">Overdue</Badge>}
                                                    <Badge className={cn('text-xs border-none', STATUS_COLORS[inv.status] || 'bg-slate-100')}>{inv.status}</Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                                                    {inv.case_id && <span>{getCaseTitle(inv.case_id)}</span>}
                                                    {inv.description && <span>{inv.description}</span>}
                                                    {inv.due_date && <span>Due: {new Date(inv.due_date).toLocaleDateString('en-IN')}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className="text-lg font-bold text-slate-900">₹{(inv.amount || 0).toLocaleString()}</span>
                                                {inv.status !== 'paid' && (
                                                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs"
                                                        onClick={() => markPaid(inv.invoice_id)}>
                                                        Mark Paid
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                </CardContent>
            </Card>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Client *</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value, case_id: '' })}>
                                <option value="">Select client...</option>
                                {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.full_name}</option>)}
                            </select></div>
                        {form.client_id && (
                            <div className="space-y-2"><Label>Case (optional)</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={form.case_id} onChange={e => setForm({ ...form, case_id: e.target.value })}>
                                    <option value="">Not specific to a case</option>
                                    {cases.filter(c => c.client_id === parseInt(form.client_id)).map(c => <option key={c.case_id} value={c.case_id}>{c.case_title}</option>)}
                                </select></div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Amount (₹) *</Label>
                                <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Due Date</Label>
                                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Description</Label>
                            <Textarea placeholder="e.g., Retainer fee, Court appearance..." rows={2} className="resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd} disabled={!form.client_id || !form.amount} className="bg-emerald-600">Create Invoice</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
