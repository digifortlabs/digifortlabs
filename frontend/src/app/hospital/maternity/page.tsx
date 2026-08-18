"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Calendar, User, Activity,
    ChevronRight, Clock, MapPin, Phone,
    Filter, LayoutGrid, List, MoreVertical,
    FileText, Zap, ChevronLeft, X, Baby
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card, CardContent, CardDescription,
    CardHeader, CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { API_URL, apiFetch } from '@/config/api';
import HospitalSelectionPrompt from '@/components/HospitalSelectionPrompt';

export default function MaternityDashboard() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userRole, setUserRole] = useState<string>('');
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

    useEffect(() => {
        const role = localStorage.getItem('userRole') || '';
        setUserRole(role);
        const saved = localStorage.getItem('hospital_id');
        if (saved) setSelectedHospitalId(Number(saved));

        const handleHospitalChanged = (e: any) => {
            if (e.detail?.storageKey === 'hospital_id') {
                setSelectedHospitalId(e.detail.hospitalId ? Number(e.detail.hospitalId) : null);
            } else if (typeof e.detail === 'string' || typeof e.detail === 'number') {
                setSelectedHospitalId(e.detail ? Number(e.detail) : null);
            }
        };
        window.addEventListener('hospitalChanged', handleHospitalChanged);
        return () => window.removeEventListener('hospitalChanged', handleHospitalChanged);
    }, []);

    useEffect(() => {
        if (['superadmin', 'superadmin_staff', 'website_admin'].includes(userRole) && !selectedHospitalId) {
            setLoading(false);
            return;
        }

        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const patientsData = await apiFetch(`maternity/patients`);
                if (patientsData) setPatients(patientsData);
            } catch (error) {
                console.error("Failed to fetch Maternity dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedHospitalId, userRole]);

    const filteredPatients = patients.filter(p =>
        p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.uhid?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (['superadmin', 'superadmin_staff', 'website_admin'].includes(userRole) && !selectedHospitalId) {
        return <HospitalSelectionPrompt storageKey="hospital_id" onSelect={(id) => setSelectedHospitalId(id)} />;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Baby className="h-8 w-8 text-pink-600" />
                        Maternity & Obstetrics
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage ANC visits, deliveries, and newborn records</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => router.push('/hospital/patients')} className="bg-pink-600 hover:bg-pink-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Add Maternity Patient
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Maternity Patients</p>
                                <h3 className="text-2xl font-bold mt-2">{patients.length}</h3>
                            </div>
                            <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center">
                                <User className="h-6 w-6 text-pink-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">High Risk Pregnancies</p>
                                <h3 className="text-2xl font-bold mt-2">{patients.filter(p => p.high_risk).length}</h3>
                            </div>
                            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                                <Activity className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-sm ring-1 ring-border/50">
                <CardHeader className="bg-muted/30 border-b pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Registered Patients</CardTitle>
                            <CardDescription>All pregnant patients in care</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search patients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-background"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Patient</th>
                                    <th className="px-6 py-4 font-semibold">UHID</th>
                                    <th className="px-6 py-4 font-semibold">LMP</th>
                                    <th className="px-6 py-4 font-semibold">EDD</th>
                                    <th className="px-6 py-4 font-semibold">Risk Level</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mr-2"></div>
                                                Loading...
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredPatients.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                            No patients found. Add a patient from the main patient registry first.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPatients.map((patient) => (
                                        <tr key={patient.maternity_id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {patient.patient_name}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{patient.uhid}</td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {patient.lmp ? new Date(patient.lmp).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                {patient.edd ? new Date(patient.edd).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {patient.high_risk ? (
                                                    <Badge variant="destructive" className="bg-red-100 text-red-800">High Risk</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-0">Normal</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                                                    onClick={() => router.push(`/hospital/maternity/patients/${patient.maternity_id}`)}
                                                >
                                                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
