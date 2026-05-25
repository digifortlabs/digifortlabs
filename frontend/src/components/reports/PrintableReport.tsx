import React, { forwardRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PrintableReportProps {
    reportType: string;
    data: any;
    summary: any;
    dateRange: { start: string; end: string };
    hospitalName?: string;
    generatedBy: string;
}

const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(({
    reportType, data, summary, dateRange, hospitalName, generatedBy
}, ref) => {

    const currentDate = new Date().toLocaleString();
    const titleMap: Record<string, string> = {
        clinical: "Clinical & Patient Analytics Report",
        inventory: "Warehouse & Inventory Status Report",
        audit: "System Security & Audit Log"
    };

    return (
        <div 
            ref={ref} 
            className="bg-white text-slate-800 font-sans" 
            style={{ 
                width: '1000px', // Fixed width for consistent PDF A4 landscape/portrait sizing
                minHeight: '1200px', 
                padding: '60px', 
                boxSizing: 'border-box',
                // We use absolute styling to ensure html2canvas captures it perfectly even if hidden on screen
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                zIndex: -1
            }}
        >
            {/* Header / Branding */}
            <div className="flex justify-between items-end border-b-2 border-indigo-600 pb-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-indigo-700 tracking-tight">DIGIFORT LABS</h1>
                    <p className="text-slate-500 font-bold tracking-widest text-sm mt-1">SECURE ARCHIVAL SYSTEM</p>
                </div>
                <div className="text-right text-sm">
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">{titleMap[reportType] || "General Report"}</h2>
                    <p className="text-slate-500">
                        <span className="font-bold">Date Range:</span> {dateRange.start || 'Beginning'} to {dateRange.end || 'Now'}
                    </p>
                    <p className="text-slate-500">
                        <span className="font-bold">Client:</span> {hospitalName || 'All Clients (Global)'}
                    </p>
                </div>
            </div>

            {/* Executive Summary */}
            {summary && (
                <div className="mb-10">
                    <h3 className="text-lg font-black text-slate-800 mb-4 border-b border-slate-200 pb-2 uppercase tracking-wider">Executive Summary</h3>
                    <div className="flex flex-wrap gap-4">
                        {Object.entries(summary).slice(0, 4).map(([key, val]: any) => (
                            <div key={key} className="flex-1 min-w-[200px] bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</p>
                                <h4 className="text-2xl font-black text-indigo-600">{val}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div>
                <h3 className="text-lg font-black text-slate-800 mb-4 border-b border-slate-200 pb-2 uppercase tracking-wider">Detailed Records</h3>
                {(!data || data.length === 0) ? (
                    <p className="text-slate-400 italic">No records found for the selected criteria.</p>
                ) : (
                    <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <tr>
                                {reportType === 'clinical' && (
                                    <>
                                        <th className="p-3 border-b border-slate-200">Patient Name</th>
                                        <th className="p-3 border-b border-slate-200">ID / MRD</th>
                                        <th className="p-3 border-b border-slate-200">Admission</th>
                                        <th className="p-3 border-b border-slate-200">Tags</th>
                                    </>
                                )}
                                {reportType === 'inventory' && (
                                    <>
                                        <th className="p-3 border-b border-slate-200">Box Label</th>
                                        <th className="p-3 border-b border-slate-200">Location</th>
                                        <th className="p-3 border-b border-slate-200">Status</th>
                                        <th className="p-3 border-b border-slate-200">Utilization</th>
                                    </>
                                )}
                                {reportType === 'audit' && (
                                    <>
                                        <th className="p-3 border-b border-slate-200">Time</th>
                                        <th className="p-3 border-b border-slate-200">User</th>
                                        <th className="p-3 border-b border-slate-200">Action</th>
                                        <th className="p-3 border-b border-slate-200">Details</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {data.slice(0, 50).map((row: any, i: number) => ( // Limit to 50 rows for PDF aesthetic logic
                                <tr key={i} className="hover:bg-slate-50">
                                    {reportType === 'clinical' && (
                                        <>
                                            <td className="p-3 font-medium">{row.patient_name}</td>
                                            <td className="p-3 font-mono text-xs">{row.patient_id}</td>
                                            <td className="p-3">{row.admission_date || '-'}</td>
                                            <td className="p-3"><span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{row.tags}</span></td>
                                        </>
                                    )}
                                    {reportType === 'inventory' && (
                                        <>
                                            <td className="p-3 font-bold text-indigo-600">{row.box_label || row.label}</td>
                                            <td className="p-3 font-mono text-xs">{row.location || row.location_code}</td>
                                            <td className="p-3 font-bold text-xs">{row.status}</td>
                                            <td className="p-3">{row.files_stored || row.patient_count}/{row.capacity}</td>
                                        </>
                                    )}
                                    {reportType === 'audit' && (
                                        <>
                                            <td className="p-3 font-mono text-xs">{row.timestamp}</td>
                                            <td className="p-3 font-bold">{row.user}</td>
                                            <td className="p-3 text-xs font-bold uppercase">{row.action}</td>
                                            <td className="p-3 text-xs">{row.details}</td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {data?.length > 50 && (
                    <p className="text-center text-xs text-slate-400 mt-4 italic">
                        * Only the top 50 records are shown in this document format. Please export as CSV for the full dataset.
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="mt-16 pt-6 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
                <p>Generated by: <span className="font-bold text-slate-600">{generatedBy}</span></p>
                <p>Generated on: <span className="font-bold text-slate-600">{currentDate}</span></p>
                <p>Digifort Labs - Confidential & Proprietary</p>
            </div>
        </div>
    );
});

PrintableReport.displayName = 'PrintableReport';
export default PrintableReport;
