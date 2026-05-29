"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/config/api';
import { UserPlus, CalendarCheck, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QuickAssignDoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number | null;
    patientName: string;
}

export default function QuickAssignDoctorModal({ isOpen, onClose, patientId, patientName }: QuickAssignDoctorModalProps) {
    const [departments, setDepartments] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [visitType, setVisitType] = useState('OPD');
    
    // Date & Time
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [preferredTime, setPreferredTime] = useState('');
    
    const [reasonForVisit, setReasonForVisit] = useState('');
    const [isFollowUp, setIsFollowUp] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Schedule & Preview
    const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
    const [previewSlot, setPreviewSlot] = useState<any>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            // Reset state
            setSelectedDepartment('');
            setSelectedDoctor('');
            setVisitType('OPD');
            setSelectedDate(todayStr);
            setPreferredTime('');
            setPreviewSlot(null);
            setPreviewError(null);
            setScheduleBlocks([]);
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const depts = await apiFetch('appointments/departments');
            if (depts) setDepartments(depts);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        }
    };

    useEffect(() => {
        if (selectedDepartment) {
            fetchDoctors(selectedDepartment);
        } else {
            setDoctors([]);
            setSelectedDoctor('');
        }
    }, [selectedDepartment]);

    const fetchDoctors = async (deptId: string) => {
        try {
            const docs = await apiFetch(`appointments/doctors?department_id=${deptId}`);
            if (docs) setDoctors(docs);
        } catch (error) {
            console.error("Failed to fetch doctors", error);
        }
    };

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            fetchScheduleBlocks();
        } else {
            setScheduleBlocks([]);
        }
    }, [selectedDoctor, selectedDate]);

    const fetchScheduleBlocks = async () => {
        try {
            const blocks = await apiFetch(`appointments/doctor-schedule/${selectedDoctor}?date=${selectedDate}`);
            if (blocks) setScheduleBlocks(blocks);
        } catch (error) {
            console.error("Failed to fetch schedule blocks", error);
            setScheduleBlocks([]);
        }
    };

    useEffect(() => {
        if (selectedDoctor && selectedDate && visitType) {
            fetchPreviewSlot();
        } else {
            setPreviewSlot(null);
            setPreviewError(null);
        }
    }, [selectedDoctor, selectedDate, visitType, preferredTime]);

    const fetchPreviewSlot = async () => {
        try {
            const payload = {
                doctor_id: parseInt(selectedDoctor),
                appointment_date: selectedDate,
                visit_type: visitType,
                preferred_time: preferredTime || null
            };
            const res = await apiFetch('appointments/preview-slot', {
                method: 'POST',
                body: payload
            });
            setPreviewSlot(res);
            setPreviewError(null);
        } catch (error: any) {
            setPreviewError(error.message || "Failed to find slot");
            setPreviewSlot(null);
        }
    };

    const handleAssign = async () => {
        if (patientId === null || patientId === undefined) {
            toast.error("Patient ID is missing.");
            return;
        }
        if (!selectedDepartment || !selectedDoctor) {
            toast.error("Please select a department and a doctor.");
            return;
        }
        if (previewError && !previewSlot) {
            toast.error("Cannot book: " + previewError);
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                patient_id: patientId,
                department_id: parseInt(selectedDepartment),
                doctor_id: parseInt(selectedDoctor),
                visit_type: visitType,
                appointment_date: selectedDate,
                start_time: previewSlot?.start_time,
                end_time: previewSlot?.end_time,
                is_follow_up: isFollowUp,
                reason_for_visit: reasonForVisit
            };

            const response = await apiFetch('appointments/', {
                method: 'POST',
                body: payload
            });

            toast.success(`Appointment booked successfully!`);
            onClose();
        } catch (error: any) {
            console.error("Failed to book appointment", error);
            toast.error(error.message || "Failed to book appointment");
        } finally {
            setIsSaving(false);
        }
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CalendarCheck className="w-5 h-5 text-indigo-600" /> Book Appointment
                    </DialogTitle>
                    <DialogDescription>
                        Schedule an appointment for <span className="font-bold text-slate-800">{patientName}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Department</Label>
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(d => (
                                    <SelectItem key={d.department_id} value={d.department_id.toString()}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Doctor</Label>
                        <Select value={selectedDoctor} onValueChange={setSelectedDoctor} disabled={!selectedDepartment}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Doctor" />
                            </SelectTrigger>
                            <SelectContent>
                                {doctors.map(d => (
                                    <SelectItem key={d.profile_id} value={d.profile_id.toString()}>
                                        Dr. {d.full_name}
                                    </SelectItem>
                                ))}
                                {doctors.length === 0 && selectedDepartment && (
                                    <div className="p-2 text-sm text-slate-500 text-center">No doctors found.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 col-span-2">
                        <Label>Doctor's Schedule ({selectedDate})</Label>
                        {scheduleBlocks.length > 0 ? (
                            <div className="flex gap-1 h-8 mt-1 w-full bg-slate-100 rounded p-1 overflow-hidden">
                                {scheduleBlocks.map((block, idx) => (
                                    <div key={idx} 
                                        title={`${block.start_time} - ${block.end_time} (${block.session_type})`}
                                        className={`flex-1 flex items-center justify-center rounded text-xs font-semibold text-white shadow-sm transition-all hover:opacity-80 cursor-help
                                            ${block.session_type === 'OT' ? 'bg-red-500' : 
                                              block.session_type === 'OPD' ? 'bg-yellow-500' : 
                                              block.session_type === 'IPD' ? 'bg-blue-500' : 'bg-green-500'}`}
                                    >
                                        {block.session_type} ({block.start_time})
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 italic bg-slate-50 p-2 rounded text-center">
                                {selectedDoctor ? "No active schedule for this date or off duty." : "Select a doctor to view schedule."}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Visit Type</Label>
                        <Select value={visitType} onValueChange={setVisitType} disabled>
                            <SelectTrigger className="bg-slate-50 cursor-not-allowed text-slate-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="OPD">OPD Visit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input 
                            type="date" 
                            min={todayStr}
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                        />
                    </div>
                    
                    <div className="space-y-2 col-span-2">
                        <Label>Preferred Time (Optional)</Label>
                        <Input 
                            type="time" 
                            value={preferredTime} 
                            onChange={(e) => setPreferredTime(e.target.value)} 
                        />
                    </div>
                    
                    <div className="space-y-2 col-span-2">
                        {previewSlot && (
                            <div className={`p-3 rounded-md border ${previewSlot.message ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                                <div className="flex items-start gap-2">
                                    <Clock className={`w-5 h-5 mt-0.5 ${previewSlot.message ? 'text-amber-600' : 'text-green-600'}`} />
                                    <div>
                                        <p className={`font-semibold ${previewSlot.message ? 'text-amber-800' : 'text-green-800'}`}>
                                            Assigned Slot: {formatTime(previewSlot.start_time)} - {formatTime(previewSlot.end_time)}
                                        </p>
                                        {previewSlot.message && (
                                            <p className="text-sm text-amber-700 mt-1">{previewSlot.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {previewError && !previewSlot && (
                            <div className="p-3 rounded-md border bg-red-50 border-red-200">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 mt-0.5 text-red-600" />
                                    <div>
                                        <p className="font-semibold text-red-800">Cannot Assign Slot</p>
                                        <p className="text-sm text-red-700 mt-1">{previewError}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 col-span-2">
                        <Label>Chief Complaint / Reason for Visit (Optional)</Label>
                        <Textarea 
                            placeholder="Briefly describe the reason for visit..."
                            value={reasonForVisit}
                            onChange={(e) => setReasonForVisit(e.target.value)}
                            className="min-h-[60px]"
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2 col-span-2">
                        <Checkbox 
                            id="followUp" 
                            checked={isFollowUp} 
                            onCheckedChange={(checked) => setIsFollowUp(checked as boolean)} 
                        />
                        <Label htmlFor="followUp" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            This is a follow-up visit
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleAssign} 
                        disabled={isSaving || !selectedDoctor || !!previewError} 
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isSaving ? "Booking..." : "Book Appointment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
