"use client";

import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, Calendar, CheckCircle, XCircle, Users, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';

const STATUS_STYLES: Record<string, { badge: string; bg: string }> = {
    present: { badge: 'bg-emerald-100 text-emerald-700', bg: 'bg-emerald-50' },
    absent: { badge: 'bg-red-100 text-red-700', bg: 'bg-red-50' },
    late: { badge: 'bg-amber-100 text-amber-700', bg: 'bg-amber-50' },
    half_day: { badge: 'bg-blue-100 text-blue-700', bg: 'bg-blue-50' },
    leave: { badge: 'bg-purple-100 text-purple-700', bg: 'bg-purple-50' },
};

export default function CorporateAttendancePage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [bulkStatus, setBulkStatus] = useState('present');

    useEffect(() => { loadData(); }, [date]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [e, a] = await Promise.all([
                apiFetch('corporate/employees').catch(() => []),
                apiFetch(`corporate/attendance?date=${date}`).catch(() => []),
            ]);
            setEmployees(e || []);
            setAttendance(a || []);
        } finally { setLoading(false); }
    };

    const getStatus = (empId: number) => attendance.find(a => a.employee_id === empId)?.status || null;

    const markAttendance = async (empId: number, status: string) => {
        try {
            await apiFetch('corporate/attendance', {
                method: 'POST',
                body: JSON.stringify({ employee_id: empId, date, status })
            });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed'); }
    };

    const handleBulkMark = async () => {
        try {
            await Promise.all(employees.map(emp =>
                apiFetch('corporate/attendance', { method: 'POST', body: JSON.stringify({ employee_id: emp.employee_id, date, status: bulkStatus }) }).catch(() => { })
            ));
            setIsBulkOpen(false);
            loadData();
        } catch (e) { }
    };

    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const lateCount = attendance.filter(a => a.status === 'late').length;
    const unmarked = employees.length - attendance.length;

    const statCards = [
        { label: 'Present', value: presentCount, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
        { label: 'Absent', value: absentCount, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
        { label: 'Late', value: lateCount, color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
        { label: 'Unmarked', value: unmarked, color: 'text-slate-600', bg: 'bg-slate-50', icon: Users },
    ];

    const isToday = date === new Date().toISOString().split('T')[0];

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto pb-24">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/corporate')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Clock className="w-6 h-6 text-blue-600" /> Attendance</h1>
                        <p className="text-slate-500 text-sm">{employees.length} employees • {date}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
                    {isToday && (
                        <Button onClick={() => setIsBulkOpen(true)} variant="outline" className="gap-2">
                            <TrendingUp className="w-4 h-4" /> Bulk Mark
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                    <Card key={i} className="border-slate-200/60 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500">{s.label}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{s.value}</h3>
                                </div>
                                <div className={cn('p-2 rounded-lg', s.bg)}><s.icon className={cn('w-5 h-5', s.color)} /></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Attendance Table */}
            <Card className="border-slate-200/60 shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        {isToday ? "Today's Attendance" : `Attendance — ${date}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : (
                        <div className="divide-y divide-slate-100">
                            {employees.map(emp => {
                                const status = getStatus(emp.employee_id);
                                return (
                                    <div key={emp.employee_id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                {emp.full_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{emp.full_name}</p>
                                                <p className="text-xs text-slate-500">{emp.designation || 'Staff'} {emp.department ? `• ${emp.department}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {status ? (
                                                <Badge className={cn('text-xs border-none px-3', STATUS_STYLES[status]?.badge || 'bg-slate-100')}>
                                                    {status.replace('_', ' ')}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Not marked</span>
                                            )}
                                            {isToday && (
                                                <div className="flex gap-1 ml-2">
                                                    {['present', 'absent', 'late', 'half_day', 'leave'].map(s => (
                                                        <button key={s} title={s.replace('_', ' ')}
                                                            onClick={() => markAttendance(emp.employee_id, s)}
                                                            className={cn('w-7 h-7 rounded-full text-xs font-bold transition-all border-2',
                                                                status === s ? 'border-blue-500 bg-blue-100' : 'border-slate-200 hover:border-slate-400 bg-white',
                                                            )}>
                                                            {s === 'present' ? 'P' : s === 'absent' ? 'A' : s === 'late' ? 'L' : s === 'half_day' ? 'H' : 'V'}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {employees.length === 0 && (
                                <div className="p-8 text-center text-slate-400">No employees found.</div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bulk Mark Modal */}
            <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Bulk Mark Attendance</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-slate-500">Mark all {employees.length} employees as:</p>
                        <div className="space-y-2"><Label>Status</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="leave">Leave</option>
                            </select></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkMark} className="bg-blue-600">Mark All</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
