"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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

        {/* Desktop Menu */}
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
          <Link href="/pricing" className="text-[15px] font-medium text-slate-300 hover:text-white transition">
            Pricing
          </Link>
          <Link href="/contact" className="text-[15px] font-medium text-slate-300 hover:text-white transition">
            Contact
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/login"
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-500 transition shadow-lg shadow-blue-900/50 transform hover:-translate-y-0.5"
          >
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-300 hover:text-white p-2 transition"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-slate-900 border-b border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col p-4 space-y-4">
            <Link href="/" onClick={() => setIsOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-xl transition">
              Home
            </Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-xl transition">
              About Us
            </Link>
            <Link href="/services" onClick={() => setIsOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-xl transition">
              Services
            </Link>
            <Link href="/pricing" onClick={() => setIsOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-xl transition">
              Pricing
            </Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className="text-lg font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-xl transition">
              Contact
            </Link>
            <Link href="/login" onClick={() => setIsOpen(false)} className="text-lg font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-xl text-center shadow-lg shadow-blue-900/20 transition">
              Login Portal
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
