import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-blue-200 shadow-lg group-hover:scale-105 transition-transform">
              D
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">DIGIFORT<span className="text-blue-600">LABS</span></span>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition">
            Dashboard
          </Link>
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
            Home
          </Link>
          <Link href="/about" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
            About Us
          </Link>
          <Link href="/services" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
            Services
          </Link>
          <Link href="/#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
            Pricing
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition">
            Contact
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 transform hover:-translate-y-0.5"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
