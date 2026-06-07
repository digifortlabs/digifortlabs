"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Printer, ChevronLeft, Building2, User, Activity, FileText, Pill } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DischargeSummaryPage() {
    const params = useParams();
    const router = useRouter();
    const [admission, setAdmission] = useState<any>(null);
    const [patient, setPatient] = useState<any>(null);
    const [hospital, setHospital] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [params.id]);

    const loadData = async () => {
        try {
            const data = await apiFetch(`hms/admissions`);
            const adm = data.find((a: any) => a.admission_id === Number(params.id));
            if (adm) {
                setAdmission(adm);
                
                // Fetch patient
                const pData = await apiFetch(`patients/${adm.patient_id}`);
                setPatient(pData);
                
                // Fetch hospital
                const hData = await apiFetch(`hospitals/${adm.hospital_id}`);
                setHospital(hData);
            }
        } catch (error) {
            console.error("Failed to load discharge summary data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Discharge Summary...</div>;
    if (!admission || !patient) return <div className="p-8 text-center text-rose-500">Admission not found or patient details unavailable.</div>;

    const printPage = () => {
        window.print();
    };

    // Extract discharge summary note
    const notes = Array.isArray(admission.doctor_notes) ? admission.doctor_notes : [];
    const dischargeNote = notes.find((n: any) => n.note_type === 'Discharge Summary');

    const formatDateTime = (dtStr: string) => {
        if (!dtStr) return 'N/A';
        return new Date(dtStr).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 print:p-0 print:bg-white">
            {/* Action Bar (Hidden in Print) */}
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-6 print:hidden">
                <Button variant="ghost" onClick={() => router.back()} className="text-slate-600">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div className="flex gap-3">
                    <Button onClick={printPage} className="bg-indigo-600 hover:bg-indigo-700">
                        <Printer className="w-4 h-4 mr-2" /> Print Summary
                    </Button>
                </div>
            </div>

            {/* Print Document */}
            <div className="max-w-4xl mx-auto bg-white p-8 border border-slate-200 shadow-sm rounded-xl print:border-none print:shadow-none print:p-0">
                
                {/* Header */}
                <div className="border-b-2 border-slate-900 pb-6 mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-wider mb-2">Discharge Summary</h1>
                        <h2 className="text-xl font-bold text-slate-700">{hospital?.name || 'Digifort Labs Hospital'}</h2>
                        <p className="text-sm text-slate-500 max-w-md mt-1">{hospital?.address}</p>
                        <p className="text-sm text-slate-500">Phone: {hospital?.contact_phone}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-left">
                            <p className="text-xs font-bold text-slate-500 uppercase">Admission ID</p>
                            <p className="font-mono text-lg font-bold text-slate-900">ADM-{admission.admission_id.toString().padStart(5, '0')}</p>
                        </div>
                    </div>
                </div>

                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <Card className="border-slate-200 shadow-none">
                        <CardContent className="p-4 flex gap-4 items-start">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{patient.full_name || `${patient.first_name} ${patient.last_name}`}</h3>
                                <div className="text-sm text-slate-600 mt-1 space-y-1">
                                    <p><strong>Patient ID:</strong> {patient.record_id}</p>
                                    <p><strong>Age/Gender:</strong> {patient.age || 'N/A'} / {patient.gender || 'N/A'}</p>
                                    <p><strong>Contact:</strong> {patient.contact_phone || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-none">
                        <CardContent className="p-4 flex gap-4 items-start">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Admission Details</h3>
                                <div className="text-sm text-slate-600 mt-1 space-y-1">
                                    <p><strong>Admission Date:</strong> {formatDateTime(admission.admission_date)}</p>
                                    <p><strong>Discharge Date:</strong> {formatDateTime(admission.discharge_date)}</p>
                                    <p><strong>Attending Doctor:</strong> {admission.admitting_doctor_id || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Clinical Summary */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-500" /> Clinical Diagnosis & Summary
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p className="font-bold text-slate-800 mb-2">Primary Diagnosis:</p>
                        <p className="text-slate-700 mb-4">{admission.diagnosis || 'Diagnosis not recorded'}</p>
                        
                        <p className="font-bold text-slate-800 mb-2">Discharge Summary / Doctor's Notes:</p>
                        <p className="text-slate-700 whitespace-pre-wrap">{dischargeNote?.content || 'No detailed discharge summary provided.'}</p>
                    </div>
                </div>

                {/* Discharge Medications */}
                {admission.medication_orders && admission.medication_orders.filter((m:any) => m.status !== 'deleted').length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                            <Pill className="w-5 h-5 text-slate-500" /> Discharge Medications
                        </h3>
                        <table className="w-full text-sm text-left border border-slate-200">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-3 font-bold text-slate-700">Medicine Name</th>
                                    <th className="p-3 font-bold text-slate-700">Dosage</th>
                                    <th className="p-3 font-bold text-slate-700">Frequency</th>
                                    <th className="p-3 font-bold text-slate-700">Duration</th>
                                    <th className="p-3 font-bold text-slate-700">Instructions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admission.medication_orders.filter((m:any) => m.status !== 'deleted').map((med: any, idx: number) => (
                                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                                        <td className="p-3 font-semibold">{med.medicine_name}</td>
                                        <td className="p-3">{med.dosage} {med.dosage_unit}</td>
                                        <td className="p-3">{med.frequency}</td>
                                        <td className="p-3">{med.duration_days} days</td>
                                        <td className="p-3">{med.special_instructions || med.notes || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer Signatures */}
                <div className="mt-24 flex justify-between items-end border-t border-slate-200 pt-8">
                    <div className="text-center">
                        <div className="w-48 border-b border-slate-400 mb-2"></div>
                        <p className="font-bold text-slate-700 text-sm">Patient / Attendant Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-b border-slate-400 mb-2"></div>
                        <p className="font-bold text-slate-700 text-sm">Doctor Signature & Stamp</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
