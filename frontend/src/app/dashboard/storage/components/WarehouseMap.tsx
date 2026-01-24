
import React, { useState } from 'react';
import { Package, Map, Search, ChevronRight, Box } from 'lucide-react';

interface WarehouseMapProps {
    data: any[]; // Layout Data
    onSelectRack: (rackId: number) => void;
}

const WarehouseMap: React.FC<WarehouseMapProps> = ({ data, onSelectRack }) => {
    const [hoverRack, setHoverRack] = useState<any>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Map className="text-indigo-600" size={24} />
                <h2 className="text-xl font-black text-slate-800">Visual Layout</h2>
            </div>

            <div className="grid gap-8">
                {data.map((aisle: any) => (
                    <div key={aisle.aisle} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 relative">
                        <div className="absolute -top-3 left-6 bg-slate-800 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-slate-200">
                            Aisle {aisle.aisle}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                            {aisle.racks.map((rack: any) => {
                                const occupancy = (rack.occupied / rack.capacity) * 100;
                                const isFull = occupancy >= 100;
                                const color = isFull ? 'bg-indigo-600' : occupancy > 50 ? 'bg-indigo-400' : 'bg-indigo-200';

                                return (
                                    <div
                                        key={rack.id}
                                        onClick={() => onSelectRack(parseInt(rack.id))}
                                        onMouseEnter={() => setHoverRack(rack)}
                                        onMouseLeave={() => setHoverRack(null)}
                                        className="group relative cursor-pointer"
                                    >
                                        {/* Rack Representation */}
                                        <div className="aspect-[3/4] bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-500 transition-all p-3 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black text-slate-300 uppercase shrink-0">RACK</span>
                                                <span className="text-xs font-black text-slate-700">{rack.name.split('-').pop()}</span>
                                            </div>

                                            {/* Visual Shelves */}
                                            <div className="flex-1 flex flex-col justify-evenly py-2 gap-1">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div key={i} className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full ${color} opacity-${20 + (i * 15)}`}
                                                            style={{ width: `${Math.min(100, occupancy * (1 + (i / 10)))}%` }}
                                                        ></div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="text-center">
                                                <p className="text-[10px] text-slate-400 font-medium group-hover:text-indigo-600 transition-colors">
                                                    {rack.occupied} / {rack.capacity}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Empty Slot Placeholder */}
                            <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                <span className="text-xs font-bold opacity-50">Empty</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {data.length === 0 && (
                <div className="text-center py-20 text-slate-300">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-lg">Warehouse is Empty</p>
                    <p className="text-sm">Start by adding racks in the Rack Manager.</p>
                </div>
            )}
        </div>
    );
};

export default WarehouseMap;
