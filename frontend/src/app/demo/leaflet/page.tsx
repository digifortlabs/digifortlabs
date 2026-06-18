"use client";

import { useState } from "react";
import NextLink from "next/link";
import { 
  Printer, 
  Palette, 
  Layout, 
  Home, 
  ShieldCheck, 
  Activity,
  RotateCcw,
  Sparkles,
  Stethoscope,
  Bed,
  PhoneCall,
  Mail,
  Globe,
  Lock,
  Database,
  Search,
  User,
  Users
} from "lucide-react";

const Link = NextLink as any;

// Preset Color Themes
const THEMES = [
  {
    id: "dark-indigo",
    name: "Indigo Glow (Dark)",
    bg: "bg-slate-950 text-white",
    cardBg: "bg-slate-900/60 border-slate-800",
    accentText: "text-indigo-400",
    accentBg: "bg-indigo-500/10",
    accentBorder: "border-indigo-500/20",
    badgeBg: "bg-indigo-500/20 text-indigo-300",
    gradientFrom: "from-indigo-600",
    gradientTo: "to-blue-600",
    iconColor: "text-indigo-400",
    glow: "shadow-indigo-900/30"
  },
  {
    id: "dark-emerald",
    name: "Emerald Vault (Dark)",
    bg: "bg-slate-950 text-white",
    cardBg: "bg-slate-900/60 border-slate-800",
    accentText: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/20",
    badgeBg: "bg-emerald-500/20 text-emerald-300",
    gradientFrom: "from-emerald-600",
    gradientTo: "to-teal-600",
    iconColor: "text-emerald-400",
    glow: "shadow-emerald-900/30"
  },
  {
    id: "light-royal",
    name: "Royal Blue (Light)",
    bg: "bg-slate-50 text-slate-900",
    cardBg: "bg-white border-slate-200",
    accentText: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-100",
    badgeBg: "bg-blue-100 text-blue-800",
    gradientFrom: "from-blue-600",
    gradientTo: "to-indigo-600",
    iconColor: "text-blue-600",
    glow: "shadow-blue-100"
  },
  {
    id: "light-clinical",
    name: "Clinical Teal (Light)",
    bg: "bg-slate-50 text-slate-900",
    cardBg: "bg-white border-slate-200",
    accentText: "text-teal-600",
    accentBg: "bg-teal-50",
    accentBorder: "border-teal-100",
    badgeBg: "bg-teal-100 text-teal-800",
    gradientFrom: "from-teal-600",
    gradientTo: "to-cyan-600",
    iconColor: "text-teal-600",
    glow: "shadow-teal-100"
  }
];

