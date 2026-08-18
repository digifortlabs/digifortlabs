import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
import SessionMonitor from "@/components/Auth/SessionMonitor";
import WhatsAppFloat from "@/components/WhatsAppFloat";

import { Toaster as HotToaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Digifort Labs | Comprehensive Hospital Management System (HMS)",
  description: "Enterprise-grade Hospital Management System unifying OPD, IPD, Pharmacy Batching, Diagnostics, OT, Insurance Billing, and NABH Compliant Medical Records.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased text-slate-900 bg-white`}
        suppressHydrationWarning
      >
        {children}
        <SessionMonitor />
        <WhatsAppFloat />

        <HotToaster position="top-right" />
      </body>
    </html>
  );
}
