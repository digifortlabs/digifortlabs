
import React, { useState } from 'react';
import { Search, Printer, User, QrCode as QrIcon, FileText } from 'lucide-react';
import QRCode from "react-qr-code";
import { API_URL } from '../../../../config/api';

const PrintStyles = `
    @page { size: 1in 2in; margin: 0; }
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #fff; overflow: hidden; height: 100vh; width: 100vw; display: flex; align-items: center; justify-content: center; }
    .label { 
        text-align: center; 
        border: 1px solid #000; 
        padding: 4px; 
        width: 1in; 
        height: 2in; 
        page-break-inside: avoid; 
        display: flex; 
        flex-direction: column; 
        box-sizing: border-box; 
        background-color: #fff;
        overflow: hidden;
    }
    .header { 
        border-bottom: 1px solid #000; 
        padding-bottom: 2px; 
        margin-bottom: 2px; 
        flex-shrink: 0;
    }
    .header h3 { 
        margin: 0; 
        font-size: 7px; 
        font-weight: 900; 
        letter-spacing: 0.3px; 
        text-transform: uppercase;
        line-height: 1.2;
    }
    .qr-container { 
        margin: 2px 0; 
        display: flex; 
        justify-content: center; 
        align-items: center;
        flex-shrink: 0;
    }
    .main-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        overflow: hidden;
        padding: 2px 0;
    }
    h1 { 
        font-size: 9px; 
        margin: 0; 
        text-transform: uppercase; 
        line-height: 1.1; 
        font-weight: 900; 
        word-wrap: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-height: 20px; /* Safety for 2 lines */
    }
    .type-box {
        background-color: #000;
        color: #fff;
        padding: 1px 3px;
        display: inline-block;
        font-size: 6px;
        font-weight: 900;
        margin: 2px auto;
        letter-spacing: 0.5px;
        width: fit-content;
    }
    h2 { font-size: 8px; margin: 0 0 2px 0; font-weight: 900; color: #000; text-align: center; text-transform: uppercase; }
    .hospital { font-size: 6px; font-weight: 800; font-style: italic; margin-top: 1px; color: #333; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .footer { 
        font-size: 7px; 
        font-weight: 900; 
        border-top: 1px solid #000; 
        padding-top: 2px; 
        margin-top: auto;
        display: flex;
        justify-content: center;
        text-transform: uppercase;
        flex-shrink: 0;
    }
`;

