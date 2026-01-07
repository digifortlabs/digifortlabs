import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-2xl font-bold text-white mb-4">DIGIFORT<span className="text-blue-500">LABS</span></h3>
                        <p className="max-w-sm text-slate-400">
                            Pioneering the future of secure healthcare archives.
                            We bridge the physical and digital worlds to safeguard patient history.
                        </p>
                        <div className="mt-6 text-slate-400 text-sm">
                            <p className="font-semibold text-white">Headquarters:</p>
                            <p>Vapi, Valsad, Gujarat</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/services" className="hover:text-white transition">Physical Storage</Link></li>
                            <li><Link href="/services" className="hover:text-white transition">Digitization</Link></li>
                            <li><Link href="/dashboard" className="hover:text-white transition">Client Portal</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold uppercase tracking-wider text-sm mb-4">Company</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                            <li><Link href="/legal" className="hover:text-white transition">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Digifort Labs. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <span>ISO 27001 Certified</span>
                        <span>HIPAA Compliant</span>
                        <span>Made with ❤️ for Healthcare</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
