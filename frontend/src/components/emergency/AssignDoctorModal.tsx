import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/config/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AssignDoctorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    emergencyId: number | null;
    patientName: string;
}

export default function AssignDoctorModal({ isOpen, onClose, onSuccess, emergencyId, patientName }: AssignDoctorModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [doctors, setDoctors] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchDoctors();
            setSelectedDoctor('');
        }
    }, [isOpen]);

    const fetchDoctors = async () => {
        try {
            const data = await apiFetch('doctors/');
            if (data && data.length > 0) {
                setDoctors(data);
            } else {
                setDoctors([
                    { profile_id: 1, full_name: 'Dr. Sarah Smith' },
                    { profile_id: 2, full_name: 'Dr. John Doe' },
                    { profile_id: 3, full_name: 'Dr. Emily Chen' },
                ]);
            }
        } catch (error) {
            console.error("Failed to fetch doctors", error);
            // Fallback for demo
            setDoctors([
                { profile_id: 1, full_name: 'Dr. Sarah Smith' },
                { profile_id: 2, full_name: 'Dr. John Doe' },
                { profile_id: 3, full_name: 'Dr. Emily Chen' },
            ]);
        }
    };

    const handleAssign = async () => {
        if (!selectedDoctor || !emergencyId) return;
        
        setIsLoading(true);
        try {
            const doc = doctors.find(d => d.profile_id.toString() === selectedDoctor || d.full_name === selectedDoctor);
            const docId = doc ? doc.profile_id : parseInt(selectedDoctor);

            await apiFetch(`emergency/${emergencyId}`, {
                method: 'PUT',
                body: JSON.stringify({ doctor_id: docId })
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to assign doctor", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Doctor</DialogTitle>
                    <DialogDescription>
                        Assign an attending physician for {patientName || 'this patient'}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="doctor">Select Doctor</Label>
                        <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                            <SelectTrigger id="doctor" className="rounded-md">
                                <SelectValue placeholder="Select attending doctor" />
                            </SelectTrigger>
                            <SelectContent>
                                {doctors.map((doc) => (
                                    <SelectItem key={doc.profile_id} value={doc.profile_id.toString()}>
                                        {doc.full_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-md">Cancel</Button>
                    <Button onClick={handleAssign} disabled={isLoading || !selectedDoctor} className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isLoading ? 'Assigning...' : 'Assign Doctor'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
