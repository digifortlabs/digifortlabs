"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Printer, ChevronLeft } from 'lucide-react';

export default function DischargeSummaryPage() {
    const params = useParams();
    const router = useRouter();
    const [admission, setAdmission] = useState<any>(null);
    const [patient, setPatient] = useState<any>(null);
    const [hospital, setHospital] = useState<any>(null);
    const [ward, setWard] = useState<any>(null);
    const [bed, setBed] = useState<any>(null);
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [params.id]);

    const loadData = async () => {
        try {
            const data = await apiFetch(`hms/admissions/${params.id}`);
            if (data && data.admission) {
                setAdmission(data.admission);
                setPatient(data.patient);
                setWard(data.ward);
                setBed(data.bed);
                
                // Fetch hospital
                const hData = await apiFetch(`hospitals/${data.admission.hospital_id}`);
                setHospital(hData);

                // Fetch invoice if it exists
                if (data.admission.patient_invoice_id) {
                    try {
                        const invData = await apiFetch(`/patient-billing/invoices/${data.admission.patient_invoice_id}`);
                        setInvoice(invData);
                    } catch (e) {
                        console.error("Failed to load invoice details", e);
                    }
                }
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

    // Extract structured notes
    const notes = Array.isArray(admission.doctor_notes) ? admission.doctor_notes : [];
    
    const getNote = (type: string) => {
        const found = notes.find((n: any) => n.note_type === type);
        return found ? found.content : '';
    };

    const history = getNote('Discharge_History');
    const finalDiagnosis = getNote('Discharge_Final_Diagnosis') || admission.diagnosis;
    const operativeNote = getNote('Discharge_Operative_Note');
    const adviceOnDischarge = getNote('Discharge_Advice');
    const generalAdvice = getNote('Discharge_General_Advice');
    const followUpPlan = getNote('Discharge_Follow_Up_Plan');
    const includeLabs = getNote('Discharge_Include_Investigations') === 'true';
    const legacySummary = getNote('Discharge Summary');

    const formatDateTime = (dtStr: string) => {
        if (!dtStr) return '';
        const d = new Date(dtStr);
        return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    };

    // Parse Vitals Log for Indoor Details
    const vitalsLog = Array.isArray(admission.vitals_log) ? admission.vitals_log : [];

    return (
        <div className="min-h-screen bg-slate-200 p-6 print:p-0 print:bg-white text-black font-sans">
            {/* Action Bar (Hidden in Print) */}
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-6 print:hidden">
                <Button variant="ghost" onClick={() => router.back()} className="text-slate-600">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={printPage} className="bg-indigo-600 hover:bg-indigo-700">
                    <Printer className="w-4 h-4 mr-2" /> Print Summary
                </Button>
            </div>

            {/* Print Document */}
            <div className="max-w-4xl mx-auto bg-white border border-slate-300 shadow-xl print:border-none print:shadow-none print:max-w-full print:w-full text-[13px] leading-snug">
                
                {/* Header matching the PDF */}
                <div className="text-center py-6 px-8 border-b-2 border-black">
                    <h1 className="text-3xl font-black uppercase tracking-widest text-indigo-950 mb-1">{hospital?.name || 'Digifort Labs Hospital'}</h1>
                    <div className="flex justify-center items-center gap-6 mt-2 mb-2">
                        <div className="text-center">
                            <p className="font-bold text-lg">Dr. {admission.doctor_name || 'Attending Doctor'}</p>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Consultant</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600 max-w-2xl mx-auto">{hospital?.address || 'Hospital Address'}</p>
                    <p className="text-xs text-slate-600 font-bold mt-1">Ph: {hospital?.contact_phone || 'N/A'}</p>
                </div>

                {/* Title */}
                <div className="bg-slate-100 border-b border-black py-2 text-center">
                    <h2 className="text-lg font-black uppercase tracking-widest">Discharge Card</h2>
                </div>

                <div className="px-8 py-6">
                    {/* Patient Info Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 font-medium">
                        <div className="flex"><span className="w-32 inline-block">UHIDNO</span> <span className="font-bold">: {patient.patient_u_id || patient.record_id}</span></div>
                        <div className="flex"><span className="w-32 inline-block">WARD NAME</span> <span className="font-bold">: {ward?.ward_name || '-'}</span></div>
                        
                        <div className="flex"><span className="w-32 inline-block">NAME</span> <span className="font-bold uppercase">: {patient.full_name || `${patient.first_name} ${patient.last_name}`}</span></div>
                        <div className="flex"><span className="w-32 inline-block">ADM. NO</span> <span className="font-bold">: ADM-{admission.admission_id}</span></div>
                        
                        <div className="flex"><span className="w-32 inline-block">AGE</span> <span className="font-bold">: {patient.age || '-'} Yrs</span></div>
                        <div className="flex"><span className="w-32 inline-block">BED NO</span> <span className="font-bold">: {bed?.bed_number || '-'}</span></div>
                        
                        <div className="flex"><span className="w-32 inline-block">SEX</span> <span className="font-bold">: {patient.gender || '-'}</span></div>
                        <div className="flex"><span className="w-32 inline-block">ADM DOCTOR</span> <span className="font-bold">: Dr. {admission.doctor_name || '-'}</span></div>
                        
                        <div className="flex"><span className="w-32 inline-block">ADM. DATE</span> <span className="font-bold">: {formatDateTime(admission.admission_date)}</span></div>
                        <div className="flex"><span className="w-32 inline-block">DIS. DATE</span> <span className="font-bold">: {formatDateTime(admission.discharge_date)}</span></div>
                    </div>

                    <hr className="border-t-2 border-dashed border-black mb-6" />

                    {/* History */}
                    {history && (
                        <div className="mb-6">
                            <h3 className="font-bold underline decoration-2 underline-offset-4 mb-2 uppercase">History :</h3>
                            <p className="whitespace-pre-wrap ml-4">{history}</p>
                        </div>
                    )}

                    {/* Indoor Details */}
                    {vitalsLog.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold underline decoration-2 underline-offset-4 mb-2 uppercase">Indoor Details :</h3>
                            <div className="ml-4 space-y-2">
                                {vitalsLog.map((v: any, i: number) => (
                                    <p key={i} className="text-xs">
                                        <span className="font-bold">{new Date(v.timestamp).toLocaleDateString('en-GB')}:</span> BP {v.bp || '-'}, P {v.pulse || '-'}, Temp {v.temp || '-'} {v.notes ? `- ${v.notes}` : ''}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Investigation */}
                    <div className="mb-6 flex gap-2">
                        <h3 className="font-bold underline decoration-2 underline-offset-4 uppercase">Investigation :</h3>
                        <span className="font-bold ml-2">{includeLabs ? '(See attached lab reports)' : 'Attached'}</span>
                    </div>

                    {/* Final Diagnosis */}
                    {finalDiagnosis && (
                        <div className="mb-6">
                            <h3 className="font-bold underline decoration-2 underline-offset-4 mb-2 uppercase">Final Diagnosis :</h3>
                            <p className="whitespace-pre-wrap ml-4 font-bold">{finalDiagnosis}</p>
                        </div>
                    )}

                    {/* Operative Details */}
                    {operativeNote && (
                        <div className="mb-6">
                            <h3 className="font-bold underline decoration-2 underline-offset-4 mb-2 uppercase">Operative Details :</h3>
                            <p className="whitespace-pre-wrap ml-4 font-bold">{operativeNote}</p>
                        </div>
                    )}

                    {/* Treatment On Discharge */}
                    {admission.medication_orders && admission.medication_orders.filter((m:any) => m.status !== 'deleted').length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-bold underline decoration-2 underline-offset-4 mb-3 uppercase">Treatment On Discharge (RX GIVEN) :</h3>
                            <table className="w-full text-left border-collapse ml-4">
                                <thead>
                                    <tr className="border-b-2 border-black">
                                        <th className="py-2 font-bold w-12">SR NO</th>
                                        <th className="py-2 font-bold">MEDICINE</th>
                                        <th className="py-2 font-bold">DOSAGE</th>
                                        <th className="py-2 font-bold text-right pr-4">DAYS * QTY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admission.medication_orders.filter((m:any) => m.status !== 'deleted').map((med: any, idx: number) => {
                                        const qty = parseInt(med.duration_days) || 1;
                                        return (
                                            <tr key={idx} className="border-b border-slate-200 border-dashed">
                                                <td className="py-2">{idx + 1}</td>
                                                <td className="py-2 font-bold uppercase">{med.medicine_name}</td>
                                                <td className="py-2 font-bold uppercase">{med.dosage} {med.dosage_unit} {med.frequency}</td>
                                                <td className="py-2 text-right pr-4 font-bold">{med.duration_days} Days * {qty}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Advice On Discharge */}
                    {adviceOnDischarge && (
                        <div className="mb-6">
                            <h3 className="font-bold underline decoration-2 underline-offset-4 mb-2 uppercase">Advice On Discharge :</h3>
                            <p className="whitespace-pre-wrap ml-4">{adviceOnDischarge}</p>
                        </div>
                    )}

                    {/* General Advice */}
                    {generalAdvice && (
                        <div className="mb-6">
                            <h3 className="font-bold underline decoration-2 underline-offset-4 mb-2 uppercase">General Advice :</h3>
                            <p className="whitespace-pre-wrap ml-4">{generalAdvice}</p>
                        </div>
                    )}

                    {/* Follow Up Plan */}
                    {followUpPlan && (
                        <div className="mb-6 flex gap-2">
                            <h3 className="font-bold underline decoration-2 underline-offset-4 uppercase">Follow Up Plan :</h3>
                            <p className="whitespace-pre-wrap ml-2 font-bold">{followUpPlan}</p>
                        </div>
                    )}

                    {/* Legacy Notes Fallback */}
                    {legacySummary && !history && !finalDiagnosis && (
                        <div className="mb-6">
                            <h3 className="font-bold underline decoration-2 underline-offset-4 mb-2 uppercase">Doctor's Notes :</h3>
                            <p className="whitespace-pre-wrap ml-4">{legacySummary}</p>
                        </div>
                    )}

                    {/* Billing Summary (If Invoice Generated) */}
                    {invoice && invoice.total_amount > 0 && (
                        <div className="mt-8 mb-6 border border-slate-300 rounded-lg overflow-hidden break-inside-avoid">
                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex justify-between items-center">
                                <h3 className="font-bold uppercase tracking-wider text-slate-800">Final Billing Summary</h3>
                                <span className="font-mono text-xs font-bold text-slate-500">{invoice.invoice_number}</span>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Charges Included</p>
                                    <ul className="list-disc ml-4 space-y-1 text-slate-700">
                                        {invoice.items && invoice.items.slice(0, 3).map((item: any, i: number) => (
                                            <li key={i}>{item.description}</li>
                                        ))}
                                        {invoice.items && invoice.items.length > 3 && (
                                            <li className="italic text-slate-500">...and {invoice.items.length - 3} more items</li>
                                        )}
                                    </ul>
                                </div>
                                <div className="text-right space-y-2">
                                    <div className="flex justify-between font-medium text-slate-600">
                                        <span>Subtotal:</span>
                                        <span>₹ {invoice.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-medium text-rose-600">
                                        <span>Discount:</span>
                                        <span>- ₹ {invoice.discount_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black text-indigo-900 border-t border-slate-200 pt-2 mt-2">
                                        <span>Final Bill Amount:</span>
                                        <span>₹ {invoice.total_amount.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Status: {invoice.status}</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer / Signatures */}
                <div className="px-8 pb-12 pt-20 flex justify-between items-end mt-auto break-inside-avoid">
                    <div className="text-center">
                        <div className="w-48 border-b-2 border-black mb-2"></div>
                        <p className="font-bold uppercase text-sm">Sign. of Patient / Relative</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-b-2 border-black mb-2"></div>
                        <p className="font-bold uppercase text-sm">Consulting Doctor</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
