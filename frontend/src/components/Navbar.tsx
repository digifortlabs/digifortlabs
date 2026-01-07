import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-48 h-12 bg-white rounded-lg px-2 overflow-hidden group-hover:scale-105 transition-transform flex items-center justify-center">
              <Image
                src="/logo/logo.png"
                alt="Digifort Labs Logo"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-[15px] font-medium text-slate-300 hover:text-white transition">
            Home
          </Link>
          <Link href="/about" className="text-[15px] font-medium text-slate-300 hover:text-white transition">
            About Us
          </Link>
          <Link href="/services" className="text-[15px] font-medium text-slate-300 hover:text-white transition">
            Services
          </Link>
          <Link href="/#pricing" className="text-[15px] font-medium text-slate-300 hover:text-white transition">
            Pricing
          </Link>
          <Link href="/contact" className="text-[15px] font-medium text-slate-300 hover:text-white transition">
            Contact
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-500 transition shadow-lg shadow-blue-900/50 transform hover:-translate-y-0.5"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
