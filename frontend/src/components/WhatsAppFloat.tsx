"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";

export default function WhatsAppFloat() {
  const pathname = usePathname();
  const whatsappNumber = "919725790563";
  const defaultMessage = encodeURIComponent("Hello Digifort Labs, I would like to inquire about the HMS platform demonstration and features.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${defaultMessage}`;

  // Hide WhatsApp button on authenticated app / dashboard routes
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/hospital") ||
    pathname?.startsWith("/doctor")
  ) {
    return null;
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full shadow-2xl shadow-emerald-900/50 hover:scale-105 transition-all duration-300 group border border-emerald-400/40 print:hidden"
    >
      <div className="relative">
        <MessageSquare className="w-6 h-6 fill-current" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-ping" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400" />
      </div>
      <span className="hidden sm:inline text-sm font-semibold tracking-wide">
        Chat on WhatsApp
      </span>
    </a>
  );
}
