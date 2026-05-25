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
    const [patientName, setPatientName] = useState('');
    const [isSearchingPatient, setIsSearchingPatient] = useState(false);

    React.useEffect(() => {
        if (!patientId) {
            setPatientName('');
            return;
        }
        const delayDebounce = setTimeout(async () => {
            setIsSearchingPatient(true);
            try {
                const res = await apiFetch(`patients/${patientId}`);
                if (res && res.full_name) {
                    setPatientName(res.full_name);
                } else {
                    setPatientName('Patient not found');
                }
            } catch (err) {
                setPatientName('Patient not found');
            } finally {
                setIsSearchingPatient(false);
            }
        }, 600);
        return () => clearTimeout(delayDebounce);
    }, [patientId]);

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
            <DialogContent className="bg-white text-slate-800 border-slate-100 max-w-2xl rounded-3xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
                <DialogHeader className="pb-4 border-b border-slate-100">
                    <DialogTitle className="font-black text-slate-900 tracking-tight text-xl">Schedule New Appointment</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium text-xs mt-1">
                        Book a time slot for a patient across any OPD department.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Patient Record ID *</label>
                            <Input
                                type="number"
                                required
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl h-11 font-medium px-4"
                                placeholder="Enter Patient ID"
                            />
                            {patientId && (
                                <div className="text-xs mt-1.5 font-bold">
                                    {isSearchingPatient ? (
                                        <span className="text-slate-400 animate-pulse">Searching patient...</span>
                                    ) : patientName === 'Patient not found' ? (
                                        <span className="text-rose-500 font-black">⚠️ {patientName}</span>
                                    ) : (
                                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">👤 {patientName}</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Reason for Visit</label>
                            <Input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl h-11 font-medium px-4"
                                placeholder="E.g. Follow up, Checkup"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Department *</label>
                            <Select required value={departmentId} onValueChange={(val) => {
                                setDepartmentId(val);
                                setDoctorId(''); // reset doctor when dept changes
                            }}>
                                <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl h-11 font-medium">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-xl shadow-xl">
                                    {departments.map(d => (
                                        <SelectItem key={d.department_id} value={d.department_id.toString()}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Doctor *</label>
                            <Select required value={doctorId} onValueChange={setDoctorId} disabled={!departmentId}>
                                <SelectTrigger className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl h-11 font-medium disabled:opacity-50">
                                    <SelectValue placeholder="Select Doctor" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-100 text-slate-800 rounded-xl shadow-xl">
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
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Date *</label>
                            <Input
                                type="date"
                                required
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl h-11 font-medium px-4"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Start Time *</label>
                            <Input
                                type="time"
                                required
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl h-11 font-medium px-4"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">End Time *</label>
                            <Input
                                type="time"
                                required
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl h-11 font-medium px-4"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">Additional Notes</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-slate-50/50 border-slate-200 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl font-medium p-3 min-h-[80px]"
                            placeholder="Any special instructions or notes..."
                        />
                    </div>

                    <DialogFooter className="mt-6 border-t border-slate-100 pt-4 bg-slate-50/50 p-6 -mx-6 -mb-6 flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all h-11" disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/10 transition-all h-11">
                            {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
