"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon, Clock, User, Filter, RefreshCcw, Building2, Edit, Trash2 } from 'lucide-react';
import { API_URL, apiFetch } from '@/config/api';
import CreateAppointmentModal from './components/CreateAppointmentModal';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export default function AppointmentsDashboard() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);

    // Filters
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
    const [isFollowUpFilter, setIsFollowUpFilter] = useState<boolean>(false);
    const [showAllDates, setShowAllDates] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<"day" | "week">("day");

    const [isLoading, setIsLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<any>(null);

    const [userProfile, setUserProfile] = useState<any>(null);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

    const loadFilters = async () => {
        try {
            let deptUrl = 'appointments/departments';
            let docUrl = 'appointments/doctors';

            if (selectedHospitalId) {
                deptUrl += `?hospital_id=${selectedHospitalId}`;
                docUrl += `?hospital_id=${selectedHospitalId}`;
            } else if (['superadmin', 'superadmin_staff', 'website_admin', 'website_staff'].includes(userProfile?.role)) {
                // If platform admin hasn't selected a hospital, don't load filters yet or load all?
                // Usually we want to force selection.
                setDepartments([]);
                setDoctors([]);
                return;
            }

            const [deptsRes, docsRes] = await Promise.all([
                apiFetch(deptUrl),
                apiFetch(docUrl)
            ]);
            if (deptsRes) setDepartments(deptsRes);
            if (docsRes) setDoctors(docsRes);
        } catch (error) {
            console.error("Error loading filters:", error);
        }
    };

    const loadAppointments = async () => {
        setIsLoading(true);
        try {
            let url = `/appointments`;
            const params: string[] = [];
            if (!showAllDates && selectedDate) {
                params.push(`date=${selectedDate}`);
            }
            if (selectedDepartment !== "all") params.push(`department_id=${selectedDepartment}`);
            if (selectedDoctor !== "all") params.push(`doctor_id=${selectedDoctor}`);
            if (isFollowUpFilter) params.push(`is_follow_up=true`);

            if (selectedHospitalId) {
                params.push(`hospital_id=${selectedHospitalId}`);
            } else if (['superadmin', 'superadmin_staff', 'website_admin', 'website_staff'].includes(userProfile?.role)) {
                setAppointments([]);
                setIsLoading(false);
                return;
            }

            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }

            const data = await apiFetch(url);
            if (data) {
                setAppointments(data);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const data = await apiFetch(`users/me`);
            if (data) {
                setUserProfile(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchHospitals = async () => {
        try {
            const data = await apiFetch(`hospitals/`);
            if (data) setHospitals(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (userProfile) {
            if (['website_admin', 'website_staff', 'superadmin', 'superadmin_staff'].includes(userProfile.role)) {
                // Platform Admins rely on global state
                const saved = localStorage.getItem('globalHospitalId');
                if (saved) {
                    setSelectedHospitalId(Number(saved));
                }
            } else {
                if (userProfile.hospital_id) {
                    setSelectedHospitalId(userProfile.hospital_id);
                }
            }
        }
    }, [userProfile]);

    useEffect(() => {
        const handleHospitalChanged = (e: any) => {
            if (['website_admin', 'website_staff', 'superadmin', 'superadmin_staff'].includes(userProfile?.role)) {
                const val = e.detail;
                setSelectedHospitalId(val ? Number(val) : null);
            }
        };

        window.addEventListener('hospitalChanged', handleHospitalChanged);
        return () => window.removeEventListener('hospitalChanged', handleHospitalChanged);
    }, [userProfile]);

    useEffect(() => {
        if (selectedHospitalId) {
            loadFilters();
            loadAppointments();
        }
    }, [selectedHospitalId, selectedDate, showAllDates, selectedDepartment, selectedDoctor, isFollowUpFilter]);

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            await apiFetch(`appointments/${id}/status?status=${newStatus}`, { method: 'PUT' });
            loadAppointments();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this appointment?")) {
            try {
                await apiFetch(`appointments/${id}`, { method: 'DELETE' });
                loadAppointments();
            } catch (error) {
                console.error("Error deleting appointment:", error);
                alert("Failed to delete appointment.");
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-100 font-bold px-3 py-1 rounded-xl';
            case 'arrived': return 'bg-amber-50 text-amber-700 border-amber-100 font-bold px-3 py-1 rounded-xl';
            case 'in-consultation': return 'bg-purple-50 text-purple-700 border-purple-100 font-bold px-3 py-1 rounded-xl';
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 rounded-xl';
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100 font-bold px-3 py-1 rounded-xl';
            case 'no-show': return 'bg-slate-50 text-slate-400 border-slate-200 font-bold px-3 py-1 rounded-xl';
            default: return 'bg-slate-50 text-slate-600 border-slate-200 font-bold px-3 py-1 rounded-xl';
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto pb-24 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Appointments</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage hospital-wide schedules and patient flow</p>
                </div>
                <Button
                    onClick={() => { setEditingAppointment(null); setIsCreateModalOpen(true); }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl h-11 px-6 shadow-lg shadow-indigo-600/10 transition-all gap-2"
                >
                    <Plus className="w-5 h-5" /> New Appointment
                </Button>
            </div>

            <Card className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-100/50 overflow-hidden">
                <CardHeader className="border-b border-slate-100/80 p-6 bg-slate-50/30">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                        <div className="flex gap-4 flex-wrap w-full md:w-auto">
                            <div className="w-full sm:w-48">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Date</label>
                                    <label className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={showAllDates} 
                                            onChange={(e) => setShowAllDates(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                        />
                                        All Dates
                                    </label>
                                </div>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    disabled={showAllDates}
                                    className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl h-11 font-medium px-4 disabled:opacity-50"
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Department</label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl h-11 font-medium">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-xl shadow-xl">
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map((d: any) => (
                                            <SelectItem key={d.department_id} value={d.department_id.toString()}>
                                                {d.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-48">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Doctor</label>
                                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                    <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl h-11 font-medium">
                                        <SelectValue placeholder="All Doctors" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-xl shadow-xl">
                                        <SelectItem value="all">All Doctors</SelectItem>
                                        {doctors.map((d: any) => (
                                            <SelectItem key={d.user_id} value={d.user_id.toString()}>
                                                Dr. {d.full_name} ({departments.find(dept => dept.department_id === d.department_id)?.name || 'Unknown'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-auto flex items-end mb-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer bg-slate-50/50 hover:bg-slate-100 border border-slate-200 px-4 h-11 rounded-xl transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={isFollowUpFilter}
                                        onChange={(e) => setIsFollowUpFilter(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    Follow Up Only
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto justify-end">
                            <Button
                                variant="outline"
                                onClick={loadAppointments}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50 bg-white font-bold h-11 rounded-xl px-5 transition-all gap-2"
                                disabled={isLoading}
                            >
                                <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50/70 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Patient Details</th>
                                    <th className="px-6 py-4">Department / Doctor</th>
                                    <th className="px-6 py-4">Reason / Notes</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <CalendarIcon className="w-6 h-6" />
                                                </div>
                                                <p className="text-slate-400 font-semibold text-sm max-w-sm mx-auto">
                                                    {isLoading ? "Loading appointments..." : "No appointments scheduled for this date and filter criteria."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((appt) => (
                                        <tr key={appt.appointment_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-900 font-bold">
                                                    <Clock className="w-4 h-4 text-indigo-500" />
                                                    {format(parseISO(appt.start_time), 'hh:mm a')}
                                                    <span className="text-slate-400 text-xs font-semibold"> - {format(parseISO(appt.end_time), 'hh:mm a')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    <span className="inline-flex items-center bg-indigo-50/80 text-indigo-700 border border-indigo-100/60 px-3 py-1.5 rounded-xl font-bold text-xs tracking-wide">
                                                        Patient ID #{appt.patient_id}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                            {appt.visit_type || 'OPD'}
                                                        </span>
                                                        {appt.is_follow_up && (
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                                                Follow Up
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                        <span>Dr. {doctors.find(d => d.user_id === appt.doctor_id)?.full_name || 'Unknown'}</span>
                                                    </div>
                                                    <div className="text-xs font-semibold text-slate-400 ml-6">
                                                        {departments.find(d => d.department_id === appt.department_id)?.name || 'Unknown Dept'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-[200px] truncate text-slate-700 font-medium">
                                                    {appt.reason_for_visit || '-'}
                                                </div>
                                                {appt.notes && (
                                                    <div className="text-xs text-slate-400 font-semibold truncate mt-1">
                                                        {appt.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={getStatusColor(appt.status)}>
                                                    {appt.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                {appt.status === 'Scheduled' && (
                                                    <Button size="sm" onClick={() => handleStatusUpdate(appt.appointment_id, 'Arrived')} className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50 rounded-xl font-bold text-xs">
                                                        Mark Arrived
                                                    </Button>
                                                )}
                                                {appt.status === 'Arrived' && (
                                                    <Button size="sm" onClick={() => handleStatusUpdate(appt.appointment_id, 'In-Consultation')} className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/50 rounded-xl font-bold text-xs">
                                                        Start Consult
                                                    </Button>
                                                )}
                                                {appt.status === 'In-Consultation' && (
                                                    <Button size="sm" onClick={() => handleStatusUpdate(appt.appointment_id, 'Completed')} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 rounded-xl font-bold text-xs">
                                                        Complete
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" onClick={() => { setEditingAppointment(appt); setIsCreateModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl p-2 h-9 w-9">
                                                    <Edit className="w-4.5 h-4.5" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(appt.appointment_id)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl p-2 h-9 w-9">
                                                    <Trash2 className="w-4.5 h-4.5" />
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

            <CreateAppointmentModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setEditingAppointment(null); }}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    setEditingAppointment(null);
                    loadAppointments();
                }}
                departments={departments}
                doctors={doctors}
                appointmentToEdit={editingAppointment}
            />
        </div>
    );
}
