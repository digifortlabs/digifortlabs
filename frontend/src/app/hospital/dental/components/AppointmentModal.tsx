"use client";

import React, { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from '@/components/ui/select';
import { X, Calendar, Clock, User, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    patients: any[];
    onSchedule: (appointment: any) => void;
}

export default function AppointmentModal({ isOpen, onClose, patients, onSchedule }: AppointmentModalProps) {
    const [selectedPatientId, setSelectedPatientId] = useState<string>("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [type, setType] = useState("");
    const [doctor, setDoctor] = useState("Dr. Himani Desai");

    const handleSubmit = () => {
        if (!selectedPatientId || !date || !time || !type) {
            alert("Please fill in all required fields.");
            return;
        }

        const patient = patients.find(p => p.patient_id.toString() === selectedPatientId);
        onSchedule({
            patient_id: parseInt(selectedPatientId),
            patient_name: patient?.full_name || "Unknown",
            date,
            time,
            type,
            status: "Scheduled"
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <CardHeader className="border-b bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" /> Schedule Appointment
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                        <Label>Select Patient</Label>
                        <select
                            className="w-full h-10 px-3 py-2 bg-white border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                        >
                            <option value="">Choose a patient...</option>
                            {patients.map(p => (
                                <option key={p.patient_id} value={p.patient_id}>{p.full_name} ({p.phone})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Time</Label>
                            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Procedure Type</Label>
                        <select
                            className="w-full h-10 px-3 py-2 bg-white border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="">Select Procedure</option>
                            <option value="Consultation">General Consultation</option>
                            <option value="Root Canal">Root Canal Treatment (RCT)</option>
                            <option value="Scaling">Scaling & Polishing</option>
                            <option value="Extraction">Extraction</option>
                            <option value="Filling">Composite Filling</option>
                            <option value="Orthodontic">Orthodontic Review</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Assigned Doctor</Label>
                        <Input value={doctor} onChange={(e) => setDoctor(e.target.value)} />
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-800 flex gap-2">
                            <Zap className="w-4 h-4 fill-blue-300 text-blue-600 flex-shrink-0" />
                            AI Suggestion: Morning slots are usually quieter for longer procedures like RCT.
                        </p>
                    </div>
                </CardContent>
                <div className="p-6 border-t bg-slate-50/30 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="bg-white">Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        className="bg-blue-900 text-white hover:bg-blue-800 shadow-lg shadow-blue-900/10"
                    >
                        Schedule Appointment
                    </Button>
                </div>
            </Card>
        </div>
    );
}
