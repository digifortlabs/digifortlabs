"use client";

import React, { useState, useEffect } from 'react';
import {
    Activity, ChevronLeft, Calendar, FileText,
    Pill, Stethoscope, Ear, Plus, Activity as Rhythm
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/config/api';
import { formatDate } from '@/lib/dateFormatter';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ENTPatientDetailProps {
    patientId: number;
    onBack: () => void;
}

export default function ENTPatientDetail({ patientId, onBack }: ENTPatientDetailProps) {
    const [patientData, setPatientData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('clinical');

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const data = await apiFetch(`ent/patients/${patientId}`);
                if (data) setPatientData(data);
            } catch (error) {
                console.error("Failed to load ENT patient details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [patientId]);

    if (loading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Loading patient clinical record...</div>;
    }

    if (!patientData || !patientData.ent_profile) {
        return (
            <div className="p-6">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div className="text-center p-12 bg-white rounded-xl border border-rose-200">
                    <p className="text-rose-600 font-medium">Failed to load patient profile.</p>
                </div>
            </div>
        );
    }

    const { ent_profile, audiometry_tests, examinations, surgeries } = patientData;

    // Helper to format recharts data for Audiometry
    const renderAudiogram = (results: any) => {
        if (!results || Object.keys(results).length === 0) {
            return <p className="text-sm text-slate-500 italic p-4">No frequency data recorded.</p>;
        }

        // Transform { "500": 20, "1000": 25, "2000": 30 } -> Recharts format
        const frequencies = ['250', '500', '1000', '2000', '4000', '8000'];
        const chartData = frequencies.map(freq => ({
            frequency: freq,
            Right: results.right_ear?.[freq] || null,
            Left: results.left_ear?.[freq] || null
        }));

        return (
            <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="frequency" tick={{ fill: '#64748B' }} tickLine={false} axisLine={false} />
                        <YAxis
                            reversed={true} // Audiograms are plotted with 0 at top
                            domain={[-10, 120]}
                            tick={{ fill: '#64748B' }}
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'Hearing Level (dB HL)', angle: -90, position: 'insideLeft', fill: '#64748B' }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="Right" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 4 }} activeDot={{ r: 6 }} name="Right Ear (O)" />
                        <Line type="monotone" dataKey="Left" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} name="Left Ear (X)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <Button variant="ghost" onClick={onBack} size="sm" className="rounded-full bg-slate-100 hover:bg-slate-200">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Patient Record #{ent_profile.patient_id}
                        </h2>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">ENT Module</Badge>
                    </div>
                    <p className="text-slate-500 text-sm mt-1">Registered: {formatDate(ent_profile.created_at)}</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100/50 p-1 mb-6 inline-flex">
                    <TabsTrigger value="clinical" className="gap-2"><FileText className="w-4 h-4" /> Clinical Profile</TabsTrigger>
                    <TabsTrigger value="audiometry" className="gap-2"><Rhythm className="w-4 h-4" /> Audiometry</TabsTrigger>
                    <TabsTrigger value="examinations" className="gap-2"><Stethoscope className="w-4 h-4" /> Examinations</TabsTrigger>
                </TabsList>

                <TabsContent value="clinical" className="space-y-6">
                    <Card className="border-slate-200/60 shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" /> Chief Complaint & History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Chief Complaint</h4>
                                <p className="text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    {ent_profile.chief_complaint || "No chief complaint recorded."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Allergies</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {ent_profile.allergies?.length > 0 ? ent_profile.allergies.map((allergy: string, i: number) => (
                                            <Badge key={i} variant="destructive" className="bg-rose-50 text-rose-700 hover:bg-rose-100">
                                                {allergy}
                                            </Badge>
                                        )) : <span className="text-slate-400 italic text-sm">None reported</span>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">Family ENT History</h4>
                                    <p className="text-slate-700 text-sm">
                                        {JSON.stringify(ent_profile.family_ent_history) === '{}' ? "No significant family history." : JSON.stringify(ent_profile.family_ent_history)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="audiometry" className="space-y-6">
                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div>
                            <h3 className="font-semibold text-blue-900">Hearing Assessment Records</h3>
                            <p className="text-sm text-blue-700">Pure tone audiometry and speech tests.</p>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                            <Plus className="w-4 h-4 mr-1" /> New Test
                        </Button>
                    </div>

                    {audiometry_tests.map((test: any) => (
                        <Card key={test.test_id} className="border-slate-200/60 shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Ear className="w-5 h-5 text-indigo-600" />
                                        <div>
                                            <CardTitle className="text-base">{test.test_type} Test</CardTitle>
                                            <CardDescription>{formatDate(test.test_date)}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-white">{test.hearing_loss_degree || "Normal"}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {test.test_type === 'Pure Tone' ? (
                                    renderAudiogram(test.results)
                                ) : (
                                    <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm text-slate-700">
                                        {JSON.stringify(test.results, null, 2)}
                                    </div>
                                )}

                                {test.recommendations && (
                                    <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                        <h4 className="text-sm font-medium text-amber-800 mb-1">Audiologist Recommendations</h4>
                                        <p className="text-sm text-amber-700">{test.recommendations}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                    {audiometry_tests.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                            <Rhythm className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No audiometry tests recorded.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="examinations" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-emerald-600" /> Clinical Findings
                        </h3>
                        <Button variant="outline" size="sm" className="gap-2 bg-white">
                            <Plus className="w-4 h-4" /> Add Examination
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {examinations.map((exam: any) => (
                            <Card key={exam.exam_id} className="border-slate-200/60 shadow-sm">
                                <CardHeader className="py-3 bg-slate-50/50 border-b">
                                    <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> {formatDate(exam.exam_date)}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Otoscopy</span>
                                            <p className="text-sm text-slate-700">{exam.examination_data?.otoscopy?.findings || "Not examined"}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Rhinoscopy</span>
                                            <p className="text-sm text-slate-700">{exam.examination_data?.rhinoscopy?.findings || "Not examined"}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Laryngoscopy</span>
                                            <p className="text-sm text-slate-700">{exam.examination_data?.laryngoscopy?.findings || "Not examined"}</p>
                                        </div>
                                    </div>
                                    {exam.findings && (
                                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">Overall Findings</span>
                                            <p className="text-sm text-emerald-800">{exam.findings}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {examinations.length === 0 && (
                            <p className="text-slate-500 italic py-4 text-center border rounded-xl bg-slate-50">No clinical examinations found.</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
