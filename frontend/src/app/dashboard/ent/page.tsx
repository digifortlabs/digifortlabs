"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Calendar, User, Activity,
    ChevronRight, Clock, MapPin, Phone,
    Filter, LayoutGrid, List, MoreVertical,
    FileText, Zap, ChevronLeft, X,
    Trash2, Edit, Scissors, Ear
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Card, CardContent, CardDescription,
    CardHeader, CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { API_URL, apiFetch } from '@/config/api';
import { formatDate } from '@/lib/dateFormatter';
import ENTPatientDetail from './components/ENTPatientDetail';

export default function ENTDashboard() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [surgeries, setSurgeries] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [viewMode, setViewMode] = useState('grid');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [patientsData, statsData, surgeriesData] = await Promise.all([
                    apiFetch(`ent/patients`),
                    apiFetch(`ent/stats`),
                    apiFetch(`ent/surgeries`)
                ]);

                if (patientsData) setPatients(patientsData);
                if (statsData) setStats(statsData);
                if (surgeriesData) setSurgeries(surgeriesData);
            } catch (error) {
                console.error("Failed to fetch ENT dashboard data:", error);
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

    // If a patient is selected, show their detail view entirely
    if (selectedPatient) {
        return (
            <ENTPatientDetail
                patientId={selectedPatient.patient_id}
                onBack={() => setSelectedPatient(null)}
            />
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Ear className="w-8 h-8 text-blue-600" />
                        ENT Clinic
                    </h1>
                    <p className="text-slate-500 mt-1">Otolaryngology patient and surgery management.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => {/* Open New Patient Modal */ }}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Patient
                    </Button>
                    <Button
                        onClick={() => router.push('/dashboard/appointments')}
                        variant="outline"
                        className="gap-2 bg-white shadow-sm"
                    >
                        <Calendar className="w-4 h-4" /> Schedule
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white border-slate-200/60 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Total Patients</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_patients || 0}</h3>
                                </div>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <User className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200/60 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Upcoming Surgeries</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_surgeries || 0}</h3>
                                </div>
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                    <Scissors className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200/60 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Audiometry Tests</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total_audiometry_tests || 0}</h3>
                                </div>
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                    <Activity className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200/60 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Active Cases</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.active_cases || 0}</h3>
                                </div>
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <Zap className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100/50 p-1">
                    <TabsTrigger value="overview">Patient Overview</TabsTrigger>
                    <TabsTrigger value="surgeries" className="flex items-center gap-2">
                        <Scissors className="w-4 h-4" /> Surgery Schedule
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                    {/* Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Search by name, MRD or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-slate-50 border-transparent focus-visible:bg-white transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button variant="outline" className="gap-2 bg-white">
                                <Filter className="w-4 h-4" /> Filters
                            </Button>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <Button
                                    variant={viewMode === 'grid' ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className={viewMode === 'grid' ? "bg-white shadow-sm" : ""}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className={viewMode === 'list' ? "bg-white shadow-sm" : ""}
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Patients Grid/List */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                            {filteredPatients.map(patient => (
                                <Card
                                    key={patient.ent_patient_id}
                                    className="group hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
                                    onClick={() => setSelectedPatient(patient)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-100">
                                                    {patient.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                        {patient.full_name}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">{patient.mrd_number}</p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                                                ENT
                                            </Badge>
                                        </div>

                                        <div className="mt-6 space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                {patient.phone}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                Registered: {formatDate(patient.created_at)}
                                            </div>
                                            {patient.chief_complaint && (
                                                <div className="flex items-start gap-3 text-sm text-slate-600 mt-2 p-3 bg-slate-50 rounded-lg">
                                                    <Activity className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                                    <span className="line-clamp-2">{patient.chief_complaint}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <div className="px-6 py-3 border-t bg-slate-50/50 rounded-b-xl flex justify-end">
                                        <span className="text-sm font-medium text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            View Details <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </Card>
                            ))}
                            {filteredPatients.length === 0 && (
                                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                    <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-slate-900">No patients found</h3>
                                    <p className="text-slate-500 mt-1">Try adjusting your search or add a new patient.</p>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="surgeries" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Surgical Schedule</CardTitle>
                            <CardDescription>Upcoming and completed procedures.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {surgeries.map((s) => (
                                    <div key={s.surgery_id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                                                <Scissors className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{s.surgery_type}</h4>
                                                <div className="flex gap-3 text-sm text-slate-500 mt-1">
                                                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {s.patient_name}</span>
                                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(s.scheduled_date)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={s.status === 'scheduled' ? 'default' : 'secondary'} className={s.status === 'scheduled' ? 'bg-blue-600' : ''}>
                                            {s.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                ))}
                                {surgeries.length === 0 && (
                                    <p className="text-center text-slate-500 py-8">No surgeries currently scheduled.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
