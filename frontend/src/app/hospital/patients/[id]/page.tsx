"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, MapPin, Calendar, Activity, Clock, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { useTerminology } from '@/hooks/useTerminology';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/dateFormatter';
import PatientEditModal from './PatientEditModal';
import toast from 'react-hot-toast';

export default function PatientProfile() {
    const params = useParams();
    const router = useRouter();
    const { terms } = useTerminology();
    const [patient, setPatient] = useState<any>(null);
    const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!params.id) return;
        fetchPatientData(params.id as string);
    }, [params.id]);

    const fetchPatientData = async (id: string) => {
        setLoading(true);
        try {
            const [data, timelineData] = await Promise.all([
                apiFetch(`/patients/${id}`),
                apiFetch(`/patients/${id}/timeline`)
            ]);
            setPatient(data);
            setTimelineEvents(timelineData || []);
        } catch (e) {
            console.error("Failed to load patient", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePatient = async () => {
        if (confirm(`Are you sure you want to delete this ${terms.patient.toLowerCase()}? This action will move them to the Recycle Bin.`)) {
            setIsDeleting(true);
            try {
                await apiFetch(`/patients/${patient.record_id}`, { method: 'DELETE' });
                router.push('/hospital/patients');
            } catch (error) {
                console.error('Failed to delete patient', error);
                toast.error('Failed to delete patient.');
                setIsDeleting(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p>Loading {terms.patient.toLowerCase()} profile...</p>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="p-8 text-center max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-800">Profile Not Found</h1>
                <Button onClick={() => router.push('/hospital/patients')} className="mt-4" variant="outline">
                    <ArrowLeft size={16} className="mr-2" /> Back to Directory
                </Button>
            </div>
        );
    }

    const getAgeDisplay = (p: any) => {
        let recordedAge = p.age || '';
        if (recordedAge && /^\d+$/.test(recordedAge.trim())) {
            recordedAge = `${recordedAge} yrs`;
        }
        
        if (p.dob) {
            const dob = new Date(p.dob);
            const today = new Date();
            
            let years = today.getFullYear() - dob.getFullYear();
            let months = today.getMonth() - dob.getMonth();
            let days = today.getDate() - dob.getDate();
            
            if (days < 0) {
                months -= 1;
                const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                days += prevMonth.getDate();
            }
            if (months < 0) {
                years -= 1;
                months += 12;
            }
            
            let presentAge = '';
            if (years > 0) {
                presentAge = `${years} Yr${years > 1 ? 's' : ''}`;
                if (months > 0) presentAge += ` ${months} Mo${months > 1 ? 's' : ''}`;
            } else if (months > 0) {
                presentAge = `${months} Mo${months > 1 ? 's' : ''}`;
                if (days > 0) presentAge += ` ${days} Dy${days > 1 ? 's' : ''}`;
            } else if (days > 0) {
                presentAge = `${days} Dy${days > 1 ? 's' : ''}`;
            } else {
                presentAge = "Newborn";
            }
            
            if (recordedAge) {
                return `${recordedAge} (Present Age: ${presentAge})`;
            }
            return `Present Age: ${presentAge}`;
        }
        
        return recordedAge || 'N/A';
    };

    const getIconForType = (type: string) => {
        switch(type) {
            case 'REGISTRATION': return <User size={14} />;
            case 'IPD': return <Activity size={14} />;
            case 'OPD': return <CheckCircle2 size={14} />;
            case 'FOLLOW_UP': return <CheckCircle2 size={14} />;
            case 'MRD': return <FileText size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const getColorForType = (type: string) => {
        switch(type) {
            case 'REGISTRATION': return 'bg-slate-500 text-white';
            case 'IPD': return 'bg-rose-500 text-white';
            case 'OPD': return 'bg-blue-500 text-white';
            case 'FOLLOW_UP': return 'bg-amber-500 text-white';
            case 'MRD': return 'bg-emerald-500 text-white';
            default: return 'bg-slate-300 text-white';
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <button 
                    onClick={() => router.push('/hospital/patients')}
                    className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Directory
                </button>
                <button 
                    onClick={handleDeletePatient}
                    disabled={isDeleting}
                    className="flex items-center gap-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition"
                >
                    <Trash2 size={16} /> {isDeleting ? 'Deleting...' : `Delete ${terms.patient}`}
                </button>
            </div>

            {/* Top Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:w-1/3 text-white flex flex-col items-center justify-center text-center border-r border-slate-200">
                    <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center text-4xl font-black mb-4">
                        {patient.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black">{patient.full_name}</h1>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">
                            UHID: {patient.uhid}
                        </span>
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition"
                        >
                            Edit Profile
                        </button>
                    </div>
                </div>
                <div className="p-8 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5"><Phone size={14} /> Contact Phone</div>
                        <div className="text-slate-800 font-medium">{patient.phone || 'Not provided'}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5"><Calendar size={14} /> Age & Gender</div>
                        <div className="text-slate-800 font-medium">{getAgeDisplay(patient)} • <span className="capitalize">{patient.gender}</span></div>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                        <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5"><MapPin size={14} /> Address</div>
                        <div className="text-slate-800 font-medium">{patient.address || 'Not provided'}</div>
                    </div>
                    {patient.uhid && (
                        <div className="space-y-1 sm:col-span-2">
                            <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5"><FileText size={14} /> UHID / Government ID</div>
                            <div className="text-slate-800 font-medium">{patient.uhid}</div>
                        </div>
                    )}
                    {(patient.aadhaar_number || patient.abha_id || patient.ayushman_id || patient.maa_card) && (
                        <div className="space-y-2 sm:col-span-2 pt-4 border-t border-slate-100">
                            <div className="text-xs font-black uppercase text-indigo-500 tracking-widest">Government & Health IDs</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                {patient.aadhaar_number && (
                                    <div className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Aadhaar Card</div>
                                        <div className="text-slate-800 font-extrabold text-sm tracking-wide mt-0.5">{patient.aadhaar_number}</div>
                                    </div>
                                )}
                                {patient.abha_id && (
                                    <div className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ABHA ID</div>
                                        <div className="text-slate-800 font-extrabold text-sm tracking-wide mt-0.5">{patient.abha_id}</div>
                                    </div>
                                )}
                                {patient.ayushman_id && (
                                    <div className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ayushman ID</div>
                                        <div className="text-slate-800 font-extrabold text-sm tracking-wide mt-0.5">{patient.ayushman_id}</div>
                                    </div>
                                )}
                                {patient.maa_card && (
                                    <div className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">MAA Card</div>
                                        <div className="text-slate-800 font-extrabold text-sm tracking-wide mt-0.5">{patient.maa_card}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Quick Stats / Vitals */}
                <div className="space-y-6">
                    <Card className="p-6 border-slate-200 shadow-sm">
                        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                            <Activity className="text-rose-500" size={18} /> Clinical Vitals
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Blood Group</span>
                                <span className="font-bold text-slate-800 text-sm">{patient.blood_group || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Weight</span>
                                <span className="font-bold text-slate-800 text-sm">{patient.weight ? `${patient.weight} kg` : 'Not recorded'}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-medium text-sm">Allergies</span>
                                <span className="font-bold text-rose-600 text-sm">{patient.allergies || 'None'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-medium text-sm">Mediclaim</span>
                                <span className="font-bold text-emerald-600 text-sm">{patient.mediclaim ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                    </Card>
                    {(patient.doctor_name || patient.diagnosis || patient.operative_notes || patient.medical_summary || patient.remarks) && (
                        <Card className="p-6 border-slate-200 shadow-sm space-y-4">
                            <h3 className="font-black text-slate-800 mb-2 flex items-center gap-2">
                                <FileText className="text-indigo-500" size={18} /> Medical Details
                            </h3>
                            <div className="space-y-4 text-sm">
                                {patient.doctor_name && (
                                    <div className="pb-3 border-b border-slate-100">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Treating Doctor</div>
                                        <div className="font-bold text-slate-800 mt-0.5">Dr. {patient.doctor_name}</div>
                                    </div>
                                )}
                                {patient.diagnosis && (
                                    <div className="pb-3 border-b border-slate-100">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Diagnosis</div>
                                        <div className="font-bold text-slate-800 mt-0.5">{patient.diagnosis}</div>
                                    </div>
                                )}
                                {patient.operative_notes && (
                                    <div className="pb-3 border-b border-slate-100">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Operative Notes</div>
                                        <div className="text-slate-700 mt-0.5 whitespace-pre-wrap leading-relaxed font-medium">{patient.operative_notes}</div>
                                    </div>
                                )}
                                {patient.medical_summary && (
                                    <div className="pb-3 border-b border-slate-100">
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Medical Summary</div>
                                        <div className="text-slate-700 mt-0.5 whitespace-pre-wrap leading-relaxed font-medium">{patient.medical_summary}</div>
                                    </div>
                                )}
                                {patient.remarks && (
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Remarks</div>
                                        <div className="font-bold text-slate-800 mt-0.5">{patient.remarks}</div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Column - Unified Timeline */}
                <div className="lg:col-span-2">
                    <Card className="p-6 border-slate-200 shadow-sm">
                        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                            <Clock className="text-blue-500" size={18} /> Unified Visit Timeline
                        </h3>
                        
                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
                            {timelineEvents.map((event, i) => (
                                <div key={i} className="relative pl-6">
                                    <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border-4 border-white ${getColorForType(event.type)}`}>
                                        {getIconForType(event.type)}
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{event.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{event.type}</span>
                                                    {event.id_number && (
                                                        <span className="text-[10px] bg-white border border-slate-200 px-2 rounded font-mono text-slate-600">
                                                            {event.id_number}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium text-slate-500 whitespace-nowrap">
                                                {formatDate(event.date)}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-2">
                                            {event.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            <PatientEditModal 
                patient={patient}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUpdated={(updatedData: any) => setPatient(updatedData)}
            />
        </div>
    );
}
