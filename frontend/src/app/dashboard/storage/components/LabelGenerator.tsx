
import React, { useState } from 'react';
import { Search, Printer, User, QrCode as QrIcon, FileText } from 'lucide-react';
import QRCode from "react-qr-code";
import { API_URL } from '../../../../config/api';

const PrintStyles = `
    @page { size: 4in 6in; margin: 0; }
    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .label { text-align: center; border: 4px solid #000; padding: 20px; border-radius: 12px; width: 3.5in; height: 5.5in; page-break-inside: avoid; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; }
    h1 { font-size: 32px; margin: 0; text-transform: uppercase; line-height: 1; word-wrap: break-word; font-weight: 900; }
    h2 { font-size: 18px; margin: 10px 0; color: #555; }
    .qr-container { flex: 1; display: flex; align-items: center; justify-content: center; margin: 20px 0; }
    .footer { font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
`;

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
    const [mode, setMode] = useState<'PATIENT' | 'BOX' | 'RACK'>('PATIENT');

    // Patient Logic
    const [uhidSearch, setUhidSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    // Box/Rack Logic
    const [searchQuery, setSearchQuery] = useState('');
    const [foundItem, setFoundItem] = useState<any>(null);

    const handleSearchPatient = async () => {
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
                        title: patient.full_name,
                        subtext: patient.uhid,
                        code: patient.patient_u_id,
                        type: 'PATIENT'
                    });
                } else { alert("No patient found."); setSelectedPatient(null); }
            }
        } catch (e) { console.error(e); }
    };

    const handleSearchBoxOrRack = async () => {
        if (!searchQuery) return;
        const token = localStorage.getItem('token');
        const endpoint = mode === 'BOX' ? '/storage/boxes' : '/storage/racks';

        // Note: The backend doesn't have a direct search for boxes/racks by label easily in one call without filtering client side 
        // OR we use the new search endpoint? The new search endpoint returns hierarchies for files, not empty boxes.
        // Let's use the list endpoint and filter client side for now (simpler for this specific task)
        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const list = await res.json();
                const match = list.find((i: any) => i.label.toLowerCase().includes(searchQuery.toLowerCase()));

                if (match) {
                    setFoundItem({
                        title: match.label,
                        subtext: mode === 'BOX' ? match.location_code : `Aisle ${match.aisle}`,
                        code: match.label, // The QR Content
                        type: mode
                    });
                    setSearchQuery('');
                } else {
                    alert("Not found. Try exact label.");
                    setFoundItem(null);
                }
            }
        } catch (e) { console.error(e); }
    };

    const activeItem = mode === 'PATIENT' ? selectedPatient : foundItem;

    const handlePrint = () => {
        if (!activeItem) return;
        const printWindow = window.open('', '', 'width=600,height=800');
        if (printWindow) {
            const qrHtml = document.getElementById('real-qr-code')?.innerHTML || '';
            printWindow.document.write(`
                <html>
                <head>
                    <title>Print Label - ${activeItem.code}</title>
                    <style>${PrintStyles}</style>
                </head>
                <body>
                    <div class="label">
                        <div style="text-align:center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
                            <h3 style="margin:0; font-size: 18px; font-weight: 900; letter-spacing: 2px;">DIGIFORT LABS</h3>
                        </div>
                        <div style="text-align:center;">
                            <h1>${activeItem.type}</h1>
                            <h2>${activeItem.subtext || ''}</h2>
                        </div>
                        <div class="qr-container">
                             ${qrHtml}
                        </div>
                        <div style="text-align:center;">
                             <h1>${activeItem.title}</h1>
                        </div>
                    </div>
                    <script>
                        setTimeout(() => { window.print(); window.close(); }, 500); 
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
                <div className="flex gap-4 mb-8">
                    {['PATIENT', 'BOX', 'RACK'].map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m as any); setSelectedPatient(null); setFoundItem(null); }}
                            className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${mode === m
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                        >
                            {m} LABEL
                        </button>
                    ))}
                </div>

                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-950">
                    <Search size={20} className="text-indigo-600" /> Find {mode.toLowerCase()}
                </h2>

                {mode === 'PATIENT' ? (
                    <div className="flex gap-3 mb-8">
                        <input
                            type="text"
                            className="flex-1 bg-slate-100 border-transparent rounded-2xl px-6 py-4 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Enter UHID..."
                            value={uhidSearch}
                            onChange={e => setUhidSearch(e.target.value)}
                        />
                        <button onClick={handleSearchPatient} className="bg-indigo-600 text-white px-8 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                            Search
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3 mb-8">
                        <input
                            type="text"
                            className="flex-1 bg-slate-100 border-transparent rounded-2xl px-6 py-4 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder={`Enter ${mode} Label...`}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <button onClick={handleSearchBoxOrRack} className="bg-indigo-600 text-white px-8 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                            Search
                        </button>
                    </div>
                )}

                {/* Preview is handled below */}
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
                <h2 className="text-lg font-bold mb-8 text-slate-400 flex items-center gap-2 w-full"><Printer size={18} /> Printer Preview</h2>
                {activeItem ? (
                    <div className="bg-white p-6 rounded-2xl max-w-[280px] w-full text-slate-900 shadow-xl transform hover:scale-105 transition duration-500">
                        <div className="border-b-4 border-black pb-3 mb-3 text-center">
                            <p className="text-xs font-black uppercase tracking-[2px] mb-1">DIGIFORT LABS</p>
                            <p className="text-xl font-black uppercase">{activeItem.type}</p>
                        </div>
                        <div className="bg-white p-2 mb-3 flex justify-center" id="real-qr-code">
                            <QRCode
                                size={150}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={activeItem.code || "UNKNOWN"}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <div className="text-center">
                            <h4 className="font-black text-2xl uppercase leading-tight mb-2">{activeItem.title}</h4>
                            <p className="text-sm font-bold text-slate-500">{activeItem.subtext}</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-64 w-full flex items-center justify-center text-slate-700 italic border-2 border-slate-800 rounded-2xl border-dashed">Preview Unavailable</div>
                )}
                <button
                    onClick={handlePrint}
                    disabled={!activeItem}
                    className="mt-8 w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-sm hover:bg-slate-100 disabled:opacity-20 transition shadow-lg shadow-white/10"
                >
                    Print Label
                </button>
            </div>
        </div >
    );
};

export default LabelGenerator;
