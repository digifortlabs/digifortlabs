import sys

filepath = r'd:\Website\DIGIFORTLABS\frontend\src\app\admin\hospitals\page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Specialty</label>
                                            <input
                                                type="text"
                                                value={editingHospital.specialty || ''}
                                                onChange={(e) => setEditingHospital({...editingHospital, specialty: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none"
                                            />
                                        </div>"""

new_block = """                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Organization Type *</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Multi-Specialty Hospital', 'Single-Specialty Hospital', 'Polyclinic / Day Care Center', 'Diagnostic Center (Lab/Imaging)', 'Independent Doctor Clinic', 'Pharmacy / Medical Store'].map(type => (
                                                    <div 
                                                        key={type}
                                                        onClick={() => setEditingHospital({...editingHospital, organization_type: type, specialty: (SPECIALTY_OPTIONS[type] || defaultSpecialties)[0].value})}
                                                        className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${editingHospital.organization_type === type ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 font-semibold'} text-xs`}
                                                    >
                                                        {type}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">Primary Specialty *</label>
                                            <div className="relative">
                                                <select
                                                    value={editingHospital.specialty || ''}
                                                    onChange={(e) => setEditingHospital({...editingHospital, specialty: e.target.value})}
                                                    className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm font-semibold shadow-sm"
                                                >
                                                    {(SPECIALTY_OPTIONS[editingHospital.organization_type || 'Multi-Specialty Hospital'] || defaultSpecialties).map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("Successfully replaced the organization type block.")
else:
    print("Could not find old_block")

old_email_block = """                                            <input
                                                type="email"
                                                value={editingHospital.email}
                                                onChange={(e) => setEditingHospital({...editingHospital, email: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />"""

new_email_block = """                                            <input
                                                type="email"
                                                autoComplete="new-password"
                                                value={editingHospital.email}
                                                onChange={(e) => setEditingHospital({...editingHospital, email: e.target.value})}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                            />"""

if old_email_block in content:
    content = content.replace(old_email_block, new_email_block)
    print("Successfully replaced the email block.")
else:
    print("Could not find old_email_block")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
