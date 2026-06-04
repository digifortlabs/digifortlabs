import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
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
        className={`${inter.variable} font-sans antialiased text-slate-900 bg-white`}
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