export default function LeafletVisualizer() {
  // Customizable Leaflet State matching the HMS Spec
  const [headline, setHeadline] = useState("Run a 100% Paperless, Feature-Complete Hospital Ecosystem");
  const [intro, setIntro] = useState("Eliminate clipboards, manual registries, and loose papers. Stop letting physical files, misplaced prescriptions, and dusty paper registries slow down patient care.");
  
  const [feature1Title, setFeature1Title] = useState("OPD & Doctor Consultations");
  const [feature1Desc, setFeature1Desc] = useState("Smart clinic queues, digital prescriptions, paperless case sheets, and rapid department routing.");
  
  const [feature2Title, setFeature2Title] = useState("IPD Bed Map");
  const [feature2Desc, setFeature2Desc] = useState("Real-time ward visualization with color-coded bed occupancy tracking (Green=Available, Red=Occupied, Yellow=Maintenance).");
  
  const [feature3Title, setFeature3Title] = useState("Operation Theater");
  const [feature3Desc, setFeature3Desc] = useState("Frictionless surgery scheduling, pre-anesthetic clearance (PAC) checklists, and live OT room status tracking.");
  
  const [feature4Title, setFeature4Title] = useState("WhatsApp Alerts");
  const [feature4Desc, setFeature4Desc] = useState("Auto-send digital prescriptions, instant billing receipts, and smart OPD/IPD reminders directly to patient phones.");
  
  const [feature5Title, setFeature5Title] = useState("Dental & Specialty Portals");
  const [feature5Desc, setFeature5Desc] = useState("Specialized interactive Odontograms, diagnostic condition badges (Caries, Fractures), and custom clinical charts.");
  
  const [phone1, setPhone1] = useState("9725790563");
  const [phone2, setPhone2] = useState("9054270551");
  const [email, setEmail] = useState("admin@digifortlabs.com");
  const [web, setWeb] = useState("digifortlabs.com");
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  // Reset defaults to the actual spec
  const resetToDefault = () => {
    setHeadline("Run a 100% Paperless, Feature-Complete Hospital Ecosystem");
    setIntro("Eliminate clipboards, manual registries, and loose papers. Stop letting physical files, misplaced prescriptions, and dusty paper registries slow down patient care.");
    setFeature1Title("OPD & Doctor Consultations");
    setFeature1Desc("Smart clinic queues, digital prescriptions, paperless case sheets, and rapid department routing.");
    setFeature2Title("IPD Bed Map");
    setFeature2Desc("Real-time ward visualization with color-coded bed occupancy tracking (Green=Available, Red=Occupied, Yellow=Maintenance).");
    setFeature3Title("Operation Theater");
    setFeature3Desc("Frictionless surgery scheduling, pre-anesthetic clearance (PAC) checklists, and live OT room status tracking.");
    setFeature4Title("WhatsApp Alerts");
    setFeature4Desc("Auto-send digital prescriptions, instant billing receipts, and smart OPD/IPD reminders directly to patient phones.");
    setFeature5Title("Dental & Specialty Portals");
    setFeature5Desc("Specialized interactive Odontograms, diagnostic condition badges (Caries, Fractures), and custom clinical charts.");
    setPhone1("9725790563");
    setPhone2("9054270551");
    setEmail("admin@digifortlabs.com");
    setWeb("digifortlabs.com");
    setSelectedTheme(THEMES[0]);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans print:bg-white print:min-h-0 print:p-0">
      
      {/* Stylesheet specifically for A4 printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 10mm 10mm 15mm 10mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            background: ${selectedTheme.id.startsWith("dark") ? "#020617" : "#f8fafc"} !important;
            color: ${selectedTheme.id.startsWith("dark") ? "#ffffff" : "#0f172a"} !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
        }
        @page {
          size: A4 portrait;
          margin: 0mm;
        }
      `}} />

      {/* Screen Mode Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center no-print gap-4 shadow-sm relative z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white font-bold hover:scale-105 transition">
            <Home size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              Digifort Leaflet Creator <Sparkles size={16} className="text-amber-500" />
            </h1>
            <p className="text-xs text-slate-500 font-medium">Design and print an A4-sized single page flyer directly</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={resetToDefault} 
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center gap-2"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button 
            onClick={handlePrint} 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-indigo-100 flex items-center gap-2"
          >
            <Printer size={16} /> Print Leaflet / PDF
          </button>
        </div>
      </header>

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col lg:flex-row no-print print:p-0">
        
        {/* Settings Sidebar */}
        <aside className="w-full lg:w-[420px] bg-white border-r border-slate-200 p-6 space-y-6 overflow-y-auto no-print max-h-[calc(100vh-73px)] shadow-inner">
          
          {/* Section 1: Themes */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Palette size={14} /> Design Styles & Themes
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-3 rounded-xl border-2 text-left transition relative flex flex-col justify-between h-18 ${
                    selectedTheme.id === theme.id 
                      ? "border-indigo-600 bg-indigo-50/20" 
                      : "border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200"
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800">{theme.name}</span>
                  <div className="flex gap-1.5 mt-2">
                    <span className={`w-3.5 h-3.5 rounded-full border ${theme.id.startsWith("dark") ? "bg-slate-950" : "bg-white"}`}></span>
                    <span className={`w-3.5 h-3.5 rounded-full ${theme.id.includes("indigo") ? "bg-indigo-500" : theme.id.includes("emerald") ? "bg-emerald-500" : theme.id.includes("royal") ? "bg-blue-600" : "bg-teal-500"}`}></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Copy Editor */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Layout size={14} /> Headline & Intro
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Primary Headline</label>
              <textarea 
                value={headline} 
                onChange={(e) => setHeadline(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-semibold"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Introduction Copy</label>
              <textarea 
                value={intro} 
                onChange={(e) => setIntro(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-600 font-medium"
                rows={3}
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Feature Editor */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              ⚡ Hospital Ecosystem Modules
            </h2>

            {/* Feature 1 */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase">Module 1 (OPD)</span>
              <input 
                type="text" 
                value={feature1Title} 
                onChange={(e) => setFeature1Title(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold" 
              />
              <textarea 
                value={feature1Desc} 
                onChange={(e) => setFeature1Desc(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-600" 
                rows={2}
              />
            </div>

            {/* Feature 2 */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase">Module 2 (IPD)</span>
              <input 
                type="text" 
                value={feature2Title} 
                onChange={(e) => setFeature2Title(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold" 
              />
              <textarea 
                value={feature2Desc} 
                onChange={(e) => setFeature2Desc(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-600" 
                rows={2}
              />
            </div>

            {/* Feature 3 */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase">Module 3 (OT)</span>
              <input 
                type="text" 
                value={feature3Title} 
                onChange={(e) => setFeature3Title(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold" 
              />
              <textarea 
                value={feature3Desc} 
                onChange={(e) => setFeature3Desc(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-600" 
                rows={2}
              />
            </div>

            {/* Feature 4 */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase">Module 4 (WhatsApp)</span>
              <input 
                type="text" 
                value={feature4Title} 
                onChange={(e) => setFeature4Title(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold" 
              />
              <textarea 
                value={feature4Desc} 
                onChange={(e) => setFeature4Desc(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-600" 
                rows={2}
              />
            </div>

            {/* Feature 5 */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase">Module 5 (Specialty)</span>
              <input 
                type="text" 
                value={feature5Title} 
                onChange={(e) => setFeature5Title(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold" 
              />
              <textarea 
                value={feature5Desc} 
                onChange={(e) => setFeature5Desc(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-600" 
                rows={2}
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 4: Contact & Brand */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              📞 Verified Support Channels
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Keval Kuvekar Phone</label>
              <input 
                type="text"
                value={phone1} 
                onChange={(e) => setPhone1(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Rahul Chotai Phone</label>
              <input 
                type="text"
                value={phone2} 
                onChange={(e) => setPhone2(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Email Address</label>
              <input 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Website Domain</label>
              <input 
                type="text"
                value={web} 
                onChange={(e) => setWeb(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
              />
            </div>
          </div>

        </aside>

        {/* Live A4 Canvas Container */}
        <main className="flex-1 flex items-center justify-center p-8 overflow-auto print:p-0">
          
          {/* Canvas A4 Box (Trim Size 210x297 scaled to w-[680px] h-[962px] in screen mode) */}
          <div 
            className={`print-area w-[680px] h-[962px] rounded-2xl shadow-2xl flex flex-col justify-between p-8 transition-all duration-300 relative border select-none overflow-hidden shrink-0 ${
              selectedTheme.bg
            } ${selectedTheme.glow}`}
            style={{
              fontFamily: "var(--font-sans, system-ui)"
            }}
          >
            
            {/* Design Grids (Only for dark themes) */}
            {selectedTheme.id.startsWith("dark") && (
              <div className="absolute inset-0 bg-grid-white opacity-[0.03] pointer-events-none" />
            )}

            {/* Curved Divider accent background */}
            <div className={`absolute top-[-80px] right-[-100px] w-[380px] h-[450px] rounded-full border-l pointer-events-none z-0 ${
              selectedTheme.id.startsWith("dark") 
                ? "bg-gradient-to-b from-cyan-500/5 via-indigo-500/5 to-transparent border-slate-800" 
                : "bg-gradient-to-b from-blue-500/5 via-teal-500/5 to-transparent border-slate-200"
            }`} />

            <div className="layout-grid flex flex-col h-full justify-between z-10 relative">
              
              {/* 1. Top Section (Grid Columns) */}
              <div className="grid grid-cols-12 gap-4 items-start">
                
                {/* Left side text items */}
                <div className="col-span-7 flex flex-col gap-3.5">
                  
                  {/* Brand Header */}
                  <div className="flex items-center gap-2">
                    <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="#0b1329" stroke="url(#logoGrad)" strokeWidth="6"/>
                      <path d="M35,30 H55 C68,30 75,37 75,50 C75,63 68,70 55,70 H35 Z" stroke="url(#logoGrad)" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round"/>
                      <path d="M35,45 H50 C55,45 58,48 58,53 C58,58 55,61 50,61 H35 Z" fill="url(#logoGrad)"/>
                      <defs>
                        <linearGradient id="logoGrad" x1="10" y1="5" x2="90" y2="95" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#06b6d4"/>
                          <stop offset="1" stopColor="#6366f1"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <div>
                      <h1 className={`text-[13px] tracking-widest font-black leading-none uppercase ${
                        selectedTheme.id.startsWith("dark") ? "text-white" : "text-slate-900"
                      }`}>DIGIFORT</h1>
                      <p className="text-[8px] uppercase tracking-[0.25em] text-cyan-500 font-extrabold leading-none mt-0.5">LABS</p>
                    </div>
                  </div>

                  {/* Headline */}
                  <h2 className="text-xl font-black tracking-tight leading-[1.2]">
                    {headline.split("Feature-Complete").map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${selectedTheme.gradientFrom} ${selectedTheme.gradientTo}`}>
                            Feature-Complete
                          </span>
                        )}
                      </span>
                    ))}
                  </h2>

                  {/* Intro */}
                  <p className={`text-[10px] leading-relaxed ${
                    selectedTheme.id.startsWith("dark") ? "text-slate-400" : "text-slate-600"
                  }`}>
                    {intro}
                  </p>

                  {/* Modules bullets list */}
                  <div className="flex flex-col gap-2.5 mt-1">
                    {/* Bullet 1 */}
                    <div className="flex gap-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 mt-0.5 ${selectedTheme.cardBg} ${selectedTheme.glow}`}>
                        <Stethoscope size={11} className={selectedTheme.accentText} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-extrabold leading-tight">{feature1Title}</h4>
                        <p className={`text-[9px] leading-snug mt-0.5 ${selectedTheme.id.startsWith("dark") ? "text-slate-400" : "text-slate-500"}`}>{feature1Desc}</p>
                      </div>
                    </div>
                    {/* Bullet 2 */}
                    <div className="flex gap-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 mt-0.5 ${selectedTheme.cardBg} ${selectedTheme.glow}`}>
                        <Bed size={11} className={selectedTheme.accentText} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-extrabold leading-tight">{feature2Title}</h4>
                        <p className={`text-[9px] leading-snug mt-0.5 ${selectedTheme.id.startsWith("dark") ? "text-slate-400" : "text-slate-500"}`}>{feature2Desc}</p>
                      </div>
                    </div>
                    {/* Bullet 3 */}
                    <div className="flex gap-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 mt-0.5 ${selectedTheme.cardBg} ${selectedTheme.glow}`}>
                        <Activity size={11} className={selectedTheme.accentText} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-extrabold leading-tight">{feature3Title}</h4>
                        <p className={`text-[9px] leading-snug mt-0.5 ${selectedTheme.id.startsWith("dark") ? "text-slate-400" : "text-slate-500"}`}>{feature3Desc}</p>
                      </div>
                    </div>
                    {/* Bullet 4 */}
                    <div className="flex gap-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 mt-0.5 ${selectedTheme.cardBg} ${selectedTheme.glow}`}>
                        <svg className={`w-2.5 h-2.5 ${selectedTheme.accentText}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-extrabold leading-tight">{feature4Title}</h4>
                        <p className={`text-[9px] leading-snug mt-0.5 ${selectedTheme.id.startsWith("dark") ? "text-slate-400" : "text-slate-500"}`}>{feature4Desc}</p>
                      </div>
                    </div>
                    {/* Bullet 5 */}
                    <div className="flex gap-2">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 mt-0.5 ${selectedTheme.cardBg} ${selectedTheme.glow}`}>
                        <svg className={`w-2.5 h-2.5 ${selectedTheme.accentText}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9 7L4 5L6 14C6 18 9 21 12 21C15 21 18 18 18 14L20 5L15 7L12 2Z"/></svg>
                      </div>
                      <div>
                        <h4 className="text-[11px] font-extrabold leading-tight">{feature5Title}</h4>
                        <p className={`text-[9px] leading-snug mt-0.5 ${selectedTheme.id.startsWith("dark") ? "text-slate-400" : "text-slate-500"}`}>{feature5Desc}</p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right side mockups (Tablet Bed Map + Checkbox card) */}
                <div className="col-span-5 flex flex-col gap-4 items-center">
                  
                  {/* Bed Map Mockup */}
                  <div className={`p-1 border rounded-lg w-full ${selectedTheme.id.startsWith("dark") ? "bg-slate-900 border-slate-800" : "bg-slate-200 border-slate-300"}`}>
                    <div className={`p-1.5 rounded-md h-[155px] flex flex-col ${selectedTheme.id.startsWith("dark") ? "bg-slate-950" : "bg-white"}`}>
                      <div className="flex justify-between items-center pb-1 mb-1.5 border-b border-slate-800/40 text-[7px] uppercase tracking-wider font-extrabold text-slate-400">
                        <span>Ward bed status</span>
                        <span className="text-cyan-500">9 active beds</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 flex-1">
                        <div className={`rounded p-1 text-center flex flex-col justify-center gap-0.5 ${selectedTheme.id.startsWith("dark") ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-800"}`}>
                          <span className="text-[7px] font-bold">Bed 101</span>
                          <label className="text-[5px] uppercase font-black">Free</label>
                        </div>
                        <div className={`rounded p-1 text-center flex flex-col justify-center gap-0.5 ${selectedTheme.id.startsWith("dark") ? "bg-red-500/10 text-red-400" : "bg-red-100 text-red-800"}`}>
                          <span className="text-[7px] font-bold">Bed 102</span>
                          <label className="text-[5px] uppercase font-black">Full</label>
                        </div>
                        <div className={`rounded p-1 text-center flex flex-col justify-center gap-0.5 ${selectedTheme.id.startsWith("dark") ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-800"}`}>
                          <span className="text-[7px] font-bold">Bed 103</span>
                          <label className="text-[5px] uppercase font-black">Free</label>
                        </div>
                        <div className={`rounded p-1 text-center flex flex-col justify-center gap-0.5 ${selectedTheme.id.startsWith("dark") ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-800"}`}>
                          <span className="text-[7px] font-bold">Bed 104</span>
                          <label className="text-[5px] uppercase font-black">Free</label>
                        </div>
                        <div className={`rounded p-1 text-center flex flex-col justify-center gap-0.5 ${selectedTheme.id.startsWith("dark") ? "bg-amber-500/10 text-amber-400" : "bg-amber-100 text-amber-800"}`}>
                          <span className="text-[7px] font-bold">Bed 105</span>
                          <label className="text-[5px] uppercase font-black">Maint.</label>
                        </div>
                        <div className={`rounded p-1 text-center flex flex-col justify-center gap-0.5 ${selectedTheme.id.startsWith("dark") ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-800"}`}>
                          <span className="text-[7px] font-bold">Bed 106</span>
                          <label className="text-[5px] uppercase font-black">Free</label>
                        </div>
                        <div className={`rounded p-1 text-center flex flex-col justify-center gap-0.5 ${selectedTheme.id.startsWith("dark") ? "bg-red-500/10 text-red-400" : "bg-red-100 text-red-800"}`}>
                          <span className="text-[7px] font-bold">Bed 107</span>
                          <label className="text-[5px] uppercase font-black">Full</label>
                        </div>
                        <div className={`rounded p-1 text-center flex flex-col justify-center gap-0.5 ${selectedTheme.id.startsWith("dark") ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-800"}`}>
                          <span className="text-[7px] font-bold">Bed 108</span>
                          <label className="text-[5px] uppercase font-black">Free</label>
                        </div>
                        <div className={`rounded p-1 text-center flex flex-col justify-center gap-0.5 ${selectedTheme.id.startsWith("dark") ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-800"}`}>
                          <span className="text-[7px] font-bold">Bed 109</span>
                          <label className="text-[5px] uppercase font-black">Free</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Billing Card */}
                  <div className={`p-2.5 border rounded-lg w-full flex flex-col gap-1 shadow-md ${selectedTheme.id.startsWith("dark") ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                    <h4 className="text-[8px] font-black uppercase border-b border-slate-800/40 pb-1 mb-0.5 tracking-wider">Integrated billing & payment</h4>
                    <div className="flex items-center gap-1.5 text-[7px] font-semibold text-slate-400">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></div>
                      <span>Patient Record Checked</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[7px] font-semibold text-slate-400">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg></div>
                      <span>Outstanding Bill Processed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[7px] font-semibold text-slate-400">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg></div>
                      <span>Admission Duration Calculated</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[7px] font-semibold text-slate-400">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg></div>
                      <span>Billing Action Verified</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* 2. Middle Regulatory Badge */}
              <div className="flex justify-center my-2">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedTheme.badgeBg} flex items-center gap-1.5 border ${selectedTheme.accentBorder} shadow-lg shadow-indigo-500/[0.02]`}>
                  <ShieldCheck size={12} className={selectedTheme.iconColor} /> NMC COMPLIANT & NABH READY
                </div>
              </div>

              {/* 3. Bottom Section (Overlapping cards & Desktop screen) */}
              <div className="grid grid-cols-12 gap-4 items-end mb-9">
                
                {/* Bottom Left Panel: Consultation Cards + QR Code */}
                <div className="col-span-5 flex flex-col gap-3">
                  
                  {/* Consultation Cards */}
                  <div className={`p-2 border rounded-lg flex flex-col gap-1.5 ${selectedTheme.cardBg}`}>
                    <div className="flex gap-1">
                      {/* Doctor Card */}
                      <div className={`flex-1 rounded p-1 border flex flex-col items-center gap-0.5 ${
                        selectedTheme.id.startsWith("dark") ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="w-4 h-4 rounded-full bg-indigo-500/10 flex items-center justify-center"><User size={9} className="text-indigo-400" /></div>
                        <span className="text-[5px] uppercase tracking-wider text-slate-500 font-extrabold leading-none">Doctor</span>
                        <span className="text-[6px] font-black text-slate-400 leading-none">Consult</span>
                      </div>
                      {/* Dept Card */}
                      <div className={`flex-1 rounded p-1 border flex flex-col items-center gap-0.5 translate-y-[2px] ${
                        selectedTheme.id.startsWith("dark") ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="w-4 h-4 rounded-full bg-cyan-500/10 flex items-center justify-center"><Users size={9} className="text-cyan-400" /></div>
                        <span className="text-[5px] uppercase tracking-wider text-slate-500 font-extrabold leading-none">Dept</span>
                        <span className="text-[6px] font-black text-slate-400 leading-none">Consult</span>
                      </div>
                      {/* Prof Card */}
                      <div className={`flex-1 rounded p-1 border flex flex-col items-center gap-0.5 translate-y-[4px] ${
                        selectedTheme.id.startsWith("dark") ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center"><Lock size={9} className="text-emerald-400" /></div>
                        <span className="text-[5px] uppercase tracking-wider text-slate-500 font-extrabold leading-none">Specialist</span>
                        <span className="text-[6px] font-black text-slate-400 leading-none">Consult</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code section */}
                  <div className="flex items-center gap-3 pl-1">
                    <div className="w-12 h-12 bg-white p-1 rounded-md shadow-md border flex-shrink-0">
                      <svg viewBox="0 0 100 100" shapeRendering="crispEdges" className="w-full h-full">
                        <rect width="100" height="100" fill="white"/>
                        <rect x="0" y="0" width="30" height="30" fill="black"/>
                        <rect x="3" y="3" width="24" height="24" fill="white"/>
                        <rect x="8" y="8" width="14" height="14" fill="black"/>
                        <rect x="70" y="0" width="30" height="30" fill="black"/>
                        <rect x="73" y="3" width="24" height="24" fill="white"/>
                        <rect x="78" y="8" width="14" height="14" fill="black"/>
                        <rect x="0" y="70" width="30" height="30" fill="black"/>
                        <rect x="3" y="73" width="24" height="24" fill="white"/>
                        <rect x="8" y="78" width="14" height="14" fill="black"/>
                        <rect x="75" y="75" width="10" height="10" fill="black"/>
                        <rect x="77" y="77" width="6" height="6" fill="white"/>
                        <rect x="79" y="79" width="2" height="2" fill="black"/>
                        <rect x="35" y="5" width="5" height="5" fill="black"/>
                        <rect x="45" y="0" width="5" height="10" fill="black"/>
                        <rect x="55" y="5" width="10" height="5" fill="black"/>
                        <rect x="5" y="35" width="5" height="5" fill="black"/>
                        <rect x="0" y="45" width="10" height="5" fill="black"/>
                        <rect x="5" y="55" width="5" height="10" fill="black"/>
                        <rect x="35" y="35" width="10" height="10" fill="black"/>
                        <rect x="50" y="30" width="5" height="15" fill="black"/>
                        <rect x="60" y="35" width="15" height="5" fill="black"/>
                        <rect x="30" y="50" width="15" height="5" fill="black"/>
                        <rect x="35" y="60" width="5" height="15" fill="black"/>
                        <rect x="45" y="70" width="15" height="5" fill="black"/>
                        <rect x="55" y="60" width="5" height="20" fill="black"/>
                        <rect x="65" y="50" width="10" height="15" fill="black"/>
                        <rect x="60" y="80" width="10" height="5" fill="black"/>
                        <rect x="80" y="45" width="15" height="5" fill="black"/>
                        <rect x="90" y="55" width="5" height="15" fill="black"/>
                        <rect x="85" y="85" width="10" height="5" fill="black"/>
                        <rect x="90" y="80" width="5" height="5" fill="black"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-wider">Scan to demo</span>
                      <p className={`text-[8px] font-extrabold ${selectedTheme.id.startsWith("dark") ? "text-slate-500" : "text-slate-400"}`}>Launch Sandbox demo</p>
                    </div>
                  </div>

                </div>

                {/* Bottom Right Panel: Desktop Screen Mockup */}
                <div className="col-span-7 flex flex-col items-center">
                  
                  {/* Hardware screen border */}
                  <div className="border-[2px] border-slate-600 bg-slate-950 p-[3px] rounded-t-lg w-full h-[180px] flex flex-col shadow-2xl">
                    
                    {/* Dashboard interior */}
                    <div className={`p-1.5 rounded flex-1 flex flex-col justify-between overflow-hidden ${
                      selectedTheme.id.startsWith("dark") ? "bg-slate-900" : "bg-slate-50"
                    }`}>
                      
                      {/* Dashboard Top bar */}
                      <div className="flex justify-between items-center border-b border-slate-800/40 pb-0.5 mb-1.5">
                        <div className="flex gap-[2px]">
                          <div className="w-1 h-1 rounded-full bg-red-500"></div>
                          <div className="w-1 h-1 rounded-full bg-yellow-500"></div>
                          <div className="w-1 h-1 rounded-full bg-green-500"></div>
                        </div>
                        <div className="w-14 h-1.5 bg-slate-800/50 border border-slate-700/40 rounded"></div>
                      </div>

                      {/* Stats cards row */}
                      <div className="grid grid-cols-3 gap-1 mb-1.5">
                        <div className={`p-1 rounded border flex flex-col justify-between ${
                          selectedTheme.id.startsWith("dark") ? "bg-slate-950/50 border-slate-800" : "bg-white border-slate-200"
                        }`}>
                          <span className="text-[5px] text-slate-500 font-extrabold uppercase">OPD COUNT</span>
                          <span className="text-[7px] font-black text-cyan-400 mt-0.5">43.6895</span>
                          <div className="h-2.5 flex items-end gap-[0.5px] mt-0.5">
                            <div className="flex-1 bg-cyan-500/60 rounded-[0.5px] h-[30%]"></div>
                            <div className="flex-1 bg-cyan-500/60 rounded-[0.5px] h-[60%]"></div>
                            <div className="flex-1 bg-cyan-500/60 rounded-[0.5px] h-[80%]"></div>
                            <div className="flex-1 bg-cyan-500/60 rounded-[0.5px] h-[50%]"></div>
                          </div>
                        </div>
                        <div className={`p-1 rounded border flex flex-col justify-between ${
                          selectedTheme.id.startsWith("dark") ? "bg-slate-950/50 border-slate-800" : "bg-white border-slate-200"
                        }`}>
                          <span className="text-[5px] text-slate-500 font-extrabold uppercase">REVENUE</span>
                          <span className="text-[7px] font-black text-emerald-400 mt-0.5">₹6.0678L</span>
                          <div className="h-2.5 flex items-end gap-[0.5px] mt-0.5">
                            <div className="flex-1 bg-emerald-500/60 rounded-[0.5px] h-[40%]"></div>
                            <div className="flex-1 bg-emerald-500/60 rounded-[0.5px] h-[50%]"></div>
                            <div className="flex-1 bg-emerald-500/60 rounded-[0.5px] h-[90%]"></div>
                            <div className="flex-1 bg-emerald-500/60 rounded-[0.5px] h-[70%]"></div>
                          </div>
                        </div>
                        <div className={`p-1 rounded border flex flex-col justify-between ${
                          selectedTheme.id.startsWith("dark") ? "bg-slate-950/50 border-slate-800" : "bg-white border-slate-200"
                        }`}>
                          <span className="text-[5px] text-slate-500 font-extrabold uppercase">DUE BILLS</span>
                          <span className="text-[7px] font-black text-red-400 mt-0.5">₹3.5247L</span>
                          <div className="h-2.5 flex items-end gap-[0.5px] mt-0.5">
                            <div className="flex-1 bg-red-500/60 rounded-[0.5px] h-[30%]"></div>
                            <div className="flex-1 bg-red-500/60 rounded-[0.5px] h-[40%]"></div>
                            <div className="flex-1 bg-red-500/60 rounded-[0.5px] h-[35%]"></div>
                            <div className="flex-1 bg-red-500/60 rounded-[0.5px] h-[55%]"></div>
                          </div>
                        </div>
                      </div>

                      {/* Body elements */}
                      <div className="grid grid-cols-2 gap-1 flex-1 overflow-hidden">
                        
                        {/* Monthly counts */}
                        <div className={`p-1 border rounded flex flex-col gap-0.5 ${
                          selectedTheme.id.startsWith("dark") ? "bg-slate-950/20 border-slate-800/50" : "bg-white border-slate-200"
                        }`}>
                          <span className="text-[5px] font-black text-slate-400 uppercase tracking-wide border-b border-slate-800/40 pb-0.5 mb-0.5">Progress counts</span>
                          <div className="flex justify-between items-center text-[5px] text-slate-500">
                            <span>OPD Cases</span>
                            <div className="w-8 h-[3px] bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: "75%" }}></div></div>
                          </div>
                          <div className="flex justify-between items-center text-[5px] text-slate-500">
                            <span>Admissions</span>
                            <div className="w-8 h-[3px] bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: "50%" }}></div></div>
                          </div>
                          <div className="flex justify-between items-center text-[5px] text-slate-500">
                            <span>Surgeries</span>
                            <div className="w-8 h-[3px] bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: "35%" }}></div></div>
                          </div>
                        </div>

                        {/* Recent Patient records */}
                        <div className={`p-1 border rounded flex flex-col gap-0.5 overflow-hidden ${
                          selectedTheme.id.startsWith("dark") ? "bg-slate-950/20 border-slate-800/50" : "bg-white border-slate-200"
                        }`}>
                          <span className="text-[5px] font-black text-slate-400 uppercase tracking-wide border-b border-slate-800/40 pb-0.5 mb-0.5">Records</span>
                          <table className="w-full text-left border-collapse text-[5px] leading-tight">
                            <thead>
                              <tr className="text-slate-500">
                                <th>Patient</th>
                                <th>Task</th>
                              </tr>
                            </thead>
                            <tbody className="text-slate-400">
                              <tr className="border-b border-slate-800/20">
                                <td className="font-semibold">Anandi J.</td>
                                <td>OPD Consult</td>
                              </tr>
                              <tr className="border-b border-slate-800/20">
                                <td className="font-semibold">Rahul C.</td>
                                <td>IPD Bed Map</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                      </div>

                    </div>

                  </div>
                  {/* Stand and base */}
                  <div className="w-12 h-3.5 bg-slate-600 [clip-path:polygon(20%_0%,80%_0%,100%_100%,0%_100%)]"></div>
                  <div className="w-20 h-[3px] bg-slate-500 rounded-full"></div>

                </div>

              </div>

            </div>

            {/* Bottom Contact Strip (covers trimmed canvas print bleeds) */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-950 flex items-center justify-center z-30 px-4">
              <p className="text-[9px] font-bold text-slate-300 tracking-[0.05em] text-center uppercase">
                {phone1} - Keval Kuvekar &nbsp;|&nbsp; {phone2} - Rahul Chotai &nbsp;|&nbsp; www.{web} &nbsp;|&nbsp; {email}
              </p>
            </div>

          </div>

        </main>
      </div>

    </div>
  );
}
