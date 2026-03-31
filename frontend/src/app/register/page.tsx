"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import {
    Building2, User, Mail, Phone, Lock,
    ArrowRight, ArrowLeft, CheckCircle2,
    Activity, ShieldCheck, Globe, Eye, EyeOff,
    Stethoscope, Scale, FlaskConical, Briefcase,
    Cpu, Archive, Hotel, IndianRupee, Loader2,
    MapPin, Hash, Calendar, FileText, ChevronRight,
    Sparkles, Star, Zap
} from 'lucide-react';

const STEPS = [
    { id: 1, label: 'Organization', icon: Building2, color: 'indigo' },
    { id: 2, label: 'Contact', icon: MapPin, color: 'emerald' },
    { id: 3, label: 'Admin', icon: User, color: 'blue' },
    { id: 4, label: 'Modules', icon: Cpu, color: 'purple' },
    { id: 5, label: 'Review', icon: CheckCircle2, color: 'green' },
];

const ORG_TYPES = ['Hospital', 'Clinic', 'Dental Clinic', 'Law Firm', 'Corporate Office', 'Pharma Manufacturing'];
const SPECIALTIES = ['General Medical', 'Dental Practice', 'ENT Specialist', 'Corporate HR/Biz', 'Legal', 'Manufacturing'];

const MODULES = [
    { id: 'core', label: 'AIO Core Warehouse', icon: Archive, color: 'slate', desc: 'Base data processor & cloud storage', fixed: true },
    { id: 'hms', label: 'HMS Pro', icon: Hotel, color: 'indigo', desc: 'IPD, Wards, OT and smart billing' },
    { id: 'dental', label: 'Dental Engine', icon: Stethoscope, color: 'emerald', desc: '3D charting & clinical records' },
    { id: 'legal', label: 'Law Discovery', icon: Scale, color: 'amber', desc: 'Case tracking and evidence vault' },
    { id: 'pharma', label: 'Pharma Ops', icon: FlaskConical, color: 'blue', desc: 'Manufacturing and batch tracing' },
    { id: 'accounting', label: 'Financial Ledger', icon: IndianRupee, color: 'purple', desc: 'GST invoicing and P&L tracking' },
];

