"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FlaskConical, Search, CheckCircle, FileText, Upload, Save, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function LabDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Result Modal State
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [resultForm, setResultForm] = useState({
        result_value: '',
        reference_range: '',
        remarks: ''
    });
    const [reportFile, setReportFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/lab/orders/pending');
            setOrders(data || []);
        } catch (error) {
            console.error("Failed to fetch lab orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleOpenResultModal = (order: any) => {
        setSelectedOrder(order);
        setResultForm({ result_value: '', reference_range: '', remarks: '' });
        setReportFile(null);
        setIsResultModalOpen(true);
    };

    const handleSaveResult = async () => {
        if (!selectedOrder) return;
        try {
            const formData = new FormData();
            formData.append('order_id', selectedOrder.order_id);
            formData.append('test_id', selectedOrder.test_id);
            formData.append('result_value', resultForm.result_value);
            if (resultForm.reference_range) formData.append('reference_range', resultForm.reference_range);
            if (resultForm.remarks) formData.append('remarks', resultForm.remarks);
            
            if (reportFile) {
                formData.append('file', reportFile);
            }

            const token = localStorage.getItem('access_token');
            const hospitalId = localStorage.getItem('hospital_id');
            const baseUrl = typeof window !== 'undefined'
                ? (window.location.hostname.includes('digifortlabs.com') ? 'https://digifortlabs.com/api' : '/api')
                : 'http://localhost:8000';

            const res = await fetch(`${baseUrl}/lab/results/upload`, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...(hospitalId ? { 'X-Hospital-Id': hospitalId } : {})
                },
                body: formData
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Failed to save result");
            }
            
            toast.success("Lab result saved successfully.");
            setIsResultModalOpen(false);
            fetchOrders();
        } catch (error: any) {
            console.error("Failed to save result:", error);
            toast.error(error.message || "Failed to save result.");
        }
    };

    const filteredOrders = orders.filter(o => 
        o.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.test_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FlaskConical className="w-7 h-7 text-purple-600" />
                        Laboratory Information System
                    </h1>
                    <p className="text-slate-500 mt-1">Manage lab orders and publish test results</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search by Patient or Test Name..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-50 border-slate-200"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Patient Details</th>
                                    <th className="px-6 py-4 font-bold">Test Name</th>
                                    <th className="px-6 py-4 font-bold">Ordered At</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-slate-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                            Loading lab orders...
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-slate-500">
                                            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                            No pending lab orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.order_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{order.patient_name}</p>
                                                <p className="text-xs text-slate-500">MRD: {order.mrd_number}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-purple-900">{order.test_name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {format(new Date(order.ordered_at), 'dd MMM yyyy, h:mm a')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" onClick={() => handleOpenResultModal(order)} className="bg-purple-600 hover:bg-purple-700 text-white">
                                                    Enter Result
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

            {/* Enter Result Modal */}
            <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-600" /> Enter Lab Results
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedOrder && (
                        <div className="space-y-4 py-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2">
                                <h3 className="font-bold text-slate-900 text-lg">{selectedOrder.patient_name}</h3>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-md">{selectedOrder.test_name}</span>
                                    <span className="text-xs text-slate-500">{format(new Date(selectedOrder.ordered_at), 'dd MMM yyyy')}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Result Value <span className="text-rose-500">*</span></Label>
                                    <Input 
                                        placeholder="e.g., 14.5, Negative, 120"
                                        value={resultForm.result_value} 
                                        onChange={e => setResultForm({...resultForm, result_value: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reference Range <span className="text-slate-400 font-normal">(Optional)</span></Label>
                                    <Input 
                                        placeholder="e.g., 12.0 - 15.5 g/dL"
                                        value={resultForm.reference_range} 
                                        onChange={e => setResultForm({...resultForm, reference_range: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Technician Remarks <span className="text-slate-400 font-normal">(Optional)</span></Label>
                                    <Input 
                                        placeholder="Any observations..."
                                        value={resultForm.remarks} 
                                        onChange={e => setResultForm({...resultForm, remarks: e.target.value})}
                                    />
                                </div>
                                
                                <div className="pt-2 border-t border-slate-100">
                                    <Label className="mb-2 block">Upload Report PDF/Image (Optional)</Label>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={(e) => setReportFile(e.target.files?.[0] || null)} 
                                        className="hidden" 
                                        accept=".pdf,.png,.jpg,.jpeg"
                                    />
                                    <Button 
                                        variant="outline" 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full border-dashed border-2 border-slate-200 text-slate-500"
                                    >
                                        <Upload className="w-4 h-4 mr-2" /> 
                                        {reportFile ? reportFile.name : "Select PDF/Image File"}
                                    </Button>
                                    {reportFile && (
                                        <div className="flex justify-between items-center mt-2 px-2 py-1 bg-slate-50 rounded text-xs text-slate-600">
                                            <span className="truncate">{reportFile.name}</span>
                                            <button onClick={() => setReportFile(null)} className="text-rose-500 hover:text-rose-700">Remove</button>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-center text-slate-400 mt-2">Uploading will attach the full report to the patient's record.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResultModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveResult} disabled={!resultForm.result_value} className="bg-purple-600 hover:bg-purple-700">
                            <Save className="w-4 h-4 mr-2" /> Publish Result
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
