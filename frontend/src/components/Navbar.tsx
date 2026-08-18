"use client";
import NextLink from 'next/link';
import NextImage from 'next/image';
const Link = NextLink as any;
const Image = NextImage as any;
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-48 h-12 bg-white rounded-lg px-2 overflow-hidden group-hover:scale-105 transition-transform flex items-center justify-center">
              <Image
                src="/logo/longlogo.png"
                alt="Digifort Labs Logo"
                fill
                sizes="192px"
                className="object-contain p-1"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-[14px] font-semibold text-slate-600 hover:text-slate-900 transition">
            Home
          </Link>
          <Link href="/services" className="text-[14px] font-semibold text-teal-600 hover:text-teal-700 transition">
            11 FRS Modules
          </Link>
          <Link href="/services" className="text-[14px] font-semibold text-slate-600 hover:text-slate-900 transition">
            Specialties
          </Link>
          <Link href="/pricing" className="text-[14px] font-semibold text-slate-600 hover:text-slate-900 transition">
            Pricing & ROI
          </Link>
          <Link href="/about" className="text-[14px] font-semibold text-slate-600 hover:text-slate-900 transition">
            About Us
          </Link>
          <Link href="/contact" className="text-[14px] font-semibold text-slate-600 hover:text-slate-900 transition">
            Contact
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-3">
          <Link
            href="/demo"
            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-200 transition"
          >
            Demo Sandbox
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-900/20"
          >
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-600 hover:text-slate-900 p-2 transition"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col p-4 space-y-3">
            <Link href="/" onClick={() => setIsOpen(false)} className="text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition">
              Home
            </Link>
            <Link href="/modules" onClick={() => setIsOpen(false)} className="text-base font-bold text-teal-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition">
              11 FRS Modules
            </Link>
            <Link href="/services" onClick={() => setIsOpen(false)} className="text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition">
              Specialties
            </Link>
            <Link href="/pricing" onClick={() => setIsOpen(false)} className="text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition">
              Pricing & ROI
            </Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition">
              About Us
            </Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className="text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-4 py-2.5 rounded-xl transition">
              Contact
            </Link>
            <Link href="/login" onClick={() => setIsOpen(false)} className="text-base font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl text-center shadow-md shadow-blue-900/20 transition">
              Login Portal
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
