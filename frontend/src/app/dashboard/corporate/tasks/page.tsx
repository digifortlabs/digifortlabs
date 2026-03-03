"use client";

import React, { useState, useEffect } from 'react';
import { CheckSquare, ChevronLeft, Plus, Circle, CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/config/api';

const COLUMNS = [
    { key: 'todo', label: 'To Do', icon: Circle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    { key: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { key: 'review', label: 'In Review', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { key: 'done', label: 'Done', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

const PRIORITY_COLORS: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
};

export default function CorporateTasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [addToColumn, setAddToColumn] = useState('todo');
    const [form, setForm] = useState({ title: '', description: '', priority: 'medium', project_id: '', assignee_id: '', due_date: '', status: 'todo' });
    const [draggingId, setDraggingId] = useState<number | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [t, p, e] = await Promise.all([
                apiFetch('corporate/tasks').catch(() => []),
                apiFetch('corporate/projects').catch(() => []),
                apiFetch('corporate/employees').catch(() => []),
            ]);
            setTasks(t || []);
            setProjects(p || []);
            setEmployees(e || []);
        } finally { setLoading(false); }
    };

    const handleAdd = async () => {
        try {
            await apiFetch('corporate/tasks', {
                method: 'POST',
                body: JSON.stringify({ ...form, status: addToColumn, project_id: form.project_id ? parseInt(form.project_id) : undefined, assignee_id: form.assignee_id ? parseInt(form.assignee_id) : undefined })
            });
            setIsAddOpen(false);
            setForm({ title: '', description: '', priority: 'medium', project_id: '', assignee_id: '', due_date: '', status: 'todo' });
            loadData();
        } catch (e: any) { alert(e.message || 'Failed'); }
    };

    const moveTask = async (taskId: number, newStatus: string) => {
        try {
            await apiFetch(`corporate/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
            setTasks(prev => prev.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t));
        } catch { }
    };

    const getProjectName = (id: number) => projects.find(p => p.project_id === id)?.project_name || '';
    const getAssigneeName = (id: number) => employees.find(e => e.employee_id === id)?.full_name || '';

    return (
        <div className="p-6 space-y-6 max-w-full mx-auto pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/corporate')} className="rounded-full bg-white shadow-sm border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><CheckSquare className="w-6 h-6 text-purple-600" /> Task Board</h1>
                        <p className="text-slate-500 text-sm">{tasks.filter(t => t.status === 'in_progress').length} tasks in progress.</p>
                    </div>
                </div>
                <Button onClick={() => { setAddToColumn('todo'); setIsAddOpen(true); }} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Task
                </Button>
            </div>

            {/* Kanban Board */}
            {loading ? <div className="p-12 text-center text-slate-500">Loading tasks...</div> : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[500px]">
                    {COLUMNS.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.key);
                        return (
                            <div key={col.key} className={cn('rounded-xl border-2', col.border, col.bg, 'p-3 space-y-3')}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => { e.preventDefault(); if (draggingId) moveTask(draggingId, col.key); setDraggingId(null); }}>

                                {/* Column Header */}
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <col.icon className={cn('w-4 h-4', col.color)} />
                                        <span className="font-semibold text-sm text-slate-700">{col.label}</span>
                                        <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full', col.bg, col.color)}>{colTasks.length}</span>
                                    </div>
                                    <button onClick={() => { setAddToColumn(col.key); setIsAddOpen(true); }}
                                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/80 text-slate-400 hover:text-slate-600 transition-colors">
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Task Cards */}
                                <div className="space-y-2">
                                    {colTasks.map(task => (
                                        <div key={task.task_id}
                                            draggable
                                            onDragStart={() => setDraggingId(task.task_id)}
                                            className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-grab hover:shadow-md transition-all space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-sm text-slate-900 leading-snug flex-1">{task.title}</p>
                                                <Badge className={cn('text-[10px] border-none flex-shrink-0', PRIORITY_COLORS[task.priority] || 'bg-slate-100')}>
                                                    {task.priority}
                                                </Badge>
                                            </div>
                                            {task.description && <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>}
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                                                {task.project_id && <span className="bg-slate-100 px-1.5 py-0.5 rounded">{getProjectName(task.project_id)}</span>}
                                                {task.assignee_id && <span>@{getAssigneeName(task.assignee_id).split(' ')[0]}</span>}
                                                {task.due_date && <span className={cn(new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500 font-medium' : '')}>
                                                    Due {new Date(task.due_date).toLocaleDateString('en-IN')}
                                                </span>}
                                            </div>

                                            {/* Move buttons */}
                                            <div className="flex gap-1 pt-1 border-t border-slate-100">
                                                {COLUMNS.filter(c => c.key !== col.key).map(c => (
                                                    <button key={c.key} onClick={() => moveTask(task.task_id, c.key)}
                                                        title={`Move to ${c.label}`}
                                                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors">
                                                        → {c.label.split(' ')[0]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {colTasks.length === 0 && (
                                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center text-slate-400 text-xs">
                                            Drop tasks here
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2"><Label>Task Title *</Label>
                            <Input placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Priority</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                                </select></div>
                            <div className="space-y-2"><Label>Due Date</Label>
                                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Project</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })}>
                                    <option value="">None</option>
                                    {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
                                </select></div>
                            <div className="space-y-2"><Label>Assignee</Label>
                                <select className="w-full border border-slate-200 rounded-md p-2 h-10 text-sm"
                                    value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
                                    <option value="">Unassigned</option>
                                    {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.full_name}</option>)}
                                </select></div>
                        </div>
                        <div className="space-y-2"><Label>Description</Label>
                            <Textarea placeholder="Task details..." rows={2} className="resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdd} disabled={!form.title} className="bg-purple-600">Create Task</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
