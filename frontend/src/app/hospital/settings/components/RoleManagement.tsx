import { useState, useEffect } from 'react';
import { apiFetch } from '@/config/api';
import { Shield, Plus, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoleManagement() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [editingRole, setEditingRole] = useState<any>(null);
    const [roleName, setRoleName] = useState('');
    
    // Modules list
    const modules = [
        { id: 'patients', name: 'Patients Management' },
        { id: 'appointments', name: 'Appointments' },
        { id: 'billing', name: 'Billing & Invoicing' },
        { id: 'hms', name: 'HMS Core (IPD/OPD)' },
        { id: 'pharmacy', name: 'Pharmacy' },
        { id: 'lab', name: 'Laboratory' },
        { id: 'inventory', name: 'Inventory' },
        { id: 'accounting', name: 'Accounting' },
        { id: 'settings', name: 'Settings' }
    ];

    const defaultPermissions = modules.reduce((acc, mod) => {
        acc[mod.id] = { read: false, edit: false, delete: false };
        return acc;
    }, {} as any);

    const [permissions, setPermissions] = useState<any>(defaultPermissions);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const data = await apiFetch('roles/');
            setRoles(data || []);
        } catch (error) {
            console.error("Failed to load roles", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRole = async () => {
        if (!roleName.trim()) {
            toast.error("Role name is required");
            return;
        }

        const payload = {
            name: roleName,
            permissions: permissions
        };

        try {
            if (editingRole) {
                await apiFetch(`roles/${editingRole.role_id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
                toast.success("Role updated successfully");
            } else {
                await apiFetch('roles/', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                toast.success("Role created successfully");
            }
            closeModal();
            fetchRoles();
        } catch (error: any) {
            toast.error(error.message || "Failed to save role");
        }
    };

    const handleDelete = async (role_id: number) => {
        if (!confirm("Are you sure you want to delete this custom role? Users assigned to this role will lose these permissions.")) return;
        
        try {
            await apiFetch(`roles/${role_id}`, { method: 'DELETE' });
            toast.success("Role deleted successfully");
            fetchRoles();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete role");
        }
    };

    const openModal = (role: any = null) => {
        if (role) {
            setEditingRole(role);
            setRoleName(role.name);
            setPermissions({ ...defaultPermissions, ...role.permissions });
        } else {
            setEditingRole(null);
            setRoleName('');
            setPermissions({ ...defaultPermissions });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };

    const togglePermission = (moduleId: string, action: string) => {
        setPermissions((prev: any) => ({
            ...prev,
            [moduleId]: {
                ...prev[moduleId],
                [action]: !prev[moduleId]?.[action]
            }
        }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Shield className="text-indigo-600 w-6 h-6" />
                        Custom User Roles
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Define custom User Types and configure granular access permissions.
                    </p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
                >
                    <Plus size={18} /> Create New Role
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {roles.map(role => (
                        <div key={role.role_id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.is_system_locked ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                                        {role.is_system_locked ? <ShieldAlert className="text-amber-500" size={24} /> : <Shield className="text-indigo-600" size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">{role.name}</h3>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${role.is_system_locked ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {role.is_system_locked ? 'System Default' : 'Custom Role'}
                                        </span>
                                    </div>
                                </div>
                                {!role.is_system_locked && (
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(role)} className="bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 p-2 rounded-lg transition-colors border border-slate-200">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(role.role_id)} className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 p-2 rounded-lg transition-colors border border-slate-200">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Allowed Modules</h4>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(role.permissions).map(([mod, perms]: any) => {
                                        if (perms.read || perms.edit || perms.delete) {
                                            const modName = modules.find(m => m.id === mod)?.name || mod;
                                            return (
                                                <span key={mod} className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">
                                                    {modName}
                                                </span>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">
                                    {editingRole ? 'Edit Role Configuration' : 'Create Custom Role'}
                                </h2>
                                <p className="text-slate-500 font-medium text-sm mt-1">Configure module-level access for this user type.</p>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-50/50">
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Role Name (User Type)</label>
                                <input 
                                    type="text" 
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-4 bg-white font-bold text-slate-900 placeholder:text-slate-400 transition-all outline-none"
                                    placeholder="e.g. Senior Nurse, Junior Accountant"
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Module Access Matrix</h3>
                                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                                <th className="py-4 px-6 font-black text-slate-600 text-xs uppercase tracking-wider">Module</th>
                                                <th className="py-4 px-4 font-black text-slate-600 text-xs uppercase tracking-wider text-center">Read / View</th>
                                                <th className="py-4 px-4 font-black text-slate-600 text-xs uppercase tracking-wider text-center">Edit / Create</th>
                                                <th className="py-4 px-4 font-black text-slate-600 text-xs uppercase tracking-wider text-center">Delete</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {modules.map(mod => (
                                                <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6 font-bold text-slate-800">{mod.name}</td>
                                                    {['read', 'edit', 'delete'].map(action => (
                                                        <td key={action} className="py-4 px-4 text-center">
                                                            <button 
                                                                onClick={() => togglePermission(mod.id, action)}
                                                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                                                                    permissions[mod.id]?.[action] 
                                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-110' 
                                                                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400'
                                                                }`}
                                                            >
                                                                {permissions[mod.id]?.[action] && <Check size={16} strokeWidth={3} />}
                                                            </button>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 border-t border-slate-100 bg-white flex justify-end gap-3">
                            <button 
                                onClick={closeModal}
                                className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveRole}
                                className="px-8 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all active:scale-95"
                            >
                                Save Role Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
