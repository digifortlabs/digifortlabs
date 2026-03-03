"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, Plus, Clock, MapPin, Briefcase, CheckCircle } from 'lucide-react';
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
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    adjourned: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-slate-100 text-slate-600',
};

export default function LegalHearingsPage() {
    const router = useRouter();
    const [hearings, setHearings] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [form, setForm] = useState({ case_id: '', hearing_date: '', hearing_type: 'Regular', court_name: '', judge_name: '', notes: '', status: 'scheduled' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [h, c] = await Promise.all([
                apiFetch('legal/hearings').catch(() => []),
                apiFetch('legal/cases').catch(() => []),
            ]);
            // Sort by date ascending
            const sorted = (h || []).sort((a: any, b: any) => new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime());
            setHearings(sorted);
            setCases(c || []);
        } finally { setLoading(false); }
    };

    const handleAdd = async () => {
        try {
            await apiFetch('legal/hearings', { method: 'POST', body: JSON.stringify({ ...form, case_id: parseInt(form.case_id) }) });
            setIsAddOpen(false);
            setForm({ case_id: '', hearing_date: '', hearing_type: 'Regular', court_name: '', judge_name: '', notes: '', status: 'scheduled' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed'); }
    };

    const getCaseName = (id: number) => cases.find(c => c.case_id === id)?.case_title || `Case #${id}`;

    const upcoming = hearings.filter(h => h.status === 'scheduled' && new Date(h.hearing_date) >= new Date());
    const past = hearings.filter(h => h.status !== 'scheduled' || new Date(h.hearing_date) < new Date());

    const renderHearingCard = (h: any) => (
        <Card key={h.hearing_id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-14 h-14 bg-blue-50 rounded-xl flex flex-col items-center justify-center">
                            <span className="text-xs font-bold text-blue-600 uppercase">
                                {new Date(h.hearing_date).toLocaleString('en-IN', { month: 'short' })}
                            </span>
                            <span className="text-xl font-bold text-blue-800 leading-tight">
                                {new Date(h.hearing_date).getDate()}
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-slate-900">{h.hearing_type || 'Hearing'}</h3>
                                <Badge className={cn('text-xs border-none', STATUS_COLORS[h.status] || 'bg-slate-100')}>{h.status}</Badge>
                            </div>
                            <p className="text-sm font-medium text-blue-700 mt-0.5">{getCaseName(h.case_id)}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                                {h.court_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{h.court_name}</span>}
                                {h.judge_name && <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Judge: {h.judge_name}</span>}
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                                    {new Date(h.hearing_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {h.notes && <p className="text-xs text-slate-400 mt-2 italic">{h.notes}</p>}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/legal')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Calendar className="w-6 h-6 text-purple-600" /> Hearing Calendar</h1>
                        <p className="text-slate-500 text-sm">{upcoming.length} upcoming hearing{upcoming.length !== 1 ? 's' : ''} scheduled.</p>
                    </div>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> Schedule Hearing
                </Button>
            </div>

            {loading ? <div className="p-12 text-center text-slate-500">Loading hearings...</div> : (
                <div className="space-y-8">
                    {upcoming.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Upcoming</h2>
                            {upcoming.map(renderHearingCard)}
                        </div>
                    )}
                    {past.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Past</h2>
                            {past.map(renderHearingCard)}
                        </div>
                    )}
                    {hearings.length === 0 && (
                        <Card className="border-slate-200/60 shadow-sm">
                            <CardContent className="p-12 text-center">
                                <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="font-semibold text-slate-900">No hearings scheduled</h3>
                                <Button onClick={() => setIsAddOpen(true)} className="mt-4 bg-purple-600">Schedule First Hearing</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Schedule Hearing</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Case *</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={form.case_id} onChange={e => setForm({ ...form, case_id: e.target.value })}>
                                <option value="">Select case...</option>
                                {cases.map(c => <option key={c.case_id} value={c.case_id}>{c.case_title}</option>)}
                            </select></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Date & Time *</Label>
                                <Input type="datetime-local" value={form.hearing_date} onChange={e => setForm({ ...form, hearing_date: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Hearing Type</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={form.hearing_type} onChange={e => setForm({ ...form, hearing_type: e.target.value })}>
                                    {['Regular', 'Bail', 'Arguments', 'Evidence', 'Judgment', 'Interim', 'Mediation'].map(t => <option key={t}>{t}</option>)}
                                </select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Court Name</Label>
                                <Input placeholder="Court" value={form.court_name} onChange={e => setForm({ ...form, court_name: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Judge Name</Label>
                                <Input placeholder="Judge" value={form.judge_name} onChange={e => setForm({ ...form, judge_name: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Notes</Label>
                            <Textarea placeholder="Notes..." rows={2} className="resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd} disabled={!form.case_id || !form.hearing_date} className="bg-purple-600">Schedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
