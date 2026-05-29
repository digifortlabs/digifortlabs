"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Search, RefreshCcw, User, ShieldAlert, HeartPulse } from 'lucide-react';
import { apiFetch } from '@/config/api';
import FastRegistrationModal from '@/components/emergency/FastRegistrationModal';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function EmergencyDashboard() {
    const [emergencies, setEmergencies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEmergencies = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('emergency/?status=Active');
            if (data) {
                // Sort logically by triage level (Red -> Orange -> Yellow -> Green -> Blue)
                const severityMap: Record<string, number> = {
                    'Red': 1,
                    'Orange': 2,
                    'Yellow': 3,
                    'Green': 4,
                    'Blue': 5
                };
                
                const sorted = data.sort((a: any, b: any) => {
                    const sevA = severityMap[a.triage_level] || 99;
                    const sevB = severityMap[b.triage_level] || 99;
                    if (sevA !== sevB) return sevA - sevB;
                    // If same severity, older visit date first
                    return new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime();
                });
                
                setEmergencies(sorted);
            }
        } catch (error) {
            console.error("Failed to fetch emergencies", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmergencies();
        // Set up auto-refresh every 30 seconds for live triage board
        const interval = setInterval(fetchEmergencies, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredEmergencies = emergencies.filter(e => 
        e.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTriageColor = (level: string) => {
        switch (level) {
            case 'Red': return 'bg-red-500 text-white border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]';
            case 'Orange': return 'bg-orange-500 text-white border-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
            case 'Yellow': return 'bg-yellow-400 text-slate-900 border-yellow-500';
            case 'Green': return 'bg-green-500 text-white border-green-600';
            case 'Blue': return 'bg-blue-500 text-white border-blue-600';
            default: return 'bg-slate-200 text-slate-700';
        }
    };

    const getTriageLabel = (level: string) => {
        switch (level) {
            case 'Red': return 'Resuscitation';
            case 'Orange': return 'Emergent';
            case 'Yellow': return 'Urgent';
            case 'Green': return 'Less Urgent';
            case 'Blue': return 'Non Urgent';
            default: return 'Unknown';
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-red-100 p-2 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">ER Triage Dashboard</h1>
                    </div>
                    <p className="text-sm font-medium text-slate-500 ml-12">Live emergency queue sorted by severity</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={fetchEmergencies} 
                        disabled={isLoading}
                        className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin text-red-500' : ''}`} />
                        Refresh Board
                    </Button>
                    <Button 
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30 px-6 h-11 rounded-xl"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Emergency
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white overflow-hidden group">
                    <div className="h-1 w-full bg-red-500 group-hover:h-1.5 transition-all"></div>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Active</p>
                            <h3 className="text-2xl font-black text-slate-800">{emergencies.length}</h3>
                        </div>
                        <div className="bg-red-50 p-3 rounded-2xl text-red-600">
                            <HeartPulse className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm bg-white overflow-hidden group">
                    <div className="h-1 w-full bg-orange-500 group-hover:h-1.5 transition-all"></div>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Critical (Red/Orange)</p>
                            <h3 className="text-2xl font-black text-slate-800">
                                {emergencies.filter(e => e.triage_level === 'Red' || e.triage_level === 'Orange').length}
                            </h3>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white overflow-hidden group">
                    <div className="h-1 w-full bg-slate-800 group-hover:h-1.5 transition-all"></div>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">MLC Cases</p>
                            <h3 className="text-2xl font-black text-slate-800">
                                {emergencies.filter(e => e.is_medico_legal).length}
                            </h3>
                        </div>
                        <div className="bg-slate-100 p-3 rounded-2xl text-slate-700">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="Search patients or complaints..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-slate-200 shadow-sm rounded-xl h-11"
                />
            </div>

            {/* Triage Board */}
            <div className="space-y-4">
                {isLoading && emergencies.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 border-dashed">
                        <RefreshCcw className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Loading triage board...</p>
                    </div>
                ) : filteredEmergencies.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 border-dashed">
                        <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HeartPulse className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">ER is clear</h3>
                        <p className="text-slate-500 text-sm">No active emergency patients at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredEmergencies.map((em) => (
                            <Card key={em.emergency_id} className={`overflow-hidden border-0 shadow-sm hover:shadow-md transition-all relative ${
                                em.triage_level === 'Red' ? 'ring-2 ring-red-500/50 bg-red-50/30' : 'bg-white'
                            }`}>
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${getTriageColor(em.triage_level).split(' ')[0]}`}></div>
                                <CardContent className="p-5 pl-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <Badge className={`${getTriageColor(em.triage_level)} border uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-lg mb-2`}>
                                                {getTriageLabel(em.triage_level)}
                                            </Badge>
                                            <h3 className="text-lg font-black text-slate-800 line-clamp-1">{em.patient_name || 'Unknown Patient'}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                Arrived {format(new Date(em.visit_date), 'h:mm a')}
                                            </div>
                                        </div>
                                        {em.is_medico_legal && (
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold px-2 py-0.5 rounded-lg">
                                                MLC
                                            </Badge>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Chief Complaint</p>
                                            <p className="text-sm text-slate-700 font-medium line-clamp-2">{em.chief_complaint || 'Not specified'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Arrival Mode</p>
                                                <p className="text-xs text-slate-600 font-semibold">{em.mode_of_arrival || 'Unknown'}</p>
                                            </div>
                                            {em.doctor_name && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Assigned To</p>
                                                    <p className="text-xs text-indigo-600 font-semibold line-clamp-1">{em.doctor_name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                                        <Button size="sm" variant="outline" className="w-full text-xs font-bold rounded-xl border-slate-200 text-slate-600">
                                            Update Vitals
                                        </Button>
                                        <Button size="sm" className="w-full text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-sm">
                                            View Chart
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <FastRegistrationModal 
                isOpen={isRegisterModalOpen} 
                onClose={() => setIsRegisterModalOpen(false)} 
                onSuccess={fetchEmergencies} 
            />
        </div>
    );
}

// Plus icon since it's not imported at the top
function Plus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
