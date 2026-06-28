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
import { API_URL, apiFetch } from '@/config/api';
import { formatDate } from '@/lib/dateFormatter';
import PatientDetail from './components/PatientDetail';
import HospitalSelectionPrompt from '@/components/HospitalSelectionPrompt';
import toast from 'react-hot-toast';
// import AppointmentModal from './components/AppointmentModal'; // Deprecated

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
    const [userRole, setUserRole] = useState<string>('');
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

    // handleScheduleAppointment was removed as scheduling is now centralized.

    const fetchNextIds = async () => {
        try {
            const data = await apiFetch(`dental/next-ids`);
            if (data) {
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
            const data = await apiFetch(`dental/check/uhid/${uhid}`);
            if (data && data.exists) {
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
                toast.error(`✨ Patient found! Details from ${data.source} records have been auto-filled.`);
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
            const res = await apiFetch(`dental/patients/${patientId}`, {
                method: 'DELETE'
            });

            if (res === null) {
                setPatients(patients.filter(p => p.patient_id !== patientId));
                if (selectedPatient?.patient_id === patientId) setSelectedPatient(null);
                toast.success("Patient deleted successfully.");
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.message || "Error deleting patient.");
        }
    };

    const handleCreatePatient = async () => {
        if (!newPatientData.full_name || !newPatientData.phone) {
            toast.error("Please fill in required fields.");
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
                ? `dental/patients/${editingId}`
                : `dental/patients`;

            const method = editingId ? 'PUT' : 'POST';

            const data = await apiFetch(url, {
                method: method,
                body: JSON.stringify(payload)
            });

            if (data) {
                if (editingId) {
                    setPatients(patients.map(p => p.patient_id === editingId ? data : p));
                    toast.success("Patient updated successfully!");
                } else {
                    setPatients([data, ...patients]);
                    toast.success("Patient registered successfully!");
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
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "An error occurred while registering patient.");
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
        { label: "Today's Appointments", value: dentalStats.today_appointments, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", gradient: "from-blue-50 to-blue-100/60", border: "border-blue-200/50" },
        { label: "Total Patients", value: dentalStats.total_patients, icon: User, color: "text-teal-600", bg: "bg-teal-50", gradient: "from-teal-50 to-teal-100/60", border: "border-teal-200/50" },
        { label: "New Cases (Week)", value: dentalStats.new_cases_week, icon: Activity, color: "text-violet-600", bg: "bg-violet-50", gradient: "from-violet-50 to-violet-100/60", border: "border-violet-200/50" },
        { label: "Pending Plans", value: dentalStats.pending_plans, icon: FileText, color: "text-amber-600", bg: "bg-amber-50", gradient: "from-amber-50 to-amber-100/60", border: "border-amber-200/50" },
    ];

    useEffect(() => {
        const role = localStorage.getItem('userRole') || '';
        setUserRole(role);
        const saved = localStorage.getItem('dental_hospital_id');
        if (saved) setSelectedHospitalId(Number(saved));

        const handleHospitalChanged = (e: any) => {
            if (e.detail?.storageKey === 'dental_hospital_id') {
                setSelectedHospitalId(e.detail.hospitalId ? Number(e.detail.hospitalId) : null);
            } else if (typeof e.detail === 'string' || typeof e.detail === 'number') {
                setSelectedHospitalId(e.detail ? Number(e.detail) : null);
            }
        };
        window.addEventListener('hospitalChanged', handleHospitalChanged);
        return () => window.removeEventListener('hospitalChanged', handleHospitalChanged);
    }, []);

    useEffect(() => {
        // Block fetching if superadmin hasn't selected a hospital
        if (['superadmin', 'superadmin_staff', 'website_admin'].includes(userRole) && !selectedHospitalId) {
            setLoading(false);
            return;
        }

        // Fetch initial data
        const fetchData = async () => {
            setLoading(true);
            try {
                let suffix = selectedHospitalId ? `?hospital_id=${selectedHospitalId}` : '';
                let ampSuffix = selectedHospitalId ? `&hospital_id=${selectedHospitalId}` : '';
                
                const [patientsData, appointmentsData, statsData] = await Promise.all([
                    apiFetch(`dental/patients${suffix}`),
                    apiFetch(`appointments?date=${new Date().toISOString().split('T')[0]}${ampSuffix}`),
                    apiFetch(`dental/stats${suffix}`)
                ]);

                if (patientsData) setPatients(patientsData);
                if (appointmentsData) setAppointments(appointmentsData);
                if (statsData) setDentalStats(statsData);

            } catch (error) {
                console.error("Failed to fetch dental data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedHospitalId, userRole]);

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

    if (['website_admin', 'superadmin', 'superadmin_staff'].includes(userRole) && !selectedHospitalId) {
        return <HospitalSelectionPrompt requiredModule="dental" storageKey="dental_hospital_id" onSelect={setSelectedHospitalId} />;
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dental Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage your patients, appointments, and treatment plans.</p>
                </div>
                <div className="flex items-center gap-3">
                    {['website_admin', 'superadmin', 'superadmin_staff'].includes(userRole) && selectedHospitalId && (
                        <Button
                            onClick={() => {
                                setSelectedHospitalId(null);
                                localStorage.removeItem('dental_hospital_id');
                            }}
                            variant="outline"
                            className="gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                        >
                            Change Hospital
                        </Button>
                    )}
                    <Button onClick={() => setShowNewPatientModal(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm text-white hidden sm:flex">
                        <User className="w-4 h-4 mr-2" /> Register Patient
                    </Button>
                    <Button
                        onClick={() => router.push('/hospital/records')}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm text-white hidden sm:flex"
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Visit
                    </Button>
                    <Button
                        onClick={() => router.push('/hospital/appointments')}
                        variant="outline"
                        className="gap-2 bg-white shadow-sm border-slate-200"
                    >
                        <Calendar className="w-4 h-4 text-slate-500" /> Appointments
                    </Button>
                </div>
            </div>

            {/* Appointment Modal moved to Centralized Dashboard */}

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
                    <Card key={i} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border bg-gradient-to-br", stat.gradient, stat.border)}>
                                    <stat.icon size={24} strokeWidth={2.5} className={stat.color} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none">{stat.value}</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{stat.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area: Patients & Search */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-white pb-4 border-b border-slate-100 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900">Patients Directory</CardTitle>
                                    <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage and view patient records</CardDescription>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Search patients..."
                                        className="pl-10 h-11 bg-white border-slate-200 shadow-sm rounded-full focus-visible:ring-indigo-500 font-medium"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {loading ? (
                                    <div className="p-12 text-center flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-4"></div>
                                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading patients...</p>
                                    </div>
                                ) : filteredPatients.length > 0 ? (
                                    filteredPatients.map(patient => (
                                        <div
                                            key={patient.patient_id}
                                            onClick={() => setSelectedPatient(patient)}
                                            className="list-item-card group border-b border-slate-100 last:border-0"
                                        >
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="avatar-square">
                                                    {patient.full_name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                                                        {patient.full_name}
                                                    </h3>
                                                    <div className="meta-text-container uppercase tracking-wider text-[11px] font-bold">
                                                        <span className="flex items-center gap-1.5">
                                                            <Phone className="w-3.5 h-3.5 text-slate-300" /> {patient.phone}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-slate-300" /> Last Visit: {patient.last_visit || 'Never'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200/60 font-bold px-3 py-1 rounded-lg">
                                                    {patient.status || 'Active'}
                                                </Badge>
                                                <div className="flex items-center gap-2">
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all text-slate-400 hover:text-slate-700">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                                <DropdownMenuItem onClick={() => handleEditPatient(patient)} className="font-medium text-slate-700 focus:bg-slate-50 cursor-pointer">
                                                                    <Edit className="mr-2 h-4 w-4 text-slate-400" /> Edit Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={(e) => handleDeletePatient(e, patient.patient_id)}
                                                                    className="text-red-600 focus:text-red-700 focus:bg-red-50 font-medium cursor-pointer"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors hidden sm:block" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-16 text-center flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-3xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center mb-4">
                                            <Search className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">No patients found</h3>
                                        <p className="text-sm font-medium text-slate-500">We couldn't find any patients matching your search criteria.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-3xl border border-slate-200/60 shadow-sm bg-white overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <CardTitle className="text-lg font-black text-slate-900">Appointments</CardTitle>
                                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Today's Schedule</CardDescription>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {appointments.length > 0 ? appointments.map(apt => (
                                    <div
                                        key={apt.appointment_id || apt.id} 
                                        onClick={() => {
                                            const targetId = apt.patient_id;
                                            let p = patients.find(p => p.patient_id === targetId || p.record_id === targetId || p.main_patient_id === targetId);
                                            
                                            if (!p && apt.patient) {
                                                p = { ...apt.patient, patient_id: apt.patient.record_id || targetId };
                                            }
                                            
                                            if (p) {
                                                setSelectedPatient(p);
                                            } else {
                                                toast.error("Patient record not found. Please search in the Patients Directory.");
                                            }
                                        }}
                                        className="p-5 hover:bg-slate-50/80 transition-colors group relative overflow-hidden cursor-pointer"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex justify-between items-start mb-2 pl-2">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                                                <Clock className="w-3 h-3" />
                                                {apt.start_time ? new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : apt.time}
                                            </div>
                                            <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold border-slate-200 text-slate-500">
                                                {apt.status}
                                            </Badge>
                                        </div>
                                        <div className="pl-2 flex items-center justify-between">
                                            <div>
                                                <h5 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">{apt.patient?.full_name || apt.patient_name || apt.patient}</h5>
                                                <p className="text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">{apt.purpose || apt.type}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all text-indigo-600 hover:bg-indigo-100 shrink-0">
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-10 text-center flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                                            <Calendar className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No appointments today</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                                <Button variant="outline" className="w-full bg-white border-slate-200 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-bold gap-2 rounded-xl h-11 transition-all" onClick={() => router.push('/hospital/appointments')}>
                                    View Full Calendar <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}

