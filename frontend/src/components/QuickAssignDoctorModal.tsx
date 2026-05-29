"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/config/api';
import { UserPlus, CalendarCheck } from 'lucide-react';
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
    const [reasonForVisit, setReasonForVisit] = useState('');
    const [isFollowUp, setIsFollowUp] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
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

    const handleAssign = async () => {
        if (patientId === null || patientId === undefined) {
            toast.error("Patient ID is missing. Please try again.");
            return;
        }
        if (!selectedDepartment || !selectedDoctor) {
            toast.error("Please select a department and a doctor.");
            return;
        }

        setIsSaving(true);
        try {
            // Backend will auto-calculate start_time and end_time (dynamic 7-min queue)
            const payload = {
                patient_id: patientId,
                department_id: parseInt(selectedDepartment),
                doctor_id: parseInt(selectedDoctor),
                visit_type: 'OPD',
                is_follow_up: isFollowUp,
                reason_for_visit: reasonForVisit
            };

            const response = await apiFetch('appointments/', {
                method: 'POST',
                body: payload
            });

            let timeMsg = "";
            if (response && response.start_time) {
                const dateStr = new Date(response.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const timeStr = new Date(response.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                timeMsg = ` Scheduled for ${dateStr} at ${timeStr}.`;
            }

            toast.success(`Patient added to queue successfully!${timeMsg}`);
            onClose();
        } catch (error: any) {
            console.error("Failed to assign doctor", error);
            toast.error(error.message || "Failed to assign doctor");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CalendarCheck className="w-5 h-5 text-indigo-600" /> Book Appointment
                    </DialogTitle>
                    <DialogDescription>
                        Assign <span className="font-bold text-slate-800">{patientName}</span> to a doctor's OPD queue. The estimated wait time will be calculated automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
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
                                    <SelectItem key={d.user_id} value={d.user_id.toString()}>
                                        Dr. {d.full_name}
                                    </SelectItem>
                                ))}
                                {doctors.length === 0 && selectedDepartment && (
                                    <div className="p-2 text-sm text-slate-500 text-center">No doctors found in this department.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Chief Complaint / Reason for Visit (Optional)</Label>
                        <Textarea 
                            placeholder="Briefly describe the patient's symptoms or reason for visit..."
                            value={reasonForVisit}
                            onChange={(e) => setReasonForVisit(e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
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
                    <Button onClick={handleAssign} disabled={isSaving || !selectedDoctor} className="bg-indigo-600 hover:bg-indigo-700">
                        {isSaving ? "Assigning..." : "Assign & Queue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
