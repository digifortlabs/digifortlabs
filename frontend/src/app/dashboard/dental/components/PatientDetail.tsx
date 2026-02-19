"use client";

import React, { useState } from 'react';
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
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
    Box, Stethoscope, History, Pill, ChevronRight,
    Camera
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Odontogram from '@/components/dental/Odontogram';
import ThreeDViewer from '@/components/dental/ThreeDViewer';
import LiveScanner from '@/components/dental/LiveScanner';
import { API_URL } from '@/config/api';

interface PatientDetailProps {
    patient: any;
    onBack: () => void;
}

export default function PatientDetail({ patient, onBack }: PatientDetailProps) {
    const [activeTab, setActiveTab] = useState("examination");
    const [isSaving, setIsSaving] = useState(false);
    const [liveScannerOpen, setLiveScannerOpen] = useState(false);

    // Clinical State
    // Clinical State - Safely merge defaults in case backend data is empty object {}
    const [clinicalData, setClinicalData] = useState({
        chief_complaints: [],
        medical_history: {},
        odontogram: {},
        notes: "",
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

    // Scans State
    const [scans, setScans] = useState<any[]>([]);
    const [selectedScanUrl, setSelectedScanUrl] = useState<string>("");
    const [isUploadingScan, setIsUploadingScan] = useState(false);

    // Fetch scans on load
    React.useEffect(() => {
        if (activeTab === 'scans') {
            fetchScans();
        }
    }, [activeTab]);

    const fetchScans = async () => {
        try {
            const response = await fetch(`${API_URL}/dental/scans/patient/${patient.patient_id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setScans(data);
                if (data.length > 0 && !selectedScanUrl) {
                    // Auto-select first scan
                    setSelectedScanUrl(`${API_URL.replace('/api', '')}/${data[0].file_path}`);
                }
            }
        } catch (error) {
            console.error("Error fetching scans:", error);
        }
    };

    const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('scan_type', 'Intraoral'); // Default for now

        setIsUploadingScan(true);
        try {
            const response = await fetch(`${API_URL}/dental/scans/${patient.patient_id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                alert("Scan uploaded successfully!");
                fetchScans();
            } else {
                alert("Failed to upload scan.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading scan.");
        } finally {
            setIsUploadingScan(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleLiveScanSave = async (files: File[]) => {
        setIsUploadingScan(true);
        let successCount = 0;

        try {
            // Upload sequentially
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('scan_type', 'Intraoral Photo');

                const response = await fetch(`${API_URL}/dental/scans/${patient.patient_id}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: formData
                });

                if (response.ok) successCount++;
            }

            if (successCount > 0) {
                alert(`Successfully saved ${successCount} images.`);
                fetchScans();
            }
        } catch (error) {
            console.error("Live save error:", error);
            alert("Error saving live scans.");
        } finally {
            setIsUploadingScan(false);
        }
    };

    const [isScanning, setIsScanning] = useState(false);

    const handleLaunchScanner = async () => {
        setIsScanning(true);
        try {
            const response = await fetch(`${API_URL}/dental/scanner/launch`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                alert("Scanner software launched! Please perform the scan and export to 'C:\\DentalScans'.");
                // TODO: Start polling for new files
            } else {
                const data = await response.json();
                if (response.status === 404) {
                    const path = prompt("Scanner software not found. Please enter the full path to your scanner .exe:", data.path || "");
                    if (path) {
                        // In a real app, save this to user prefs
                        alert(`Path '${path}' noted. (Feature to save config pending)`);
                    }
                } else {
                    alert("Failed to launch scanner: " + data.detail);
                }
            }
        } catch (error) {
            console.error("Launch error:", error);
            alert("Error launching scanner.");
        } finally {
            setTimeout(() => setIsScanning(false), 5000); // Reset state after 5s
        }
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
        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/dental/patients/${patient.patient_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...patient,
                    clinical_data: clinicalData,
                    habits: habits,
                    prescriptions: prescriptions
                })
            });
            if (response.ok) {
                alert("Record saved successfully!");
            } else {
                alert("Failed to save record.");
            }
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setIsSaving(false);
        }
    };

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
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span>ID: #{patient.patient_id.toString().padStart(5, '0')}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span>{patient.phone}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span>Last Visit: {patient.last_visit}</span>
                            </div>
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
                                                        setClinicalData({
                                                            ...clinicalData,
                                                            chief_complaints: [...clinicalData.chief_complaints, val]
                                                        });
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
                                                            onClick={() => setClinicalData({ ...clinicalData, medical_history: { ...clinicalData.medical_history, [h]: false } })}
                                                        >NO</button>
                                                        <button
                                                            className={`w-8 h-6 rounded text-[10px] font-bold ${clinicalData.medical_history[h] === true ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                            onClick={() => setClinicalData({ ...clinicalData, medical_history: { ...clinicalData.medical_history, [h]: true } })}
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
                                setChiefComplaint={(notes) => setClinicalData({ ...clinicalData, notes })}
                                advice={clinicalData.advice || ""}
                                setAdvice={(advice) => setClinicalData({ ...clinicalData, advice })}
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* --- Procedures Tab --- */}
                <TabsContent value="procedures" className="outline-none">
                    <Card className="border-none shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Treatment Plan</CardTitle>
                                <CardDescription>List of planned and ongoing procedures</CardDescription>
                            </div>
                            <Button className="bg-blue-900 hover:bg-blue-800 text-white gap-2">
                                <Plus className="w-4 h-4" /> Add Procedure
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="border-t">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b">
                                        <tr>
                                            <th className="px-6 py-4">Procedure</th>
                                            <th className="px-6 py-4">Tooth</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Estimated (₹)</th>
                                            <th className="px-6 py-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <tr className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-semibold">Root Canal Treatment</td>
                                            <td className="px-6 py-4">#16</td>
                                            <td className="px-6 py-4">
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">In Progress</Badge>
                                            </td>
                                            <td className="px-6 py-4">₹ 4,500</td>
                                            <td className="px-6 py-4">
                                                <Button variant="ghost" size="sm" className="text-xs">Complete</Button>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-semibold">Composite Filling</td>
                                            <td className="px-6 py-4">#24</td>
                                            <td className="px-6 py-4">
                                                <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none">Planned</Badge>
                                            </td>
                                            <td className="px-6 py-4">₹ 1,200</td>
                                            <td className="px-6 py-4">
                                                <Button variant="ghost" size="sm" className="text-xs">Start</Button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Billing Tab --- */}
                <TabsContent value="billing" className="outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-none shadow-sm md:col-span-1">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Payable</CardTitle>
                                <h3 className="text-3xl font-bold">₹ 5,700</h3>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500">Paid: <span className="text-emerald-600 font-bold ml-1">₹ 2,000</span></p>
                                    <p className="text-xs text-slate-500">Balance: <span className="text-red-600 font-bold ml-1">₹ 3,700</span></p>
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
                                    <div className="p-4 flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-semibold underline decoration-blue-200 underline-offset-4">Receipt #REC-2024-001</p>
                                            <p className="text-xs text-slate-500 mt-1">16 Feb 2024 • Cash</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600">₹ 2,000</p>
                                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-600 text-[10px] uppercase font-bold tracking-widest">Download Receipt</Button>
                                        </div>
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
                                <CardHeader>
                                    <CardTitle className="text-lg">Diagnostic Tools</CardTitle>
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
                                                <h5 className="font-semibold text-slate-900">{isUploadingScan ? 'Uploading...' : 'Upload File'}</h5>
                                                <p className="text-[10px] text-slate-500 mt-1">STL, GLB, JPG, PNG</p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setLiveScannerOpen(true)}
                                            className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors cursor-pointer group bg-emerald-50/10"
                                        >
                                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                                <Camera className="w-8 h-8 text-emerald-400 group-hover:text-emerald-600 transition-colors mb-2" />
                                                <h5 className="font-semibold text-slate-900">Live Camera</h5>
                                                <p className="text-[10px] text-slate-500 mt-1">Capture from Intraoral Cam</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Scanner Modal */}
                                    <LiveScanner
                                        isOpen={liveScannerOpen}
                                        onClose={() => setLiveScannerOpen(false)}
                                        onSave={handleLiveScanSave}
                                    />

                                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
                                        {scans.length === 0 ? (
                                            <p className="text-center text-slate-400 text-sm py-4">No scans uploaded yet.</p>
                                        ) : (
                                            scans.map((scan) => (
                                                <div
                                                    key={scan.scan_id}
                                                    onClick={() => setSelectedScanUrl(`${API_URL.replace('/api', '')}/${scan.file_path}`)}
                                                    className={`p-3 rounded-lg flex items-center justify-between text-sm cursor-pointer transition-colors ${selectedScanUrl.includes(scan.file_path) ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50 hover:bg-slate-100'}`}
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
                                        {["Amoxicillin 500mg", "Augmentin 625mg", "Metrogyl 400mg"].map(m => (
                                            <Button key={m} variant="outline" className="w-full justify-start text-xs h-9 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200" onClick={() => handleAddMedication(m)}>
                                                + {m}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-xs font-bold uppercase text-slate-400">Analgesics (Pain)</Label>
                                        {["Zerodol P (Aceclofenac + Paracetamol)", "Combiflam", "Ketorol DT"].map(m => (
                                            <Button key={m} variant="outline" className="w-full justify-start text-xs h-9 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200" onClick={() => handleAddMedication(m)}>
                                                + {m}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-xs font-bold uppercase text-slate-400">Others</Label>
                                        {["Pantocid 40mg (Antacid)", "Chlohexidine Mouthwash"].map(m => (
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
                                        <Button variant="outline" size="sm" className="gap-2">
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
            </Tabs>
        </div>
    );
}
