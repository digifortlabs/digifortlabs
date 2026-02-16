"use client";

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
    LayoutDashboard,
    Globe,
    ShieldCheck,
    FileText,
    Users,
    Building2,
    Database,
    Settings,
    Server,
    CreditCard,
    Unlock
} from 'lucide-react';

export default function SiteMapPage() {
    const sections = [
        {
            title: "Public Pages",
            icon: <Globe className="text-blue-500" />,
            links: [
                { name: "Home", href: "/" },
                { name: "Services", href: "/services" },
                { name: "Pricing", href: "/pricing" },
                { name: "About Us", href: "/about" },
                { name: "Contact", href: "/contact" },
                { name: "Legal / Terms", href: "/legal" },
            ]
        },
        {
            title: "Portals & Auth",
            icon: <Unlock className="text-purple-500" />,
            links: [
                { name: "Patient Portal Login", href: "/portal/login" },
                { name: "Patient Dashboard", href: "/portal" },
                { name: "Employee Login", href: "/login" },
                { name: "Forgot Password", href: "/forgot-password" },
            ]
        },
        {
            title: "Admin Dashboard (Restricted)",
            icon: <LayoutDashboard className="text-indigo-500" />,
            description: "Requires Employee Login",
            subsections: [
                {
                    subtitle: "Core Modules",
                    links: [
                        { name: "Dashboard Overview", href: "/dashboard" },
                        { name: "Records Management", href: "/dashboard/records" },
                        { name: "Hospital Management", href: "/dashboard/hospital_mgmt" },
                        { name: "User Management (Orphan)", href: "/dashboard/user_mgmt" },
                        { name: "Staff Management (Orphan)", href: "/dashboard/staff" },
                    ]
                },
                {
                    subtitle: "Operations & Storage",
                    links: [
                        { name: "Physical Storage", href: "/dashboard/storage" },
                        { name: "Storage Requests (Orphan)", href: "/dashboard/storage/requests" },
                        { name: "Digitization Requests (Orphan)", href: "/dashboard/requests" },
                        { name: "Drafts / Pending", href: "/dashboard/drafts" },
                        { name: "Downloads (Orphan)", href: "/dashboard/downloads" },
                    ]
                },
                {
                    subtitle: "Finance & Compliance",
                    links: [
                        { name: "Accounting / Invoices", href: "/dashboard/accounting" },
                        { name: "Audit Logs", href: "/dashboard/audit" },
                        { name: "Reports (Orphan)", href: "/dashboard/reports" },
                    ]
                },
                {
                    subtitle: "System",
                    links: [
                        { name: "Server Manager (Orphan)", href: "/dashboard/server-manager" },
                        { name: "Platform Settings", href: "/dashboard/settings" },
                    ]
                }
            ]
        },
        {
            title: "Utilities / Other",
            icon: <FileText className="text-slate-500" />,
            links: [
                { name: "Invoice Preview (Dynamic)", href: "/invoice-preview/YOUR_INVOICE_ID" },
                { name: "XML Sitemap (SEO)", href: "/sitemap.xml" },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-20 pt-32">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Site Map</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        A complete overview of all modules, pages, and features available within the Digifort Labs ecosystem.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sections.map((section, idx) => (
                        <div key={idx} className={`bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow ${section.subsections ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                            <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    {section.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                                    {section.description && <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{section.description}</p>}
                                </div>
                            </div>

                            {section.subsections ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {section.subsections.map((sub, sidx) => (
                                        <div key={sidx}>
                                            <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                                {sub.subtitle}
                                            </h3>
                                            <ul className="space-y-3">
                                                {sub.links.map((link, lidx) => (
                                                    <li key={lidx}>
                                                        <Link href={link.href} className="text-slate-600 hover:text-indigo-600 transition-colors text-sm flex items-center gap-2 group">
                                                            <span className="opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300">→</span>
                                                            {link.name}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {section.links?.map((link, lidx) => (
                                        <li key={lidx}>
                                            <Link href={link.href} className="text-slate-600 hover:text-blue-600 transition-colors text-sm flex items-center gap-2 group">
                                                <span className="opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300">→</span>
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
