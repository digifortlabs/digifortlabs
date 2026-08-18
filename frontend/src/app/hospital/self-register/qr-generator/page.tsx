"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function QRGeneratorPage() {
    const [hospitalId, setHospitalId] = useState<number | null>(null);

    useEffect(() => {
        apiFetch("/users/me/").then((user: any) => {
            if (user && user.hospital_id) {
                setHospitalId(user.hospital_id);
            }
        });
    }, []);

    const qrUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/hospital/self-register?hospital_id=${hospitalId}`
        : '';

    if (!hospitalId) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8 no-print">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">QR Standee Generator</h1>
                    <p className="text-slate-500 font-medium mt-1">Print this and place it at your reception desk.</p>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                    <Printer className="w-4 h-4" />
                    Print Standee
                </button>
            </div>

            {/* Print Area */}
            <div className="bg-white border-4 border-indigo-600 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden print:shadow-none print:border-4 print:border-black max-w-2xl mx-auto">
                <div className="absolute top-0 left-0 w-full h-40 bg-indigo-600 -z-10 print:bg-black"></div>
                
                <h2 className="text-4xl font-black text-white mt-4 mb-16 uppercase tracking-widest print:text-white">
                    Express Check-in
                </h2>
                
                <div className="bg-white p-8 rounded-3xl inline-block shadow-xl mb-12 print:shadow-none print:border-2 print:border-slate-200">
                    <QRCodeSVG 
                        value={qrUrl} 
                        size={256}
                        level="H"
                        includeMargin={true}
                    />
                </div>
                
                <h3 className="text-3xl font-black text-slate-900 mb-4 print:text-black">
                    Skip the line.
                </h3>
                <p className="text-xl text-slate-600 font-medium mb-8 max-w-md mx-auto print:text-black">
                    Scan this QR code with your smartphone camera to register instantly.
                </p>
                
                <div className="flex justify-center gap-4 text-slate-400 font-bold items-center">
                    <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
                    POWERED BY DIGIFORT
                    <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
                </div>
            </div>
            
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:border-black {
                        border-color: #000 !important;
                    }
                    .print\\:text-black {
                        color: #000 !important;
                    }
                    .print\\:bg-black {
                        background-color: #000 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .print\\:text-white {
                        color: #fff !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .max-w-2xl {
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .max-w-2xl * {
                        visibility: visible;
                    }
                }
            `}</style>
        </div>
    );
}
