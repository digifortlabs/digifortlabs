// @ts-ignore
import NextImage from 'next/image';
// @ts-ignore
import NextLink from 'next/link';
const Link = NextLink as any;
const Image = NextImage as any;

export default function Footer() {
    return (
        <footer className="bg-slate-50 text-slate-600 py-12 border-t border-slate-200 print:hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="relative w-48 h-12 bg-white rounded-lg px-2 overflow-hidden mb-6 flex items-center justify-center shadow-sm">
                            <Image
                                src="/logo/longlogo.png"
                                alt="Digifort Labs Logo"
                                fill
                                className="object-contain p-1"
                            />
                        </div>
                        <p className="max-w-sm text-slate-500">
                            Pioneering the future of secure enterprise healthcare.
                            We bridge the physical and digital worlds to safeguard critical enterprise data.
                        </p>
                        <div className="mt-6 text-slate-500 text-sm">
                            <p className="font-bold text-slate-900">Headquarters:</p>
                            <p>Vapi, Valsad, Gujarat</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-slate-900 font-bold uppercase tracking-wider text-sm mb-4">Clinical Platform</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/modules" className="hover:text-blue-600 transition">11 FRS Modules</Link></li>
                            <li><Link href="/services" className="hover:text-blue-600 transition">Specialty EMR Templates</Link></li>
                            <li><Link href="/pricing" className="hover:text-blue-600 transition">ROI Calculator & Plans</Link></li>
                            <li><Link href="/login" className="hover:text-blue-600 transition">Hospital Staff Portal</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-slate-900 font-bold uppercase tracking-wider text-sm mb-4">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/about" className="hover:text-blue-600 transition">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-blue-600 transition">Contact</Link></li>
                            <li><Link href="/legal" className="hover:text-blue-600 transition">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Digifort Labs. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <span>Enterprise Compliant</span>
                        <span>Made with ❤️ for Hospitals</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
