"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Calendar, History, FileText, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiFetch } from '@/config/api';
import toast from 'react-hot-toast';

export default function SalesHistoryPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/pharmacy/direct-sales?limit=100');
            setSales(data || []);
        } catch (err: any) {
            toast.error(err.message || "Failed to load sales history");
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(s => 
        (s.walkin_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.walkin_phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sale_id.toString().includes(searchQuery)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-7 h-7 text-indigo-600" />
                        Sales History
                    </h1>
                    <p className="text-slate-500 mt-1">View recent POS transactions and direct sales records</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input 
                        placeholder="Search by name, phone, or Sale ID..." 
                        className="w-full md:w-80 pl-9 border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
            ) : filteredSales.length === 0 ? (
                <Card className="border-dashed border-2 shadow-none bg-slate-50/50">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">No Sales Found</h3>
                        <p className="text-sm text-slate-500 mt-1">No direct sales match your search criteria.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-600 bg-slate-100 border-b">
                                <tr>
                                    <th className="px-6 py-4">Sale ID / Date</th>
                                    <th className="px-6 py-4">Customer Info</th>
                                    <th className="px-6 py-4">Items Sold</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4 text-right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSales.map((sale) => (
                                    <tr key={sale.sale_id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-slate-900">{sale.bill_number || `#SALE-${sale.sale_id}`}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(sale.sold_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700">
                                                {sale.patient_id ? `Patient ID: ${sale.patient_id}` : (sale.walkin_name || 'Walk-in Customer')}
                                            </div>
                                            {sale.walkin_phone && (
                                                <div className="text-xs text-slate-500 mt-1">{sale.walkin_phone}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate">
                                            <div className="flex flex-col gap-1">
                                                {(sale.items_sold || []).map((item: any, idx: number) => (
                                                    <div key={idx} className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block truncate">
                                                        {item.quantity}x {item.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                {sale.payment_method || 'Cash'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="font-black text-indigo-700 text-lg">
                                                ₹{(sale.total_amount || 0).toFixed(2)}
                                            </div>
                                            {(sale.tax_amount > 0) && (
                                                <div className="text-[10px] text-slate-400 font-medium">
                                                    Incl. ₹{sale.tax_amount.toFixed(2)} tax
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
