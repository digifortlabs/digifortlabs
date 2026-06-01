import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import SessionMonitor from "@/components/Auth/SessionMonitor";
import { Toaster } from "@/components/ui/sonner";

import { Toaster as HotToaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Digifort Labs | AIO Data Processor",
  description: "Enterprise-grade All-In-One Data Processing and Storage system. Secure, compliant physical and digital records management.",
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
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased text-slate-900 bg-white`}
        suppressHydrationWarning
      >
        {children}
        <SessionMonitor />
        <Toaster />
        <HotToaster position="top-right" />
      </body>
    </html>
  );
}
