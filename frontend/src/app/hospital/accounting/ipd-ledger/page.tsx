"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';
import { 
    Users, Search, Wallet, ShieldCheck, 
    ArrowRight, Activity, Plus, CreditCard, ChevronLeft, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface IPDStatusResponse {
    patient_id: number;
    patient_name: string;
    mrd_number: string;
    admission_date: string;
    bed_details: string;
    running_unbilled: number;
    advance_deposit: number;
    cashless_approved: number;
    net_due: number;
}

export default function IPDLedgerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [patients, setPatients] = useState<IPDStatusResponse[]>([]);

    const [depositPatient, setDepositPatient] = useState<IPDStatusResponse | null>(null);
    const [cashlessPatient, setCashlessPatient] = useState<IPDStatusResponse | null>(null);

    // Modal Form States
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/patient-ledger/ipd-status');
            const data = await res.json();
            if (res.ok) {
                setPatients(data);
            } else {
                toast.error(data.detail || "Failed to load IPD financials");
            }
        } catch (err) {
            toast.error("Network error while loading IPD financials");
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p => 
        p.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.mrd_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.bed_details && p.bed_details.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleDepositSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!depositPatient || !amount) return;
        setIsSaving(true);
        try {
            await apiFetch(`/patient-ledger/${depositPatient.patient_id}/deposit`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    payment_method: paymentMethod,
                    reference_number: reference,
                    notes: notes
                })
            });
            toast.success("Advance deposit recorded successfully!");
            setDepositPatient(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to record deposit");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCashlessSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cashlessPatient || !amount) return;
        setIsSaving(true);
        try {
            await apiFetch(`/patient-ledger/${cashlessPatient.patient_id}/cashless-approval`, {
                method: 'POST',
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    payment_method: "TPA", // backend requires payment_method in payload
                    reference_number: reference,
                    notes: notes
                })
            });
            toast.success("Cashless approval updated!");
            setCashlessPatient(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || "Failed to record cashless approval");
        } finally {
            setIsSaving(false);
        }
    };

    const resetForms = () => {
        setAmount("");
        setPaymentMethod("CASH");
        setReference("");
        setNotes("");
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6">
            {/* Header Area */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <button 
                        onClick={() => router.push('/hospital/accounting')}
                        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-3 text-sm font-bold"
                    >
                        <ChevronLeft size={16} /> Back to Accounts
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">IPD Financial Ledger</h1>
                            <p className="text-slate-500 font-medium text-sm mt-0.5">Real-time balances for currently admitted patients</p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search patient or ward..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-72 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase tracking-widest text-slate-500 font-black">
                                <th className="py-5 px-6">Patient Details</th>
                                <th className="py-5 px-4 text-right">Running Bill</th>
                                <th className="py-5 px-4 text-right">Advance Deposit</th>
                                <th className="py-5 px-4 text-right">Cashless Approved</th>
                                <th className="py-5 px-6 text-right">Net Outstanding</th>
                                <th className="py-5 px-6 text-center">Ledger Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full font-bold text-sm animate-pulse">
                                            <Activity className="animate-spin" size={18} />
                                            Syncing Ledgers...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <Users className="text-slate-400" size={24} />
                                        </div>
                                        <p className="text-slate-900 font-bold text-lg">No admitted patients found</p>
                                        <p className="text-slate-500 text-sm mt-1">There are currently no active IPD admissions.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map(patient => (
                                    <tr key={patient.patient_id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-5 px-6">
                                            <p className="font-black text-slate-900">{patient.patient_name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    {patient.mrd_number}
                                                </span>
                                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                                    {patient.bed_details}
                                                </span>
                                            </div>
                                        </td>
                                        
                                        <td className="py-5 px-4 text-right">
                                            <p className="font-black text-slate-900 text-lg">₹ {patient.running_unbilled.toLocaleString()}</p>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">Unbilled Charges</p>
                                        </td>
                                        
                                        <td className="py-5 px-4 text-right group-hover:bg-emerald-50/30 transition-colors">
                                            <p className="font-black text-emerald-600 text-lg">₹ {patient.advance_deposit.toLocaleString()}</p>
                                            <p className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-bold mt-0.5">Deposits Received</p>
                                        </td>
                                        
                                        <td className="py-5 px-4 text-right group-hover:bg-blue-50/30 transition-colors">
                                            <p className="font-black text-blue-600 text-lg">₹ {patient.cashless_approved.toLocaleString()}</p>
                                            <p className="text-[10px] uppercase tracking-wider text-blue-500/70 font-bold mt-0.5">TPA Approved</p>
                                        </td>
                                        
                                        <td className="py-5 px-6 text-right border-l border-slate-100 bg-slate-50/30">
                                            <p className={`font-black text-2xl tracking-tight ${patient.net_due > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                                ₹ {patient.net_due.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">Total Due Now</p>
                                        </td>
                                        
                                        <td className="py-5 px-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => { resetForms(); setDepositPatient(patient); }}
                                                    className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-xl transition-colors tooltip-trigger" 
                                                    title="Collect Advance Deposit"
                                                >
                                                    <Wallet size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => { resetForms(); setCashlessPatient(patient); }}
                                                    className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl transition-colors tooltip-trigger" 
                                                    title="Update Cashless Approval"
                                                >
                                                    <ShieldCheck size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => router.push(`/hospital/accounting/invoices/new?patient_id=${patient.patient_id}`)}
                                                    className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-md" title="Generate Final Invoice"
                                                >
                                                    <ArrowRight size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Advance Deposit Modal */}
            {depositPatient && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                        <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                                    <Wallet size={18} />
                                    Collect Advance Deposit
                                </h2>
                                <p className="text-xs text-emerald-600 mt-1">{depositPatient.patient_name} ({depositPatient.mrd_number})</p>
                            </div>
                            <button onClick={() => setDepositPatient(null)} className="text-emerald-500 hover:bg-emerald-100 p-2 rounded-full"><X size={18}/></button>
                        </div>
                        <form onSubmit={handleDepositSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Deposit Amount (₹)</Label>
                                <Input type="number" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 10000" />
                            </div>
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">Cash</SelectItem>
                                        <SelectItem value="UPI">UPI</SelectItem>
                                        <SelectItem value="CARD">Card</SelectItem>
                                        <SelectItem value="NEFT">NEFT / Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Transaction / Reference Number (Optional)</Label>
                                <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. UPI Ref #..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any specific instructions..." />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setDepositPatient(null)}>Cancel</Button>
                                <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">Record Deposit</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Cashless Approval Modal */}
            {cashlessPatient && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                        <div className="px-6 py-4 border-b border-slate-100 bg-blue-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                                    <ShieldCheck size={18} />
                                    Update Cashless Approval
                                </h2>
                                <p className="text-xs text-blue-600 mt-1">{cashlessPatient.patient_name} ({cashlessPatient.mrd_number})</p>
                            </div>
                            <button onClick={() => setCashlessPatient(null)} className="text-blue-500 hover:bg-blue-100 p-2 rounded-full"><X size={18}/></button>
                        </div>
                        <form onSubmit={handleCashlessSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Approved Amount (₹)</Label>
                                <Input type="number" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 50000" />
                            </div>
                            <div className="space-y-2">
                                <Label>TPA / Pre-Auth Reference Number</Label>
                                <Input required value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. TPA-AUTH-9912..." />
                            </div>
                            <div className="space-y-2">
                                <Label>TPA Name / Notes</Label>
                                <Textarea required value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Star Health Insurance..." />
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setCashlessPatient(null)}>Cancel</Button>
                                <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">Save Approval</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
