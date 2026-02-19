"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Calendar, User, Activity,
    ChevronRight, Clock, MapPin, Phone,
    Filter, LayoutGrid, List, MoreVertical,
    FileText, Zap, ChevronLeft, X,
    Trash2, Edit
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
import { API_URL } from '@/config/api';
import { formatDate } from '@/lib/dateFormatter';
import PatientDetail from './components/PatientDetail';
import AppointmentModal from './components/AppointmentModal';

// --- Components ---
// I will create these shortly as separate files if they get complex
// For now, I'll define basic structure here or create empty placeholders

export default function DentalDashboard() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [showNewPatientModal, setShowNewPatientModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newPatientData, setNewPatientData] = useState({
        full_name: '',
        phone: '',
        email: '',
        gender: '',
        date_of_birth: '',
        address: '',
        uhid: '',
        opd_number: '',
        medical_history: '',
        allergies: '',
        medications: '',
        chief_complaint: ''
    });
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleScheduleAppointment = async (apt: any) => {
        setIsSaving(true);
        try {
            // Transform to backend schema
            const [year, month, day] = apt.date.split('-').map(Number);
            const [hours, minutes] = apt.time.split(':').map(Number);
            const startTime = new Date(year, month - 1, day, hours, minutes);
            const endTime = new Date(startTime.getTime() + 30 * 60000); // Default 30 min

            const response = await fetch(`${API_URL}/dental/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    patient_id: apt.patient_id, // We need to add this to the modal callback
                    doctor_name: "Dr. Himani Desai", // Default or from modal
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    purpose: apt.type,
                    status: "scheduled"
                })
            });

            if (response.ok) {
                const newApt = await response.json();
                setAppointments(prev => [newApt, ...prev]);
                setShowAppointmentModal(false);
                alert("Appointment scheduled successfully!");
            } else {
                alert("Failed to schedule appointment.");
            }
        } catch (error) {
            console.error("Schedule error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const fetchNextIds = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/dental/next-ids`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNewPatientData(prev => ({
                    ...prev,
                    uhid: data.next_uhid,
                    opd_number: data.next_opd
                }));
            }
        } catch (error) {
            console.error("Failed to fetch next IDs:", error);
        }
    };

    const handleNameSearch = (val: string) => {
        setNewPatientData(prev => ({ ...prev, full_name: val }));
        if (val.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const matches = patients.filter(p =>
            p.full_name?.toLowerCase().includes(val.toLowerCase()) ||
            p.uhid?.toLowerCase().includes(val.toLowerCase()) ||
            p.phone?.includes(val)
        ).slice(0, 5);

        setSuggestions(matches);
        setShowSuggestions(true);
    };

    const handleSelectPatient = (p: any) => {
        setNewPatientData({
            full_name: p.full_name || '',
            phone: p.phone || '',
            email: p.email || '',
            gender: p.gender || '',
            date_of_birth: p.date_of_birth ? p.date_of_birth.split('T')[0] : '',
            address: p.address || '',
            uhid: p.uhid || '',
            opd_number: p.opd_number || '',
            medical_history: p.medical_history || '',
            allergies: p.allergies || '',
            medications: p.medications || '',
            chief_complaint: p.chief_complaint || ''
        });
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const checkExistingUHID = async (uhid: string) => {
        if (!uhid || uhid.length < 3) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/dental/check/uhid/${uhid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.exists) {
                    const p = data.patient;
                    setNewPatientData(prev => ({
                        ...prev,
                        full_name: p.full_name || prev.full_name,
                        phone: p.phone || prev.phone,
                        email: p.email || prev.email,
                        gender: p.gender || prev.gender,
                        date_of_birth: p.date_of_birth ? p.date_of_birth.split('T')[0] : prev.date_of_birth,
                        address: p.address || prev.address,
                        medical_history: p.medical_history || prev.medical_history,
                        allergies: p.allergies || prev.allergies,
                        medications: p.medications || prev.medications,
                        chief_complaint: p.chief_complaint || prev.chief_complaint
                    }));
                    alert(`✨ Patient found! Details from ${data.source} records have been auto-filled.`);
                }
            }
        } catch (err) {
            console.error("Error checking UHID:", err);
        }
    };

    const handleEditPatient = (patient: any) => {
        setNewPatientData({
            full_name: patient.full_name,
            phone: patient.phone || '',
            email: patient.email || '',
            gender: patient.gender || '',
            date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
            address: patient.address || '',
            uhid: patient.uhid || '',
            opd_number: patient.opd_number || '',
            medical_history: patient.medical_history || '',
            allergies: patient.allergies || '',
            medications: patient.medications || '',
            chief_complaint: patient.chief_complaint || ''
        });
        setEditingId(patient.patient_id);
        setShowNewPatientModal(true);
    };

    const handleDeletePatient = async (e: React.MouseEvent, patientId: number) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm("Are you sure you want to delete this patient?")) return;

        try {
            const res = await fetch(`${API_URL}/dental/patients/${patientId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.ok) {
                setPatients(patients.filter(p => p.patient_id !== patientId));
                if (selectedPatient?.patient_id === patientId) setSelectedPatient(null);
                alert("Patient deleted successfully.");
            } else {
                alert("Failed to delete patient.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error deleting patient.");
        }
    };

    const handleCreatePatient = async () => {
        if (!newPatientData.full_name || !newPatientData.phone) {
            alert("Please fill in required fields.");
            return;
        }

        setIsSaving(true);
        try {
            // Sanitize Payload
            const payload = {
                ...newPatientData,
                date_of_birth: newPatientData.date_of_birth ? new Date(newPatientData.date_of_birth).toISOString() : null,
                email: newPatientData.email || null,
                gender: newPatientData.gender || null
            };

            const url = editingId
                ? `${API_URL}/dental/patients/${editingId}`
                : `${API_URL}/dental/patients`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const savedPatient = await res.json();

                if (editingId) {
                    setPatients(patients.map(p => p.patient_id === editingId ? savedPatient : p));
                    alert("Patient updated successfully!");
                } else {
                    setPatients([savedPatient, ...patients]);
                    alert("Patient registered successfully!");
                }

                setShowNewPatientModal(false);
                setEditingId(null);
                setNewPatientData({
                    full_name: '',
                    phone: '',
                    email: '',
                    gender: '',
                    date_of_birth: '',
                    address: '',
                    uhid: '',
                    opd_number: '',
                    medical_history: '',
                    allergies: '',
                    medications: '',
                    chief_complaint: ''
                });
            } else {
                const errData = await res.json();
                alert(`Failed to register patient: ${errData.detail || "Unknown error"}`);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while registering patient.");
        } finally {
            setIsSaving(false);
        }
    };

    const [dentalStats, setDentalStats] = useState({
        today_appointments: 0,
        total_patients: 0,
        new_cases_week: 0,
        pending_plans: 0
    });

    // Stats
    const stats_items = [
        { label: "Today's Appointments", value: dentalStats.today_appointments, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Total Patients", value: dentalStats.total_patients, icon: User, color: "text-teal-600", bg: "bg-teal-50" },
        { label: "New Cases (Week)", value: dentalStats.new_cases_week, icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Pending Plans", value: dentalStats.pending_plans, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
    ];

    useEffect(() => {
        // Fetch initial data
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const [patientsRes, appointmentsRes, statsRes] = await Promise.all([
                    fetch(`${API_URL}/dental/patients`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_URL}/dental/appointments`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_URL}/dental/stats`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (patientsRes.ok) setPatients(await patientsRes.json());
                if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
                if (statsRes.ok) setDentalStats(await statsRes.json());

            } catch (error) {
                console.error("Failed to fetch dental data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredPatients = patients.filter(p =>
        (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone || '').includes(searchTerm) ||
        (p.uhid || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedPatient) {
        return (
            <div className="p-6">
                <PatientDetail
                    patient={selectedPatient}
                    onBack={() => setSelectedPatient(null)}
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 bg-slate-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dental Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage your patients, appointments, and treatment plans.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => {
                            setEditingId(null);
                            setNewPatientData({
                                full_name: '',
                                phone: '',
                                email: '',
                                gender: '',
                                date_of_birth: '',
                                address: '',
                                uhid: '',
                                opd_number: '',
                                medical_history: '',
                                allergies: '',
                                medications: '',
                                chief_complaint: ''
                            });
                            setShowNewPatientModal(true);
                            fetchNextIds();
                        }}
                        className="bg-blue-900 hover:bg-blue-800 text-white gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> New Patient
                    </Button>
                    <Button
                        onClick={() => setShowAppointmentModal(true)}
                        variant="outline"
                        className="gap-2 bg-white shadow-sm"
                    >
                        <Calendar className="w-4 h-4" /> Schedule
                    </Button>
                </div>
            </div>

            {/* Appointment Modal */}
            <AppointmentModal
                isOpen={showAppointmentModal}
                onClose={() => setShowAppointmentModal(false)}
                patients={patients}
                onSchedule={handleScheduleAppointment}
            />

            {/* New Patient Modal */}
            {showNewPatientModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>{editingId ? "Edit Dental Patient" : "Register Dental Patient"}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setShowNewPatientModal(false);
                                    setEditingId(null);
                                    setNewPatientData({
                                        full_name: '',
                                        phone: '',
                                        email: '',
                                        gender: '',
                                        date_of_birth: '',
                                        address: '',
                                        uhid: '',
                                        opd_number: '',
                                        medical_history: '',
                                        allergies: '',
                                        medications: '',
                                        chief_complaint: ''
                                    });
                                }}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Tabs defaultValue="general" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="general">General Information</TabsTrigger>
                                    <TabsTrigger value="clinical">Medical Profile</TabsTrigger>
                                </TabsList>

                                <TabsContent value="general" className="space-y-4 pt-2">
                                    <div className="space-y-2 relative">
                                        <Label>Full Name</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                placeholder="Search by name, UHID, or phone"
                                                className="pl-9"
                                                value={newPatientData.full_name}
                                                onChange={(e) => handleNameSearch(e.target.value)}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                                autoComplete="off"
                                            />
                                        </div>
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-40 overflow-y-auto">
                                                {suggestions.map((p, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleSelectPatient(p)}
                                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 transition border-b border-slate-50 last:border-0"
                                                    >
                                                        <p className="font-bold text-slate-800 text-xs">{p.full_name}</p>
                                                        <p className="text-[10px] text-slate-500 flex gap-2">
                                                            <span>{p.uhid ? `UHID:${p.uhid}` : ''}</span>
                                                            <span>• {p.gender}, {p.phone}</span>
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>UHID (Optional)</Label>
                                            <Input
                                                placeholder="e.g. UHID-123456"
                                                value={newPatientData.uhid}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, uhid: e.target.value })}
                                                onBlur={(e) => checkExistingUHID(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>OPD Number</Label>
                                            <Input
                                                placeholder="e.g. OPD-2025/001"
                                                value={newPatientData.opd_number}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, opd_number: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input
                                                placeholder="Phone"
                                                value={newPatientData.phone}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Gender</Label>
                                            <select
                                                className="w-full h-10 px-3 py-2 bg-white border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                value={newPatientData.gender}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, gender: e.target.value })}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Date of Birth</Label>
                                            <Input
                                                type="date"
                                                value={newPatientData.date_of_birth}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, date_of_birth: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email (Optional)</Label>
                                            <Input
                                                placeholder="Email address"
                                                value={newPatientData.email}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Current Address</Label>
                                        <Textarea
                                            placeholder="Patient's residential address"
                                            value={newPatientData.address}
                                            onChange={(e) => setNewPatientData({ ...newPatientData, address: e.target.value })}
                                            className="min-h-[80px]"
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="clinical" className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label>Chief Complaint</Label>
                                        <Textarea
                                            placeholder="Reason for visit (e.g., Pain in upper right molar)"
                                            value={newPatientData.chief_complaint}
                                            onChange={(e) => setNewPatientData({ ...newPatientData, chief_complaint: e.target.value })}
                                            className="min-h-[80px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Medical History</Label>
                                        <Textarea
                                            placeholder="Systemic diseases, past surgeries, etc."
                                            value={newPatientData.medical_history}
                                            onChange={(e) => setNewPatientData({ ...newPatientData, medical_history: e.target.value })}
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Known Allergies</Label>
                                        <Input
                                            placeholder="e.g. Penicillin, Latex, Pollen"
                                            value={newPatientData.allergies}
                                            onChange={(e) => setNewPatientData({ ...newPatientData, allergies: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Current Medications</Label>
                                        <Input
                                            placeholder="e.g. Aspirin 50mg, Insulin"
                                            value={newPatientData.medications}
                                            onChange={(e) => setNewPatientData({ ...newPatientData, medications: e.target.value })}
                                        />
                                    </div>
                                    <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 mt-4">
                                        <p className="text-xs text-blue-700 italic flex items-center gap-2">
                                            <Activity className="w-3 h-3" />
                                            Dental-specific habits and specialized clinical charts can be expanded later in the patient detail view.
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowNewPatientModal(false)}>Cancel</Button>
                            <Button
                                onClick={handleCreatePatient}
                                disabled={isSaving}
                                className="bg-blue-900 text-white hover:bg-blue-800 px-8"
                            >
                                {isSaving ? "Saving..." : (editingId ? "Update Patient" : "Register Patient")}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats_items.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={cn("p-3 rounded-xl", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area: Patients & Search */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-white pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Patients Directory</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search patients..."
                                        className="pl-9 bg-slate-50 border-none focus-visible:ring-blue-500"
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
                                            key={patient.patient_id}
                                            onClick={() => setSelectedPatient(patient)}
                                            className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                                    {patient.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                                                        {patient.full_name}
                                                    </h4>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {patient.phone}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> Last Visit: {patient.last_visit}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">
                                                    {patient.status}
                                                </Badge>
                                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />

                                                <div onClick={(e) => e.stopPropagation()} className="ml-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditPatient(patient)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => handleDeletePatient(e, patient.patient_id)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
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

                {/* Sidebar: Appointments */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Appointments</CardTitle>
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Today</Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {appointments.map(apt => (
                                <div key={apt.appointment_id || apt.id} className="relative pl-4 border-l-2 border-blue-500 py-1">
                                    <div className="text-xs font-bold text-blue-600 mb-1">
                                        {apt.start_time ? new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : apt.time}
                                    </div>
                                    <h5 className="font-semibold text-slate-900 text-sm">{apt.patient?.full_name || apt.patient_name || apt.patient}</h5>
                                    <p className="text-xs text-slate-500">{apt.purpose || apt.type}</p>
                                    <div className="mt-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                        Status: <span className="text-slate-600">{apt.status}</span>
                                    </div>
                                </div>
                            ))}
                            <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs gap-2">
                                View Calendar <ChevronRight className="w-3 h-3" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-blue-900 text-white overflow-hidden relative">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" /> AI Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-blue-100 leading-relaxed">
                                You have 3 pending treatment plans that need approval. Keval Kuvekar's RCT procedure is due for a follow-up today.
                            </p>
                            <Button className="mt-4 w-full bg-white text-blue-900 hover:bg-blue-50 font-semibold border-none">
                                Review Plans
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}
