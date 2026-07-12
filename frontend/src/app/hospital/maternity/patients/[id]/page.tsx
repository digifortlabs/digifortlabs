"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, Calendar, FileText, 
    Baby, Activity, Plus 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card, CardContent, CardDescription,
    CardHeader, CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { API_URL, apiFetch } from '@/config/api';

export default function MaternityPatientDetail({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('anc');
    const [ancVisits, setAncVisits] = useState<any[]>([]);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const [ancData, deliveryData] = await Promise.all([
                    apiFetch(`maternity/patients/${params.id}/anc_visits`),
                    apiFetch(`maternity/patients/${params.id}/deliveries`)
                ]);
                if (ancData) setAncVisits(ancData);
                if (deliveryData) setDeliveries(deliveryData);
            } catch (error) {
                console.error("Failed to fetch maternity patient details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [params.id]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Patient Record #{params.id}</h1>
                    <p className="text-muted-foreground text-sm">Maternity & Obstetrics Details</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-grid">
                    <TabsTrigger value="anc"><Activity className="h-4 w-4 mr-2"/> ANC Visits</TabsTrigger>
                    <TabsTrigger value="deliveries"><Baby className="h-4 w-4 mr-2"/> Deliveries & Newborns</TabsTrigger>
                </TabsList>

                <TabsContent value="anc" className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Antenatal Care History</h2>
                        <Button className="bg-pink-600 hover:bg-pink-700">
                            <Plus className="h-4 w-4 mr-2" /> Log ANC Visit
                        </Button>
                    </div>
                    {loading ? (
                        <p>Loading...</p>
                    ) : ancVisits.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No ANC visits logged yet.
                            </CardContent>
                        </Card>
                    ) : (
                        ancVisits.map((visit) => (
                            <Card key={visit.anc_id}>
                                <CardHeader className="py-4">
                                    <CardTitle className="text-base flex items-center justify-between">
                                        <span>Visit Date: {new Date(visit.visit_date).toLocaleDateString()}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Weight</p>
                                        <p className="font-medium">{visit.weight ? `${visit.weight} kg` : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">BP</p>
                                        <p className="font-medium">{visit.blood_pressure || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Fundal Height</p>
                                        <p className="font-medium">{visit.fundal_height || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">FHR</p>
                                        <p className="font-medium">{visit.fetal_heart_rate || '-'}</p>
                                    </div>
                                    <div className="col-span-full">
                                        <p className="text-muted-foreground">Notes</p>
                                        <p className="font-medium">{visit.notes || 'No specific notes'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="deliveries" className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Delivery Records</h2>
                        <Button className="bg-pink-600 hover:bg-pink-700">
                            <Plus className="h-4 w-4 mr-2" /> Log Delivery
                        </Button>
                    </div>
                    {loading ? (
                        <p>Loading...</p>
                    ) : deliveries.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                No deliveries logged yet.
                            </CardContent>
                        </Card>
                    ) : (
                        deliveries.map((del) => (
                            <Card key={del.delivery_id}>
                                <CardHeader className="py-4 bg-muted/30">
                                    <CardTitle className="text-base flex items-center justify-between">
                                        <span>Delivery on {new Date(del.delivery_date).toLocaleDateString()}</span>
                                        <span className="text-sm font-normal px-2 py-1 bg-pink-100 text-pink-700 rounded">
                                            {del.delivery_type}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="py-4 space-y-4 text-sm">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-muted-foreground">Discharge Date</p>
                                            <p className="font-medium">{del.discharge_date ? new Date(del.discharge_date).toLocaleDateString() : '-'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground">Complications</p>
                                            <p className="font-medium">{del.complications || 'None reported'}</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <p className="font-semibold mb-2">Newborn Details</p>
                                        <Button variant="outline" size="sm">
                                            <Plus className="h-3 w-3 mr-1"/> Add Newborn
                                        </Button>
                                        {/* In a complete implementation, we would fetch and map the newborn records here */}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
