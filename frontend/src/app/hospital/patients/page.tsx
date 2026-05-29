"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Plus, Calendar, Activity, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useTerminology } from '@/hooks/useTerminology';
import CreateAppointmentModal from '../appointments/components/CreateAppointmentModal';

export default function PatientsDirectory() {
    const router = useRouter();
    const { terms } = useTerminology();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [hospitalId, setHospitalId] = useState<string | null>(null);

    // Appointment Modal State
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState<string>('');
    const [departments, setDepartments] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);

    useEffect(() => {
        const id = localStorage.getItem('hospital_id');
        setHospitalId(id);
        fetchPatients(id, '');
        if (id) {
            loadFilters(id);
        }

        const handlePatientRegistered = () => {
            fetchPatients(id, searchTerm);
        };
        
        window.addEventListener('patient-registered', handlePatientRegistered);
        return () => window.removeEventListener('patient-registered', handlePatientRegistered);
    }, [searchTerm]);

    const loadFilters = async (hId: string) => {
        try {
            const [deptsRes, docsRes] = await Promise.all([
                apiFetch(`appointments/departments?hospital_id=${hId}`),
                apiFetch(`appointments/doctors?hospital_id=${hId}`)
            ]);
            if (deptsRes) setDepartments(deptsRes);
            if (docsRes) setDoctors(docsRes);
        } catch (error) {
            console.error("Error loading filters:", error);
        }
    };

    const fetchPatients = async (hId: string | null, search: string) => {
        setLoading(true);
        try {
            let url = 'patients/?';
            if (hId) url += `hospital_id=${hId}&`;
            if (search) url += `q=${encodeURIComponent(search)}&`;
            
            const data = await apiFetch(url);
            setPatients(Array.isArray(data) ? data : (data?.items || []));
        } catch (e) {
            console.error("Failed to load patients", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPatients(hospitalId, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, hospitalId]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Users className="text-blue-600 w-8 h-8" /> 
                        {terms.patient} Directory
                    </h1>
                    <p className="text-slate-500 mt-1">View profiles and full medical timelines for all {terms.patient.toLowerCase()}s.</p>
                </div>
                <Button 
                    onClick={() => window.dispatchEvent(new CustomEvent('open-global-patient-register'))}
                    className="bg-blue-600 hover:bg-blue-700 shadow-sm gap-2"
                >
                    <Plus size={16} /> Register New {terms.patient}
                </Button>
            </div>

            <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder={`Search by Name, ${terms.mrd} Number, or Phone...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white border-slate-200"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500 animate-pulse flex flex-col items-center">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                            Loading {terms.patient.toLowerCase()} records...
                        </div>
                    ) : patients.length > 0 ? (
                        patients.map(patient => (
                            <div 
                                key={patient.record_id}
                                onClick={() => router.push(`/hospital/patients/${patient.record_id}`)}
                                className="p-4 sm:p-5 hover:bg-blue-50/50 cursor-pointer transition-colors group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-black text-lg shadow-sm border border-blue-200/50 group-hover:scale-105 transition-transform">
                                        {patient.full_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">
                                            {patient.full_name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                                            <span className="font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs">{terms.mrd}: {patient.mrd_number}</span>
                                            {patient.phone && <span>{patient.phone}</span>}
                                            {patient.age && <span>{/^\d+$/.test(patient.age.trim()) ? `${patient.age} yrs` : patient.age}</span>}
                                            {patient.gender && <span className="capitalize">{patient.gender}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="hidden sm:flex border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 font-bold bg-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPatientForAppointment(patient.record_id.toString());
                                            setIsAppointmentModalOpen(true);
                                        }}
                                    >
                                        <Calendar size={14} />
                                        Add Appointment
                                    </Button>
                                    <div className="hidden sm:flex text-xs text-slate-400 font-medium">
                                        View Profile & Timeline
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-300 group-hover:bg-blue-50 transition-colors shadow-sm">
                                        <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-16 text-center">
                            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-700">No {terms.patient.toLowerCase()}s found</h3>
                            <p className="text-slate-500 text-sm mt-1">Try adjusting your search query or register a new {terms.patient.toLowerCase()}.</p>
                        </div>
                    )}
                </div>
            </Card>

            {isAppointmentModalOpen && (
                <CreateAppointmentModal
                    isOpen={isAppointmentModalOpen}
                    onClose={() => setIsAppointmentModalOpen(false)}
                    onSuccess={() => {
                        setIsAppointmentModalOpen(false);
                    }}
                    departments={departments}
                    doctors={doctors}
                    initialPatientId={selectedPatientForAppointment}
                />
            )}
        </div>
    );
}
