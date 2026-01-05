import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 flex flex-col">
      <Navbar />

      {/* Hero Section - Neo-Clean */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        {/* Abstract Background mesh */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full mb-8 animate-fade-in-up">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-sm font-semibold text-slate-600">DPDP Act 2023 Compliant</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]">
            The Future of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Medical Records</span> is Hybrid.
          </h1>

          <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Seamlessly manage massive physical archives and secure digital assets.
            <span className="text-slate-900 font-semibold"> One Platform. Zero Friction.</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="px-10 py-5 bg-blue-600 text-white text-lg font-bold rounded-full hover:bg-blue-700 transition shadow-xl shadow-blue-200 hover:-translate-y-1">
              Get Started
            </Link>
            <Link href="/services" className="px-10 py-5 bg-white text-slate-700 text-lg font-bold rounded-full hover:bg-slate-50 transition border border-slate-200 hover:border-slate-300">
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* The Digifort Edge - Bento Grid */}
      <section className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">The Digifort Edge</h2>
            <p className="text-slate-500 text-lg">
              Purpose-built technology for the modern Indian hospital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">

            {/* Card 1: Transparency (Large) */}
            <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl p-10 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6">
                    🔍
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">Total Transparency</h3>
                  <p className="text-slate-500 text-lg leading-relaxed max-w-md">
                    Detailed "Original vs. Compressed" reporting for every file.
                    We don't just store data; we optimize it. Know exactly what you're paying for.
                  </p>
                </div>
                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-slate-400">Compression Rate</span>
                    <span className="text-2xl font-bold text-green-500">60% Saved</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[40%] bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Control */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full blur-2xl"></div>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
                🎮
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Heat Map Control</h3>
              <p className="text-slate-500">
                Interactive visual tracking of your physical warehouse capacity.
              </p>
            </div>

            {/* Card 3: Speed */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Blazing Speed</h3>
              <p className="text-slate-500">
                Powered by AWS CloudFront India Edge locations. Instant access.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section - Minimalist */}
      <section id="pricing" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-500">No hidden fees. Scale as you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

            {/* Starter */}
            <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors duration-300">
              <h3 className="text-lg font-bold text-slate-700 mb-2">Starter</h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">₹19k</span>
                <span className="text-slate-400">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-slate-600 text-sm">
                  <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs mr-3">✓</span> In-Patient (IPD) Only
                </li>
                <li className="flex items-center text-slate-600 text-sm">
                  <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs mr-3">✓</span> Speciality Centers
                </li>
              </ul>
              <Link href="/contact" className="block w-full py-3 border border-slate-200 text-slate-700 font-bold text-center rounded-xl hover:bg-slate-50 transition">
                Get Started
              </Link>
            </div>

            {/* Professional - Highlighted */}
            <div className="p-10 rounded-3xl bg-slate-900 text-white shadow-2xl shadow-slate-200 relative transform md:scale-105 z-10">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-2xl">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Professional</h3>
              <div className="mb-8">
                <span className="text-5xl font-extrabold">₹39k</span>
                <span className="text-slate-400">/mo</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-slate-300 text-sm">
                  <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">✓</span> Full IPD + OPD
                </li>
                <li className="flex items-center text-slate-300 text-sm">
                  <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">✓</span> 50-200 Bed Hospital
                </li>
                <li className="flex items-center text-slate-300 text-sm">
                  <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs mr-3">✓</span> Interactive Heat Map
                </li>
              </ul>
              <Link href="/contact" className="block w-full py-4 bg-blue-600 text-white font-bold text-center rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-900/50">
                Choose Professional
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors duration-300">
              <h3 className="text-lg font-bold text-slate-700 mb-2">Enterprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-slate-600 text-sm">
                  <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs mr-3">✓</span> Multi-Branch Chains
                </li>
                <li className="flex items-center text-slate-600 text-sm">
                  <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs mr-3">✓</span> Global Maps
                </li>
                <li className="flex items-center text-slate-600 text-sm">
                  <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs mr-3">✓</span> Dedicated Manager
                </li>
              </ul>
              <Link href="/contact" className="block w-full py-3 border border-slate-200 text-slate-700 font-bold text-center rounded-xl hover:bg-slate-50 transition">
                Contact Sales
              </Link>
            </div>

          </div>
        </div>
      </section>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
