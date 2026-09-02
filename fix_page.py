import sys

with open(r'd:\Website\DIGIFORTLABS\frontend\src\app\admin\hospitals\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('{/* Hospital Groups Table */}')
end_idx = content.find('{/* Permanent Delete Confirmation Modal')

if start_idx != -1 and end_idx != -1:
    new_html = """            {/* Hospital Groups Table */}
            <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 tracking-tight">Hospital Groups / Networks</h3>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Parent organizations overseeing multiple branches.</p>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Building2 className="w-5 h-5" />
                    </div>
                </div>
                
                {hospitalGroups.length === 0 ? (
                    <div className="py-12 text-center">
                        <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-500 mt-3 font-black uppercase">No Hospital Groups Found</p>
                        <p className="text-[11px] text-slate-400 mt-1">Create a new group during the onboarding process.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="py-4 px-6">Group Profile</th>
                                    <th className="py-4 px-4">Contact Email</th>
                                    <th className="py-4 px-4">HQ Location</th>
                                    <th className="py-4 px-4">Branches</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {hospitalGroups.map(group => (
                                    <tr key={group.group_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs shadow-sm">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-sm tracking-tight">{group.group_name}</h4>
                                                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">ID: {group.group_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 font-semibold text-slate-600">{group.admin_email || 'N/A'}</td>
                                        <td className="py-4 px-4 font-semibold text-slate-600">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                {group.location || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 font-black text-indigo-600">
                                            {hospitals.filter(h => h.group_id === group.group_id).length} Branches
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button className="text-indigo-600 font-bold hover:underline text-[10px] uppercase tracking-wider">Manage</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            """
    
    final_content = content[:start_idx] + new_html + content[end_idx:]
    with open(r'd:\Website\DIGIFORTLABS\frontend\src\app\admin\hospitals\page.tsx', 'w', encoding='utf-8') as f:
        f.write(final_content)
    print('Fixed the Hospital Groups Table rendering logic successfully.')
else:
    print('Could not find markers.')
