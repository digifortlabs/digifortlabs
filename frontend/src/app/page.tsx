import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, ScanLine, Lock, Cloud, Search, ChevronDown } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 flex flex-col">
      <Navbar />

      {/* Hero Section - Neo-Clean */}
      {/* Hero Section - Neo-Clean Dark */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-slate-900">

        {/* Tech Background Grid */}
        <div className="absolute inset-0 z-0 opacity-10 bg-grid-white pointer-events-none" />

        {/* Abstract Server Room Glows - Adjusted for Dark Mode */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] opacity-50 animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] opacity-40"></div>
        </div>

        {/* 3D Abstract "Server Rack" / "Towers" Graphic - Right Side Decoration (Dark Mode) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-0 hidden lg:block opacity-60 pointer-events-none select-none z-0">
          <div className="flex gap-8 transform -skew-y-12 scale-110">
            <div className="w-24 h-96 bg-gradient-to-b from-blue-900 to-slate-900 border border-blue-500/20 rounded-lg shadow-2xl flex flex-col justify-evenly items-center py-4 ring-1 ring-blue-500/20">
              {[...Array(8)].map((_, i) => <div key={i} className="w-16 h-1 bg-blue-400/30 rounded-full shimmer shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>)}
            </div>
            <div className="w-24 h-[500px] bg-gradient-to-b from-indigo-900 to-slate-900 border border-indigo-500/20 rounded-lg shadow-2xl flex flex-col justify-evenly items-center py-4 -mt-20 ring-1 ring-indigo-500/20">
              {[...Array(10)].map((_, i) => <div key={i} className="w-16 h-1 bg-indigo-400/30 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>)}
            </div>
            <div className="w-24 h-80 bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-600/20 rounded-lg shadow-2xl flex flex-col justify-evenly items-center py-4 mt-20 ring-1 ring-slate-600/20">
              {[...Array(6)].map((_, i) => <div key={i} className="w-16 h-1 bg-slate-400/30 rounded-full"></div>)}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full mb-8 animate-fade-in-up backdrop-blur-sm">
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.1]">
            The Future of <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">Medical Records</span> is Hybrid.
          </h1>

          <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Seamlessly manage massive physical archives and secure digital assets.
            <span className="text-slate-100 font-semibold"> One Platform. Zero Friction.</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="px-10 py-5 bg-blue-600 text-white text-lg font-bold rounded-full hover:bg-blue-500 transition shadow-xl shadow-blue-900/40 hover:-translate-y-1 hover:shadow-blue-600/20 border border-transparent">
              Get Started
            </Link>
            <Link href="/services" className="px-10 py-5 bg-slate-800/50 text-white text-lg font-bold rounded-full hover:bg-slate-800 transition border border-slate-700 hover:border-slate-500 backdrop-blur-sm">
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Process / Workflow Section - "How it Works" */}
      <section className="py-20 bg-slate-900 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">From Chaos to Clarity</h2>
            <p className="text-slate-400 text-lg">
              Our streamlined 5-step process ensures total security and accessibility.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-blue-900/0 via-blue-500/30 to-blue-900/0 -translate-y-12 z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mb-6 shadow-lg shadow-blue-900/20 group-hover:scale-110 group-hover:border-blue-500 transition-all duration-300 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-slate-900">1</div>
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-2">Collection</h3>
                <p className="text-slate-500 text-sm">Secure pickup of your physical records.</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mb-6 shadow-lg shadow-purple-900/20 group-hover:scale-110 group-hover:border-purple-500 transition-all duration-300 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-slate-900">2</div>
                  <ScanLine className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-white font-bold mb-2">Digitization</h3>
                <p className="text-slate-500 text-sm">High-speed, AI-enhanced scanning.</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/20 group-hover:scale-110 group-hover:border-indigo-500 transition-all duration-300 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-slate-900">3</div>
                  <Lock className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-white font-bold mb-2">Encryption</h3>
                <p className="text-slate-500 text-sm">AES-256 bank-grade security applied.</p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20 group-hover:scale-110 group-hover:border-emerald-500 transition-all duration-300 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-slate-900">4</div>
                  <Cloud className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-white font-bold mb-2">Cloud Archive</h3>
                <p className="text-slate-500 text-sm">Stored on redundant AWS servers.</p>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center mb-6 shadow-lg shadow-cyan-900/20 group-hover:scale-110 group-hover:border-cyan-500 transition-all duration-300 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-slate-900">5</div>
                  <Search className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-white font-bold mb-2">Smart Retrieval</h3>
                <p className="text-slate-500 text-sm">Instantly find files via OCR search.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Digifort Edge - Benefits Grid */}
      <section className="py-16 bg-slate-950 relative">
        <div className="absolute inset-0 z-0 opacity-5 bg-grid-white pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Top Hospitals Choose Digifort</h2>
            <p className="text-slate-400 text-lg">
              Beyond simple storage. Intelligent infrastructure for critical medical data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {/* Feature 1: Efficiency (Was Transparency) */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300 group">
              <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                📉
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Compression</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Reduce digital footprint by up to 60% without quality loss. Pay only for what you actually use.
              </p>
            </div>

            {/* Feature 2: Heat Map */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800 transition-all duration-300 group">
              <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🎮
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Warehouse Heat Maps</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Visualize physical file locations in real-time. Optimize shelf space and retrieval routes instantly.
              </p>
            </div>

            {/* Feature 3: Speed */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 transition-all duration-300 group">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Retrieval</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Powered by AWS CloudFront Edge locations. Access patient history in milliseconds, anywhere.
              </p>
            </div>

            {/* Feature 4: Security (New) */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-red-500/50 hover:bg-slate-800 transition-all duration-300 group">
              <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Bank-Grade Security</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                AES-256 encryption at rest and in transit. Granular role-based access controls (RBAC).
              </p>
            </div>

            {/* Feature 5: OCR (New) */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800 transition-all duration-300 group">
              <div className="w-10 h-10 bg-orange-500/10 text-orange-400 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🔍
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Optical Search</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Don't just scan—index. Search for specific medications or doctor notes inside PDF files.
              </p>
            </div>

            {/* Feature 6: Compliance (New) */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 transition-all duration-300 group">
              <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-lg flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                ⚖️
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Audit & Compliance</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Full immutable audit logs for every view and download. DPDP 2023 & NHA compliant architecture.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section - Replaces Pricing */}
      <section id="faq" className="py-24 bg-slate-900 scroll-mt-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400">Everything you need to know about Digifort.</p>
          </div>

          <div className="space-y-4">
            {/* QA 1 */}
            <details className="group bg-slate-800/50 rounded-2xl border border-slate-700 open:bg-slate-800 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white">How secure are the digitized records?</h3>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-slate-700/50 pt-4 mt-2">
                We use bank-grade AES-256 encryption for all data at rest and in transit.
                Our infrastructure is built on AWS with strict role-based access controls (RBAC),
                ensuring only authorized personnel can access sensitive patient data.
              </div>
            </details>

            {/* QA 2 */}
            <details className="group bg-slate-800/50 rounded-2xl border border-slate-700 open:bg-slate-800 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white">What happens to the physical files?</h3>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-slate-700/50 pt-4 mt-2">
                Physical files are barcoded, sealed, and stored in our fire-safe,
                access-controlled warehouse. You can request the physical original anytime via
                the dashboard, and we retrieve it within 24-48 hours.
              </div>
            </details>

            {/* QA 3 */}
            <details className="group bg-slate-800/50 rounded-2xl border border-slate-700 open:bg-slate-800 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white">Is Digifort compliant with Indian laws?</h3>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-slate-700/50 pt-4 mt-2">
                Yes. We are fully compliant with the Digital Personal Data Protection (DPDP) Act 2023
                and follow NHA (National Health Authority) guidelines for electronic health records.
              </div>
            </details>

            {/* QA 4 */}
            <details className="group bg-slate-800/50 rounded-2xl border border-slate-700 open:bg-slate-800 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="text-lg font-semibold text-white">How fast is the retrieval process?</h3>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-slate-700/50 pt-4 mt-2">
                Digital retrieval is instant (milliseconds) via our cloud portal.
                You can search by patient name, ID, or date using our AI Optical Search.
                Physical retrieval typically takes 1 business day depending on location.
              </div>
            </details>
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
