
import React from 'react';
import { MapPin } from 'lucide-react';

interface Rack {
    id: string;
    name: string;
    capacity: number;
    occupied: number;
}

interface Aisle {
    aisle: number;
    racks: Rack[];
}

const RackCard = ({ rack }: { rack: Rack }) => {
    let occupancy = rack.occupied;
    const percent = Math.min(100, Math.round((occupancy / rack.capacity) * 100));

    let color = "bg-emerald-500";
    if (percent > 70) color = "bg-amber-500";
    if (percent > 90) color = "bg-red-500";

    return (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all cursor-pointer">
            <div>
                <h4 className="font-bold text-slate-700">{rack.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{occupancy}/{rack.capacity}</span>
                </div>
            </div>
        </div>
    );
};

const AisleGrid = ({ data }: { data: Aisle[] }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800">MRD Physical Map</h2>
                    <p className="text-sm sm:text-base text-slate-400 font-medium">Visual occupancy and capacity monitoring</p>
                </div>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div> Available
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div> Near Capacity
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div> Full
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {data.map((aisleData) => (
                    <div key={aisleData.aisle} className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-base text-indigo-950 flex items-center gap-2">
                                <MapPin size={18} className="text-indigo-600" />
                                Aisle {aisleData.aisle}
                            </h3>
                            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                {aisleData.aisle < 3 ? 'Zone A' : 'Zone B'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {aisleData.racks.map(rack => (
                                <div key={rack.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-xs text-slate-700 truncate w-full">{rack.name}</h4>
                                        <div className={`w-2 h-2 rounded-full ${rack.occupied / rack.capacity > 0.9 ? 'bg-red-500' : rack.occupied / rack.capacity > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                    </div>
                                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mb-1">
                                        <div className={`h-full ${rack.occupied / rack.capacity > 0.9 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (rack.occupied / rack.capacity) * 100)}%` }}></div>
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-400 text-right">{rack.occupied} Files</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {data.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-sm font-bold">No warehouse data.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AisleGrid;