const CategoryBadge = ({ category }: { category: string }) => {
    const cats: any = {
        'MLC': 'bg-red-100 text-red-700 border-red-200',
        'MCL': 'bg-red-100 text-red-700 border-red-200',
        'BIRTH': 'bg-green-100 text-green-700 border-green-200',
        'BRT': 'bg-green-100 text-green-700 border-green-200',
        'DEATH': 'bg-slate-800 text-white border-slate-900',
        'DHT': 'bg-slate-800 text-white border-slate-900',
        'IPD': 'bg-blue-100 text-blue-700 border-blue-200',
        'OPD': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'STANDARD': 'bg-blue-50 text-blue-600 border-blue-100'
    };
    const style = cats[category.toUpperCase()] || cats['STANDARD'];
    return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${style}`}>{category}</span>;
};

const LabelGenerator = () => {
    const [mode, setMode] = useState<'PATIENT' | 'BOX' | 'RACK'>('PATIENT');

    // Patient Logic
    const [uhidSearch, setUhidSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    // Search Results State
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Filter/Selection Logic
    const [searchQuery, setSearchQuery] = useState('');
    const [foundItem, setFoundItem] = useState<any>(null);

    const handleSearchPatient = async () => {
        if (!uhidSearch) return;
        setIsSearching(true);
        setSearchResults([]);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/patients/?q=${encodeURIComponent(uhidSearch)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const results = await res.json();
                setSearchResults(results.map((p: any) => ({
                    ...p,
                    displayTitle: p.full_name,
                    displaySub: p.uhid || p.patient_u_id,
                    displayCode: p.patient_u_id,
                    displayHospital: p.hospital_name || 'Digifort Labs',
                    displayType: 'PATIENT (MED)',
                    displayBox: p.box_label
                })));
                if (results.length === 0) alert("No patient found.");
            }
        } catch (e) { console.error(e); }
        finally { setIsSearching(false); }
    };

    const handleSearchBoxOrRack = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        setSearchResults([]);
        const token = localStorage.getItem('token');
        const endpoint = mode === 'BOX' ? '/storage/boxes' : '/storage/racks';

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const list = await res.json();
                const matches = list.filter((i: any) => i.label.toLowerCase().includes(searchQuery.toLowerCase()));

                setSearchResults(matches.map((m: any) => ({
                    ...m,
                    displayTitle: m.label,
                    displaySub: mode === 'BOX' ? m.location_code : `Aisle ${m.aisle}`,
                    displayCode: m.label,
                    displayHospital: m.hospital_name || 'Digifort Labs',
                    displayType: mode,
                    displayBox: mode === 'BOX' ? m.label : null
                })));

                if (matches.length === 0) alert("Not found. Try exact label.");
            }
        } catch (e) { console.error(e); }
        finally { setIsSearching(false); }
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
                        <div class="header">
                            <h3>DIGIFORT LABS</h3>
                            <div class="type-box">${activeItem.type}</div>
                        </div>
                        <div class="main-info">
                            ${activeItem.box ? `<h2 style="font-size: 8px; font-weight: 900; margin: 0 0 2px 0; color: #000;">BOX: ${activeItem.box}</h2>` : ''}
                            <h1>${activeItem.title}</h1>
                            <div class="hospital">${activeItem.hospital || ''}</div>
                        </div>
                        <div class="qr-container">
                             ${qrHtml}
                        </div>
                        <div class="footer">
                             <span style="width: 100%; text-align: center;">MRD: ${activeItem.code}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
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
                        <button onClick={handleSearchBoxOrRack} className="bg-indigo-600 text-white px-8 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50" disabled={isSearching}>
                            {isSearching ? '...' : 'Search'}
                        </button>
                    </div>
                )}

                {/* Results List */}
                {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Search Results ({searchResults.length})</p>
                        {searchResults.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    const formatted = {
                                        title: item.displayTitle,
                                        subtext: item.displaySub,
                                        code: item.displayCode,
                                        hospital: item.displayHospital,
                                        type: item.displayType,
                                        box: item.displayBox
                                    };
                                    if (mode === 'PATIENT') setSelectedPatient(formatted);
                                    else setFoundItem(formatted);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${(activeItem?.code === item.displayCode && activeItem?.title === item.displayTitle)
                                    ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                    : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="text-left">
                                    <p className="font-black text-slate-900 text-sm uppercase">{item.displayTitle}</p>
                                    <p className="text-xs font-bold text-slate-500">{item.displaySub}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase">{item.displayHospital}</p>
                                        <p className="text-[9px] font-bold text-slate-400">MRD: {item.displayCode}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition">
                                        <QrIcon size={14} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Preview is handled below */}
            </div>

            <div className="bg-slate-900 rounded-xl p-10 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
                <h2 className="text-lg font-bold mb-8 text-slate-400 flex items-center gap-2 w-full"><Printer size={18} /> Printer Preview</h2>
                {activeItem ? (
                    <div className="bg-white rounded-lg w-[1.5in] h-[3in] text-slate-900 shadow-2xl flex flex-col p-3 box-border overflow-hidden border border-slate-100">
                        <div className="border-b-[1.5px] border-black pb-1 mb-1 text-center flex-shrink-0">
                            <p className="text-[7px] font-black uppercase tracking-[1px]">DIGIFORT LABS</p>
                            <div className="bg-black text-white px-1.5 py-0.5 inline-block text-[6px] font-black uppercase tracking-widest mt-1">
                                {activeItem.type}
                            </div>
                        </div>

                        <div className="main-info flex-1 flex flex-col justify-center text-center overflow-hidden py-2">
                            {activeItem.box && (
                                <p className="text-[8px] font-black text-slate-800 uppercase mb-1 tracking-tight">BOX: {activeItem.box}</p>
                            )}
                            <h4
                                className="font-black text-[11px] uppercase leading-[1.1] mb-1 overflow-hidden"
                                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                            >
                                {activeItem.title}
                            </h4>
                            <p className="text-[6px] font-bold text-slate-500 italic mt-1 truncate">{activeItem.hospital}</p>
                        </div>

                        <div className="bg-white p-1 mb-2 flex justify-center flex-shrink-0" id="real-qr-code">
                            <QRCode
                                size={120}
                                style={{ height: "auto", maxWidth: "80px", width: "100%" }}
                                value={activeItem.code || "UNKNOWN"}
                                viewBox={`0 0 256 256`}
                            />
                        </div>

                        <div className="border-t border-black pt-1 flex justify-center text-[7px] font-black uppercase flex-shrink-0">
                            <span>MRD: {activeItem.code}</span>
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
