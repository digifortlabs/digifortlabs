"use client";

import React, { useEffect, useState, use } from 'react';
import { apiFetch } from '@/config/api';
import { Loader2 } from 'lucide-react';

export default function MRDFilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [admission, setAdmission] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAdmission = async () => {
            try {
                const data = await apiFetch(`hms/admissions/${id}`);
                setAdmission(data.admission);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadAdmission();
    }, [id]);

    useEffect(() => {
        if (!loading && admission) {
            // Give time for layout to settle then trigger print dialog automatically
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    }, [loading, admission]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!admission) {
        return <div className="p-8 text-center text-red-500">Failed to load admission details.</div>;
    }

    const { patient } = admission;

    return (
        <div className="print-container">
            {/* Page 1: Face Sheet / Admission Record */}
            <div className="print-page">
                <div className="header border-b-2 border-black pb-4 mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-wider">HOSPITAL BILL / FACE SHEET</h1>
                        <p className="text-sm font-semibold mt-1">MEDICAL RECORD DEPARTMENT (MRD)</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black">DIXIT HOSPITAL</div>
                        <p className="text-xs">Silvassa Road, Vapi, Gujarat.</p>
                        <p className="text-xs mt-1">Ph: 0260-2435432, 2426651</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="border border-black p-4 min-h-[400px]">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b border-gray-300"><td className="py-2 font-bold w-1/2">Total Bill</td><td className="py-2"></td></tr>
                                <tr className="border-b border-gray-300"><td className="py-2 font-bold">Bill No. & Date</td><td className="py-2"></td></tr>
                                <tr className="border-b border-gray-300"><td className="py-2 font-bold">Advance</td><td className="py-2"></td></tr>
                                <tr className="border-b border-gray-300"><td className="py-2 font-bold">Remaining Bill</td><td className="py-2"></td></tr>
                                <tr className="border-b border-gray-300"><td className="py-2 font-bold">To be Paid</td><td className="py-2"></td></tr>
                                <tr><td className="py-4" colSpan={2}></td></tr>
                                <tr><td className="py-1 font-bold">Anaesthetist</td><td className="py-1 border-b border-dotted border-black"></td></tr>
                                <tr><td className="py-1 font-bold">Paediatrician</td><td className="py-1 border-b border-dotted border-black"></td></tr>
                                <tr><td className="py-1 font-bold">Laboratory</td><td className="py-1 border-b border-dotted border-black"></td></tr>
                                <tr><td className="py-1 font-bold">X-Rays</td><td className="py-1 border-b border-dotted border-black"></td></tr>
                                <tr><td className="py-1 font-bold">Sonography</td><td className="py-1 border-b border-dotted border-black"></td></tr>
                                <tr><td className="py-1 font-bold">Oxygen</td><td className="py-1 border-b border-dotted border-black"></td></tr>
                                <tr><td className="py-1 font-bold">Dressings</td><td className="py-1 border-b border-dotted border-black"></td></tr>
                                <tr><td className="py-1 font-bold">Others</td><td className="py-1 border-b border-dotted border-black"></td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="space-y-4">
                        <div className="flex border-b border-black pb-1">
                            <span className="font-bold w-32">Patient's Name:</span> 
                            <span className="uppercase">{patient?.full_name}</span>
                        </div>
                        <div className="flex border-b border-black pb-1">
                            <span className="font-bold w-32">Age / Sex:</span> 
                            <span>{patient?.age} Yrs / {patient?.gender}</span>
                        </div>
                        <div className="flex border-b border-black pb-1">
                            <span className="font-bold w-32">Residence:</span> 
                            <span>{patient?.address || 'N/A'}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="border border-black p-2">
                                <span className="font-bold block text-xs">Date of Admission</span>
                                <span>{new Date(admission.admission_date).toLocaleDateString()}</span>
                            </div>
                            <div className="border border-black p-2">
                                <span className="font-bold block text-xs">Date of Discharge</span>
                                <span>{admission.discharge_date ? new Date(admission.discharge_date).toLocaleDateString() : 'Active'}</span>
                            </div>
                            <div className="border border-black p-2">
                                <span className="font-bold block text-xs">Time of Admission</span>
                                <span>{new Date(admission.admission_date).toLocaleTimeString()}</span>
                            </div>
                            <div className="border border-black p-2">
                                <span className="font-bold block text-xs">Time of Discharge</span>
                                <span>{admission.discharge_date ? new Date(admission.discharge_date).toLocaleTimeString() : '-'}</span>
                            </div>
                        </div>

                        <div className="mt-4 border-b border-black pb-1 min-h-[40px]">
                            <span className="font-bold">Diagnosis:</span> 
                            <span className="ml-2 uppercase">{admission.diagnosis || 'Pending'}</span>
                        </div>
                        <div className="border-b border-black pb-1 min-h-[40px]">
                            <span className="font-bold">Operation:</span> 
                        </div>
                        <div className="border-b border-black pb-1 min-h-[40px]">
                            <span className="font-bold">Anaesthetist Name:</span> 
                        </div>
                        <div className="border-b border-black pb-1 min-h-[40px]">
                            <span className="font-bold">Remarks:</span> 
                        </div>
                    </div>
                </div>
            </div>

            {/* Page 2: Clinical Progress Sheet */}
            <div className="print-page">
                <div className="text-center font-bold text-xl uppercase underline mb-6">Clinical Progress & Doctor's Notes</div>
                <div className="grid grid-cols-12 border-b-2 border-black pb-2 mb-4 font-bold text-sm">
                    <div className="col-span-3">Date & Time</div>
                    <div className="col-span-9">Clinical Notes (C/O, O/E, Diagnosis)</div>
                </div>
                
                {(!admission.doctor_notes || admission.doctor_notes.length === 0) ? (
                    <div className="text-center py-8 text-gray-500 italic">No clinical notes recorded.</div>
                ) : (
                    <div className="space-y-6">
                        {(admission.doctor_notes).map((note: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-12 border-b border-gray-300 pb-4">
                                <div className="col-span-3 text-sm">
                                    <div className="font-bold">{new Date(note.timestamp).toLocaleDateString()}</div>
                                    <div className="text-xs text-gray-600">{new Date(note.timestamp).toLocaleTimeString()}</div>
                                    <div className="text-xs font-semibold mt-2">Dr. {note.doctor_name}</div>
                                </div>
                                <div className="col-span-9 whitespace-pre-wrap text-sm">
                                    <span className="font-bold uppercase text-xs mr-2 p-1 border border-black rounded">{note.note_type}</span>
                                    <div className="mt-2">{note.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Page 3: Treatment Chart (Orders) */}
            <div className="print-page">
                <div className="flex justify-between items-end mb-6">
                    <div className="font-bold text-xl uppercase underline">Treatment Chart (Doctor's Orders)</div>
                    <div className="text-sm border border-black p-2">Patient: {patient?.full_name}</div>
                </div>
                
                <table className="w-full text-sm border-collapse border border-black">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2 text-left w-1/4">Start Date / Prescribed By</th>
                            <th className="border border-black p-2 text-left w-1/3">Medicine & Dosage</th>
                            <th className="border border-black p-2 text-left">Frequency</th>
                            <th className="border border-black p-2 text-left">Status & History</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(!admission.medication_orders || admission.medication_orders.length === 0) ? (
                            <tr><td colSpan={4} className="p-4 text-center border border-black italic">No medication orders.</td></tr>
                        ) : (
                            admission.medication_orders.map((order: any, idx: number) => (
                                <tr key={idx} className={order.status === 'deleted' ? "bg-gray-50 text-gray-500" : ""}>
                                    <td className="border border-black p-2 align-top">
                                        <div className="font-bold">{new Date(order.start_date).toLocaleDateString()}</div>
                                        <div className="text-xs">{new Date(order.start_date).toLocaleTimeString()}</div>
                                        <div className="mt-2 text-xs font-semibold">Dr. {order.prescribed_by}</div>
                                    </td>
                                    <td className="border border-black p-2 align-top">
                                        <div className={`font-bold text-base uppercase ${order.status === 'deleted' ? 'line-through' : ''}`}>{order.medicine_name}</div>
                                        <div>{order.dosage}</div>
                                        {order.notes && <div className="text-xs mt-1 italic">Note: {order.notes}</div>}
                                    </td>
                                    <td className="border border-black p-2 align-top">
                                        <div className="font-bold">{order.frequency}</div>
                                        <div className="text-xs">(Every {order.frequency_hours} hrs)</div>
                                    </td>
                                    <td className="border border-black p-2 align-top text-xs">
                                        <div className="font-bold uppercase mb-1">{order.status}</div>
                                        {(order.history || []).map((h: any, i: number) => (
                                            <div key={i} className="mb-1 border-l-2 border-gray-400 pl-2">
                                                <span className="font-semibold">{h.action}</span> - {h.details} <br/>
                                                <span className="text-[10px] text-gray-500">{new Date(h.timestamp).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Page 4: Nursing & Vitals Flowsheet */}
            <div className="print-page">
                <div className="text-center font-bold text-xl uppercase underline mb-6">Nursing & Vitals Chart</div>
                
                <table className="w-full text-sm border-collapse border border-black text-center">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2">Date</th>
                            <th className="border border-black p-2">Time</th>
                            <th className="border border-black p-2">Temp (°F)</th>
                            <th className="border border-black p-2">Resp Rate</th>
                            <th className="border border-black p-2">BP (mmHg)</th>
                            <th className="border border-black p-2">Pulse</th>
                            <th className="border border-black p-2">SpO2 (%)</th>
                            <th className="border border-black p-2">Urine</th>
                            <th className="border border-black p-2">Stool</th>
                            <th className="border border-black p-2">Sign</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(!admission.vitals_log || admission.vitals_log.length === 0) ? (
                            <tr><td colSpan={10} className="p-4 border border-black italic">No vitals recorded yet.</td></tr>
                        ) : (
                            admission.vitals_log.map((vital: any, idx: number) => {
                                const dt = new Date(vital.timestamp);
                                return (
                                    <tr key={idx}>
                                        <td className="border border-black p-2">{dt.toLocaleDateString()}</td>
                                        <td className="border border-black p-2">{dt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="border border-black p-2">{vital.temp || '-'}</td>
                                        <td className="border border-black p-2">{vital.respiratory_rate || '-'}</td>
                                        <td className="border border-black p-2">{vital.bp || '-'}</td>
                                        <td className="border border-black p-2">{vital.pulse || '-'}</td>
                                        <td className="border border-black p-2">{vital.spo2 || '-'}</td>
                                        <td className="border border-black p-2">-</td>
                                        <td className="border border-black p-2">-</td>
                                        <td className="border border-black p-2 text-xs truncate max-w-[60px]">{vital.recorded_by}</td>
                                    </tr>
                                );
                            })
                        )}
                        {/* Fill empty rows to make it look like a physical sheet */}
                        {Array.from({ length: Math.max(0, 20 - (admission.vitals_log?.length || 0)) }).map((_, i) => (
                            <tr key={`empty-${i}`}>
                                <td className="border border-black p-4"></td>
                                <td className="border border-black p-4"></td>
                                <td className="border border-black p-4"></td>
                                <td className="border border-black p-4"></td>
                                <td className="border border-black p-4"></td>
                                <td className="border border-black p-4"></td>
                                <td className="border border-black p-4"></td>
                                <td className="border border-black p-4"></td>
                                <td className="border border-black p-4"></td>
                                <td className="border border-black p-4"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: A4; margin: 15mm; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .print-page { 
                        page-break-after: always;
                        min-height: 297mm;
                    }
                    .print-page:last-child {
                        page-break-after: auto;
                    }
                    nav, header, aside, .no-print { display: none !important; }
                }
                body { background-color: #f1f5f9; }
                .print-container {
                    max-width: 210mm;
                    margin: 0 auto;
                    background: white;
                }
                .print-page {
                    padding: 15mm;
                    min-height: 297mm;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    margin-bottom: 2rem;
                    background: white;
                }
                @media print {
                    .print-container { max-width: 100%; box-shadow: none; margin: 0; }
                    .print-page { box-shadow: none; margin-bottom: 0; }
                }
            `}} />
        </div>
    );
}
