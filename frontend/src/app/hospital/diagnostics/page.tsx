"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/config/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { Activity, Plus, Search, Edit2, Trash2, X, FileText, Upload, Clock, User as UserIcon, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MODALITIES = ["All", "Pathology", "Radiology", "CT Scan", "MRI", "Cardiology", "Microbiology"];

export default function DiagnosticsCenterPage() {
    const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'catalog'>('active');
    const [modalityFilter, setModalityFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Data States
    const [catalog, setCatalog] = useState<any[]>([]);
    const [activeOrders, setActiveOrders] = useState<any[]>([]);
    const [completedOrders, setCompletedOrders] = useState<any[]>([]);

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTest, setEditTest] = useState<any>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTestForm, setNewTestForm] = useState({ test_name: '', price: '', category: 'Pathology' });

    // Assign Test Modal
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);

    // Upload Result Modal
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadOrder, setUploadOrder] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [catData, actData, compData, patData] = await Promise.all([
                apiFetch('lab/catalog'),
                apiFetch('lab/orders/pending'),
                apiFetch('lab/orders/completed'),
                apiFetch('patients')
            ]);
            setCatalog(catData || []);
            setActiveOrders(actData || []);
            setCompletedOrders(compData || []);
            setPatients(patData || []);
        } catch (error) {
            toast.error("Failed to fetch diagnostics data");
        } finally {
            setIsLoading(false);
        }
    };

    // Catalog Actions
    const handleEditSave = async () => {
        if (!editTest.test_name.trim()) return toast.error("Test name is required");
        try {
            await apiFetch(`lab/catalog/${editTest.test_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    test_name: editTest.test_name,
                    category: editTest.category || "Pathology",
                    price: parseFloat(editTest.price) || 0
                })
            });
            toast.success("Test updated successfully");
            setIsEditModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to update test");
        }
    };

    const handleDelete = async (test_id: number) => {
        if (!confirm("Are you sure you want to delete this test permanently?")) return;
        try {
            await apiFetch(`lab/catalog/${test_id}`, { method: 'DELETE' });
            toast.success("Test deleted successfully");
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete test");
        }
    };

    const handleAddSubmit = async () => {
        if (!newTestForm.test_name.trim()) return toast.error("Test name is required");
        try {
            await apiFetch('lab/catalog', {
                method: 'POST',
                body: JSON.stringify({
                    test_name: newTestForm.test_name,
                    category: newTestForm.category,
                    price: parseFloat(newTestForm.price) || 0
                })
            });
            toast.success("New test added successfully");
            setIsAddModalOpen(false);
            setNewTestForm({ test_name: '', price: '', category: 'Pathology' });
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to add test");
        }
    };

    // Assign Orders
    const handleAssignOrders = async () => {
        if (!selectedPatientId) return toast.error("Select a patient");
        if (selectedTestIds.length === 0) return toast.error("Select at least one test");

        try {
            await apiFetch('lab/orders', {
                method: 'POST',
                body: JSON.stringify({
                    patient_id: selectedPatientId,
                    test_ids: selectedTestIds,
                    visit_type: "Walk-in"
                })
            });
            toast.success("Tests ordered successfully");
            setIsAssignModalOpen(false);
            setSelectedPatientId(null);
            setSelectedTestIds([]);
            fetchData();
            setActiveTab('active');
        } catch (error: any) {
            toast.error(error.message || "Failed to assign tests");
        }
    };

    // Upload Report
    const handleUploadReport = async () => {
        if (!selectedFile) return toast.error("Please select a file to upload");
        setIsUploading(true);

        const formData = new FormData();
        formData.append("order_id", uploadOrder.order_id.toString());
        formData.append("test_id", uploadOrder.test_id.toString());
        formData.append("result_value", "Report Uploaded");
        if (selectedFile) formData.append("file", selectedFile);

        try {
            await apiFetch(`lab/results/upload`, {
                method: 'POST',
                body: formData
            });
            toast.success("Report uploaded and test marked as completed");
            setIsUploadModalOpen(false);
            setUploadOrder(null);
            setSelectedFile(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to upload report");
        } finally {
            setIsUploading(false);
        }
    };

    // Filters
    const filteredCatalog = catalog.filter(t => 
        t.test_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (modalityFilter === 'All' || t.category === modalityFilter)
    );

    const filteredActive = activeOrders.filter(o => 
        (o.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || o.test_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (modalityFilter === 'All' || o.category === modalityFilter)
    );

    const filteredCompleted = completedOrders.filter(o => 
        (o.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || o.test_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (modalityFilter === 'All' || o.category === modalityFilter)
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl text-white">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Activity className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Diagnostics Operations</h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-xl">Manage diagnostic workflows, track active tests, upload imaging and lab reports, and manage your service catalog.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button 
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold w-full md:w-auto rounded-xl shadow-lg shadow-blue-900/20"
                        onClick={() => setIsAssignModalOpen(true)}
                    >
                        <Plus className="w-5 h-5 mr-2" /> Order New Test
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-2xl w-full max-w-fit border border-slate-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 ${activeTab === 'active' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                    <Clock className="w-4 h-4" /> Active Orders
                    <Badge className="ml-1 bg-blue-100 text-blue-700 hover:bg-blue-100">{activeOrders.length}</Badge>
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 ${activeTab === 'completed' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                    <CheckCircle2 className="w-4 h-4" /> Completed
                    <Badge className="ml-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{completedOrders.length}</Badge>
                </button>
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 ${activeTab === 'catalog' ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                    <FileText className="w-4 h-4" /> Catalog Management
                </button>
            </div>

            {/* Modality Filters & Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {MODALITIES.map(mod => (
                        <button
                            key={mod}
                            onClick={() => setModalityFilter(mod)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${modalityFilter === mod ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {mod}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder={activeTab === 'catalog' ? "Search tests by name..." : "Search patient or test..."}
                        className="pl-9 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-3xl bg-white">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                {activeTab !== 'catalog' && (
                                    <>
                                        <th className="p-4 font-bold text-slate-600 text-sm">Patient / ID</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm">Test Details</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm">Modality</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm">Ordered By</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm">Time / Status</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                                    </>
                                )}
                                {activeTab === 'catalog' && (
                                    <>
                                        <th className="p-4 font-bold text-slate-600 text-sm w-16">ID</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm">Test Name / Description</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm">Modality</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm text-right">Price (₹)</th>
                                        <th className="p-4 font-bold text-slate-600 text-sm text-center">Actions</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-medium">Loading data...</td></tr>
                            ) : activeTab === 'active' ? (
                                filteredActive.length === 0 ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-medium">No active orders found.</td></tr>
                                ) : (
                                    filteredActive.map(order => (
                                        <tr key={order.order_id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{order.patient_name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{order.mrd_number}</div>
                                            </td>
                                            <td className="p-4 font-bold text-slate-700">{order.test_name}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                                                    {order.category || 'Pathology'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 flex items-center gap-1.5 mt-2">
                                                <UserIcon className="w-3.5 h-3.5 text-slate-400" /> {order.doctor_name}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium text-amber-600">
                                                    {formatDistanceToNow(new Date(order.ordered_at), { addSuffix: true })}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">{order.status}</div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button 
                                                    size="sm" 
                                                    className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                                                    onClick={() => {
                                                        setUploadOrder(order);
                                                        setIsUploadModalOpen(true);
                                                    }}
                                                >
                                                    <Upload className="w-4 h-4 mr-1.5" /> Upload Report
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : activeTab === 'completed' ? (
                                filteredCompleted.length === 0 ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-medium">No completed orders found.</td></tr>
                                ) : (
                                    filteredCompleted.map(order => (
                                        <tr key={order.order_id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{order.patient_name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{order.mrd_number}</div>
                                            </td>
                                            <td className="p-4 font-bold text-slate-700">{order.test_name}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                                                    {order.category || 'Pathology'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 flex items-center gap-1.5 mt-2">
                                                <UserIcon className="w-3.5 h-3.5 text-slate-400" /> {order.doctor_name}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {order.completed_at ? formatDistanceToNow(new Date(order.completed_at), { addSuffix: true }) : 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                {order.pdf_file_id ? (
                                                    <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => window.open(`/api/patients/files/${order.pdf_file_id}/view`, '_blank')}>
                                                        <FileText className="w-4 h-4 mr-1.5" /> View Report
                                                    </Button>
                                                ) : (
                                                    <span className="text-slate-400 text-sm italic">No PDF Attached</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                filteredCatalog.length === 0 ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium">No tests found in catalog.</td></tr>
                                ) : (
                                    filteredCatalog.map(test => (
                                        <tr key={test.test_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 text-slate-500 font-mono text-sm">#{test.test_id}</td>
                                            <td className="p-4 font-bold text-slate-800">{test.test_name}</td>
                                            <td className="p-4">
                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                                    {test.category || 'Pathology'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-emerald-600">
                                                ₹{test.price.toFixed(2)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-blue-600 hover:bg-blue-50"
                                                        onClick={() => { setEditTest({ ...test }); setIsEditModalOpen(true); }}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-rose-500 hover:bg-rose-50"
                                                        onClick={() => handleDelete(test.test_id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Catalog Action Buttons (only visible in Catalog tab) */}
            {activeTab === 'catalog' && (
                <div className="flex justify-end mt-4">
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-slate-800 hover:bg-slate-700 shadow-md">
                        <Plus className="w-4 h-4 mr-2" /> Add Custom Test to Catalog
                    </Button>
                </div>
            )}

            {/* Modals */}
            {/* Assign Test Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
                                    <Activity className="text-blue-600 w-6 h-6" /> Order Diagnostic Tests
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">Select a patient and assign modalities.</p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm border border-slate-200 p-2 rounded-full"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                            {/* Patient Selection */}
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">1. Select Patient</label>
                                <select 
                                    className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                    value={selectedPatientId || ''}
                                    onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                                >
                                    <option value="">-- Choose a Patient --</option>
                                    {patients.map(p => (
                                        <option key={p.record_id} value={p.record_id}>
                                            {p.full_name} ({p.patient_u_id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Test Selection */}
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">2. Select Tests & Modalities</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Group tests by modality */}
                                    {["CT Scan", "MRI", "Pathology", "Radiology", "Cardiology"].map(mod => {
                                        const modTests = catalog.filter(t => t.category === mod);
                                        if (modTests.length === 0) return null;
                                        return (
                                            <div key={mod} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                                                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                                    {mod} <Badge variant="secondary" className="ml-auto bg-white">{modTests.length}</Badge>
                                                </h4>
                                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                                    {modTests.map(test => (
                                                        <label key={test.test_id} className="flex items-start gap-3 p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 hover:shadow-sm cursor-pointer transition-all">
                                                            <input 
                                                                type="checkbox" 
                                                                className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                checked={selectedTestIds.includes(test.test_id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setSelectedTestIds(prev => [...prev, test.test_id]);
                                                                    else setSelectedTestIds(prev => prev.filter(id => id !== test.test_id));
                                                                }}
                                                            />
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-700">{test.test_name}</div>
                                                                <div className="text-xs text-slate-500 font-mono">₹{test.price.toFixed(2)}</div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <div className="text-sm font-bold text-slate-600">
                                {selectedTestIds.length} tests selected
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} className="rounded-xl">Cancel</Button>
                                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md" onClick={handleAssignOrders}>
                                    Confirm Order <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Report Modal */}
            {isUploadModalOpen && uploadOrder && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-black text-slate-800 text-xl">Upload Report</h3>
                            <p className="text-slate-500 text-sm mt-1">{uploadOrder.test_name} for {uploadOrder.patient_name}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer relative">
                                <input 
                                    type="file" 
                                    accept="application/pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            setSelectedFile(e.target.files[0]);
                                        }
                                    }}
                                />
                                <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                                    <div className={`p-3 rounded-full ${selectedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div className="font-bold text-slate-700">
                                        {selectedFile ? selectedFile.name : "Select PDF Report to Upload"}
                                    </div>
                                    {!selectedFile && <div className="text-xs text-slate-500">Click or drag and drop</div>}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => {setIsUploadModalOpen(false); setSelectedFile(null);}} className="rounded-xl">Cancel</Button>
                            <Button 
                                className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md" 
                                onClick={handleUploadReport}
                                disabled={!selectedFile || isUploading}
                            >
                                {isUploading ? "Uploading..." : "Complete Order"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Modals for Catalog (Re-used basic logic but styled) */}
            {(isAddModalOpen || isEditModalOpen) && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 text-xl">{isAddModalOpen ? 'Add Catalog Test' : 'Edit Test'}</h3>
                            <button onClick={() => {setIsAddModalOpen(false); setIsEditModalOpen(false);}} className="text-slate-400 hover:text-slate-600 bg-white border border-slate-200 p-1.5 rounded-full"><X size={16} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-1.5">Test Name</label>
                                <Input 
                                    className="rounded-xl border-slate-200 focus-visible:ring-blue-500"
                                    value={isAddModalOpen ? newTestForm.test_name : editTest?.test_name || ''} 
                                    onChange={e => isAddModalOpen ? setNewTestForm({...newTestForm, test_name: e.target.value}) : setEditTest({...editTest, test_name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-1.5">Category / Modality</label>
                                <select 
                                    className="w-full border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm px-3 py-2 border"
                                    value={isAddModalOpen ? newTestForm.category : editTest?.category || 'Pathology'}
                                    onChange={e => isAddModalOpen ? setNewTestForm({...newTestForm, category: e.target.value}) : setEditTest({...editTest, category: e.target.value})}
                                >
                                    {MODALITIES.filter(m => m !== 'All').map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-1.5">Price (₹)</label>
                                <Input 
                                    type="number"
                                    className="rounded-xl border-slate-200 focus-visible:ring-blue-500 font-mono"
                                    value={isAddModalOpen ? newTestForm.price : editTest?.price || ''} 
                                    onChange={e => isAddModalOpen ? setNewTestForm({...newTestForm, price: e.target.value}) : setEditTest({...editTest, price: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => {setIsAddModalOpen(false); setIsEditModalOpen(false);}} className="rounded-xl">Cancel</Button>
                            <Button className="bg-slate-800 hover:bg-slate-900 rounded-xl shadow-md text-white" onClick={isAddModalOpen ? handleAddSubmit : handleEditSave}>
                                {isAddModalOpen ? "Create Test" : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
