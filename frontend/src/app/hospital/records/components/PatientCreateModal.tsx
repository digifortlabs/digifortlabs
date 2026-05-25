'use client';

import React from 'react';
import { 
    User, 
    Sparkles, 
    Camera, 
    Loader2, 
    AlertTriangle, 
    ArrowRight, 
    Upload,
    X
} from 'lucide-react';

interface PatientCreateModalProps {
    show: boolean;
    onClose: () => void;
    isEditing: boolean;
    newPatient: any;
    setNewPatient: (val: any) => void;
    activeTab: string;
    setActiveTab: (val: string) => void;
    isExtracting: boolean;
    onAIExtraction: (file: File) => void;
    onOpenCamera: () => void;
    onReset: () => void;
    onSubmit: (e: React.FormEvent) => void;
    terms: any;
    specialty: string;
    userProfile: any;
    hospitalDoctors: string[];
    isMRDDuplicate: boolean;
    onMRDChange: (val: string) => void;
    checkExistingUHID: (val: string) => void;
    isExistingPatient: boolean;
    suggestions: any[];
    showSuggestions: boolean;
    setShowSuggestions: (val: boolean) => void;
    onNameSearch: (val: string) => void;
    onSelectPatient: (p: any) => void;
    ageUnit: string;
    setAgeUnit: (val: any) => void;
    calculateAge: (val: string) => void;
    toUpperCaseMRD: (val: string) => string;
    toTitleCase: (val: string) => string;
}

