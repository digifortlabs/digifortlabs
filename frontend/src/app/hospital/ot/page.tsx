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
        anesthesiologist_id: '', current_diagnosis: '', special_requirements: '', ot_id: ''
    });
    const [otForm, setOtForm] = useState({ ot_name: '', ot_type: 'General' });
    const [patientSearch, setPatientSearch] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');
    const [anesSearch, setAnesSearch] = useState('');

    const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
    const [assessmentTab, setAssessmentTab] = useState('pre');
    const [assessmentSurgeryId, setAssessmentSurgeryId] = useState('');
    const [assessmentSearch, setAssessmentSearch] = useState('');
    const [activeSurgeriesCount, setActiveSurgeriesCount] = useState(0);
    const [wards, setWards] = useState<any[]>([]);
    const [beds, setBeds] = useState<any[]>([]);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [transferSurgeryId, setTransferSurgeryId] = useState('');
    const [transferForm, setTransferForm] = useState({ ward_id: '', new_bed_id: '' });

    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportSurgery, setReportSurgery] = useState<any>(null);
    
    const [preOpForm, setPreOpForm] = useState({
        bp: '', pulse: '', temp: '', weight: '', allergies: '', comorbidities: '', fitness_status: 'Fit', notes: '', 
        consent_signed: false, jewellery_removed: false, site_marked: false, blood_reserved: false, who_checklist_followed: false
    });
    const [intraOpForm, setIntraOpForm] = useState({
        implants: '', narcotics: '', sponge_count: '', operative_notes: '',
        patient_in: '', anesthesia_start: '', surgery_start: '', surgery_end: '', patient_out: ''
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
            const [o, p, d, s, w, b] = await Promise.all([
                apiFetch('hms/ots').catch(() => []),
                apiFetch('hms/admissions/active').catch(() => []),
                apiFetch('doctors').catch(() => []),
                apiFetch('hms/surgeries').catch(() => []),
                apiFetch('hms/wards').catch(() => []),
                apiFetch('hms/beds').catch(() => []),
            ]);
            setOts(o || []);
            setPatients(p || []);
            setDoctors(d || []);
            setSurgeries(s || []);
            setWards(w || []);
            setBeds(b || []);
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

    const openScheduleModal = (ot: any = null, surgery: any = null) => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localNow = new Date(now.getTime() - tzOffset);
        const startString = localNow.toISOString().slice(0, 16);
        const localEnd = new Date(now.getTime() + 60 * 60000 - tzOffset);
        const endString = localEnd.toISOString().slice(0, 16);

        setAssignForm({ 
            patient_id: surgery ? surgery.patient_id?.toString() : '', 
            surgery_id: surgery ? surgery.surgery_id?.toString() : '', 
            doctor_id: surgery ? surgery.doctor_id?.toString() : '', 
            scheduled_start: startString, scheduled_end: endString, 
            current_surgery_name: surgery ? surgery.surgery_name : '', 
            current_anesthesia_type: 'General', anesthesiologist_id: '', 
            current_diagnosis: '', special_requirements: '',
            ot_id: ot ? ot.ot_id.toString() : ''
        });
        setSelectedOt(ot);
        setIsAssignOpen(true);
    };

    const handleAssign = async () => {
        const targetOtId = assignForm.ot_id || selectedOt?.ot_id;
        if (!targetOtId) {
            toast.error("Please select an OT Room.");
            return;
        }
        if (!assignForm.anesthesiologist_id) {
            toast.error("Anesthesiologist assignment is mandatory.");
            return;
        }
        
        try {
            await apiFetch(`hms/ots/${targetOtId}/assign`, {
                method: 'POST',
                body: JSON.stringify({
                    surgery_id: assignForm.surgery_id ? parseInt(assignForm.surgery_id) : null,
                    patient_id: parseInt(assignForm.patient_id),
                    doctor_id: parseInt(assignForm.doctor_id),
                    anesthesiologist_id: parseInt(assignForm.anesthesiologist_id),
                    scheduled_start: assignForm.scheduled_start ? new Date(assignForm.scheduled_start).toISOString() : new Date().toISOString(),
                    scheduled_end: assignForm.scheduled_end ? new Date(assignForm.scheduled_end).toISOString() : null,
                    current_surgery_name: assignForm.current_surgery_name,
                    current_anesthesia_type: assignForm.current_anesthesia_type,
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
        if (surgeryId) {
            const surg = surgeries.find(s => s.surgery_id.toString() === surgeryId);
            if (surg?.pre_op_assessment) setPreOpForm({...preOpForm, ...surg.pre_op_assessment});
            if (surg?.post_op_assessment) setPostOpForm({...postOpForm, ...surg.post_op_assessment});
            setIntraOpForm({
                implants: surg?.implant_register ? JSON.stringify(surg.implant_register, null, 2) : '',
                narcotics: surg?.narcotics_log ? JSON.stringify(surg.narcotics_log, null, 2) : '',
                sponge_count: surg?.intra_op_logs?.sponge_count || '',
                operative_notes: surg?.intra_op_logs?.operative_notes || '',
                patient_in: surg?.timestamps?.patient_in || '',
                anesthesia_start: surg?.timestamps?.anesthesia_start || '',
                surgery_start: surg?.timestamps?.surgery_start || '',
                surgery_end: surg?.timestamps?.surgery_end || '',
                patient_out: surg?.timestamps?.patient_out || ''
            });
        } else {
            setPreOpForm({ bp: '', pulse: '', temp: '', weight: '', allergies: '', comorbidities: '', fitness_status: 'Fit', notes: '', consent_signed: false, jewellery_removed: false, site_marked: false, blood_reserved: false, who_checklist_followed: false });
            setPostOpForm({ bp: '', pulse: '', temp: '', recovery_status: 'Stable', notes: '' });
            setIntraOpForm({ implants: '', narcotics: '', sponge_count: '', operative_notes: '', patient_in: '', anesthesia_start: '', surgery_start: '', surgery_end: '', patient_out: '' });
        }
        setIsAssessmentOpen(true);
    };

    const openReportModal = (surgery: any) => {
        setReportSurgery(surgery);
        setIsReportOpen(true);
    };

    const handleSaveAssessment = async () => {
        if (!assessmentSurgeryId) return toast.error("Please select a surgery request");
        const surg = surgeries.find(s => s.surgery_id.toString() === assessmentSurgeryId);
        if (!surg) return toast.error("Invalid surgery record");
        
        try {
            if (assessmentTab === 'pre') {
                const updatedPreOp = {...preOpForm, pulse: parseInt(preOpForm.pulse as any) || 0, temp: parseFloat(preOpForm.temp as any) || 0, weight: parseFloat(preOpForm.weight as any) || 0};
                let newStatus = surg.status;
                if (surg.status === 'Requested' || surg.status === 'PAC Pending') {
                    newStatus = updatedPreOp.fitness_status === 'Fit' ? 'PAC Cleared' : 'PAC Pending';
                }
                await apiFetch(`hms/surgeries/${surg.surgery_id}`, {
                    method: 'PATCH', body: JSON.stringify({ pre_op_assessment: updatedPreOp, status: newStatus })
                });
            } else if (assessmentTab === 'intra') {
                let implantsParsed = null;
                let narcoticsParsed = null;
                try { if (intraOpForm.implants) implantsParsed = JSON.parse(intraOpForm.implants); } catch (e) { toast.error("Invalid Implants JSON"); return; }
                try { if (intraOpForm.narcotics) narcoticsParsed = JSON.parse(intraOpForm.narcotics); } catch (e) { toast.error("Invalid Narcotics JSON"); return; }
                
                const intraLogs = { sponge_count: intraOpForm.sponge_count, operative_notes: intraOpForm.operative_notes };
                const timestamps = { 
                    patient_in: intraOpForm.patient_in, 
                    anesthesia_start: intraOpForm.anesthesia_start, 
                    surgery_start: intraOpForm.surgery_start, 
                    surgery_end: intraOpForm.surgery_end, 
                    patient_out: intraOpForm.patient_out 
                };

                await apiFetch(`hms/surgeries/${surg.surgery_id}`, {
                    method: 'PATCH', body: JSON.stringify({ 
                        implant_register: implantsParsed, 
                        narcotics_log: narcoticsParsed,
                        intra_op_logs: intraLogs,
                        timestamps: timestamps
                    })
                });
            } else {
                const updatedPostOp = {...postOpForm, pulse: parseInt(postOpForm.pulse as any) || 0, temp: parseFloat(postOpForm.temp as any) || 0};
                await apiFetch(`hms/surgeries/${surg.surgery_id}`, {
                    method: 'PATCH', body: JSON.stringify({ post_op_assessment: updatedPostOp })
                });
            }
            toast.success(`${assessmentTab === 'pre' ? 'Pre-Op' : assessmentTab === 'intra' ? 'Intra-Op' : 'Post-Op'} Saved!`);
            setIsAssessmentOpen(false);
            loadData();
        } catch(e: any) {
            toast.error(e.message || "Failed to save assessment");
        }
    };

    const updateSurgeryStatus = async (surgeryId: number | string, newStatus: string) => {
        try {
            await apiFetch(`hms/surgeries/${surgeryId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            toast.success(`Surgery moved to ${newStatus}`);
            if (surgeryId) {
                const s = surgeries.find(s => s.surgery_id.toString() === surgeryId.toString());
                if (s?.admission_id && s.admission) {
                    toast.success("Surgery completed. No bed transfer required.");
                }
            }
            loadData();
        } catch (e: any) {
            toast.error(e.message || 'Failed to update surgery status');
        }
    };

    const handleTransferBed = async () => {
        if (!transferSurgeryId) return;
        const surg = surgeries.find(s => s.surgery_id.toString() === transferSurgeryId);
        if (!surg) return;
        
        try {
            if (transferForm.new_bed_id) {
                await apiFetch(`hms/admissions/${surg.admission_id}/transfer`, {
                    method: 'POST',
                    body: JSON.stringify({ new_bed_id: parseInt(transferForm.new_bed_id) })
                });
                toast.success("Patient successfully transferred to new bed");
            }
            
            await updateSurgeryStatus(surg.surgery_id, 'Completed');
            setIsTransferOpen(false);
            setTransferForm({ ward_id: '', new_bed_id: '' });
        } catch (e: any) {
            toast.error(e.message || "Failed to process transfer");
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

    const handleDragStart = (e: React.DragEvent, surgeryId: string) => {
        e.dataTransfer.setData('surgeryId', surgeryId);
    };

    const handleDrop = (e: React.DragEvent, targetColTitle: string) => {
        e.preventDefault();
        const surgeryId = e.dataTransfer.getData('surgeryId');
        if (!surgeryId) return;
        
        const surgery = surgeries.find(s => s.surgery_id.toString() === surgeryId);
        if (!surgery) return;

        if (targetColTitle === 'Pre-Op' && surgery.status === 'Requested') {
            openAssessmentModal(surgeryId, 'pre');
        } else if (targetColTitle === 'In Surgery' && ['PAC Cleared', 'Scheduled', 'In Pre-Op'].includes(surgery.status)) {
            if (!surgery.ot_id) {
                openScheduleModal(null, surgery);
            } else {
                updateSurgeryStatus(surgeryId, 'In Progress');
            }
        } else if (targetColTitle === 'Recovery' && surgery.status === 'In Progress') {
            updateSurgeryStatus(surgeryId, 'Recovery');
        } else if (targetColTitle === 'Completed' && surgery.status === 'Recovery') {
            setTransferSurgeryId(surgeryId);
            setIsTransferOpen(true);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
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
                    <TabsTrigger value="tracking" className="flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Live Tracking
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
                                <Card key={ot.ot_id} className={cn("border shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 group", isAvailable ? "border-emerald-200/60 bg-gradient-to-br from-white to-emerald-50/30" : "border-rose-200/60 bg-gradient-to-br from-white to-rose-50/30")}>
                                    <CardHeader className="border-b bg-white/50 backdrop-blur-sm p-5 flex flex-row items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-lg text-slate-800 font-bold group-hover:text-blue-600 transition-colors">{ot.ot_name}</CardTitle>
                                            <Badge variant="outline" className="text-[10px] mt-1.5 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">{ot.ot_type}</Badge>
                                        </div>
                                        <Badge className={cn('text-xs border font-bold capitalize px-3 py-1 rounded-full shadow-sm', statusColors[ot.status] || 'bg-slate-100 text-slate-700')}>
                                            {ot.status.replace('_', ' ')}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6 bg-white/40">
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
                                                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-2 bg-white/50 p-1.5 rounded-md w-fit">
                                                        <Calendar size={12} className="text-slate-500" /> Started: {new Date(ot.scheduled_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center flex flex-col items-center justify-center bg-white/40 rounded-xl border border-emerald-100/50 h-full">
                                                <div className="p-3 bg-emerald-50 rounded-full mb-3 shadow-sm">
                                                    <Activity className="w-8 h-8 text-emerald-400" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">OT Available</p>
                                                <p className="text-xs text-slate-500 mt-1">Ready for surgery assignments.</p>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-slate-100/60 flex gap-3">
                                            {isAvailable ? (
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all gap-2" size="sm" onClick={() => openScheduleModal(ot)}>
                                                    <Calendar size={14} /> Schedule Surgery
                                                </Button>
                                            ) : (
                                                <Button variant="outline" className="w-full text-rose-600 hover:bg-rose-50 border-rose-200 gap-2 transition-colors" size="sm" onClick={() => handleRelease(ot.ot_id)}>
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

                <TabsContent value="tracking" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 pb-6 items-start">
                        {[
                            { title: 'Requested', statuses: ['Requested', 'PAC Pending'], color: 'slate', icon: FileText },
                            { title: 'Pre-Op', statuses: ['PAC Cleared', 'Scheduled', 'In Pre-Op'], color: 'blue', icon: Activity },
                            { title: 'In Surgery', statuses: ['In Progress'], color: 'rose', icon: Scissors },
                            { title: 'Recovery', statuses: ['Recovery'], color: 'amber', icon: Clock },
                            { title: 'Completed', statuses: ['Completed'], color: 'emerald', icon: ShieldCheck }
                        ].map(col => {
                            const count = surgeries.filter(s => col.statuses.includes(s.status)).length;
                            const Icon = col.icon;
                            
                            const columnClasses = {
                                slate: 'border-t-slate-500', blue: 'border-t-blue-500', rose: 'border-t-rose-500', amber: 'border-t-amber-500', emerald: 'border-t-emerald-500'
                            }[col.color];

                            const headerColor = {
                                slate: 'text-slate-800', blue: 'text-blue-800', rose: 'text-rose-800', amber: 'text-amber-800', emerald: 'text-emerald-800'
                            }[col.color];

                            const badgeColor = {
                                slate: 'bg-slate-200 text-slate-700', blue: 'bg-blue-100 text-blue-700', rose: 'bg-rose-100 text-rose-700', amber: 'bg-amber-100 text-amber-700', emerald: 'bg-emerald-100 text-emerald-700'
                            }[col.color];
                            
                            const cardBadgeColor = {
                                slate: 'bg-slate-50 text-slate-700 border-slate-200', blue: 'bg-blue-50 text-blue-700 border-blue-200', rose: 'bg-rose-50 text-rose-700 border-rose-200', amber: 'bg-amber-50 text-amber-700 border-amber-200', emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }[col.color];

                            return (
                                <div 
                                    key={col.title} 
                                    className={cn("w-full rounded-xl bg-slate-50/80 border border-slate-200 p-3 shadow-sm h-full min-h-[600px] flex flex-col transition-all border-t-4", columnClasses)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col.title)}
                                >
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                                        <h3 className={cn("font-bold flex items-center gap-1.5 text-sm", headerColor)}>
                                            <Icon className="w-4 h-4 opacity-70" />
                                            {col.title}
                                        </h3>
                                        <span className={cn("text-xs px-2.5 py-1 rounded-full font-bold shadow-sm", badgeColor)}>{count}</span>
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        {surgeries.filter(s => col.statuses.includes(s.status)).map(surgery => (
                                            <Card 
                                                key={surgery.surgery_id} 
                                                className={cn("bg-white shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden border cursor-grab active:cursor-grabbing", `hover:border-${col.color}-300 border-slate-200`)}
                                                draggable={true}
                                                onDragStart={(e) => handleDragStart(e, surgery.surgery_id.toString())}
                                            >
                                                {col.title === 'In Surgery' && (
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 animate-pulse"></div>
                                                )}
                                                <CardContent className="p-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <Badge variant="outline" className={cn("text-[9px] font-bold border-0 px-1.5 py-0", cardBadgeColor)}>
                                                            {surgery.status}
                                                        </Badge>
                                                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{surgery.mrd_number}</span>
                                                    </div>
                                                    <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{surgery.patient_name}</h4>
                                                    <p className="text-[11px] font-medium text-slate-600 mt-0.5 mb-2 line-clamp-2 leading-snug">{surgery.surgery_name}</p>
                                                    {surgery.doctor_name && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 bg-slate-50 p-1.5 rounded-md">
                                                            <User className="w-3 h-3" /> Dr. {surgery.doctor_name}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                                                        {col.title === 'Requested' && <Button size="sm" variant="outline" className="w-full text-[10px] h-7 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors px-1" onClick={() => openAssessmentModal(surgery.surgery_id.toString(), 'pre')}>Complete PAC Check</Button>}
                                                        {col.title === 'Pre-Op' && (!surgery.ot_id ? (
                                                            <Button size="sm" variant="outline" className="w-full text-[10px] h-7 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors px-1" onClick={() => openScheduleModal(null, surgery)}>Schedule OT Room</Button>
                                                        ) : (
                                                            <Button size="sm" className="w-full text-[10px] h-7 bg-rose-600 hover:bg-rose-700 shadow-sm transition-all hover:shadow-md px-1" onClick={() => updateSurgeryStatus(surgery.surgery_id, 'In Progress')}>Start Surgery</Button>
                                                        ))}
                                                        {col.title === 'In Surgery' && <Button size="sm" variant="outline" className="w-full text-[10px] h-7 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors px-1" onClick={() => openAssessmentModal(surgery.surgery_id.toString(), 'intra')}>Intra-Op Logs</Button>}
                                                        {col.title === 'In Surgery' && <Button size="sm" className="w-full text-[10px] h-7 bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all hover:shadow-md px-1" onClick={() => updateSurgeryStatus(surgery.surgery_id, 'Recovery')}>Move to Recovery</Button>}
                                                        {col.title === 'Recovery' && <Button size="sm" variant="outline" className="w-full text-[10px] h-7 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors px-1" onClick={() => openAssessmentModal(surgery.surgery_id.toString(), 'post')}>Post-Op Assessment</Button>}
                                                        {col.title === 'Recovery' && <Button size="sm" className="w-full text-[10px] h-7 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all hover:shadow-md px-1" onClick={() => { setTransferSurgeryId(surgery.surgery_id.toString()); setIsTransferOpen(true); }}>Mark Completed</Button>}
                                                        {col.title === 'Completed' && <Button size="sm" variant="outline" className="w-full text-[10px] h-7 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors px-1" onClick={() => openReportModal(surgery)}>View Operative Report</Button>}
                                                        {col.title === 'Completed' && <Button size="sm" variant="ghost" className="w-full text-[10px] h-7 text-slate-500 hover:bg-slate-100 transition-colors px-1" onClick={() => { if(confirm('Archive this surgery? It will be removed from the active board.')) updateSurgeryStatus(surgery.surgery_id, 'Archived'); }}>Archive Record</Button>}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {count === 0 && (
                                            <div className="flex flex-col items-center justify-center h-32 text-slate-400/80 text-sm border-2 border-dashed border-slate-200/80 rounded-xl bg-slate-100/50">
                                                <Icon className="w-8 h-8 mb-2 opacity-30" />
                                                No patients here
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
                    <DialogHeader><DialogTitle>Schedule Surgery {selectedOt ? `— ${selectedOt.ot_name}` : ''}</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        {!selectedOt && (
                            <div className="space-y-2">
                                <Label>Select OT Room *</Label>
                                <select className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={assignForm.ot_id || ''} onChange={(e) => setAssignForm({ ...assignForm, ot_id: e.target.value })}>
                                    <option value="" disabled>Select OT Room</option>
                                    {ots.map(o => (
                                        <option key={o.ot_id} value={o.ot_id.toString()}>{o.ot_name} ({o.ot_type})</option>
                                    ))}
                                </select>
                            </div>
                        )}
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
                            <Label>Anesthesiologist *</Label>
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
                        <Button onClick={handleAssign} disabled={!assignForm.patient_id || !assignForm.doctor_id || !assignForm.anesthesiologist_id || (!selectedOt && !assignForm.ot_id)} className="bg-blue-600">Schedule Surgery</Button>
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
                                <button className={`px-4 py-2 text-sm font-medium border-b-2 ${assessmentTab === 'pre' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setAssessmentTab('pre')}>Pre-Op (PAC)</button>
                                <button className={`px-4 py-2 text-sm font-medium border-b-2 ${assessmentTab === 'intra' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setAssessmentTab('intra')}>Intra-Op Logs</button>
                                <button className={`px-4 py-2 text-sm font-medium border-b-2 ${assessmentTab === 'post' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`} onClick={() => setAssessmentTab('post')}>Post-Op Recovery</button>
                            </div>
                        )}

                        {assessmentSurgeryId && assessmentTab === 'pre' && (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pb-4">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Vitals & Assessment</h4>
                                    <div className="grid grid-cols-4 gap-3 mb-3">
                                        <div className="space-y-1"><Label className="text-xs">BP</Label><Input size={1} value={preOpForm.bp} onChange={e => setPreOpForm({...preOpForm, bp: e.target.value})} placeholder="120/80" /></div>
                                        <div className="space-y-1"><Label className="text-xs">Pulse</Label><Input type="number" size={1} value={preOpForm.pulse} onChange={e => setPreOpForm({...preOpForm, pulse: e.target.value})} /></div>
                                        <div className="space-y-1"><Label className="text-xs">Temp</Label><Input type="number" step="0.1" size={1} value={preOpForm.temp} onChange={e => setPreOpForm({...preOpForm, temp: e.target.value})} /></div>
                                        <div className="space-y-1"><Label className="text-xs">Weight</Label><Input type="number" step="0.1" size={1} value={preOpForm.weight} onChange={e => setPreOpForm({...preOpForm, weight: e.target.value})} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="space-y-1"><Label className="text-xs">Allergies</Label><Input value={preOpForm.allergies} onChange={e => setPreOpForm({...preOpForm, allergies: e.target.value})} /></div>
                                        <div className="space-y-1"><Label className="text-xs">Comorbidities</Label><Input value={preOpForm.comorbidities} onChange={e => setPreOpForm({...preOpForm, comorbidities: e.target.value})} /></div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Fitness for Surgery (PAC)</Label>
                                        <select className="w-full border border-slate-200 rounded-md p-2 text-sm" value={preOpForm.fitness_status} onChange={e => setPreOpForm({...preOpForm, fitness_status: e.target.value})}>
                                            <option value="Fit">Fit for Surgery</option><option value="High Risk">High Risk</option><option value="Unfit">Unfit</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-3">Surgical Safety Checklist</h4>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-md border border-blue-100/50 hover:bg-blue-100/30 transition-colors">
                                            <input type="checkbox" className="rounded text-blue-600 w-4 h-4" checked={preOpForm.consent_signed} onChange={e => setPreOpForm({...preOpForm, consent_signed: e.target.checked})} />
                                            <span className="text-sm font-medium text-slate-700">Consent Signed</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-md border border-blue-100/50 hover:bg-blue-100/30 transition-colors">
                                            <input type="checkbox" className="rounded text-blue-600 w-4 h-4" checked={preOpForm.site_marked} onChange={e => setPreOpForm({...preOpForm, site_marked: e.target.checked})} />
                                            <span className="text-sm font-medium text-slate-700">Surgery Site Marked</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-md border border-blue-100/50 hover:bg-blue-100/30 transition-colors">
                                            <input type="checkbox" className="rounded text-blue-600 w-4 h-4" checked={preOpForm.jewellery_removed} onChange={e => setPreOpForm({...preOpForm, jewellery_removed: e.target.checked})} />
                                            <span className="text-sm font-medium text-slate-700">Jewellery/Dentures Removed</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-md border border-blue-100/50 hover:bg-blue-100/30 transition-colors">
                                            <input type="checkbox" className="rounded text-blue-600 w-4 h-4" checked={preOpForm.blood_reserved} onChange={e => setPreOpForm({...preOpForm, blood_reserved: e.target.checked})} />
                                            <span className="text-sm font-medium text-slate-700">Blood Reserved (if needed)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer bg-blue-600 text-white p-2 rounded-md border border-blue-700 hover:bg-blue-700 transition-colors col-span-2">
                                            <input type="checkbox" className="rounded text-blue-900 border-white w-4 h-4" checked={preOpForm.who_checklist_followed} onChange={e => setPreOpForm({...preOpForm, who_checklist_followed: e.target.checked})} />
                                            <span className="text-sm font-bold">WHO Surgical Safety Checklist Followed</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-2"><Label>Notes</Label><Textarea value={preOpForm.notes} onChange={e => setPreOpForm({...preOpForm, notes: e.target.value})} /></div>
                            </div>
                        )}

                        {assessmentSurgeryId && assessmentTab === 'intra' && (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pb-4">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock size={14} /> Surgical Timestamps</h4>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="space-y-1"><Label className="text-[10px]">Patient In Time</Label><Input type="datetime-local" className="h-8 text-xs" value={intraOpForm.patient_in} onChange={e => setIntraOpForm({...intraOpForm, patient_in: e.target.value})} /></div>
                                        <div className="space-y-1"><Label className="text-[10px]">Anesthesia Start</Label><Input type="datetime-local" className="h-8 text-xs" value={intraOpForm.anesthesia_start} onChange={e => setIntraOpForm({...intraOpForm, anesthesia_start: e.target.value})} /></div>
                                        <div className="space-y-1"><Label className="text-[10px]">Surgery Start Time</Label><Input type="datetime-local" className="h-8 text-xs" value={intraOpForm.surgery_start} onChange={e => setIntraOpForm({...intraOpForm, surgery_start: e.target.value})} /></div>
                                        <div className="space-y-1"><Label className="text-[10px]">Surgery End Time</Label><Input type="datetime-local" className="h-8 text-xs" value={intraOpForm.surgery_end} onChange={e => setIntraOpForm({...intraOpForm, surgery_end: e.target.value})} /></div>
                                        <div className="space-y-1 col-span-2"><Label className="text-[10px]">Patient Out Time (Shift to Recovery)</Label><Input type="datetime-local" className="h-8 text-xs" value={intraOpForm.patient_out} onChange={e => setIntraOpForm({...intraOpForm, patient_out: e.target.value})} /></div>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText size={14} /> Operative Notes (Doctor's Notes)</h4>
                                    <p className="text-[10px] text-blue-700/80 mb-2">Record procedure details, findings, closure, and estimated blood loss.</p>
                                    <Textarea className="text-sm bg-white border-blue-200 min-h-[120px]" placeholder="Detailed operative notes..." value={intraOpForm.operative_notes} onChange={e => setIntraOpForm({...intraOpForm, operative_notes: e.target.value})} />
                                </div>
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Zap size={14} /> Implant Register</h4>
                                    <p className="text-[10px] text-amber-700/80 mb-2">Record batch & serial no. of implants as per hospital policy.</p>
                                    <Textarea className="font-mono text-xs bg-white border-amber-200 focus-visible:ring-amber-500 min-h-[100px]" placeholder='{"implant": "Titanium Plate", "batch": "B123", "serial": "S456"}' value={intraOpForm.implants} onChange={e => setIntraOpForm({...intraOpForm, implants: e.target.value})} />
                                </div>
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                                    <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><ShieldCheck size={14} /> Narcotics Log</h4>
                                    <p className="text-[10px] text-rose-700/80 mb-2">Narcotic drugs taken by Surgeon Name. Empty ampoules to be stored in Narcotic Stock Box.</p>
                                    <Textarea className="font-mono text-xs bg-white border-rose-200 focus-visible:ring-rose-500 min-h-[100px]" placeholder='{"drug": "Fentanyl", "amount": "50mcg", "administered_by": "Dr. Smith"}' value={intraOpForm.narcotics} onChange={e => setIntraOpForm({...intraOpForm, narcotics: e.target.value})} />
                                </div>
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

            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-slate-500" /> Operative Report</DialogTitle></DialogHeader>
                    {reportSurgery && (
                        <div className="space-y-4 py-2 text-sm text-slate-700">
                            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{reportSurgery.patient_name}</h3>
                                    <p className="text-slate-500 font-mono text-xs mt-1">MRD: {reportSurgery.mrd_number}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="bg-slate-50">{reportSurgery.surgery_name}</Badge>
                                    <p className="text-slate-500 text-xs mt-1">Date: {new Date(reportSurgery.scheduled_date || Date.now()).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
                                <div><span className="font-semibold block text-xs text-slate-500 uppercase">Surgeon</span>{reportSurgery.doctor_name || 'N/A'}</div>
                                <div><span className="font-semibold block text-xs text-slate-500 uppercase">Anesthesiologist</span>{reportSurgery.anesthesiologist?.full_name || 'N/A'}</div>
                                <div><span className="font-semibold block text-xs text-slate-500 uppercase">Anesthesia Type</span>{reportSurgery.anesthesia_type || 'N/A'}</div>
                                <div><span className="font-semibold block text-xs text-slate-500 uppercase">Pre-Op Diagnosis</span>{reportSurgery.diagnosis || 'N/A'}</div>
                            </div>

                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 mt-4">
                                <h4 className="font-bold text-xs uppercase text-slate-500 mb-2 border-b border-slate-200 pb-1">Timestamps</h4>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div><span className="block font-medium text-slate-500">Patient In</span>{reportSurgery.timestamps?.patient_in ? new Date(reportSurgery.timestamps.patient_in).toLocaleTimeString() : '-'}</div>
                                    <div><span className="block font-medium text-slate-500">Anesthesia Start</span>{reportSurgery.timestamps?.anesthesia_start ? new Date(reportSurgery.timestamps.anesthesia_start).toLocaleTimeString() : '-'}</div>
                                    <div><span className="block font-medium text-slate-500">Surgery Start</span>{reportSurgery.timestamps?.surgery_start ? new Date(reportSurgery.timestamps.surgery_start).toLocaleTimeString() : '-'}</div>
                                    <div><span className="block font-medium text-slate-500">Surgery End</span>{reportSurgery.timestamps?.surgery_end ? new Date(reportSurgery.timestamps.surgery_end).toLocaleTimeString() : '-'}</div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="font-bold text-xs uppercase text-slate-500 mb-1 border-b border-slate-200 pb-1">Operative Findings & Procedure</h4>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 bg-white p-3 border border-slate-200 rounded-md shadow-sm min-h-[100px] mt-2">
                                    {reportSurgery.intra_op_logs?.operative_notes || 'No operative notes recorded.'}
                                </p>
                            </div>

                            <div className="flex gap-4 mt-4">
                                <div className="flex-1">
                                    <h4 className="font-bold text-xs uppercase text-slate-500 mb-1">Implants</h4>
                                    <p className="font-mono text-xs text-slate-600 break-all bg-slate-50 p-2 border border-slate-200 rounded-md">
                                        {reportSurgery.implant_register ? JSON.stringify(reportSurgery.implant_register) : 'None'}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-xs uppercase text-slate-500 mb-1">Narcotics</h4>
                                    <p className="font-mono text-xs text-slate-600 break-all bg-slate-50 p-2 border border-slate-200 rounded-md">
                                        {reportSurgery.narcotics_log ? JSON.stringify(reportSurgery.narcotics_log) : 'None'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReportOpen(false)}>Close</Button>
                        <Button onClick={() => window.print()} className="bg-blue-600">Print Report</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
