"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Search, FileText, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function TPADashboard() {
    const [claims, setClaims] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<any>(null);
    const [updateForm, setUpdateForm] = useState({
        status: '',
        approved_amount: 0,
        policy_details: ''
    });

    const fetchClaims = async () => {
        setIsLoading(true);
        try {
            const url = statusFilter !== 'All' ? `/tpa/claims?status=${statusFilter}` : '/tpa/claims';
            const data = await apiFetch(url);
            setClaims(data || []);
        } catch (error) {
            console.error("Failed to fetch claims:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, [statusFilter]);

    const handleOpenModal = (claim: any) => {
        setSelectedClaim(claim);
        setUpdateForm({
            status: claim.status,
            approved_amount: claim.approved_amount || 0,
            policy_details: claim.policy_details || ''
        });
        setIsModalOpen(true);
    };

    const handleUpdateClaim = async () => {
        if (!selectedClaim) return;
        try {
            await apiFetch(`/tpa/claims/${selectedClaim.claim_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: updateForm.status,
                    approved_amount: updateForm.approved_amount ? parseFloat(updateForm.approved_amount.toString()) : null,
                    policy_details: updateForm.policy_details
                })
            });
            setIsModalOpen(false);
            fetchClaims();
        } catch (error) {
            console.error("Failed to update claim:", error);
        }
    };

    const filteredClaims = claims.filter(c => 
        c.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.mrd_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };
    
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pending': return <Clock className="w-4 h-4 mr-1" />;
            case 'Approved': return <CheckCircle className="w-4 h-4 mr-1" />;
            case 'Rejected': return <XCircle className="w-4 h-4 mr-1" />;
            default: return <AlertCircle className="w-4 h-4 mr-1" />;
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-indigo-600" />
                        TPA / Insurance Desk
                    </h1>
                    <p className="text-slate-500 mt-1">Manage Mediclaim approvals and track insurance billing</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search by Patient Name or MRD..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-slate-50 border-slate-200"
                    />
                </div>
                
                <div className="flex gap-2">
                    {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                        <Button 
                            key={status}
                            variant={statusFilter === status ? "default" : "outline"}
                            onClick={() => setStatusFilter(status)}
                            className={statusFilter === status ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-white text-slate-600'}
                        >
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Claims Table */}
            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Patient Details</th>
                                    <th className="px-6 py-4 font-bold">Visit Type</th>
                                    <th className="px-6 py-4 font-bold">Policy Info</th>
                                    <th className="px-6 py-4 font-bold">Claim Info</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                            Loading claims...
                                        </td>
                                    </tr>
                                ) : filteredClaims.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-500">
                                            No mediclaim records found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClaims.map((claim) => (
                                        <tr key={claim.claim_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{claim.patient_name}</p>
                                                <p className="text-xs text-slate-500">MRD: {claim.mrd_number}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="bg-white">{claim.visit_type}</Badge>
                                                <p className="text-xs text-slate-400 mt-1">{format(new Date(claim.created_at), 'dd MMM yyyy')}</p>
                                            </td>
                                            <td className="px-6 py-4 max-w-[200px] truncate">
                                                {claim.policy_details || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {claim.claimed_amount ? `₹${claim.claimed_amount}` : 'TBD'}
                                                {claim.approved_amount && <span className="text-emerald-600 font-semibold block">₹{claim.approved_amount} Appr.</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`flex items-center w-fit ${getStatusColor(claim.status)}`}>
                                                    {getStatusIcon(claim.status)}
                                                    {claim.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" variant="outline" onClick={() => handleOpenModal(claim)} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                                    Manage Claim
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

            {/* Update Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-600" /> Manage Mediclaim Status
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedClaim && (
                        <div className="space-y-4 py-4">
                            <div className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100 mb-2">
                                <p><span className="text-slate-500 font-semibold">Patient:</span> {selectedClaim.patient_name} ({selectedClaim.mrd_number})</p>
                                <p><span className="text-slate-500 font-semibold">Origin:</span> {selectedClaim.visit_type}</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Claim Status</Label>
                                <Select value={updateForm.status} onValueChange={v => setUpdateForm({...updateForm, status: v})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Approved Amount (₹)</Label>
                                <Input 
                                    type="number" 
                                    value={updateForm.approved_amount} 
                                    onChange={e => setUpdateForm({...updateForm, approved_amount: parseFloat(e.target.value) || 0})}
                                    disabled={updateForm.status !== 'Approved'}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Policy / Approval Remarks</Label>
                                <Input 
                                    value={updateForm.policy_details} 
                                    onChange={e => setUpdateForm({...updateForm, policy_details: e.target.value})}
                                />
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateClaim} className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
