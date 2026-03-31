"use client";

import React, { useState, useEffect } from 'react';
import { Building2, Bed, Users, Activity, Plus, Search, ChevronRight, UserPlus, LogOut, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';

export default function HMSDashboard() {
    const router = useRouter();
    const [wards, setWards] = useState<any[]>([]);
    const [admissions, setAdmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddWardOpen, setIsAddWardOpen] = useState(false);
    const [wardForm, setWardForm] = useState({ ward_name: '', ward_type: 'General', total_beds: '', floor_number: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [w, a] = await Promise.all([
                apiFetch('hms/wards').catch(() => []),
                apiFetch('hms/admissions/active').catch(() => []),
            ]);
            setWards(w || []);
            setAdmissions(a || []);
        } finally { setLoading(false); }
    };

    const handleAddWard = async () => {
        try {
            await apiFetch('hms/wards', { method: 'POST', body: JSON.stringify({ ...wardForm, total_beds: parseInt(wardForm.total_beds) || 0, floor_number: parseInt(wardForm.floor_number) || 1 }) });
            setIsAddWardOpen(false);
            setWardForm({ ward_name: '', ward_type: 'General', total_beds: '', floor_number: '' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed'); }
    };

    const totalBeds = wards.reduce((s, w) => s + (w.total_beds || 0), 0);
    const occupiedBeds = admissions.length;
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const filtered = wards.filter(w => w.ward_name?.toLowerCase().includes(searchTerm.toLowerCase()) || w.ward_type?.toLowerCase().includes(searchTerm.toLowerCase()));

    const stats = [
        { label: 'Total Wards', value: wards.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Beds', value: totalBeds, icon: Bed, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Occupied Beds', value: occupiedBeds, icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Available Beds', value: availableBeds, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const wardTypeColors: Record<string, string> = {
        'General': 'bg-blue-100 text-blue-700',
        'ICU': 'bg-red-100 text-red-700',
        'Emergency': 'bg-orange-100 text-orange-700',
        'Maternity': 'bg-pink-100 text-pink-700',
        'Pediatric': 'bg-purple-100 text-purple-700',
        'Private': 'bg-emerald-100 text-emerald-700',
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Building2 className="w-8 h-8 text-blue-600" /> Hospital Management
                    </h1>
                    <p className="text-slate-500 mt-1">Manage wards, beds, admissions, and discharges.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setIsAddWardOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Ward
                    </Button>
                    <Button onClick={() => router.push('/dashboard/hms/admissions')} variant="outline" className="gap-2">
                        <UserPlus className="w-4 h-4" /> New Admission
                    </Button>
                    <Button onClick={() => router.push('/dashboard/hms/beds')} variant="outline" className="gap-2">
                        <Bed className="w-4 h-4" /> Bed Status
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

            {/* Occupancy Bar */}
            <Card className="border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-slate-900">Overall Occupancy</p>
                        <span className={cn('text-sm font-bold', occupancyRate > 80 ? 'text-rose-600' : occupancyRate > 60 ? 'text-amber-600' : 'text-emerald-600')}>
                            {occupancyRate}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', occupancyRate > 80 ? 'bg-rose-500' : occupancyRate > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
                            style={{ width: `${occupancyRate}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{occupiedBeds} / {totalBeds} beds occupied</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Wards</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input placeholder="Search wards..." className="pl-9 bg-slate-50 border-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {loading ? <div className="p-8 text-center text-slate-500">Loading...</div>
                                    : filtered.length > 0 ? filtered.map(ward => {
                                        const wardAdmissions = admissions.filter(a => a.ward_id === ward.ward_id).length;
                                        const wardOccupancy = ward.total_beds > 0 ? Math.round((wardAdmissions / ward.total_beds) * 100) : 0;
                                        return (
                                            <div key={ward.ward_id} className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer group transition-colors"
                                                onClick={() => router.push('/dashboard/hms/beds')}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                        <Bed className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{ward.ward_name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                            <span>Floor {ward.floor_number || 1}</span>
                                                            <span>•</span>
                                                            <span>{wardAdmissions}/{ward.total_beds} beds</span>
                                                            <span>•</span>
                                                            <span className={wardOccupancy > 80 ? 'text-rose-600 font-medium' : 'text-slate-500'}>{wardOccupancy}% occupied</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={cn('text-xs border-none', wardTypeColors[ward.ward_type] || 'bg-slate-100 text-slate-600')}>
                                                        {ward.ward_type || 'General'}
                                                    </Badge>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="p-8 text-center text-slate-400">
                                            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p>No wards yet.</p>
                                        </div>
                                    )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    {/* Recent Admissions */}
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-rose-600" /> Active Admissions</CardTitle>
                                <Button variant="ghost" size="sm" className="text-blue-600 text-xs" onClick={() => router.push('/dashboard/hms/admissions')}>View all</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {admissions.slice(0, 5).map(a => (
                                <div key={a.admission_id} className="flex items-center justify-between p-3 bg-rose-50/60 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{a.patient_name || 'Patient'}</p>
                                        <p className="text-xs text-slate-500">Bed {a.bed_number} • {a.ward_name}</p>
                                    </div>
                                    <Badge className="text-xs border-none bg-rose-100 text-rose-700">Active</Badge>
                                </div>
                            ))}
                            {admissions.length === 0 && <p className="text-sm text-slate-400 text-center py-2">No active admissions.</p>}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b pb-3"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {[
                                { label: 'Bed Status Grid', icon: Bed, path: '/dashboard/hms/beds', color: 'text-blue-600 bg-blue-50' },
                                { label: 'New Admission', icon: UserPlus, path: '/dashboard/hms/admissions', color: 'text-emerald-600 bg-emerald-50' },
                                { label: 'Discharge Patient', icon: LogOut, path: '/dashboard/hms/discharge', color: 'text-orange-600 bg-orange-50' },
                                { label: 'Critical Alerts', icon: AlertCircle, path: '/dashboard/hms/admissions', color: 'text-rose-600 bg-rose-50' },
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

            <Dialog open={isAddWardOpen} onOpenChange={setIsAddWardOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add New Ward</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Ward Name *</Label>
                            <Input placeholder="e.g., General Ward A" value={wardForm.ward_name} onChange={e => setWardForm({ ...wardForm, ward_name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Ward Type</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={wardForm.ward_type} onChange={e => setWardForm({ ...wardForm, ward_type: e.target.value })}>
                                    <option>General</option><option>ICU</option><option>Emergency</option>
                                    <option>Maternity</option><option>Pediatric</option><option>Private</option>
                                </select></div>
                            <div className="space-y-2"><Label>Total Beds</Label>
                                <Input placeholder="e.g., 20" type="number" value={wardForm.total_beds} onChange={e => setWardForm({ ...wardForm, total_beds: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Floor Number</Label>
                            <Input placeholder="e.g., 2" type="number" value={wardForm.floor_number} onChange={e => setWardForm({ ...wardForm, floor_number: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddWardOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddWard} disabled={!wardForm.ward_name} className="bg-blue-600">Add Ward</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
