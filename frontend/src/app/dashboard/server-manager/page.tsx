"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../../config/api';
import { Folder, File, Download, ArrowLeft, RefreshCw, HardDrive, Cloud, Trash2 } from 'lucide-react';

export default function ServerFileManager() {
    const router = useRouter();
    const [source, setSource] = useState<'local' | 's3'>('local');
    const [path, setPath] = useState('');
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bucket, setBucket] = useState('digifort-production-bucket'); // Default bucket

    useEffect(() => {
        fetchFiles();
    }, [source, path]);

    const fetchFiles = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error("No token");

            let url = `${API_URL}/server-files/list?source=${source}&path=${encodeURIComponent(path)}`;
            if (source === 's3') {
                url += `&bucket=${bucket}`;
            }

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to list files");
            }

            const data = await res.json();
            // Sort: Directories first, then files
            data.sort((a: any, b: any) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
            });
            setFiles(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (newPath: string) => {
        setPath(newPath);
    };

    const handleUp = () => {
        if (!path) return;
        if (source === 'local') {
            // Simple parent dir logic for local
            const parts = path.split(/[/\\]/);
            parts.pop();
            // If empty, it means root relative to project
            setPath(parts.join('/'));
        } else {
            // S3 prefixes end with / usually
            const parts = path.replace(/\/$/, '').split('/');
            parts.pop();
            const newPath = parts.join('/');
            setPath(newPath ? newPath + '/' : '');
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="p-6 w-full mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <HardDrive className="text-indigo-600" />
                        Server File Manager
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Direct access to {source === 'local' ? 'Local Server' : 'S3 Cloud'} storage.
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded ml-2 uppercase">Developer Access</span>
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => { setSource('local'); setPath(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${source === 'local' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <HardDrive size={16} /> Local Server
                    </button>
                    <button
                        onClick={() => { setSource('s3'); setPath(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${source === 's3' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Cloud size={16} /> AWS S3
                    </button>
                </div>
            </div>

            {/* Breadcrumb & Controls */}
            <div className="bg-white p-4 rounded-t-2xl border border-slate-200 border-b-0 flex items-center gap-4">
                <button
                    onClick={handleUp}
                    disabled={!path}
                    className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-30 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>

                <div className="flex-1 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 font-mono text-sm text-slate-700 overflow-x-auto whitespace-nowrap">
                    {source === 'local' ? 'Project Root / ' : `s3://${bucket} / `}
                    {path}
                </div>

                <button onClick={fetchFiles} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-full transition-colors">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* File List */}
            <div className="bg-white border border-slate-200 rounded-b-2xl shadow-sm overflow-hidden min-h-[500px]">
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm font-bold border-b border-red-100">
                        Error: {error}
                    </div>
                )}

                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase w-12">Type</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Size</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Modified</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {files.map((file, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-3 text-slate-400">
                                    {file.type === 'directory' ? <Folder className="text-amber-400 fill-amber-400" size={20} /> : <File className="text-indigo-400" size={20} />}
                                </td>
                                <td className="px-6 py-3">
                                    {file.type === 'directory' ? (
                                        <button
                                            onClick={() => handleNavigate(file.path)}
                                            className="text-slate-800 font-bold hover:text-indigo-600 hover:underline"
                                        >
                                            {file.name}
                                        </button>
                                    ) : (
                                        <span className="text-slate-700 font-medium">{file.name}</span>
                                    )}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-xs text-slate-600">
                                    {file.type === 'file' ? formatSize(file.size_bytes) : '-'}
                                </td>
                                <td className="px-6 py-3 text-right text-xs text-slate-500">
                                    {file.last_modified ? new Date(file.last_modified).toLocaleString() : '-'}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    {file.type === 'file' && (
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded"
                                                title="Download"
                                                onClick={() => window.alert("Download not yet implemented in demo")}
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                className="p-1.5 hover:bg-red-100 text-red-600 rounded"
                                                title="Delete"
                                                onClick={() => window.alert("Delete restricted in demo")}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {files.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                    Empty directory or access denied.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                    Loading...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
