"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Calendar } from 'lucide-react';
import { apiFetch } from '@/config/api';
import { toast } from 'sonner';

interface DoctorScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctorId: number | null;
    doctorName: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorScheduleModal({ isOpen, onClose, doctorId, doctorName }: DoctorScheduleModalProps) {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && doctorId) {
            fetchSchedule();
        } else {
            setBlocks([]);
        }
    }, [isOpen, doctorId]);

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch(`doctors/${doctorId}/schedule`);
            setBlocks(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load schedule");
        } finally {
            setIsLoading(false);
        }
    };

    const addBlock = (dayIndex: number) => {
        setBlocks([...blocks, {
            day_of_week: dayIndex,
            start_time: '09:00',
            end_time: '13:00',
            session_type: 'OPD',
            is_active: true
        }]);
    };

    const removeBlock = (index: number) => {
        setBlocks(blocks.filter((_, i) => i !== index));
    };

    const updateBlock = (index: number, field: string, value: any) => {
        const newBlocks = [...blocks];
        newBlocks[index][field] = value;
        setBlocks(newBlocks);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiFetch(`doctors/${doctorId}/schedule`, {
                method: 'POST',
                body: blocks
            });
            toast.success("Schedule updated successfully!");
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save schedule");
        } finally {
            setIsSaving(false);
        }
    };

    const getBlocksForDay = (dayIndex: number) => {
        return blocks.map((b, i) => ({ ...b, originalIndex: i })).filter(b => b.day_of_week === dayIndex).sort((a,b) => a.start_time.localeCompare(b.start_time));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Calendar className="w-5 h-5 text-indigo-600" /> Manage Schedule: Dr. {doctorName}
                    </DialogTitle>
                    <DialogDescription>
                        Configure working blocks (OPD, IPD, OT) for each day of the week.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 text-center text-slate-500">Loading schedule...</div>
                ) : (
                    <div className="space-y-6 py-4">
                        {DAYS.map((day, dayIndex) => {
                            const dayBlocks = getBlocksForDay(dayIndex);
                            return (
                                <div key={day} className="border rounded-md p-4 bg-slate-50 shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold text-slate-800">{day}</h4>
                                        <Button variant="outline" size="sm" onClick={() => addBlock(dayIndex)}>
                                            <Plus className="w-4 h-4 mr-1" /> Add Block
                                        </Button>
                                    </div>
                                    
                                    {dayBlocks.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic">No shifts configured (Off Duty).</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {dayBlocks.map(block => (
                                                <div key={block.originalIndex} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white p-2 rounded border shadow-sm">
                                                    <div className="w-32">
                                                        <Select value={block.session_type} onValueChange={(val) => updateBlock(block.originalIndex, 'session_type', val)}>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="OPD">OPD Visit</SelectItem>
                                                                <SelectItem value="IPD">IPD Rounds</SelectItem>
                                                                <SelectItem value="OT">Surgery (OT)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Input 
                                                        type="time" 
                                                        value={block.start_time} 
                                                        onChange={(e) => updateBlock(block.originalIndex, 'start_time', e.target.value)}
                                                        className="w-32"
                                                    />
                                                    <span className="text-slate-400">to</span>
                                                    <Input 
                                                        type="time" 
                                                        value={block.end_time} 
                                                        onChange={(e) => updateBlock(block.originalIndex, 'end_time', e.target.value)}
                                                        className="w-32"
                                                    />
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto" onClick={() => removeBlock(block.originalIndex)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading || isSaving} className="bg-indigo-600 hover:bg-indigo-700">
                        {isSaving ? "Saving..." : "Save Schedule"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