const colorMap: Record<string, string> = {
    slate: 'border-slate-400 bg-slate-50 text-slate-700',
    indigo: 'border-indigo-500 bg-indigo-50 text-indigo-700',
    emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-500 bg-amber-50 text-amber-700',
    blue: 'border-blue-500 bg-blue-50 text-blue-700',
    purple: 'border-purple-500 bg-purple-50 text-purple-700',
    green: 'border-green-500 bg-green-50 text-greenald-700',
};

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [pincodeLoading, setPincodeLoading] = useState(false);

    // Step 1: Organization
    const [legalName, setLegalName] = useState('');
    const [orgType, setOrgType] = useState('Hospital');
    const [specialty, setSpecialty] = useState('General Medical');
    const [regNumber, setRegNumber] = useState('');
    const [estYear, setEstYear] = useState('');

    // Step 2: Contact
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [country, setCountry] = useState('India');
    const [gstNumber, setGstNumber] = useState('');

    // Step 3: Admin
    const [adminFirstName, setAdminFirstName] = useState('');
    const [adminLastName, setAdminLastName] = useState('');
    const [email, setEmail] = useState('');
    const [adminPhone, setAdminPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 4: Modules
    const [enabledModules, setEnabledModules] = useState<string[]>(['core']);

    const totalSteps = STEPS.length;

    const toTitleCase = (str: string) =>
        str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

    const handlePincodeBlur = async () => {
        if (pincode.length !== 6) return;
        setPincodeLoading(true);
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await res.json();
            if (data[0].Status === 'Success') {
                const details = data[0].PostOffice[0];
                setCity(toTitleCase(details.District));
                setState(toTitleCase(details.State));
            }
        } catch { }
        finally { setPincodeLoading(false); }
    };

    const toggleModule = (modId: string) => {
        if (modId === 'core') return;
        setEnabledModules(prev =>
            prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
        );
    };

    const validateStep = () => {
        setError('');
        if (step === 1 && !legalName.trim()) { setError('Organization name is required.'); return false; }
        if (step === 2 && !phone.trim()) { setError('Phone number is required.'); return false; }
        if (step === 3) {
            if (!adminFirstName.trim() || !adminLastName.trim()) { setError('Admin full name is required.'); return false; }
            if (!email.trim()) { setError('Email address is required.'); return false; }
            if (password.length < 8) { setError('Password must be at least 8 characters.'); return false; }
            if (password !== confirmPassword) { setError('Passwords do not match.'); return false; }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) setStep(s => Math.min(s + 1, totalSteps));
    };
    const prevStep = () => { setError(''); setStep(s => Math.max(s - 1, 1)); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    legal_name: legalName,
                    organization_type: orgType,
                    specialty,
                    registration_number: regNumber,
                    established_year: estYear ? parseInt(estYear) : null,
                    phone,
                    address,
                    city,
                    state,
                    pincode,
                    country,
                    gst_number: gstNumber,
                    admin_first_name: adminFirstName,
                    admin_last_name: adminLastName,
                    admin_phone: adminPhone,
                    email,
                    password,
                    enabled_modules: enabledModules,
                })
            });
            router.push('/login?message=Registration successful! Please log in.');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
            setLoading(false);
        }
    };

    const passwordStrength = () => {
        if (password.length === 0) return 0;
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    };
    const strength = passwordStrength();
    const strengthColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    return (
        <div className="min-h-screen flex bg-slate-50 font-sans">
            {/* Left Sidebar */}
            <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-shrink-0 bg-slate-900 relative overflow-hidden flex-col">
                {/* Background blobs */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/3" />
                    <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px]" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-10">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-12">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                            <Activity className="text-indigo-400" size={28} />
                        </div>
                        <span className="text-xl font-black text-white tracking-tight">DIGIFORT LABS</span>
                    </div>

                    {/* Headline */}
                    <div className="mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-bold mb-4">
                            <Sparkles size={12} /> Enterprise Platform
                        </div>
                        <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-4">
                            Register your<br />
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">organization</span>
                        </h1>
                        <p className="text-slate-400 text-base leading-relaxed">
                            Set up your workspace in minutes. Secure, compliant &amp; enterprise-ready.
                        </p>
                    </div>

                    {/* Step Progress */}
                    <div className="mb-auto space-y-3">
                        {STEPS.map((s, idx) => {
                            const Icon = s.icon;
                            const isDone = step > s.id;
                            const isActive = step === s.id;
                            return (
                                <div key={s.id} className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isActive ? 'bg-white/10 border border-white/10' : ''}`}>
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-emerald-500' : isActive ? 'bg-indigo-600' : 'bg-white/5 border border-white/10'}`}>
                                        {isDone
                                            ? <CheckCircle2 size={16} className="text-white" />
                                            : <Icon size={16} className={isActive ? 'text-white' : 'text-slate-500'} />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold ${isActive ? 'text-white' : isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {s.label}
                                        </p>
                                    </div>
                                    {isDone && <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />}
                                    {isActive && <ChevronRight size={14} className="text-indigo-400 flex-shrink-0" />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Feature badges */}
                    <div className="grid grid-cols-3 gap-2 mt-8">
                        {[
                            { icon: ShieldCheck, label: 'Bank-grade Security' },
                            { icon: Zap, label: 'Instant Setup' },
                            { icon: Globe, label: '24/7 Cloud Access' },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                <Icon size={18} className="text-indigo-400" />
                                <p className="text-[10px] font-bold text-slate-400 leading-tight">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right — Form */}
            <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center gap-3 p-6 border-b border-slate-200 bg-white">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <Activity className="text-indigo-600" size={22} />
                    </div>
                    <span className="text-base font-black text-slate-800">DIGIFORT LABS</span>
                </div>

                <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
                    <div className="w-full max-w-xl">
                        {/* Mobile step pills */}
                        <div className="flex items-center gap-2 mb-8 lg:hidden">
                            {STEPS.map(s => (
                                <div
                                    key={s.id}
                                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${step >= s.id ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                />
                            ))}
                        </div>

                        {/* Step Header */}
                        <div className="mb-8">
                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">
                                Step {step} of {totalSteps}
                            </p>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {step === 1 && 'Organization Details'}
                                {step === 2 && 'Contact & Location'}
                                {step === 3 && 'Administrator Account'}
                                {step === 4 && 'Select Modules'}
                                {step === 5 && 'Review & Submit'}
                            </h2>
                            <p className="text-slate-500 mt-1.5 font-medium">
                                {step === 1 && 'Tell us about your organization — this will be your workspace identity.'}
                                {step === 2 && 'How can we reach you? This also helps us set up your regional settings.'}
                                {step === 3 && 'The primary administrator will have full control over your workspace.'}
                                {step === 4 && 'Choose the modules that fit your workflow. You can always change these later.'}
                                {step === 5 && 'Review everything before we create your workspace.'}
                            </p>
                        </div>

                        <form onSubmit={step === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-5">
                            {/* ── STEP 1: Organization ── */}
                            {step === 1 && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Legal / Trade Name *</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                            <input
                                                required value={legalName} onChange={e => setLegalName(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                                                placeholder="e.g. Apollo Hospitals Pvt. Ltd."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Organization Type</label>
                                            <select value={orgType} onChange={e => setOrgType(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all appearance-none">
                                                {ORG_TYPES.map(t => <option key={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Specialty / Industry</label>
                                            <select value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all appearance-none">
                                                {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Hash size={11} />Registration No.</label>
                                            <input value={regNumber} onChange={e => setRegNumber(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" placeholder="Govt. License ID" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar size={11} />Est. Year</label>
                                            <input type="number" value={estYear} onChange={e => setEstYear(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" placeholder="e.g. 2010" min="1900" max="2025" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 2: Contact ── */}
                            {step === 2 && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Phone Number *</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                            <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" placeholder="+91 98765 43210" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Address</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                            <input value={address} onChange={e => setAddress(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" placeholder="Street, Building, Area" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Pincode</label>
                                            <input value={pincode} onChange={e => setPincode(e.target.value)} onBlur={handlePincodeBlur} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" placeholder="110001" maxLength={6} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">City</label>
                                            <input value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" placeholder={pincodeLoading ? 'Loading…' : 'Auto-filled'} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">State</label>
                                            <input value={state} onChange={e => setState(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" placeholder="Auto-filled" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><FileText size={11} />GSTIN Number (optional)</label>
                                        <input value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono" placeholder="22AAAAA0000A1Z5" maxLength={15} />
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 3: Admin ── */}
                            {step === 3 && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">First Name *</label>
                                            <div className="relative group">
                                                <User className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={17} />
                                                <input required value={adminFirstName} onChange={e => setAdminFirstName(e.target.value)} className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" placeholder="Jane" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Last Name *</label>
                                            <input required value={adminLastName} onChange={e => setAdminLastName(e.target.value)} className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" placeholder="Doe" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Work Email *</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" placeholder="jane@company.com" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Admin Phone</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                            <input type="tel" value={adminPhone} onChange={e => setAdminPhone(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" placeholder="+91 98765 43210" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Password *</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                            <input required type={showPassword ? 'text' : 'password'} minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" placeholder="Min. 8 characters" />
                                            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {password.length > 0 && (
                                            <div className="space-y-1.5 pt-1">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColors[strength] : 'bg-slate-100'}`} />
                                                    ))}
                                                </div>
                                                <p className={`text-xs font-bold ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-orange-500' : strength === 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                                                    {strengthLabels[strength]} password
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Confirm Password *</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                                            <input required type={showConfirmPassword ? 'text' : 'password'} minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`w-full pl-11 pr-12 py-3.5 bg-white border rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 transition-all ${confirmPassword && confirmPassword !== password ? 'border-red-400 focus:ring-red-400/20 focus:border-red-400' : 'border-slate-200 focus:ring-blue-500/30 focus:border-blue-500'}`} placeholder="Re-enter password" />
                                            <button type="button" onClick={() => setShowConfirmPassword(s => !s)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors">
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {confirmPassword && confirmPassword !== password && (
                                            <p className="text-xs text-red-500 font-bold">Passwords do not match</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 4: Modules ── */}
                            {step === 4 && (
                                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {MODULES.map(m => {
                                            const Icon = m.icon;
                                            const isActive = enabledModules.includes(m.id);
                                            return (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => toggleModule(m.id)}
                                                    disabled={m.fixed}
                                                    className={`p-4 text-left rounded-xl border-2 transition-all duration-200 ${isActive ? `border-${m.color}-400 bg-${m.color}-50` : 'border-slate-200 bg-white hover:border-slate-300'} ${m.fixed ? 'opacity-80 cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className={`p-2 rounded-lg ${isActive ? `bg-${m.color}-100` : 'bg-slate-100'}`}>
                                                            <Icon size={16} className={isActive ? `text-${m.color}-600` : 'text-slate-500'} />
                                                        </div>
                                                        {isActive
                                                            ? <CheckCircle2 size={16} className={`text-${m.color}-500 mt-0.5`} />
                                                            : <div className="w-4 h-4 rounded-full border-2 border-slate-300 mt-0.5" />
                                                        }
                                                    </div>
                                                    <p className={`text-sm font-bold ${isActive ? `text-${m.color}-800` : 'text-slate-700'}`}>{m.label}</p>
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5 leading-tight">{m.desc}</p>
                                                    {m.fixed && <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-wide">Always Active</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium text-center">You can enable or disable modules anytime from the Admin panel.</p>
                                </div>
                            )}

                            {/* ── STEP 5: Review ── */}
                            {step === 5 && (
                                <div className="space-y-4 animate-in zoom-in-95 fade-in duration-300">
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">Organization</h3>
                                        </div>
                                        <div className="p-6 space-y-2">
                                            <p className="text-xl font-black text-slate-900">{legalName}</p>
                                            <p className="text-sm text-slate-500 font-medium">{orgType} · {specialty}</p>
                                            {(city || state) && <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5"><MapPin size={13} />{[city, state, country].filter(Boolean).join(', ')}</p>}
                                            {regNumber && <p className="text-xs text-slate-400 font-medium">Reg: {regNumber}</p>}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">Administrator</h3>
                                        </div>
                                        <div className="p-6 space-y-1">
                                            <p className="text-base font-bold text-slate-900">{adminFirstName} {adminLastName}</p>
                                            <p className="text-sm text-slate-500 font-medium">{email}</p>
                                            {adminPhone && <p className="text-sm text-slate-500 font-medium">{adminPhone}</p>}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                                            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">Active Modules ({enabledModules.length})</h3>
                                        </div>
                                        <div className="p-6 flex flex-wrap gap-2">
                                            {enabledModules.map(m => {
                                                const mod = MODULES.find(x => x.id === m);
                                                return mod ? (
                                                    <span key={m} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold">
                                                        <mod.icon size={12} /> {mod.label}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                                        <ShieldCheck size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                                            By completing registration you agree to our <span className="font-bold underline cursor-pointer">Terms of Service</span> and <span className="font-bold underline cursor-pointer">Privacy Policy</span>. Your data is encrypted and stored securely.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold flex items-center gap-2 animate-in zoom-in-95">
                                    <ShieldCheck size={16} className="flex-shrink-0" /> {error}
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex gap-3 pt-2">
                                {step > 1 && (
                                    <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]">
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <><Loader2 size={16} className="animate-spin" /> Creating workspace…</>
                                    ) : step === totalSteps ? (
                                        <><CheckCircle2 size={16} /> Complete Registration</>
                                    ) : (
                                        <>Continue <ArrowRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Sign in link */}
                        <div className="mt-8 text-center">
                            <p className="text-sm font-medium text-slate-500">
                                Already have an account?{' '}
                                <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
