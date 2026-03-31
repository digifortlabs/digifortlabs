"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Calendar, User, Activity,
    ChevronRight, Clock, Stethoscope, FileText,
    Heart, TrendingUp, Users, DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';
import { formatDate } from '@/lib/dateFormatter';

export default function ClinicOPDDashboard() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Registration Modal State
    const [isRegOpen, setIsRegOpen] = useState(false);
    const [globalPatients, setGlobalPatients] = useState<any[]>([]);
    const [globalSearch, setGlobalSearch] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [regForm, setRegForm] = useState({ blood_group: '', allergies: '', chronic_conditions: '' });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [patientsData, statsData] = await Promise.all([
                    apiFetch(`clinic/patients`),
                    apiFetch(`clinic/stats`)
                ]);

                if (patientsData) setPatients(patientsData);
                if (statsData) setStats(statsData);
            } catch (error) {
                console.error("Failed to fetch clinic dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const filteredPatients = patients.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.mrd_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm)
    );

    // Fetch core patients for registration
    const fetchGlobalPatients = async (query: string) => {
        if (!query || query.length < 2) {
            setGlobalPatients([]);
            return;
        }
        try {
            const data = await apiFetch(`patients?search=${encodeURIComponent(query)}`);
            setGlobalPatients(data || []);
        } catch (error) {
            console.error("Failed to fetch global patients:", error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchGlobalPatients(globalSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [globalSearch]);

    const handleRegister = async () => {
        if (!selectedPatientId) return alert("Select a patient first.");
        try {
            const data = await apiFetch('clinic/patients', {
                method: 'POST',
                body: JSON.stringify({
                    patient_id: selectedPatientId,
                    blood_group: regForm.blood_group,
                    allergies: regForm.allergies,
                    chronic_conditions: regForm.chronic_conditions ? { notes: regForm.chronic_conditions } : {}
                })
            });
            if (data) {
                setIsRegOpen(false);
                setRegForm({ blood_group: '', allergies: '', chronic_conditions: '' });
                setSelectedPatientId(null);
                setGlobalSearch('');
                // Refresh list
                const refreshed = await apiFetch(`clinic/patients`);
                if (refreshed) setPatients(refreshed);
            }
        } catch (error: any) {
            alert(error.message || "Failed to register patient.");
        }
    };

    const statCards = [
        { title: "Total Patients", value: stats?.total_patients || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Today's Visits", value: stats?.today_visits || 0, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
        { title: "Total Visits", value: stats?.total_visits || 0, icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-50" },
        { title: "Revenue Today", value: "₹0", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" }
    ];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Stethoscope className="w-8 h-8 text-blue-600" />
                        Clinic OPD
                    </h1>
                    <p className="text-slate-500 mt-1">Outpatient department management and consultations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setIsRegOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                        <User className="w-4 h-4 mr-2" /> Register Patient
                    </Button>
                    <Button
                        onClick={() => router.push('/dashboard/records')}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Visit
                    </Button>
                    <Button
                        onClick={() => router.push('/dashboard/appointments')}
                        variant="outline"
                        className="gap-2 bg-white shadow-sm"
                    >
                        <Calendar className="w-4 h-4" /> Appointments
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                    <Card key={idx} className="bg-white border-slate-200/60 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '-' : stat.value}</h3>
                                </div>
                                <div className={cn("p-2 rounded-lg", stat.bg)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Patient List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="border-b bg-white">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">OPD Patients</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search patients..."
                                        className="pl-9 bg-slate-50 border-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {loading ? (
                                    <div className="p-8 text-center text-slate-500">Loading patients...</div>
                                ) : filteredPatients.length > 0 ? (
                                    filteredPatients.map(patient => (
                                        <div
                                            key={patient.opd_patient_id}
                                            onClick={() => router.push(`/dashboard/clinic/${patient.patient_id}`)}
                                            className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                                    {patient.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                                        {patient.full_name}
                                                    </h4>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                        <span>{patient.mrd_number}</span>
                                                        <span>•</span>
                                                        <span>{patient.phone}</span>
                                                        {patient.blood_group && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Heart className="w-3 h-3 text-rose-500" />
                                                                    {patient.blood_group}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                                    OPD
                                                </Badge>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-500">No patients found.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Quick Actions */}
                <div className="space-y-6">
                    <Card className="border-slate-200/60 shadow-sm hover:border-blue-200 transition-colors group cursor-pointer"
                        onClick={() => router.push('/dashboard/records')}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                        Record Visit
                                    </h3>
                                    <p className="text-sm text-slate-500">Start new consultation</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/60 shadow-sm hover:border-emerald-200 transition-colors group cursor-pointer"
                        onClick={() => router.push('/dashboard/appointments')}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                        Appointments
                                    </h3>
                                    <p className="text-sm text-slate-500">View schedule</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 shadow-sm bg-blue-50/30">
                        <CardHeader className="pb-3 border-b border-blue-100">
                            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" /> Quick Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Avg. Consultation Time</span>
                                <span className="font-bold text-slate-900">15 min</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Patient Satisfaction</span>
                                <span className="font-bold text-emerald-600">4.8/5</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Follow-up Rate</span>
                                <span className="font-bold text-blue-600">78%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Registration Modal */}
            <Dialog open={isRegOpen} onOpenChange={setIsRegOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Register Patient to Clinic OPD</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Search Patient (Name, MRD, Phone)</Label>
                            <Input
                                placeholder="Start typing..."
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                            />
                            {globalPatients.length > 0 && !selectedPatientId && (
                                <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1 mt-1 bg-slate-50">
                                    {globalPatients.map(p => (
                                        <div
                                            key={p.record_id}
                                            className="p-2 hover:bg-blue-50 cursor-pointer rounded text-sm text-slate-700 border border-transparent hover:border-blue-100"
                                            onClick={() => {
                                                setSelectedPatientId(p.record_id);
                                                setGlobalSearch(`${p.full_name} (${p.mrd_number})`);
                                                setGlobalPatients([]);
                                            }}
                                        >
                                            <span className="font-semibold">{p.full_name}</span> • {p.mrd_number} • {p.phone}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedPatientId && (
                            <>
                                <div className="space-y-2">
                                    <Label>Blood Group</Label>
                                    <select
                                        className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                        value={regForm.blood_group}
                                        onChange={e => setRegForm({ ...regForm, blood_group: e.target.value })}
                                    >
                                        <option value="">Unknown</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Allergies</Label>
                                    <Input
                                        placeholder="e.g., Penicillin, Peanuts (or leave blank)"
                                        value={regForm.allergies}
                                        onChange={e => setRegForm({ ...regForm, allergies: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Chronic Conditions</Label>
                                    <Textarea
                                        placeholder="e.g., Hypertension, Diabetes"
                                        value={regForm.chronic_conditions}
                                        onChange={e => setRegForm({ ...regForm, chronic_conditions: e.target.value })}
                                        className="resize-none"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRegOpen(false)}>Cancel</Button>
                        <Button onClick={handleRegister} disabled={!selectedPatientId} className="bg-blue-600">Register</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
