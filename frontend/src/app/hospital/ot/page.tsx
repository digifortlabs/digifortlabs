"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Calendar, User, Activity,
    ChevronRight, Clock, ShieldCheck,
    Filter, LayoutGrid, List,
    FileText, Zap, ChevronLeft, X,
    Trash2, Edit, Scissors, LogOut, RefreshCw
} from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';
import HospitalSelectionPrompt from '@/components/HospitalSelectionPrompt';

export default function OTDashboard() {
    const router = useRouter();
    const [ots, setOts] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [surgeries, setSurgeries] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [activeTab, setActiveTab] = useState('overview');
    const [userRole, setUserRole] = useState<string>('');
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);

    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [selectedOt, setSelectedOt] = useState<any>(null);
    const [isAddOtOpen, setIsAddOtOpen] = useState(false);
    
    // Forms
    const [assignForm, setAssignForm] = useState({ 
        patient_id: '', surgery_id: '', doctor_id: '', scheduled_start: '', scheduled_end: '',
        current_surgery_name: '', current_anesthesia_type: 'General',
        anesthesiologist_id: '', current_diagnosis: '', special_requirements: ''
    });
    const [otForm, setOtForm] = useState({ ot_name: '', ot_type: 'General' });
    const [patientSearch, setPatientSearch] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');
    const [anesSearch, setAnesSearch] = useState('');

    const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
    const [assessmentTab, setAssessmentTab] = useState('pre');
    const [assessmentSurgeryId, setAssessmentSurgeryId] = useState('');
    const [assessmentSearch, setAssessmentSearch] = useState('');
    
    const [preOpForm, setPreOpForm] = useState({
        bp: '', pulse: '', temp: '', weight: '', allergies: '', comorbidities: '', fitness_status: 'Fit', notes: '', consent_signed: false
    });
    const [postOpForm, setPostOpForm] = useState({
        bp: '', pulse: '', temp: '', recovery_status: 'Stable', notes: ''
    });

    const filteredPatients = patients.filter(p => 
        p.patient_name?.toLowerCase().includes(patientSearch.toLowerCase()) || 
        p.mrd_number?.toLowerCase().includes(patientSearch.toLowerCase())
    );
    
    const filteredAssessmentSurgeries = surgeries.filter(s => 
        s.patient_name?.toLowerCase().includes(assessmentSearch.toLowerCase()) || 
        s.mrd_number?.toLowerCase().includes(assessmentSearch.toLowerCase()) ||
        s.surgery_name?.toLowerCase().includes(assessmentSearch.toLowerCase())
    );
    
    const filteredDoctors = doctors.filter(d => d.full_name?.toLowerCase().includes(doctorSearch.toLowerCase()));
    const filteredAnes = doctors.filter(d => d.full_name?.toLowerCase().includes(anesSearch.toLowerCase()));

    const overviewSurgeries = surgeries.filter(s => 
        s.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.mrd_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.surgery_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const role = localStorage.getItem('userRole') || '';
        setUserRole(role);
        const saved = localStorage.getItem('hms_hospital_id');
        if (saved) setSelectedHospitalId(Number(saved));

        const handleHospitalChanged = (e: any) => {
            if (e.detail?.storageKey === 'hms_hospital_id') {
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
        loadData();
    }, [selectedHospitalId, userRole]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [o, p, d, s] = await Promise.all([
                apiFetch('hms/ots').catch(() => []),
                apiFetch('hms/admissions/active').catch(() => []),
                apiFetch('doctors').catch(() => []),
                apiFetch('hms/surgeries').catch(() => []),
            ]);
            setOts(o || []);
            setPatients(p || []);
            setDoctors(d || []);
            setSurgeries(s || []);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOt = async () => {
        try {
            await apiFetch('hms/ots', { method: 'POST', body: JSON.stringify(otForm) });
            setIsAddOtOpen(false);
            setOtForm({ ot_name: '', ot_type: 'General' });
            loadData();
        } catch (e: any) {
            toast.error(e.message || 'Failed to create OT Room');
        }
    };

    const openScheduleModal = (ot: any) => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localNow = new Date(now.getTime() - tzOffset);
        const startString = localNow.toISOString().slice(0, 16);
        const localEnd = new Date(now.getTime() + 60 * 60000 - tzOffset);
        const endString = localEnd.toISOString().slice(0, 16);

        setAssignForm({ 
            patient_id: '', surgery_id: '', doctor_id: '', scheduled_start: startString, scheduled_end: endString, 
            current_surgery_name: '', current_anesthesia_type: 'General', anesthesiologist_id: '', 
            current_diagnosis: '', special_requirements: '' 
        });
        setSelectedOt(ot);
        setIsAssignOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedOt) return;
        try {
            await apiFetch(`hms/ots/${selectedOt.ot_id}/assign`, {
                method: 'POST',
                body: JSON.stringify({
                    surgery_id: assignForm.surgery_id ? parseInt(assignForm.surgery_id) : null,
                    patient_id: parseInt(assignForm.patient_id),
                    doctor_id: parseInt(assignForm.doctor_id),
                    scheduled_start: assignForm.scheduled_start ? new Date(assignForm.scheduled_start).toISOString() : new Date().toISOString(),
                    scheduled_end: assignForm.scheduled_end ? new Date(assignForm.scheduled_end).toISOString() : null,
                    current_surgery_name: assignForm.current_surgery_name,
                    current_anesthesia_type: assignForm.current_anesthesia_type,
                    anesthesiologist_id: assignForm.anesthesiologist_id ? parseInt(assignForm.anesthesiologist_id) : null,
                    current_diagnosis: assignForm.current_diagnosis,
                    special_requirements: assignForm.special_requirements
                })
            });
            setIsAssignOpen(false);
            loadData();
        } catch (e: any) {
            toast.error(e.message || 'Failed to schedule surgery');
        }
    };

    const openAssessmentModal = (surgeryId = '', type = 'pre') => {
        setAssessmentSurgeryId(surgeryId);
        setAssessmentTab(type);
        setAssessmentSearch('');
        if (surgeryId) {
            const surg = surgeries.find(s => s.surgery_id.toString() === surgeryId);
            if (surg?.pre_op_assessment) setPreOpForm({...preOpForm, ...surg.pre_op_assessment});
            if (surg?.post_op_assessment) setPostOpForm({...postOpForm, ...surg.post_op_assessment});
        } else {
            setPreOpForm({ bp: '', pulse: '', temp: '', weight: '', allergies: '', comorbidities: '', fitness_status: 'Fit', notes: '', consent_signed: false });
            setPostOpForm({ bp: '', pulse: '', temp: '', recovery_status: 'Stable', notes: '' });
        }
        setIsAssessmentOpen(true);
    };

    const handleSaveAssessment = async () => {
        if (!assessmentSurgeryId) return toast.error("Please select a surgery request");
        const surg = surgeries.find(s => s.surgery_id.toString() === assessmentSurgeryId);
        if (!surg) return toast.error("Invalid surgery record");
        
        try {
            if (assessmentTab === 'pre') {
                const updatedPreOp = {...preOpForm, pulse: parseInt(preOpForm.pulse) || 0, temp: parseFloat(preOpForm.temp) || 0, weight: parseFloat(preOpForm.weight) || 0};
                let newStatus = surg.status;
                if (surg.status === 'Requested' || surg.status === 'PAC Pending') {
                    newStatus = updatedPreOp.fitness_status === 'Fit' ? 'PAC Cleared' : 'PAC Pending';
                }
                await apiFetch(`hms/surgeries/${surg.surgery_id}`, {
                    method: 'PATCH', body: JSON.stringify({ pre_op_assessment: updatedPreOp, status: newStatus })
                });
            } else {
                const updatedPostOp = {...postOpForm, pulse: parseInt(postOpForm.pulse) || 0, temp: parseFloat(postOpForm.temp) || 0};
                await apiFetch(`hms/surgeries/${surg.surgery_id}`, {
                    method: 'PATCH', body: JSON.stringify({ post_op_assessment: updatedPostOp })
                });
            }
            toast.success(`${assessmentTab === 'pre' ? 'Pre-Op' : 'Post-Op'} Assessment Saved!`);
            setIsAssessmentOpen(false);
            loadData();
        } catch(e: any) {
            toast.error(e.message || "Failed to save assessment");
        }
    };

    const handleRelease = async (otId: number) => {
        if (!confirm("Are you sure you want to conclude the current surgery and release this OT Room?")) return;
        try {
            await apiFetch(`hms/ots/${otId}/release`, { method: 'POST' });
            loadData();
        } catch (e: any) {
            toast.error(e.message || 'Failed to release OT Room');
        }
    };

    if (['website_admin', 'superadmin', 'superadmin_staff'].includes(userRole) && !selectedHospitalId) {
        return <HospitalSelectionPrompt requiredModule="hms" storageKey="hms_hospital_id" onSelect={setSelectedHospitalId} />;
    }

    const statusColors: Record<string, string> = {
        available: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        in_use: 'bg-rose-50 text-rose-700 border-rose-200',
        maintenance: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    };

    const totalRooms = ots.length;
    const activeSurgeries = ots.filter(o => o.status === 'in_use').length;
    const pendingPACs = surgeries.filter(s => s.status === 'Requested' || s.status === 'PAC Pending').length;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Scissors className="w-8 h-8 text-blue-600" />
                        Operation Theater
                    </h1>
                    <p className="text-slate-500 mt-1">Manage OT scheduling, surgeries, and surgical assessments.</p>
                </div>
                <div className="flex items-center gap-3">
                    {['website_admin', 'superadmin', 'superadmin_staff'].includes(userRole) && selectedHospitalId && (
                        <Button onClick={() => { setSelectedHospitalId(null); localStorage.removeItem('hms_hospital_id'); }} variant="outline" className="gap-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200">
                            Change Hospital
                        </Button>
                    )}
                    <Button variant="outline" onClick={loadData} className="gap-2 bg-white shadow-sm border-slate-200 hidden sm:flex">
                        <RefreshCw className="w-4 h-4 text-slate-500" /> Refresh
                    </Button>
                    <Button onClick={() => openAssessmentModal('', 'pre')} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm text-white hidden sm:flex">
                        <FileText className="w-4 h-4 mr-2" /> Pre/Post-Op Assessment
                    </Button>
                    <Button onClick={() => setIsAddOtOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm text-white hidden sm:flex">
                        <Plus className="w-4 h-4 mr-2" /> Add OT Room
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200/60 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total OT Rooms</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalRooms}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity className="w-5 h-5" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200/60 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Active Surgeries</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeSurgeries}</h3>
                            </div>
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200/60 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Surgery Requests</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">{surgeries.length}</h3>
                            </div>
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><User className="w-5 h-5" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200/60 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pending PACs</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">{patients.filter(p => p.ot_required && !p.pre_op_assessment).length}</h3>
                            </div>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100/50 p-1">
                    <TabsTrigger value="overview">Surgery Requests</TabsTrigger>
                    <TabsTrigger value="surgeries" className="flex items-center gap-2">
                        <Scissors className="w-4 h-4" /> Surgery Schedule
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input placeholder="Search admitted patients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-slate-50 border-transparent focus-visible:bg-white transition-colors" />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <Button variant={viewMode === 'grid' ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? "bg-white shadow-sm" : ""}><LayoutGrid className="w-4 h-4" /></Button>
                                <Button variant={viewMode === 'list' ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? "bg-white shadow-sm" : ""}><List className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                            {overviewSurgeries.map(surgery => (
                                <Card key={surgery.surgery_id} className="group hover:border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer bg-white" onClick={() => openAssessmentModal(surgery.surgery_id.toString(), 'pre')}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-100">
                                                    {surgery.patient_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{surgery.patient_name}</h3>
                                                    <p className="text-sm text-slate-500">MRD: {surgery.mrd_number}</p>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                                                {surgery.status}
                                            </Badge>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <p className="text-sm font-semibold text-slate-800">{surgery.surgery_name}</p>
                                        </div>

                                        <div className="mt-4 space-y-3">
                                            {surgery.pre_op_assessment ? (
                                                <div className={`flex items-center gap-3 text-sm font-medium ${surgery.pre_op_assessment.fitness_status === 'Fit' ? 'text-green-600' : 'text-amber-600'}`}>
                                                    <ShieldCheck className="w-4 h-4" /> PAC: {surgery.pre_op_assessment.fitness_status}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 text-sm font-medium text-red-500">
                                                    <Zap className="w-4 h-4" /> PAC Pending
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <div className="px-6 py-3 border-t bg-slate-50/50 rounded-b-xl flex justify-end">
                                        <span className="text-sm font-medium text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Assess Patient <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </Card>
                            ))}
                            {overviewSurgeries.length === 0 && (
                                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                    <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-slate-900">No surgery requests</h3>
                                    <p className="text-slate-500 mt-1">Patients must have surgeries requested from IPD Bed Console.</p>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="surgeries" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ots.map(ot => {
                            const isAvailable = ot.status === 'available';
                            const isInUse = ot.status === 'in_use';
                            
                            return (
                                <Card key={ot.ot_id} className="border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <CardHeader className="border-b bg-slate-50/50 p-5 flex flex-row items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-base text-slate-800 font-bold">{ot.ot_name}</CardTitle>
                                            <Badge className="text-xs mt-1 border-none bg-slate-200 text-slate-600 font-semibold">{ot.ot_type}</Badge>
                                        </div>
                                        <Badge className={cn('text-xs border font-bold capitalize px-2.5 py-0.5 rounded-full', statusColors[ot.status] || 'bg-slate-100 text-slate-700')}>
                                            {ot.status.replace('_', ' ')}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
                                        {isInUse ? (
                                            <div className="space-y-3">
                                                <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl space-y-2">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-semibold text-rose-500 flex items-center gap-1"><Clock size={12} /> Live Surgery</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-slate-400 font-medium">Patient</p>
                                                        <p className="text-sm font-bold text-slate-800">{ot.patient_name || 'Patient'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-slate-400 font-medium">Lead Surgeon</p>
                                                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-500" /> Dr. {ot.doctor_name || 'Surgeon'}</p>
                                                    </div>
                                                    {ot.current_surgery_name && (
                                                        <div className="space-y-1 border-t border-rose-100/50 pt-2 mt-2">
                                                            <p className="text-xs text-slate-400 font-medium">Procedure</p>
                                                            <p className="text-sm font-bold text-slate-800">{ot.current_surgery_name} <span className="text-xs font-normal text-slate-500">({ot.current_anesthesia_type || 'General'} Anesthesia)</span></p>
                                                            {ot.anesthesia_doctor_name && (
                                                                <p className="text-xs text-slate-600 mt-0.5">Anesthesiologist: Dr. {ot.anesthesia_doctor_name}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {ot.scheduled_start && (
                                                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                                        <Calendar size={11} /> Started: {new Date(ot.scheduled_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center text-slate-400 flex flex-col items-center justify-center">
                                                <Activity className="w-8 h-8 opacity-25 mb-1.5" />
                                                <p className="text-sm font-semibold">OT Available</p>
                                                <p className="text-xs mt-0.5">Ready for surgery assignments.</p>
                                            </div>
                                        )}

                                        <div className="pt-2 border-t flex gap-2">
                                            {isAvailable ? (
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-1.5" size="sm" onClick={() => openScheduleModal(ot)}>
                                                    <Calendar size={14} /> Schedule Surgery
                                                </Button>
                                            ) : (
                                                <Button variant="outline" className="w-full text-rose-600 hover:bg-rose-50 border-rose-200 gap-1.5" size="sm" onClick={() => handleRelease(ot.ot_id)}>
                                                    <LogOut size={14} className="rotate-180" /> Conclude Surgery
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {ots.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <h3 className="text-lg font-medium text-slate-900">No Operation Theater Rooms Configured</h3>
                                <p className="text-slate-500 mt-1">Configure your clinical rooms to schedule surgeries.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals from old HMS logic */}
            <Dialog open={isAddOtOpen} onOpenChange={setIsAddOtOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Add New OT Room</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2">
                            <Label>OT Room Name *</Label>
                            <Input placeholder="e.g., OT Room 1 (Cardiac)" value={otForm.ot_name} onChange={e => setOtForm({ ...otForm, ot_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>OT Room Type</Label>
                            <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm" value={otForm.ot_type} onChange={e => setOtForm({ ...otForm, ot_type: e.target.value })}>
                                <option>General</option><option>Cardiac</option><option>Neuro</option><option>Ortho</option><option>Ophthalmic</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOtOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateOt} disabled={!otForm.ot_name} className="bg-blue-600">Create Room</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Schedule Surgery — {selectedOt?.ot_name}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2 relative">
                            <Label>Select Surgery Request *</Label>
                            {assignForm.surgery_id ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 p-2 border border-slate-200 rounded-md bg-slate-50 text-sm flex items-center justify-between">
                                        <span>
                                            <span className="font-semibold">{surgeries.find(s => s.surgery_id.toString() === assignForm.surgery_id)?.surgery_name}</span> 
                                            <span className="text-slate-500 ml-1">({surgeries.find(s => s.surgery_id.toString() === assignForm.surgery_id)?.patient_name})</span>
                                        </span>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => { setAssignForm({...assignForm, surgery_id: '', patient_id: '', current_surgery_name: ''}); setPatientSearch(''); }}>Change</Button>
                                </div>
                            ) : (
                                <>
                                    <Input placeholder="Search surgery by patient name or MRD..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                                    {patientSearch.length > 0 && (
                                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md shadow-sm absolute z-10 bg-white w-full">
                                            {filteredAssessmentSurgeries.map(s => (
                                                <div key={s.surgery_id} className="p-2 text-sm hover:bg-slate-50 cursor-pointer border-b last:border-0" onClick={() => { setAssignForm({...assignForm, surgery_id: s.surgery_id.toString(), patient_id: s.patient_id.toString(), current_surgery_name: s.surgery_name, current_diagnosis: s.current_diagnosis || ''}); setPatientSearch(''); }}>
                                                    <div className="font-semibold">{s.surgery_name} <span className="font-normal text-slate-500">for {s.patient_name}</span></div> 
                                                    <div className="text-slate-500 text-xs">MRD: {s.mrd_number}</div>
                                                    {s.pre_op_assessment ? <div className={`text-xs mt-1 font-medium ${s.pre_op_assessment.fitness_status === 'Fit' ? 'text-green-600' : 'text-amber-600'}`}>PAC: {s.pre_op_assessment.fitness_status}</div> : <div className="text-xs mt-1 font-medium text-red-500">No PAC Checkup found!</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="space-y-2 relative">
                            <Label>Lead Surgeon *</Label>
                            {assignForm.doctor_id ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 p-2 border border-slate-200 rounded-md bg-slate-50 text-sm">
                                        <span className="font-semibold">Dr. {doctors.find(d => d.profile_id.toString() === assignForm.doctor_id)?.full_name}</span> 
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => { setAssignForm({...assignForm, doctor_id: ''}); setDoctorSearch(''); }}>Change</Button>
                                </div>
                            ) : (
                                <>
                                    <Input placeholder="Search surgeon by name..." value={doctorSearch} onChange={e => setDoctorSearch(e.target.value)} />
                                    {doctorSearch.length > 0 && (
                                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md shadow-sm absolute z-10 bg-white w-full">
                                            {filteredDoctors.map(d => (
                                                <div key={d.profile_id} className="p-2 text-sm hover:bg-slate-50 cursor-pointer border-b last:border-0" onClick={() => { setAssignForm({...assignForm, doctor_id: d.profile_id.toString()}); setDoctorSearch(''); }}>
                                                    <span className="font-semibold">Dr. {d.full_name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="space-y-2 relative">
                            <Label>Anesthesiologist (Optional)</Label>
                            {assignForm.anesthesiologist_id ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 p-2 border border-slate-200 rounded-md bg-slate-50 text-sm">
                                        <span className="font-semibold">Dr. {doctors.find(d => d.profile_id.toString() === assignForm.anesthesiologist_id)?.full_name}</span> 
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => { setAssignForm({...assignForm, anesthesiologist_id: ''}); setAnesSearch(''); }}>Change</Button>
                                </div>
                            ) : (
                                <>
                                    <Input placeholder="Search anesthesiologist by name..." value={anesSearch} onChange={e => setAnesSearch(e.target.value)} />
                                    {anesSearch.length > 0 && (
                                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md shadow-sm absolute z-10 bg-white w-full">
                                            {filteredAnes.map(d => (
                                                <div key={d.profile_id} className="p-2 text-sm hover:bg-slate-50 cursor-pointer border-b last:border-0" onClick={() => { setAssignForm({...assignForm, anesthesiologist_id: d.profile_id.toString()}); setAnesSearch(''); }}>
                                                    <span className="font-semibold">Dr. {d.full_name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Start Time</Label><Input type="datetime-local" value={assignForm.scheduled_start} onChange={e => setAssignForm({ ...assignForm, scheduled_start: e.target.value })} /></div>
                            <div className="space-y-2"><Label>End Time (Est)</Label><Input type="datetime-local" value={assignForm.scheduled_end} onChange={e => setAssignForm({ ...assignForm, scheduled_end: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2 pt-2 border-t mt-2">
                            <Label>Surgery Name / Procedure *</Label><Input placeholder="e.g., Appendectomy" value={assignForm.current_surgery_name} onChange={e => setAssignForm({ ...assignForm, current_surgery_name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Anesthesia Type</Label><select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm" value={assignForm.current_anesthesia_type} onChange={e => setAssignForm({ ...assignForm, current_anesthesia_type: e.target.value })}><option>General</option><option>Local</option><option>Spinal</option><option>IV Sedation</option></select></div>
                            <div className="space-y-2"><Label>Diagnosis / Indications</Label><Input placeholder="Pre-op diagnosis" value={assignForm.current_diagnosis} onChange={e => setAssignForm({ ...assignForm, current_diagnosis: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Special Requirements (Optional)</Label><Input placeholder="e.g., C-Arm required" value={assignForm.special_requirements} onChange={e => setAssignForm({ ...assignForm, special_requirements: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssign} disabled={!assignForm.patient_id || !assignForm.doctor_id} className="bg-blue-600">Start Surgery</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAssessmentOpen} onOpenChange={setIsAssessmentOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader><DialogTitle>Surgical Assessments (PAC & Post-Op)</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2 relative">
                            <Label>Select Surgery Request *</Label>
                            {assessmentSurgeryId ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 p-2 border border-slate-200 rounded-md bg-slate-50 text-sm">
                                        <span className="font-semibold">{surgeries.find(s => s.surgery_id.toString() === assessmentSurgeryId)?.surgery_name}</span> 
                                        <span className="text-slate-500 ml-1">({surgeries.find(s => s.surgery_id.toString() === assessmentSurgeryId)?.patient_name})</span>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => { setAssessmentSurgeryId(''); setAssessmentSearch(''); }}>Change</Button>
                                </div>
                            ) : (
                                <>
                                    <Input placeholder="Search surgery by patient name or MRD..." value={assessmentSearch} onChange={e => setAssessmentSearch(e.target.value)} />
                                    {assessmentSearch.length > 0 && (
                                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md shadow-sm absolute z-10 bg-white w-full">
                                            {filteredAssessmentSurgeries.map(s => (
                                                <div key={s.surgery_id} className="p-2 text-sm hover:bg-slate-50 cursor-pointer border-b last:border-0" onClick={() => { setAssessmentSurgeryId(s.surgery_id.toString()); setAssessmentSearch(''); if (s.pre_op_assessment) setPreOpForm({...preOpForm, ...s.pre_op_assessment}); if (s.post_op_assessment) setPostOpForm({...postOpForm, ...s.post_op_assessment});}}>
                                                    <span className="font-semibold">{s.surgery_name}</span> <span className="text-slate-500">(for {s.patient_name})</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {assessmentSurgeryId && (
                            <div className="flex gap-2 border-b">
                                <button className={`px-4 py-2 text-sm font-medium border-b-2 ${assessmentTab === 'pre' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`} onClick={() => setAssessmentTab('pre')}>Pre-Op (PAC)</button>
                                <button className={`px-4 py-2 text-sm font-medium border-b-2 ${assessmentTab === 'post' ? 'border-primary text-primary' : 'border-transparent text-slate-500'}`} onClick={() => setAssessmentTab('post')}>Post-Op Recovery</button>
                            </div>
                        )}

                        {assessmentSurgeryId && assessmentTab === 'pre' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="space-y-1"><Label className="text-xs">BP</Label><Input size={1} value={preOpForm.bp} onChange={e => setPreOpForm({...preOpForm, bp: e.target.value})} placeholder="120/80" /></div>
                                    <div className="space-y-1"><Label className="text-xs">Pulse</Label><Input type="number" size={1} value={preOpForm.pulse} onChange={e => setPreOpForm({...preOpForm, pulse: e.target.value})} /></div>
                                    <div className="space-y-1"><Label className="text-xs">Temp</Label><Input type="number" step="0.1" size={1} value={preOpForm.temp} onChange={e => setPreOpForm({...preOpForm, temp: e.target.value})} /></div>
                                    <div className="space-y-1"><Label className="text-xs">Weight</Label><Input type="number" step="0.1" size={1} value={preOpForm.weight} onChange={e => setPreOpForm({...preOpForm, weight: e.target.value})} /></div>
                                </div>
                                <div className="space-y-2"><Label>Allergies</Label><Input value={preOpForm.allergies} onChange={e => setPreOpForm({...preOpForm, allergies: e.target.value})} /></div>
                                <div className="space-y-2"><Label>Comorbidities</Label><Input value={preOpForm.comorbidities} onChange={e => setPreOpForm({...preOpForm, comorbidities: e.target.value})} /></div>
                                <div className="grid grid-cols-2 gap-3 items-center mt-2">
                                    <div className="space-y-2">
                                        <Label>Fitness for Surgery</Label>
                                        <select className="w-full border border-slate-200 rounded-md p-2 text-sm" value={preOpForm.fitness_status} onChange={e => setPreOpForm({...preOpForm, fitness_status: e.target.value})}>
                                            <option value="Fit">Fit for Surgery</option><option value="High Risk">High Risk</option><option value="Unfit">Unfit</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-6">
                                        <input type="checkbox" id="consent_signed" className="rounded text-primary h-4 w-4" checked={preOpForm.consent_signed} onChange={e => setPreOpForm({...preOpForm, consent_signed: e.target.checked})} />
                                        <Label htmlFor="consent_signed" className="font-semibold text-red-600">Consent Form Signed</Label>
                                    </div>
                                </div>
                                <div className="space-y-2"><Label>Notes</Label><Textarea value={preOpForm.notes} onChange={e => setPreOpForm({...preOpForm, notes: e.target.value})} /></div>
                            </div>
                        )}

                        {assessmentSurgeryId && assessmentTab === 'post' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1"><Label className="text-xs">BP</Label><Input size={1} value={postOpForm.bp} onChange={e => setPostOpForm({...postOpForm, bp: e.target.value})} placeholder="120/80" /></div>
                                    <div className="space-y-1"><Label className="text-xs">Pulse</Label><Input type="number" size={1} value={postOpForm.pulse} onChange={e => setPostOpForm({...postOpForm, pulse: e.target.value})} /></div>
                                    <div className="space-y-1"><Label className="text-xs">Temp</Label><Input type="number" step="0.1" size={1} value={postOpForm.temp} onChange={e => setPostOpForm({...postOpForm, temp: e.target.value})} /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Recovery Status</Label>
                                    <select className="w-full border border-slate-200 rounded-md p-2 text-sm" value={postOpForm.recovery_status} onChange={e => setPostOpForm({...postOpForm, recovery_status: e.target.value})}>
                                        <option value="Stable">Stable</option><option value="Observing">Under Observation</option><option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div className="space-y-2"><Label>Instructions / Notes</Label><Textarea value={postOpForm.notes} onChange={e => setPostOpForm({...postOpForm, notes: e.target.value})} /></div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssessmentOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveAssessment} disabled={!assessmentSurgeryId}>Save Assessment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