export default function PatientCreateModal({
    show,
    onClose,
    isEditing,
    newPatient,
    setNewPatient,
    activeTab,
    setActiveTab,
    isExtracting,
    onAIExtraction,
    onOpenCamera,
    onReset,
    onSubmit,
    terms,
    specialty,
    userProfile,
    hospitalDoctors,
    isMRDDuplicate,
    onMRDChange,
    checkExistingUHID,
    isExistingPatient,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    onNameSearch,
    onSelectPatient,
    ageUnit,
    setAgeUnit,
    calculateAge,
    toUpperCaseMRD,
    toTitleCase
}: PatientCreateModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[1.5rem] max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative max-h-[95vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-5 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <User className="text-indigo-600" size={20} /> {isEditing ? `Edit ${terms.patient}` : `Register New ${terms.patient}`}
                    </h2>
                    <div className="flex gap-2">
                        {(['superadmin', 'platform_staff', 'website_admin'].includes(userProfile?.role)) && (
                            <>
                                <label className={`flex items-center gap-2 px-3 py-1 rounded-lg border cursor-pointer transition-all ${isExtracting ? 'bg-indigo-50 border-indigo-200 cursor-wait' : 'bg-indigo-50/20 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'}`}>
                                    {isExtracting ? (
                                        <>
                                            <Loader2 size={12} className="text-indigo-600 animate-spin" />
                                            <span className="text-[10px] font-bold text-indigo-600">AI Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={12} className="text-indigo-600" />
                                            <span className="text-[10px] font-bold text-indigo-600">Magic AI</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) onAIExtraction(file);
                                                    e.target.value = '';
                                                }}
                                                disabled={isExtracting}
                                            />
                                        </>
                                    )
                                    }
                                </label>

                                <button
                                    type="button"
                                    onClick={onOpenCamera}
                                    disabled={isExtracting}
                                    className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${isExtracting ? 'bg-indigo-50 border-indigo-200 cursor-wait' : 'bg-indigo-50/20 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'}`}
                                >
                                    <Camera size={12} className="text-indigo-600" />
                                    <span className="text-[10px] font-bold text-indigo-600">Camera</span>
                                </button>
                            </>
                        )}

                        <button
                            onClick={onReset}
                            className="px-3 py-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-200 transition"
                        >
                            Reset
                        </button>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('identity')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'identity' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        1. Identity
                    </button>
                    <button
                        onClick={() => setActiveTab('admission')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'admission' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        2. Admission
                    </button>
                    <button
                        onClick={() => setActiveTab('clinical')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'clinical' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        3. Clinical
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    {activeTab === 'identity' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">UHID</label>
                                    <div className="relative">
                                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-mono text-indigo-700 font-bold text-sm"
                                            value={newPatient.uhid}
                                            onChange={e => {
                                                const val = toUpperCaseMRD(e.target.value);
                                                setNewPatient({ ...newPatient, uhid: val });
                                            }}
                                            onBlur={(e) => checkExistingUHID(e.target.value)}
                                            placeholder="Auto-fill..." />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-indigo-400 font-bold pointer-events-none">
                                            {isExistingPatient ? "FOUND" : "NEW"}
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-8 relative">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-slate-900 text-sm"
                                        placeholder={`${terms.patient} Name`}
                                        value={newPatient.full_name}
                                        onChange={e => onNameSearch(e.target.value)}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        autoComplete="off"
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-40 overflow-y-auto">
                                            {suggestions.map((p, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => onSelectPatient(p)}
                                                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition border-b border-slate-50 last:border-0"
                                                >
                                                    <p className="font-bold text-slate-800 text-xs">{p.full_name}</p>
                                                    <p className="text-[10px] text-slate-500 flex gap-2">
                                                        <span>{p.uhid ? `UHID:${p.uhid}` : `mrd:${p.patient_u_id}`}</span>
                                                        <span>• {p.gender}, {p.age}</span>
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-3">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Age <span className="text-red-500">*</span></label>
                                    <div className="flex gap-1">
                                        <input
                                            required
                                            type="number"
                                            className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                            value={newPatient.age}
                                            onChange={e => setNewPatient({ ...newPatient, age: e.target.value })}
                                            placeholder="00"
                                        />
                                        <select
                                            className="px-1 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-xs font-bold text-slate-700"
                                            value={ageUnit}
                                            onChange={e => setAgeUnit(e.target.value as any)}
                                        >
                                            <option value="Years">Yr</option>
                                            <option value="Months">Mo</option>
                                            <option value="Days">Dy</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="md:col-span-4">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Gender <span className="text-red-500">*</span></label>
                                    <select required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                        value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="md:col-span-5">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">DOB</label>
                                    <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                        value={newPatient.dob} onChange={e => calculateAge(e.target.value)} />
                                </div>

                                <div className="md:col-span-6">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile <span className="text-red-500">*</span></label>
                                    <input required type="tel" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm font-mono"
                                        value={newPatient.contact_number} onChange={e => setNewPatient({ ...newPatient, contact_number: e.target.value })} placeholder="Mobile Number" />
                                </div>

                                <div className="md:col-span-6">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                                    <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                        value={newPatient.address}
                                        onChange={e => setNewPatient({ ...newPatient, address: toTitleCase(e.target.value) })}
                                        placeholder="City / Area" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admission' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-6">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{terms.mrd} No. <span className="text-red-500">*</span></label>
                                    <input required type="text" className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 font-mono font-black text-slate-800 text-sm ${isMRDDuplicate ? 'border-red-500' : 'border-slate-200'}`}
                                        value={newPatient.patient_u_id}
                                        onChange={e => onMRDChange(e.target.value)}
                                        placeholder={`New ${terms.mrd}`} />
                                    {isMRDDuplicate && <p className="text-red-500 text-[10px] mt-0.5">⚠️ Exists!</p>}
                                </div>

                                <div className="md:col-span-6">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 font-bold text-slate-700 text-sm"
                                        value={newPatient.patient_category}
                                        onChange={e => setNewPatient({ ...newPatient, patient_category: e.target.value })}
                                        disabled={specialty === 'Dental'}
                                    >
                                        <option value="IPD">IPD</option>
                                        <option value="OPD">OPD</option>
                                        <option value="MCL">MCL (Medico-Legal)</option>
                                        <option value="BRT">Birth</option>
                                        <option value="DHT">Death</option>
                                    </select>
                                </div>

                                <div className="md:col-span-6">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Admission Date</label>
                                    <input type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm"
                                        value={newPatient.admission_date} onChange={e => setNewPatient((prev: any) => ({ ...prev, admission_date: e.target.value }))} />
                                </div>

                                <div className="md:col-span-6">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Discharge Date <span className="text-red-500">*</span></label>
                                    <input required type="date" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm"
                                        value={newPatient.discharge_date} onChange={e => setNewPatient((prev: any) => ({ ...prev, discharge_date: e.target.value }))} />
                                </div>

                                <div className="col-span-12">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name(s)</label>
                                    <input
                                        type="text"
                                        list="hospital-doctors-list"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm font-bold"
                                        placeholder="e.g. Dr. Dixit, Dr. Shah"
                                        value={newPatient.doctor_name || ''}
                                        onChange={e => setNewPatient((prev: any) => ({ ...prev, doctor_name: e.target.value }))}
                                    />
                                    <datalist id="hospital-doctors-list">
                                        {hospitalDoctors.map((doc, idx) => (
                                            <option key={idx} value={doc} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clinical' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-6">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Weight</label>
                                    <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm"
                                        placeholder="e.g. 65kg"
                                        value={newPatient.weight || ''}
                                        onChange={e => setNewPatient((prev: any) => ({ ...prev, weight: e.target.value }))} />
                                </div>

                                <div className="md:col-span-6">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Mediclaim</label>
                                    <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm"
                                        placeholder="Yes / No"
                                        value={newPatient.mediclaim || ''}
                                        onChange={e => setNewPatient((prev: any) => ({ ...prev, mediclaim: e.target.value }))} />
                                </div>

                                <div className="col-span-12">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Diagnosis / Notes</label>
                                    <textarea className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 text-sm h-32"
                                        placeholder="Provisional diagnosis or medical notes..."
                                        value={newPatient.diagnosis || ''}
                                        onChange={e => setNewPatient((prev: any) => ({ ...prev, diagnosis: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex gap-3 sticky bottom-0 bg-white z-10 pb-2 border-t border-slate-100 mt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition text-sm">
                            Cancel
                        </button>
                        {activeTab !== 'clinical' ? (
                            <button
                                type="button"
                                onClick={() => setActiveTab(activeTab === 'identity' ? 'admission' : 'clinical')}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm"
                            >
                                Next <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm">
                                <Upload size={16} /> Save & Upload
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
