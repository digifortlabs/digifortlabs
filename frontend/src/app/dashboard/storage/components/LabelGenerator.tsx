
import React, { useState } from 'react';
import { Search, Printer, User, QrCode as QrIcon, FileText } from 'lucide-react';
import QRCode from "react-qr-code";
import { API_URL } from '../../../../config/api';

const CategoryBadge = ({ category }: { category: string }) => {
    const cats: any = {
        'MLC': 'bg-red-100 text-red-700 border-red-200',
        'BIRTH': 'bg-green-100 text-green-700 border-green-200',
        'DEATH': 'bg-slate-800 text-white border-slate-900',
        'STANDARD': 'bg-blue-50 text-blue-600 border-blue-100'
    };
    const style = cats[category] || cats['STANDARD'];
    return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${style}`}>{category}</span>;
};

const LabelGenerator = () => {
    const [uhidSearch, setUhidSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    const handleSearch = async () => {
        if (!uhidSearch) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/patients/?q=${encodeURIComponent(uhidSearch)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const results = await res.json();
                if (results.length > 0) {
                    const patient = results[0];
                    setSelectedPatient({
                        name: patient.full_name,
                        uhid: patient.uhid || '',
                        mrd_id: patient.patient_u_id || '', // Explicitly store MRD ID
                        location: patient.box_location_code || 'Unassigned',
                        category: patient.patient_category || 'STANDARD'
                    });
                } else {
                    alert("No patient found.");
                    setSelectedPatient(null);
                }
            }
        } catch (e) { console.error(e); }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=600,height=600');
        if (printWindow && selectedPatient) {
            const qrHtml = document.getElementById('real-qr-code')?.innerHTML || '';
            const idDisplay = selectedPatient.mrd_id || selectedPatient.uhid; // Prioritize MRD ID

            printWindow.document.write(`
                <html>
                <head>
                    <title>Print Label - ${idDisplay}</title>
                    <style>
                        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .label { text-align: center; border: 2px dashed #000; padding: 20px; border-radius: 10px; width: 300px; page-break-inside: avoid; }
                        h1 { font-size: 14px; margin-bottom: 5px; text-transform: uppercase; line-height: 1.2; word-wrap: break-word; }
                        p { font-size: 12px; color: #555; font-weight: bold; margin: 0; }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <img src="/logo/logo.png" style="height: 30px; margin-bottom: 5px;" />
                        <h1>${selectedPatient.name}</h1>
                        <div style="margin: 15px 0; display: flex; justify-content: center;">
                             ${qrHtml}
                        </div>
                        <p>${idDisplay}</p>
                        <p>${selectedPatient.category}</p>
                    </div>
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500); 
                    </script>
                </body>
                </html>
             `);
            printWindow.document.close();
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-950">
                    <Search size={20} className="text-indigo-600" /> Find Patient File
                </h2>
                <div className="flex gap-3 mb-8">
                    <input
                        type="text"
                        className="flex-1 bg-slate-100 border-transparent rounded-2xl px-6 py-4 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="Enter UHID..."
                        value={uhidSearch}
                        onChange={e => setUhidSearch(e.target.value)}
                    />
                    <button onClick={handleSearch} className="bg-indigo-600 text-white px-8 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                        Search
                    </button>
                </div>

                {/* Manual Toggle */}
                <div className="mb-6 flex justify-end">
                    <button
                        onClick={() => {
                            const isManual = selectedPatient?.isManual;
                            if (isManual) {
                                setSelectedPatient(null);
                            } else {
                                setSelectedPatient({ name: 'New Patient', uhid: 'MANUAL', mrd_id: 'MANUAL', category: 'STANDARD', location: 'N/A', isManual: true });
                            }
                        }}
                        className="text-xs font-bold text-slate-400 hover:text-indigo-600 underline"
                    >
                        {selectedPatient?.isManual ? "Back to Search" : "Or Create Manually"}
                    </button>
                </div>

                {selectedPatient?.isManual && (
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6 space-y-4 animate-in slide-in-from-top-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Name</label>
                            <input
                                className="w-full p-2 rounded-lg border border-slate-200 font-bold text-slate-700"
                                value={selectedPatient.name}
                                onChange={e => setSelectedPatient({ ...selectedPatient, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">MRD ID / UHID</label>
                                <input
                                    className="w-full p-2 rounded-lg border border-slate-200 font-bold"
                                    value={selectedPatient.mrd_id || selectedPatient.uhid}
                                    onChange={e => setSelectedPatient({ ...selectedPatient, mrd_id: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                <select
                                    className="w-full p-2 rounded-lg border border-slate-200 font-bold"
                                    value={selectedPatient.category}
                                    onChange={e => setSelectedPatient({ ...selectedPatient, category: e.target.value })}
                                >
                                    <option value="STANDARD">Standard</option>
                                    <option value="MLC">MLC</option>
                                    <option value="BIRTH">Birth</option>
                                    <option value="DEATH">Death</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
                {selectedPatient ? (
                    <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><User size={24} /></div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg leading-tight">{selectedPatient.name}</h3>
                                    <p className="text-indigo-600 text-sm font-bold uppercase tracking-widest">{selectedPatient.mrd_id || selectedPatient.uhid}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <CategoryBadge category={selectedPatient.category} />
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                        <FileText size={48} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">Search for a patient to generate label</p>
                    </div>
                )}
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
                <h2 className="text-lg font-bold mb-8 text-slate-400 flex items-center gap-2 w-full"><Printer size={18} /> Printer Preview</h2>
                {selectedPatient ? (
                    <div className="bg-white p-6 rounded-2xl max-w-[260px] w-full text-slate-900 shadow-xl transform hover:scale-105 transition duration-500">
                        <div className="border-b-2 border-dashed border-slate-200 pb-3 mb-3 text-center">
                            <p className="text-[9px] font-black uppercase tracking-[2px] text-indigo-600">Digifort Labs</p>
                        </div>
                        <div className="bg-slate-100 p-4 mb-3 flex justify-center" id="real-qr-code">
                            <QRCode
                                size={120}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={selectedPatient.mrd_id || selectedPatient.uhid || "UNKNOWN"}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <div className="text-center">
                            <h4 className="font-black text-sm uppercase leading-tight">{selectedPatient.name}</h4>
                            <p className="text-[10px] font-bold text-indigo-600">{selectedPatient.mrd_id || selectedPatient.uhid}</p>
                            <div className="mt-2 text-[10px] font-bold bg-slate-200 inline-block px-2 rounded">{selectedPatient.category}</div>
                        </div>
                    </div>
                ) : (
                    <div className="h-64 w-full flex items-center justify-center text-slate-700 italic border-2 border-slate-800 rounded-2xl border-dashed">Preview Unavailable</div>
                )}
                <button
                    onClick={handlePrint}
                    disabled={!selectedPatient}
                    className="mt-8 w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-sm hover:bg-slate-100 disabled:opacity-20 transition shadow-lg shadow-white/10"
                >
                    Print Thermal Label
                </button>
            </div>
        </div >
    );
};

export default LabelGenerator;
