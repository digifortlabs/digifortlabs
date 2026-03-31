import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/config/api';

interface CreateAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    departments: any[];
    doctors: any[];
}

export default function CreateAppointmentModal({ isOpen, onClose, onSuccess, departments, doctors }: CreateAppointmentModalProps) {
    const [patientId, setPatientId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!patientId || !departmentId || !doctorId || !appointmentDate || !startTime || !endTime) {
            alert("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Combine date and time for backend
            const startDateTime = `${appointmentDate}T${startTime}:00`;
            const endDateTime = `${appointmentDate}T${endTime}:00`;

            const payload = {
                patient_id: parseInt(patientId),
                department_id: parseInt(departmentId),
                doctor_id: parseInt(doctorId),
                appointment_date: `${appointmentDate}T00:00:00.000Z`,
                start_time: startDateTime,
                end_time: endDateTime,
                reason_for_visit: reason,
                notes: notes
            };

            const data = await apiFetch('appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (data) {
                alert("Appointment scheduled successfully!");
                // Reset form
                setPatientId('');
                setDepartmentId('');
                setDoctorId('');
                setAppointmentDate('');
                setStartTime('');
                setEndTime('');
                setReason('');
                setNotes('');
                onSuccess();
            }
        } catch (error: any) {
            console.error("Error creating appointment:", error);
            alert(error.message || "Failed to schedule appointment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 text-white border-slate-800 max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Schedule New Appointment</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Book a time slot for a patient across any OPD department.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Patient Record ID *</label>
                            <Input
                                type="number"
                                required
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="Enter Patient ID"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Reason for Visit</label>
                            <Input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="E.g. Follow up, Checkup"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Department *</label>
                            <Select required value={departmentId} onValueChange={(val) => {
                                setDepartmentId(val);
                                setDoctorId(''); // reset doctor when dept changes
                            }}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    {departments.map(d => (
                                        <SelectItem key={d.department_id} value={d.department_id.toString()}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Doctor *</label>
                            <Select required value={doctorId} onValueChange={setDoctorId} disabled={!departmentId}>
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white disabled:opacity-50">
                                    <SelectValue placeholder="Select Doctor" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    {doctors
                                        .filter(d => departmentId ? d.department_id.toString() === departmentId : true)
                                        .map(d => (
                                            <SelectItem key={d.user_id} value={d.user_id.toString()}>
                                                Dr. {d.full_name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Date *</label>
                            <Input
                                type="date"
                                required
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">Start Time *</label>
                            <Input
                                type="time"
                                required
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">End Time *</label>
                            <Input
                                type="time"
                                required
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">Additional Notes</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                            placeholder="Any special instructions or notes..."
                        />
                    </div>

                    <DialogFooter className="mt-6 border-t border-slate-800 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white" disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                            {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
