import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Info, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/config/api';

interface ICD11Code {
    code: string;
    description: string;
    chapter?: string;
}

interface ICD11SearchProps {
    type: 'diagnosis' | 'procedure';
    patientId: string | number;
    onAdded: () => void;
}

export default function ICD11Search({ type, patientId, onAdded }: ICD11SearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ICD11Code[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCode, setSelectedCode] = useState<ICD11Code | null>(null);
    const [notes, setDiagNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length >= 2) {
                performSearch(query);
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const performSearch = async (q: string) => {
        setLoading(true);
        try {
            const endpoint = type === 'diagnosis' ? 'icd11/diagnoses/search' : 'icd11/procedures/search';
            const data = await apiFetch(`${endpoint}?q=${q}`);
            if (data) setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!selectedCode) return;
        setIsSaving(true);
        try {
            const endpoint = type === 'diagnosis' 
                ? `icd11/diagnoses/patients/${patientId}/diagnoses` 
                : `icd11/patients/${patientId}/procedures`;
            
            await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ code: selectedCode.code, notes })
            });
            
            setQuery('');
            setSelectedCode(null);
            setDiagNotes('');
            setResults([]);
            onAdded();
        } catch (e) {
            console.error(e);
            alert(`Failed to add ${type}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {!selectedCode ? (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={`Search ICD-11 ${type === 'diagnosis' ? 'Diagnoses' : 'Procedures'}...`}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 size={18} className="animate-spin text-indigo-600" />
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2">
                            {results.map((res) => (
                                <button
                                    key={res.code}
                                    onClick={() => setSelectedCode(res)}
                                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-start gap-3 border-b border-slate-50 last:border-0"
                                >
                                    <div className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-lg mt-0.5 shrink-0">
                                        {res.code}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{res.description}</p>
                                        {res.chapter && <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">{res.chapter}</p>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 animate-in zoom-in-95">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                                {selectedCode.code}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 leading-tight">{selectedCode.description}</h4>
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Confirmed WHO ICD-11 Code</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedCode(null)}
                            className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                        >
                            Change
                        </button>
                    </div>

                    <textarea
                        placeholder="Add clinical notes or observations (optional)..."
                        className="w-full p-3 bg-white border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm h-24 resize-none mb-4"
                        value={notes}
                        onChange={(e) => setDiagNotes(e.target.value)}
                    />

                    <button
                        disabled={isSaving}
                        onClick={handleAdd}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        Save {type === 'diagnosis' ? 'Diagnosis' : 'Procedure'}
                    </button>
                </div>
            )}
        </div>
    );
}
