"use client";

import React, { useState, useEffect } from 'react';
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    ChevronLeft, Save, Plus, Clock, FileText,
    Zap, Activity, LayoutGrid, DollarSign,
    Box, Stethoscope, History, Pill, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Odontogram from '@/components/dental/Odontogram';
import ThreeDViewer from '@/components/dental/ThreeDViewer';
import PeriodontalChart from '@/components/dental/PeriodontalChart';
import { API_URL, apiFetch } from '@/config/api';
import { ShieldAlert, Beaker, Braces, MessageSquare } from 'lucide-react';
import { toast } from "sonner";

interface PatientDetailProps {
    patient: any;
    onBack: () => void;
}

export default function PatientDetail({ patient, onBack }: PatientDetailProps) {
    const [activeTab, setActiveTab] = useState("examination");
    const [isSaving, setIsSaving] = useState(false);


    // Clinical State
    // Clinical State - Safely merge defaults in case backend data is empty object {}
    const [clinicalData, setClinicalData] = useState({
        chief_complaints: [],
        medical_history: {},
        odontogram: {},
        notes: patient.chief_complaint || "", // Fallback to registration complaint
        ...(patient.clinical_data || {})
    });

    const [habits, setHabits] = useState({
        tobacco: false,
        smoking: false,
        alcohol: false,
        brushing: "once",
        mouthwash: "no",
        ...(patient.habits || {})
    });
    const [prescriptions, setPrescriptions] = useState<any[]>(patient.prescriptions || []);
    const [treatments, setTreatments] = useState<any[]>([]);

    // Medication Presets State
    const [medicationPresets, setMedicationPresets] = useState({
        antibiotics: ["Amoxicillin 500mg", "Augmentin 625mg", "Metrogyl 400mg"],
        analgesics: ["Zerodol P (Aceclofenac + Paracetamol)", "Combiflam", "Ketorol DT"],
        others: ["Pantocid 40mg (Antacid)", "Chlohexidine Mouthwash"]
    });

    // Add Procedure Modal State
    const [isAddProcedureOpen, setIsAddProcedureOpen] = useState(false);
    const [newProcedure, setNewProcedure] = useState({
        type: "",
        tooth: "",
        cost: "",
        date: new Date().toISOString().split('T')[0], // Default to today
        phase_id: "" // Added for multi-phase support
    });

    // New Treatment Planning State
    const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
    const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
    const [newPlan, setNewPlan] = useState({ name: "", priority: "normal", notes: "" });
    const [isAddPhaseOpen, setIsAddPhaseOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [newPhase, setNewPhase] = useState({ name: "", phase_order: 1 });

    // Add Prescription Modal State
    const [isAddPrescriptionOpen, setIsAddPrescriptionOpen] = useState(false);
    const [newPrescription, setNewPrescription] = useState({
        name: "",
        dosage: "1-0-1",
        duration: "5 days",
        notes: "After food",
        startDate: new Date().toISOString().split('T')[0] // Default to today
    });

    // Scans State
    const [scans, setScans] = useState<any[]>([]);
    const [selectedScanUrl, setSelectedScanUrl] = useState<string>("");
    const [isUploadingScan, setIsUploadingScan] = useState(false);

    // Periodontal State
    const [periodontalExams, setPeriodontalExams] = useState<any[]>([]);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Final Feature State
    const [insuranceClaims, setInsuranceClaims] = useState<any[]>([]);
    const [isAddClaimOpen, setIsAddClaimOpen] = useState(false);
    const [newClaim, setNewClaim] = useState({ provider_id: 1, policy_number: "", claim_amount: "", status: "pending", notes: "" });

    const [labOrders, setLabOrders] = useState<any[]>([]);
    const [isAddLabOrderOpen, setIsAddLabOrderOpen] = useState(false);
    const [newLabOrder, setNewLabOrder] = useState({ lab_id: 1, appliance_type: "", tooth_number: "", shade: "", instructions: "", status: "sent", due_date: "" });

    const [orthoRecords, setOrthoRecords] = useState<any[]>([]);
    const [isAddOrthoOpen, setIsAddOrthoOpen] = useState(false);
    const [newOrtho, setNewOrtho] = useState({ appliance_type: "", upper_wire: "", lower_wire: "", elastics: "", notes: "", next_visit_tasks: "" });

    const [communications, setCommunications] = useState<any[]>([]);
    const [isAddCommOpen, setIsAddCommOpen] = useState(false);
    const [newComm, setNewComm] = useState({ comm_type: "Email", category: "Follow-up", message_content: "", status: "sent" });

    const fetchScans = React.useCallback(async () => {
        try {
            const data = await apiFetch(`dental/scans/patient/${patient.patient_id}`);
            if (data) {
                setScans(data);

                // Use a functional update to avoid depending on selectedScanUrl in the dependency array
                setSelectedScanUrl(prev => {
                    if (data.length > 0 && !prev) {
                        const scan = data[0];
                        return scan.presigned_url || `${API_URL.replace('/api', '')}/${scan.file_path}`;
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error("Error fetching scans:", error);
        }
    }, [patient.patient_id]); // Removed selectedScanUrl dependency to break infinite loop

    const fetchTreatmentPlans = React.useCallback(async () => {
        try {
            const data = await apiFetch(`dental/patients/${patient.patient_id}/treatment-plans`);
            if (data) {
                setTreatmentPlans(data);
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
        }
    }, [patient.patient_id]);

    const fetchTreatments = React.useCallback(async () => {
        try {
            const data = await apiFetch(`dental/treatments?patient_id=${patient.patient_id}`);
            if (data) {
                setTreatments(data);
            }
        } catch (error) {
            console.error("Error fetching treatments:", error);
        }
    }, [patient.patient_id]);

    const fetchPeriodontalExams = React.useCallback(async () => {
        try {
            const data = await apiFetch(`dental/patients/${patient.patient_id}/periodontal-exams`);
            if (data) {
                setPeriodontalExams(data);
            }
        } catch (error) {
            console.error("Error fetching periodontal exams:", error);
        }
    }, [patient.patient_id]);

    const fetchFinalFeatures = React.useCallback(async () => {
        try {
            const [claimsRes, labsRes, orthoRes, commsRes] = await Promise.all([
                apiFetch(`dental/patients/${patient.patient_id}/insurance/claims`).catch(() => []),
                apiFetch(`dental/patients/${patient.patient_id}/lab-orders`).catch(() => []),
                apiFetch(`dental/patients/${patient.patient_id}/ortho`).catch(() => []),
                apiFetch(`dental/patients/${patient.patient_id}/communications`).catch(() => [])
            ]);
            if (claimsRes) setInsuranceClaims(claimsRes);
            if (labsRes) setLabOrders(labsRes);
            if (orthoRes) setOrthoRecords(orthoRes);
            if (commsRes) setCommunications(commsRes);
        } catch (error) {
            console.error("Error fetching feature data:", error);
        }
    }, [patient.patient_id]);

    useEffect(() => {
        fetchScans();
        fetchTreatmentPlans();
        fetchTreatments();
        fetchPeriodontalExams();
        fetchFinalFeatures();
    }, [fetchScans, fetchTreatmentPlans, fetchTreatments, fetchPeriodontalExams, fetchFinalFeatures]);

    const handleDeleteAllScans = async () => {
        if (!confirm("Are you sure you want to delete ALL scans for this patient? This cannot be undone.")) return;

        try {
            const res = await apiFetch(`dental/scans/patient/${patient.patient_id}`, {
                method: 'DELETE'
            });

            if (res === null) {
                toast.success("All scans deleted successfully.");
                setScans([]);
                setSelectedScanUrl("");
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.message || "Error deleting scans.");
        }
    };

    const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('scan_type', 'Intraoral'); // Default for now

        setIsUploadingScan(true);
        setUploadProgress(0);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/dental/scans/${patient.patient_id}`, true);
        xhr.withCredentials = true; // Use HttpOnly cookies instead of manual Token header

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            setIsUploadingScan(false);
            setUploadProgress(0);
            if (xhr.status >= 200 && xhr.status < 300) {
                toast.success("Scan uploaded successfully!");
                fetchScans();
            } else {
                toast.error("Failed to upload scan.");
            }
            e.target.value = '';
        };

        xhr.onerror = () => {
            setIsUploadingScan(false);
            setUploadProgress(0);
            console.error("Upload error");
            toast.error("Error uploading scan.");
            e.target.value = '';
        };

        xhr.send(formData);
    };


    const handleAddMedication = (med: string) => {
        const newMed = {
            id: Date.now(),
            name: med,
            dosage: "1-0-1",
            duration: "5 days",
            notes: "After food"
        };
        setPrescriptions([...prescriptions, newMed]);
    };

    const handleSave = async () => {
        const payload = {
            ...patient,
            clinical_data: clinicalData,
            habits: habits,
            prescriptions: prescriptions
        };
        console.log("Saving Dental Record:", payload);

        try {
            const data = await apiFetch(`dental/patients/${patient.patient_id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            if (data) {
                toast.success("Record saved successfully!");
            }
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error.message || "Failed to save record.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddProcedure = () => {
        setIsAddProcedureOpen(true);
    };

    const saveProcedure = async () => {
        if (!newProcedure.type) {
            toast.error("Please enter a procedure name");
            return;
        }

        const cost = parseFloat(newProcedure.cost || "0");

        try {
            const data = await apiFetch(`dental/treatments`, {
                method: 'POST',
                body: JSON.stringify({
                    patient_id: patient.patient_id,
                    treatment_type: newProcedure.type,
                    tooth_number: newProcedure.tooth ? parseInt(newProcedure.tooth) : null,
                    cost: cost,
                    status: "planned",
                    description: "Added via UI",
                    date_performed: newProcedure.date || new Date().toISOString(),
                    phase_id: newProcedure.phase_id ? parseInt(newProcedure.phase_id) : null
                })
            });

            if (data) {
                setTreatments([...treatments, data]);
                fetchTreatmentPlans(); // Also refresh plans to show the new treatment in nested view
                setIsAddProcedureOpen(false);
                setNewProcedure({
                    type: "",
                    tooth: "",
                    cost: "",
                    date: new Date().toISOString().split('T')[0],
                    phase_id: ""
                }); // Reset form
            }
        } catch (error: any) {
            console.error("Error adding procedure:", error);
            toast.error(error.message || "Error adding procedure.");
        }
    };

    const handleSavePrescription = () => {
        if (!newPrescription.name) {
            toast.error("Please enter a medication name");
            return;
        }

        const newMed = {
            id: Date.now(),
            ...newPrescription
        };

        setPrescriptions([...prescriptions, newMed]);

        // Add to "Others" presets if not already in any list
        const allMeds = Object.values(medicationPresets).flat();
        if (!allMeds.includes(newPrescription.name)) {
            setMedicationPresets(prev => ({
                ...prev,
                others: [...prev.others, newPrescription.name]
            }));
        }

        setIsAddPrescriptionOpen(false);
        setNewPrescription({
            name: "",
            dosage: "1-0-1",
            duration: "5 days",
            notes: "After food",
            startDate: new Date().toISOString().split('T')[0]
        });
    };

    const savePeriodontalExam = async (examData: any) => {
        try {
            const data = await apiFetch(`dental/patients/${patient.patient_id}/periodontal-exams`, {
                method: 'POST',
                body: JSON.stringify(examData)
            });
            if (data) {
                toast.success("Periodontal exam saved successfully!");
                setPeriodontalExams([data, ...periodontalExams]);
                setActiveTab("examination"); // Or stay on tab
            }
        } catch (error: any) {
            console.error("Error saving periodontal exam:", error);
            toast.error(error.message || "Failed to save periodontal exam.");
        }
    };

    const saveTreatmentPlan = async () => {
        if (!newPlan.name) return;
        try {
            const data = await apiFetch(`dental/patients/${patient.patient_id}/treatment-plans`, {
                method: 'POST',
                body: JSON.stringify(newPlan)
            });
            if (data) {
                setTreatmentPlans([...treatmentPlans, { ...data, phases: [] }]);
                setIsAddPlanOpen(false);
                setNewPlan({ name: "", priority: "normal", notes: "" });
            }
        } catch (error) {
            console.error("Error creating plan:", error);
        }
    };

    const savePhase = async () => {
        if (!newPhase.name || !selectedPlanId) return;
        try {
            const data = await apiFetch(`dental/treatment-plans/${selectedPlanId}/phases`, {
                method: 'POST',
                body: JSON.stringify(newPhase)
            });
            if (data) {
                fetchTreatmentPlans(); // Refresh the whole tree
                setIsAddPhaseOpen(false);
                setNewPhase({ name: "", phase_order: treatmentPlans.find(p => p.plan_id === selectedPlanId)?.phases.length + 1 || 1 });
            }
        } catch (error) {
            console.error("Error creating phase:", error);
        }
    };

    const saveClaim = async () => {
        if (!newClaim.policy_number || !newClaim.claim_amount) {
            toast.error("Please fill policy number and amount.");
            return;
        }
        try {
            const data = await apiFetch(`dental/patients/${patient.patient_id}/insurance/claims`, {
                method: 'POST',
                body: JSON.stringify({ ...newClaim, claim_amount: parseFloat(newClaim.claim_amount) })
            });
            if (data) {
                toast.success("Insurance claim added successfully!");
                setInsuranceClaims([data, ...insuranceClaims]);
                setIsAddClaimOpen(false);
                setNewClaim({ provider_id: 1, policy_number: "", claim_amount: "", status: "pending", notes: "" });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to add claim.");
        }
    };

    const saveLabOrder = async () => {
        if (!newLabOrder.appliance_type) {
            toast.error("Please enter appliance type.");
            return;
        }
        try {
            const payload = {
                ...newLabOrder,
                due_date: newLabOrder.due_date ? new Date(newLabOrder.due_date).toISOString() : null
            };
            const data = await apiFetch(`dental/patients/${patient.patient_id}/lab-orders`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (data) {
                toast.success("Lab order created successfully!");
                setLabOrders([data, ...labOrders]);
                setIsAddLabOrderOpen(false);
                setNewLabOrder({ lab_id: 1, appliance_type: "", tooth_number: "", shade: "", instructions: "", status: "sent", due_date: "" });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create lab order.");
        }
    };

    const saveOrthoRecord = async () => {
        if (!newOrtho.appliance_type) {
            toast.error("Please enter appliance type.");
            return;
        }
        try {
            const data = await apiFetch(`dental/patients/${patient.patient_id}/ortho`, {
                method: 'POST',
                body: JSON.stringify(newOrtho)
            });
            if (data) {
                toast.success("Orthodontic record added successfully!");
                setOrthoRecords([data, ...orthoRecords]);
                setIsAddOrthoOpen(false);
                setNewOrtho({ appliance_type: "", upper_wire: "", lower_wire: "", elastics: "", notes: "", next_visit_tasks: "" });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to add ortho record.");
        }
    };

    const saveCommunication = async () => {
        if (!newComm.message_content) {
            toast.error("Please enter message content.");
            return;
        }
        try {
            const data = await apiFetch(`dental/patients/${patient.patient_id}/communications`, {
                method: 'POST',
                body: JSON.stringify(newComm)
            });
            if (data) {
                toast.success("Communication logged successfully!");
                setCommunications([data, ...communications]);
                setIsAddCommOpen(false);
                setNewComm({ comm_type: "Email", category: "Follow-up", message_content: "", status: "sent" });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to log communication.");
        }
    };

    // Billing Calculations
    const totalEstimate = treatments.reduce((sum, t) => sum + (t.cost || 0), 0);
    const totalPaid = 0; // Backend for payments not ready yet
    const balance = totalEstimate - totalPaid;

    return (
        <div className="space-y-4">
            {/* Top Bar / Patient Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                        <ChevronLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-900 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-900/20">
                            {patient.full_name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900">{patient.full_name}</h1>
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-semibold">Active</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-1">
                                <span>ID: <span className="font-semibold text-slate-700">#{patient.patient_id?.toString().padStart(5, '0')}</span></span>
                                {patient.uhid && (
                                    <>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>UHID: <span className="font-semibold text-slate-700">{patient.uhid}</span></span>
                                    </>
                                )}
                                {patient.opd_number && (
                                    <>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>OPD: <span className="font-semibold text-slate-700">{patient.opd_number}</span></span>
                                    </>
                                )}
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span>{patient.phone}</span>
                                {patient.registration_date && (
                                    <>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>Reg: {new Date(patient.registration_date).toLocaleDateString()}</span>
                                    </>
                                )}
                            </div>
                            {patient.chief_complaint && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg max-w-xl">
                                    <p className="text-xs text-blue-800">
                                        <span className="font-bold uppercase mr-2 text-[10px] tracking-wider">Reg. Complaint:</span>
                                        {patient.chief_complaint}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 shadow-sm">
                        <History className="w-4 h-4" /> History
                    </Button>
                    <Button
                        className="bg-blue-900 hover:bg-blue-800 text-white gap-2 shadow-md"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Record'}
                    </Button>
                </div>
            </div>

            {/* Main Tabbed Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white p-1 border shadow-sm rounded-xl h-auto flex-wrap gap-1">
                    <TabsTrigger value="examination" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 gap-2 py-2 px-4 rounded-lg transition-all">
                        <Stethoscope className="w-4 h-4" /> Clinical Examination
                    </TabsTrigger>
                    <TabsTrigger value="procedures" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 gap-2 py-2 px-4 rounded-lg transition-all">
                        <Activity className="w-4 h-4" /> Procedures & Plans
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 gap-2 py-2 px-4 rounded-lg transition-all">
                        <DollarSign className="w-4 h-4" /> Billing & Payments
                    </TabsTrigger>
                    <TabsTrigger value="scans" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 gap-2 py-2 px-4 rounded-lg transition-all">
                        <Box className="w-4 h-4" /> 3D Scans
                    </TabsTrigger>
                    <TabsTrigger value="prescriptions" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 gap-2 py-2 px-4 rounded-lg transition-all">
                        <Pill className="w-4 h-4" /> Prescriptions
                    </TabsTrigger>
                    <TabsTrigger value="periodontal" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 gap-2 py-2 px-4 rounded-lg transition-all">
                        <Activity className="w-4 h-4" /> Periodontal
                    </TabsTrigger>

                    {/* New Feature Tabs */}
                    <TabsTrigger value="insurance" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900 gap-2 py-2 px-4 rounded-lg transition-all">
                        <ShieldAlert className="w-4 h-4" /> Insurance
                    </TabsTrigger>
                    <TabsTrigger value="labs" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 gap-2 py-2 px-4 rounded-lg transition-all">
                        <Beaker className="w-4 h-4" /> Lab Orders
                    </TabsTrigger>
                    <TabsTrigger value="ortho" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-900 gap-2 py-2 px-4 rounded-lg transition-all">
                        <Braces className="w-4 h-4" /> Orthodontics
                    </TabsTrigger>
                    <TabsTrigger value="comms" className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-900 gap-2 py-2 px-4 rounded-lg transition-all">
                        <MessageSquare className="w-4 h-4" /> Comms
                    </TabsTrigger>
                </TabsList>

                {/* --- Examination Tab --- */}
                <TabsContent value="examination" className="space-y-4 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Medical Info Side */}
                        <div className="lg:col-span-4 flex flex-col h-full">
                            <Card className="border-none shadow-sm flex-1">
                                <CardHeader className="border-b bg-slate-50/50 pb-4">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        <CardTitle className="text-lg">Medical Info</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    {/* Chief Complaints */}
                                    <div className="space-y-3">
                                        <Label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Chief Complaints</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {["Pain", "Swelling", "Sensitive", "Bleeding", "Mobility", "Food Lodgement", "Aesthetic", "Missing teeth"].map(v => {
                                                const currentList = Array.isArray(clinicalData.chief_complaints) ? clinicalData.chief_complaints : [];
                                                const isSelected = currentList.includes(v);
                                                return (
                                                    <Badge
                                                        key={v}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className={cn(
                                                            "cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors py-1 px-3 border-slate-200 select-none",
                                                            isSelected ? "bg-blue-900 hover:bg-blue-800 text-white border-blue-900" : ""
                                                        )}
                                                        onClick={() => {
                                                            const next = isSelected
                                                                ? currentList.filter((c: string) => c !== v)
                                                                : [...currentList, v];
                                                            setClinicalData((prev: any) => ({ ...prev, chief_complaints: next }));
                                                        }}
                                                    >
                                                        {v}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                        <Input
                                            placeholder="Describe other complaints (Press Enter)..."
                                            className="text-sm bg-slate-50 border-none shadow-none focus-visible:ring-blue-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = e.currentTarget.value.trim();
                                                    if (val && !clinicalData.chief_complaints.includes(val)) {
                                                        setClinicalData((prev: any) => ({
                                                            ...prev,
                                                            chief_complaints: [...prev.chief_complaints, val]
                                                        }));
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Detailed Medical History */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <Label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Medical History</Label>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            {["Diabetes", "Hypertension", "Cardiac", "Asthmatic", "Thyroid", "Gastric"].map(h => (
                                                <div key={h} className="flex items-center justify-between group">
                                                    <span className="text-sm text-slate-600 font-medium">{h}</span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            className={`w-8 h-6 rounded text-[10px] font-bold ${clinicalData.medical_history[h] === false ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                            onClick={() => setClinicalData((prev: any) => ({ ...prev, medical_history: { ...(prev.medical_history || {}), [h]: false } }))}
                                                        >NO</button>
                                                        <button
                                                            className={`w-8 h-6 rounded text-[10px] font-bold ${clinicalData.medical_history[h] === true ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                            onClick={() => setClinicalData((prev: any) => ({ ...prev, medical_history: { ...(prev.medical_history || {}), [h]: true } }))}
                                                        >YES</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Habits */}
                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <Label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Habits & Lifestyle</Label>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            {["Tobacco", "Smoking", "Alcohol"].map(h => {
                                                const key = h.toLowerCase() as keyof typeof habits;
                                                return (
                                                    <div key={h} className="flex items-center justify-between">
                                                        <span className="text-sm text-slate-600 font-medium">{h}</span>
                                                        <div className="flex gap-1">
                                                            <button
                                                                className={`w-8 h-6 rounded text-[10px] font-bold ${habits[key] === false ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                                onClick={() => setHabits({ ...habits, [key]: false })}
                                                            >NO</button>
                                                            <button
                                                                className={`w-8 h-6 rounded text-[10px] font-bold ${habits[key] === true ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                                onClick={() => setHabits({ ...habits, [key]: true })}
                                                            >YES</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Brushing</span>
                                                <select
                                                    className="w-full text-xs p-2 bg-slate-50 border-none rounded outline-none"
                                                    value={habits.brushing}
                                                    onChange={(e) => setHabits({ ...habits, brushing: e.target.value })}
                                                >
                                                    <option value="once">Once Daily</option>
                                                    <option value="twice">Twice Daily</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Mouthwash</span>
                                                <select
                                                    className="w-full text-xs p-2 bg-slate-50 border-none rounded outline-none"
                                                    value={habits.mouthwash}
                                                    onChange={(e) => setHabits({ ...habits, mouthwash: e.target.value })}
                                                >
                                                    <option value="no">No</option>
                                                    <option value="regularly">Regularly</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                        <p className="text-[11px] text-amber-800 flex gap-2 leading-relaxed">
                                            <Zap className="w-4 h-4 fill-amber-300 text-amber-600 flex-shrink-0" />
                                            AI Tip: Patient's smoking habit might affect healing post-procedure. Recommend counseling.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Odontogram Section */}
                        <div className="lg:col-span-8">
                            <Odontogram
                                toothStatus={clinicalData.odontogram || {}}
                                setToothStatus={(status) => {
                                    if (typeof status === 'function') {
                                        setClinicalData((prev: any) => ({ ...prev, odontogram: status(prev.odontogram || {}) }));
                                    } else {
                                        setClinicalData({ ...clinicalData, odontogram: status });
                                    }
                                }}
                                chiefComplaint={clinicalData.notes || ""}
                                setChiefComplaint={(notes) => setClinicalData((prev: any) => ({ ...prev, notes }))}
                                advice={clinicalData.advice || ""}
                                setAdvice={(advice) => setClinicalData((prev: any) => ({ ...prev, advice }))}
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* --- Procedures Tab --- */}
                <TabsContent value="procedures" className="outline-none space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Treatment Planning</h2>
                            <p className="text-sm text-slate-500">Manage multi-phase clinical cases and quotes</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsAddPlanOpen(true)}
                                className="bg-blue-900 hover:bg-blue-800 text-white gap-2 shadow-md"
                            >
                                <Plus className="w-4 h-4" /> New Plan
                            </Button>
                            <Button
                                onClick={handleAddProcedure}
                                variant="outline"
                                className="gap-2 border-slate-200"
                            >
                                <Zap className="w-4 h-4 text-amber-500" /> Quick Entry
                            </Button>
                        </div>
                    </div>

                    {/* Active Plans List */}
                    <div className="space-y-6">
                        {treatmentPlans.length === 0 ? (
                            <Card className="border-none shadow-sm bg-slate-50/50">
                                <CardContent className="p-12 text-center text-slate-500">
                                    <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900">No active treatment plans</h3>
                                    <p className="max-w-xs mx-auto text-sm mt-1">Create a plan to group procedures into professional phases and cases.</p>
                                    <Button onClick={() => setIsAddPlanOpen(true)} variant="link" className="mt-4 text-blue-600 font-bold">Create your first plan &rarr;</Button>
                                </CardContent>
                            </Card>
                        ) : (
                            treatmentPlans.map(plan => (
                                <Card key={plan.plan_id} className="border-none shadow-md overflow-hidden bg-white">
                                    <CardHeader className="bg-slate-900 text-white p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                                    <Badge className={cn(
                                                        "uppercase text-[10px] tracking-widest px-2 py-0.5 border-none",
                                                        plan.status === 'accepted' ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                                                    )}>
                                                        {plan.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-slate-400 text-xs font-medium">Estimate: ₹ {plan.estimated_cost?.toLocaleString()} • Priority: {plan.priority}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white text-xs h-8" onClick={() => { setSelectedPlanId(plan.plan_id); setIsAddPhaseOpen(true); }}>
                                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Phase
                                                </Button>
                                                <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 border-none text-white text-xs h-8">
                                                    <FileText className="w-3.5 h-3.5 mr-1" /> Print Quote
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y border-t border-slate-100">
                                            {plan.phases?.length === 0 ? (
                                                <div className="p-8 text-center text-slate-400 bg-slate-50/30">
                                                    <p className="text-sm italic">Add phases to organize the treatment flow</p>
                                                </div>
                                            ) : (
                                                plan.phases.map((phase: any) => (
                                                    <div key={phase.phase_id} className="bg-white">
                                                        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-t border-slate-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                                                    {phase.phase_order}
                                                                </div>
                                                                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{phase.name}</h4>
                                                                <Badge variant="outline" className="text-[9px] uppercase font-bold py-0">{phase.status}</Badge>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-[10px] font-bold uppercase text-blue-600 hover:text-blue-800"
                                                                onClick={() => {
                                                                    setNewProcedure(prev => ({ ...prev, phase_id: phase.phase_id.toString() }));
                                                                    setIsAddProcedureOpen(true);
                                                                }}
                                                            >
                                                                + Add Procedure
                                                            </Button>
                                                        </div>
                                                        <div className="p-0">
                                                            <table className="w-full text-left text-sm">
                                                                <tbody className="divide-y">
                                                                    {phase.treatments?.length === 0 ? (
                                                                        <tr>
                                                                            <td className="px-14 py-4 text-xs text-slate-400 italic">No procedures in this phase</td>
                                                                        </tr>
                                                                    ) : (
                                                                        phase.treatments.map((t: any) => (
                                                                            <tr key={t.treatment_id} className="hover:bg-slate-50/30 transition-colors">
                                                                                <td className="px-14 py-3 font-semibold text-slate-800">{t.treatment_type}</td>
                                                                                <td className="px-6 py-3">{t.tooth_number ? <Badge variant="secondary" className="font-bold flex-shrink-0">#{t.tooth_number}</Badge> : '-'}</td>
                                                                                <td className="px-6 py-3">
                                                                                    <Badge className={cn(
                                                                                        "border-none text-[10px] tracking-wide py-0",
                                                                                        t.status === 'completed' ? "bg-emerald-50 text-emerald-700" :
                                                                                            t.status === 'in-progress' ? "bg-blue-50 text-blue-700" :
                                                                                                "bg-slate-100 text-slate-500"
                                                                                    )}>
                                                                                        {t.status}
                                                                                    </Badge>
                                                                                </td>
                                                                                <td className="px-6 py-3 font-medium text-slate-600">₹ {t.cost?.toLocaleString()}</td>
                                                                                <td className="px-6 py-3 text-right">
                                                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><ChevronRight className="w-4 h-4 text-slate-400" /></Button>
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}

                        {/* Unassigned Procedures */}
                        {treatments.filter(t => !t.phase_id).length > 0 && (
                            <Card className="border-none shadow-sm border-l-4 border-l-amber-400 overflow-hidden">
                                <CardHeader className="bg-slate-50 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <LayoutGrid className="w-4 h-4 text-amber-500" />
                                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-700">Quick Procedures (Unassigned)</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
                                            <tr>
                                                <th className="px-6 py-4">Procedure</th>
                                                <th className="px-6 py-4">Tooth</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Cost (₹)</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {treatments.filter(t => !t.phase_id).map((t) => (
                                                <tr key={t.treatment_id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-semibold text-slate-800">{t.treatment_type}</td>
                                                    <td className="px-6 py-4">{t.tooth_number ? `#${t.tooth_number}` : '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <Badge className={cn(
                                                            "border-none text-[10px] tracking-wide py-0",
                                                            t.status === 'completed' ? "bg-emerald-50 text-emerald-700" :
                                                                t.status === 'in-progress' ? "bg-blue-50 text-blue-700" :
                                                                    "bg-slate-100 text-slate-500"
                                                        )}>
                                                            {t.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">₹ {t.cost?.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="sm" className="text-blue-600 text-xs font-bold uppercase">Assign to Plan</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* --- Billing Tab --- */}
                <TabsContent value="billing" className="outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-none shadow-sm md:col-span-1">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Payable</CardTitle>
                                <h3 className="text-3xl font-bold">₹ {totalEstimate.toLocaleString()}</h3>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500">Paid: <span className="text-emerald-600 font-bold ml-1">₹ {totalPaid.toLocaleString()}</span></p>
                                    <p className="text-xs text-slate-500">Balance: <span className="text-red-600 font-bold ml-1">₹ {balance.toLocaleString()}</span></p>
                                </div>
                                <Button className="w-full bg-blue-900 border-none text-white hover:bg-blue-800 shadow-lg shadow-blue-900/10">
                                    Collect Payment
                                </Button>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm md:col-span-3">
                            <CardHeader>
                                <CardTitle className="text-lg">Payment History</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y border-t">
                                    <div className="p-8 text-center text-slate-500">
                                        No payment history available yet.
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Scans Tab --- */}
                <TabsContent value="scans" className="outline-none space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7">
                            <ThreeDViewer fileUrl={selectedScanUrl} />
                        </div>
                        <div className="lg:col-span-5 space-y-6">
                            <Card className="border-none shadow-sm h-full flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">Diagnostic Tools</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 text-[10px] uppercase font-bold tracking-widest gap-2"
                                        onClick={handleDeleteAllScans}
                                        disabled={scans.length === 0}
                                    >
                                        <History className="w-3.5 h-3.5" /> Delete All
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4 flex-1 flex flex-col">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => document.getElementById('scan-upload-input')?.click()}
                                            className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                                <input
                                                    type="file"
                                                    id="scan-upload-input"
                                                    className="hidden"
                                                    accept=".stl,.glb,.obj,.ply,.jpg,.jpeg,.png"
                                                    onChange={handleScanUpload}
                                                />
                                                <Plus className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors mb-2" />
                                                <h5 className="font-semibold text-slate-900">{isUploadingScan ? `Uploading ${uploadProgress}%` : 'Upload File'}</h5>
                                                <p className="text-[10px] text-slate-500 mt-1">STL, GLB, JPG, PNG</p>
                                            </div>
                                            {isUploadingScan && (
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
                                        {scans.length === 0 ? (
                                            <p className="text-center text-slate-400 text-sm py-4">No scans uploaded yet.</p>
                                        ) : (
                                            scans.map((scan) => (
                                                <div
                                                    key={scan.scan_id}
                                                    onClick={() => setSelectedScanUrl(scan.presigned_url || `${API_URL.replace('/api', '')}/${scan.file_path}`)}
                                                    className={`p-3 rounded-lg flex items-center justify-between text-sm cursor-pointer transition-colors ${selectedScanUrl === (scan.presigned_url || `${API_URL.replace('/api', '')}/${scan.file_path}`) ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 hover:bg-slate-100'}`}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-2 bg-blue-100 rounded-md flex-shrink-0">
                                                            <Box className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate">{scan.file_name}</p>
                                                            <p className="text-[10px] text-slate-500 uppercase">{new Date(scan.uploaded_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- Prescriptions Tab --- */}
                <TabsContent value="prescriptions" className="outline-none space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border-none shadow-sm">
                                <CardHeader className="bg-slate-50/50 pb-4">
                                    <CardTitle className="text-lg">Presets</CardTitle>
                                    <CardDescription>Common dental medications</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase text-slate-400">Antibiotics</Label>
                                        {medicationPresets.antibiotics.map(m => (
                                            <Button key={m} variant="outline" className="w-full justify-start text-xs h-9 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200" onClick={() => handleAddMedication(m)}>
                                                + {m}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-xs font-bold uppercase text-slate-400">Analgesics (Pain)</Label>
                                        {medicationPresets.analgesics.map(m => (
                                            <Button key={m} variant="outline" className="w-full justify-start text-xs h-9 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200" onClick={() => handleAddMedication(m)}>
                                                + {m}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-xs font-bold uppercase text-slate-400">Others</Label>
                                        {medicationPresets.others.map(m => (
                                            <Button key={m} variant="outline" className="w-full justify-start text-xs h-9 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200" onClick={() => handleAddMedication(m)}>
                                                + {m}
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-8">
                            <Card className="border-none shadow-sm min-h-[400px]">
                                <CardHeader className="border-b">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">Rx - Prescription</CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => setIsAddPrescriptionOpen(true)}
                                        >
                                            <Plus className="w-4 h-4" /> Add Custom
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {prescriptions.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 mt-12">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                                                <Pill className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="font-medium text-slate-600">No medications prescribed yet</p>
                                            <p className="text-xs mt-1">Select from presets or add custom medication</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {prescriptions.map((p) => (
                                                <div key={p.id} className="p-4 flex items-center justify-between group">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-800">{p.name}</h4>
                                                        <div className="flex gap-4 mt-1">
                                                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase font-bold tracking-widest">{p.dosage}</span>
                                                            <span className="text-xs text-slate-500">{p.duration}</span>
                                                            {p.startDate && <span className="text-xs text-slate-500">Start: {new Date(p.startDate).toLocaleDateString()}</span>}
                                                            <span className="text-xs text-slate-400 italic">{p.notes}</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => setPrescriptions(prescriptions.filter(item => item.id !== p.id))}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- Periodontal Tab --- */}
                <TabsContent value="periodontal" className="outline-none space-y-4">
                    <PeriodontalChart
                        patientId={patient.patient_id}
                        onSave={savePeriodontalExam}
                    />
                </TabsContent>

                {/* --- Final Features --- */}
                <TabsContent value="insurance" className="outline-none space-y-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Insurance Claims</CardTitle><CardDescription>Manage active policies and claim statuses.</CardDescription></div>
                        <Button onClick={() => setIsAddClaimOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"><Plus className="w-4 h-4" /> Add Claim</Button>
                    </CardHeader>
                        <CardContent>
                            {insuranceClaims.length === 0 ? <p className="text-slate-500 text-center py-4">No insurance claims on file.</p> :
                                <div className="space-y-3">
                                    {insuranceClaims.map(c => (
                                        <div key={c.claim_id} className="p-3 border rounded-xl flex items-center justify-between bg-white text-sm">
                                            <div>
                                                <p className="font-semibold text-indigo-900">Policy: {c.policy_number}</p>
                                                <p className="text-slate-500 text-xs">Claim: ₹{c.claim_amount} | Approved: ₹{c.approved_amount || 0}</p>
                                            </div>
                                            <Badge variant={c.status === 'resolved' ? 'default' : 'secondary'} className={c.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                                                {c.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>}
                        </CardContent></Card>
                </TabsContent>

                <TabsContent value="labs" className="outline-none space-y-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Dental Lab Orders</CardTitle><CardDescription>Track external prosthodontic manufacturing.</CardDescription></div>
                        <Button onClick={() => setIsAddLabOrderOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="w-4 h-4" /> New Order</Button>
                    </CardHeader>
                        <CardContent>
                            {labOrders.length === 0 ? <p className="text-slate-500 text-center py-4">No pending lab orders.</p> :
                                <div className="space-y-3">
                                    {labOrders.map(lo => (
                                        <div key={lo.order_id} className="p-3 border rounded-xl flex items-center justify-between bg-white text-sm">
                                            <div>
                                                <p className="font-semibold text-blue-900">{lo.appliance_type} <span className="text-slate-500 font-normal">({lo.tooth_number})</span></p>
                                                <p className="text-slate-500 text-xs">Shade: {lo.shade} | Due: {lo.due_date ? new Date(lo.due_date).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">{lo.status}</Badge>
                                        </div>
                                    ))}
                                </div>}
                        </CardContent></Card>
                </TabsContent>

                <TabsContent value="ortho" className="outline-none space-y-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Orthodontic Tracking</CardTitle><CardDescription>Longitudinal appliance and wire tracking.</CardDescription></div>
                        <Button onClick={() => setIsAddOrthoOpen(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"><Plus className="w-4 h-4" /> Add Record</Button>
                    </CardHeader>
                        <CardContent>
                            {orthoRecords.length === 0 ? <p className="text-slate-500 text-center py-4">No ortho records.</p> :
                                <div className="space-y-3">
                                    {orthoRecords.map(o => (
                                        <div key={o.record_id} className="p-4 border rounded-xl bg-white space-y-2 text-sm">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-slate-800 flex flex-col gap-1"><span>{o.appliance_type}</span> <span className="font-normal text-xs text-slate-500">{new Date(o.visit_date).toLocaleDateString()}</span></p>
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{o.elastics}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                                                <p><span className="font-semibold">Upper Wire:</span> {o.upper_wire}</p>
                                                <p><span className="font-semibold">Lower Wire:</span> {o.lower_wire}</p>
                                            </div>
                                            {o.notes && <p className="text-xs text-slate-500">{o.notes}</p>}
                                        </div>
                                    ))}
                                </div>}
                        </CardContent></Card>
                </TabsContent>

                <TabsContent value="comms" className="outline-none space-y-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Patient Communications</CardTitle><CardDescription>History of SMS/Email outreach.</CardDescription></div>
                        <Button onClick={() => setIsAddCommOpen(true)} size="sm" className="bg-slate-800 hover:bg-slate-900 text-white gap-2"><MessageSquare className="w-4 h-4" /> Log Message</Button>
                    </CardHeader>
                        <CardContent>
                            {communications.length === 0 ? <p className="text-slate-500 text-center py-4">No communication logs.</p> :
                                <div className="space-y-3">
                                    {communications.map(c => (
                                        <div key={c.log_id} className="p-3 border rounded-xl bg-white text-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-semibold text-slate-800 flex items-center gap-2"><Badge variant="outline">{c.comm_type}</Badge> {c.category}</span>
                                                <span className="text-xs text-slate-400">{new Date(c.sent_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-slate-600 mt-2 text-xs p-2 bg-slate-50 rounded-lg border">{c.message_content}</p>
                                        </div>
                                    ))}
                                </div>}
                        </CardContent></Card>
                </TabsContent>
            </Tabs>

            {/* --- Modals for Final Features --- */}
            <Dialog open={isAddClaimOpen} onOpenChange={setIsAddClaimOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Insurance Claim</DialogTitle><DialogDescription>Submit a new claim to the provider.</DialogDescription></DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Policy Number</Label><Input value={newClaim.policy_number} onChange={e => setNewClaim({ ...newClaim, policy_number: e.target.value })} /></div>
                        <div><Label>Claim Amount (₹)</Label><Input type="number" value={newClaim.claim_amount} onChange={e => setNewClaim({ ...newClaim, claim_amount: e.target.value })} /></div>
                        <div><Label>Status</Label><select className="w-full border rounded-md p-2 h-10 text-sm outline-none" value={newClaim.status} onChange={e => setNewClaim({ ...newClaim, status: e.target.value })}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
                        <div><Label>Notes</Label><Textarea value={newClaim.notes} onChange={e => setNewClaim({ ...newClaim, notes: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsAddClaimOpen(false)}>Cancel</Button><Button onClick={saveClaim} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Claim</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddLabOrderOpen} onOpenChange={setIsAddLabOrderOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>New Lab Order</DialogTitle><DialogDescription>Send impressions/scans to the external lab.</DialogDescription></DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Appliance Type</Label><Input placeholder="e.g. Zirconia Crown, PFM Bridge" value={newLabOrder.appliance_type} onChange={e => setNewLabOrder({ ...newLabOrder, appliance_type: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Tooth Number</Label><Input placeholder="e.g. 16, 21" value={newLabOrder.tooth_number} onChange={e => setNewLabOrder({ ...newLabOrder, tooth_number: e.target.value })} /></div>
                            <div><Label>Shade (Optional)</Label><Input placeholder="e.g. A2, B1" value={newLabOrder.shade} onChange={e => setNewLabOrder({ ...newLabOrder, shade: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Status</Label><select className="w-full border rounded-md p-2 h-10 text-sm outline-none" value={newLabOrder.status} onChange={e => setNewLabOrder({ ...newLabOrder, status: e.target.value })}><option value="sent">Sent to Lab</option><option value="received">Received</option><option value="delivered">Delivered to Patient</option></select></div>
                            <div><Label>Due Date</Label><Input type="date" value={newLabOrder.due_date} onChange={e => setNewLabOrder({ ...newLabOrder, due_date: e.target.value })} /></div>
                        </div>
                        <div><Label>Instructions</Label><Textarea placeholder="Special instructions for the technician" value={newLabOrder.instructions} onChange={e => setNewLabOrder({ ...newLabOrder, instructions: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsAddLabOrderOpen(false)}>Cancel</Button><Button onClick={saveLabOrder} className="bg-blue-600 hover:bg-blue-700 text-white">Save Order</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddOrthoOpen} onOpenChange={setIsAddOrthoOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Log Orthodontic Visit</DialogTitle><DialogDescription>Track wire changes and elastics.</DialogDescription></DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Appliance/System</Label><Input placeholder="e.g. MBT 0.22, Invisalign Aligners" value={newOrtho.appliance_type} onChange={e => setNewOrtho({ ...newOrtho, appliance_type: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Upper Wire</Label><Input placeholder="e.g. 014 NiTi" value={newOrtho.upper_wire} onChange={e => setNewOrtho({ ...newOrtho, upper_wire: e.target.value })} /></div>
                            <div><Label>Lower Wire</Label><Input placeholder="e.g. 018 SS" value={newOrtho.lower_wire} onChange={e => setNewOrtho({ ...newOrtho, lower_wire: e.target.value })} /></div>
                        </div>
                        <div><Label>Elastics/Accessories</Label><Input placeholder='e.g. Class II Elastics 1/4"' value={newOrtho.elastics} onChange={e => setNewOrtho({ ...newOrtho, elastics: e.target.value })} /></div>
                        <div><Label>Notes & Adjustments</Label><Textarea placeholder="Power chain 13-23, open coil spring 34-35..." value={newOrtho.notes} onChange={e => setNewOrtho({ ...newOrtho, notes: e.target.value })} /></div>
                        <div><Label>Next Visit Tasks</Label><Input placeholder="e.g. Change to 19x25 SS" value={newOrtho.next_visit_tasks} onChange={e => setNewOrtho({ ...newOrtho, next_visit_tasks: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsAddOrthoOpen(false)}>Cancel</Button><Button onClick={saveOrthoRecord} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Record</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddCommOpen} onOpenChange={setIsAddCommOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Log Communication</DialogTitle><DialogDescription>Draft an SMS or Email log.</DialogDescription></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Type</Label><select className="w-full border rounded-md p-2 h-10 text-sm outline-none" value={newComm.comm_type} onChange={e => setNewComm({ ...newComm, comm_type: e.target.value })}><option value="Email">Email</option><option value="SMS">SMS</option><option value="WhatsApp">WhatsApp</option><option value="Phone Call">Phone Call</option></select></div>
                            <div><Label>Category</Label><select className="w-full border rounded-md p-2 h-10 text-sm outline-none" value={newComm.category} onChange={e => setNewComm({ ...newComm, category: e.target.value })}><option value="Follow-up">Follow-up</option><option value="Appointment Reminder">Appointment Reminder</option><option value="Treatment Info">Treatment Info</option><option value="Billing">Billing</option></select></div>
                        </div>
                        <div><Label>Message Content</Label><Textarea placeholder="Hi, this is a reminder for your upcoming..." value={newComm.message_content} onChange={e => setNewComm({ ...newComm, message_content: e.target.value })} className="min-h-[100px]" /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsAddCommOpen(false)}>Cancel</Button><Button onClick={saveCommunication} className="bg-slate-800 hover:bg-slate-900 text-white">Save Log</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Procedure Modal */}
            <Dialog open={isAddProcedureOpen} onOpenChange={setIsAddProcedureOpen}>
                <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900">Add New Procedure</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Schedule a new treatment or procedure.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="proc-name" className="text-right">
                                Procedure
                            </Label>
                            <Input
                                id="proc-name"
                                value={newProcedure.type}
                                onChange={(e) => setNewProcedure({ ...newProcedure, type: e.target.value })}
                                className="col-span-3 bg-white border-slate-300 text-slate-900"
                                placeholder="e.g. Root Canal, Extraction"
                            />
                        </div>

                        {/* Phase Selector - only show if there are plans with phases */}
                        {treatmentPlans.filter(p => p.phases?.length > 0).length > 0 && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phase-select" className="text-right">
                                    Assign Phase
                                </Label>
                                <select
                                    id="phase-select"
                                    className="col-span-3 bg-white border border-slate-300 rounded-md p-2 text-sm"
                                    value={newProcedure.phase_id}
                                    onChange={(e) => setNewProcedure({ ...newProcedure, phase_id: e.target.value })}
                                >
                                    <option value="">Quick Entry (Unassigned)</option>
                                    {treatmentPlans.map(plan => (
                                        <optgroup key={plan.plan_id} label={plan.name}>
                                            {plan.phases.map((ph: any) => (
                                                <option key={ph.phase_id} value={ph.phase_id}>
                                                    Phase {ph.phase_order}: {ph.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="proc-date" className="text-right">
                                Date
                            </Label>
                            <Input
                                id="proc-date"
                                type="date"
                                value={newProcedure.date}
                                onChange={(e) => setNewProcedure({ ...newProcedure, date: e.target.value })}
                                className="col-span-3 bg-white border-slate-300 text-slate-900"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tooth-num" className="text-right">
                                Tooth No.
                            </Label>
                            <Input
                                id="tooth-num"
                                value={newProcedure.tooth}
                                onChange={(e) => setNewProcedure({ ...newProcedure, tooth: e.target.value })}
                                className="col-span-3 bg-white border-slate-300 text-slate-900"
                                placeholder="e.g. 16, 24"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cost" className="text-right">
                                Cost (₹)
                            </Label>
                            <Input
                                id="cost"
                                type="number"
                                value={newProcedure.cost}
                                onChange={(e) => setNewProcedure({ ...newProcedure, cost: e.target.value })}
                                className="col-span-3 bg-white border-slate-300 text-slate-900"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddProcedureOpen(false)}>Cancel</Button>
                        <Button className="bg-blue-900 text-white hover:bg-blue-800" onClick={saveProcedure}>Save Procedure</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Treatment Plan Modal */}
            <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
                <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Treatment Plan</DialogTitle>
                        <DialogDescription>Create a master plan/case for this patient.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Plan Name</Label>
                            <Input
                                placeholder="e.g. Full Mouth Rehabilitation, Ortho Case"
                                value={newPlan.name}
                                onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <select
                                className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm"
                                value={newPlan.priority}
                                onChange={e => setNewPlan({ ...newPlan, priority: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="emergency">Emergency</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddPlanOpen(false)}>Cancel</Button>
                        <Button className="bg-blue-900 text-white" onClick={saveTreatmentPlan}>Create Plan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Phase Modal */}
            <Dialog open={isAddPhaseOpen} onOpenChange={setIsAddPhaseOpen}>
                <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Treatment Phase</DialogTitle>
                        <DialogDescription>Define a stage within the selected plan.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Phase Name</Label>
                            <Input
                                placeholder="e.g. Phase 1: Stabilization, Phase 2: Restorative"
                                value={newPhase.name}
                                onChange={e => setNewPhase({ ...newPhase, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddPhaseOpen(false)}>Cancel</Button>
                        <Button className="bg-blue-900 text-white" onClick={savePhase}>Add Phase</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Prescription Modal */}
            <Dialog open={isAddPrescriptionOpen} onOpenChange={setIsAddPrescriptionOpen}>
                <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-slate-900">Add Prescription</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            Add a custom medication to the prescription list.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="med-start-date" className="text-right">
                                Start Date
                            </Label>
                            <Input
                                id="med-start-date"
                                type="date"
                                value={newPrescription.startDate}
                                onChange={(e) => setNewPrescription({ ...newPrescription, startDate: e.target.value })}
                                className="col-span-3 bg-white border-slate-300 text-slate-900"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="med-name" className="text-right">
                                Medicine
                            </Label>
                            <Input
                                id="med-name"
                                value={newPrescription.name}
                                onChange={(e) => setNewPrescription({ ...newPrescription, name: e.target.value })}
                                className="col-span-3 bg-white border-slate-300 text-slate-900"
                                placeholder="e.g. Paracetamol 500mg"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dosage" className="text-right">
                                Dosage
                            </Label>
                            <Input
                                id="dosage"
                                value={newPrescription.dosage}
                                onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                                className="col-span-3 bg-white border-slate-300 text-slate-900"
                                placeholder="e.g. 1-0-1"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="duration" className="text-right">
                                Duration
                            </Label>
                            <Input
                                id="duration"
                                value={newPrescription.duration}
                                onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                                className="col-span-3 bg-white border-slate-300 text-slate-900"
                                placeholder="e.g. 5 days"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">
                                Notes
                            </Label>
                            <Input
                                id="notes"
                                value={newPrescription.notes}
                                onChange={(e) => setNewPrescription({ ...newPrescription, notes: e.target.value })}
                                className="col-span-3 bg-white border-slate-300 text-slate-900"
                                placeholder="e.g. After food"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddPrescriptionOpen(false)}>Cancel</Button>
                        <Button className="bg-blue-900 text-white hover:bg-blue-800" onClick={handleSavePrescription}>Add Medication</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

