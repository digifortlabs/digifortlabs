"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon, Clock, User, Filter, RefreshCcw } from 'lucide-react';
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
    const [viewMode, setViewMode] = useState<"day" | "week">("day");

    const [isLoading, setIsLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const loadFilters = async () => {
        try {
            const [deptsRes, docsRes] = await Promise.all([
                apiFetch('appointments/departments'),
                apiFetch('appointments/doctors')
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
            let url = `appointments?date=${selectedDate}`;
            if (selectedDepartment !== "all") url += `&department_id=${selectedDepartment}`;
            if (selectedDoctor !== "all") url += `&doctor_id=${selectedDoctor}`;

            // if week view, we would query range, but for now simple day query
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

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        loadAppointments();
    }, [selectedDate, selectedDepartment, selectedDoctor]);

    const handleStatusUpdate = async (id: number, newStatus: string) => {
        try {
            await apiFetch(`appointments/${id}/status?status=${newStatus}`, { method: 'PUT' });
            loadAppointments();
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'scheduled': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'arrived': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'in-consultation': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'no-show': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            default: return 'bg-slate-800 text-slate-300 border-slate-700';
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Appointments</h1>
                    <p className="text-slate-400 mt-1">Manage hospital-wide schedules and patient flow</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Appointment
                </Button>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 pb-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="flex gap-4 flex-wrap">
                            <div className="w-48">
                                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                            <div className="w-48">
                                <label className="text-xs text-slate-400 mb-1 block">Department</label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map((d: any) => (
                                            <SelectItem key={d.department_id} value={d.department_id.toString()}>
                                                {d.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-48">
                                <label className="text-xs text-slate-400 mb-1 block">Doctor</label>
                                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="All Doctors" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="all">All Doctors</SelectItem>
                                        {doctors.map((d: any) => (
                                            <SelectItem key={d.user_id} value={d.user_id.toString()}>
                                                Dr. {d.full_name} ({departments.find(dept => dept.department_id === d.department_id)?.name || 'Unknown'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button
                                variant="outline"
                                onClick={loadAppointments}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                disabled={isLoading}
                            >
                                <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Time</th>
                                    <th className="px-6 py-4 font-medium">Patient Details</th>
                                    <th className="px-6 py-4 font-medium">Department / Doctor</th>
                                    <th className="px-6 py-4 font-medium">Reason / Notes</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            {isLoading ? "Loading appointments..." : "No appointments scheduled for this date and filter criteria."}
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((appt) => (
                                        <tr key={appt.appointment_id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <Clock className="w-4 h-4 text-emerald-500" />
                                                    {format(parseISO(appt.start_time), 'hh:mm a')}
                                                    <span className="text-slate-500 text-xs"> - {format(parseISO(appt.end_time), 'hh:mm a')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">Patient Record #{appt.patient_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                        <span className="font-medium">Dr. {doctors.find(d => d.user_id === appt.doctor_id)?.full_name || 'Unknown'}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 ml-6">
                                                        {departments.find(d => d.department_id === appt.department_id)?.name || 'Unknown Dept'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-[200px] truncate text-slate-300">
                                                    {appt.reason_for_visit || '-'}
                                                </div>
                                                {appt.notes && (
                                                    <div className="text-xs text-slate-500 truncate mt-1">
                                                        {appt.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={getStatusColor(appt.status)}>
                                                    {appt.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {appt.status === 'Scheduled' && (
                                                    <Button size="sm" onClick={() => handleStatusUpdate(appt.appointment_id, 'Arrived')} className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30">
                                                        Mark Arrived
                                                    </Button>
                                                )}
                                                {appt.status === 'Arrived' && (
                                                    <Button size="sm" onClick={() => handleStatusUpdate(appt.appointment_id, 'In-Consultation')} className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                                                        Start Consult
                                                    </Button>
                                                )}
                                                {appt.status === 'In-Consultation' && (
                                                    <Button size="sm" onClick={() => handleStatusUpdate(appt.appointment_id, 'Completed')} className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30">
                                                        Complete
                                                    </Button>
                                                )}
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
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    loadAppointments();
                }}
                departments={departments}
                doctors={doctors}
            />
        </div>
    );
}
