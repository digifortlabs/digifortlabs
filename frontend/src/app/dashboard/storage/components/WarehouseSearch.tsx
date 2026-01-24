
import React, { useState, useEffect } from 'react';
import { Search, MapPin, Box, ArrowRight, Loader2 } from 'lucide-react';
import { API_URL } from '../../../../config/api';

interface WarehouseSearchProps {
    onNavigateToBox: (boxId: number) => void;
}

const WarehouseSearch: React.FC<WarehouseSearchProps> = ({ onNavigateToBox }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 500);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        const search = async () => {
            setIsSearching(true);
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/storage/search?q=${encodeURIComponent(debouncedQuery)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setResults(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        };
        search();
    }, [debouncedQuery]);

    return (
        <div className="relative z-20">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-indigo-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-11 pr-4 py-4 border-none rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm font-bold placeholder-slate-400 transition-all"
                    placeholder="Global Search: Find Patient Name, UHID, or MRD Number..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                    </div>
                )}
            </div>

            {/* Results Dropdown */}
            {results.length > 0 && query.length >= 2 && (
                <div className="absolute mt-2 w-full bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 max-h-[60vh] overflow-y-auto animate-in zoom-in-95 origin-top">
                    <div className="p-2 sticky top-0 bg-white border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3">
                        Found {results.length} Files
                    </div>
                    <ul className="py-2">
                        {results.map((r, i) => (
                            <li key={i} className="group">
                                <button
                                    onClick={() => {
                                        if (r.location.box_id) onNavigateToBox(r.location.box_id);
                                        setQuery('');
                                        setResults([]);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{r.patient_name}</p>
                                            <p className="text-xs font-mono text-slate-400">{r.mrd_id} • {r.uhid}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                            <span>Aisle {r.location.aisle}</span>
                                            <ArrowRight size={10} className="text-slate-300" />
                                            <span>{r.location.rack}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-indigo-500 mt-0.5">{r.location.box}</p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default WarehouseSearch;
