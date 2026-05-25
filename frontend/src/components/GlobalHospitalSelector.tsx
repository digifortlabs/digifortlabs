"use client";
import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useTerminology } from '@/hooks/useTerminology';

export default function GlobalHospitalSelector() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { terms } = useTerminology();
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const { apiFetch } = await import('@/lib/api');
                const data = await apiFetch('/hospitals/');
                if (data && Array.isArray(data)) {
                    setHospitals(data);
                }
            } catch (error) {
                console.error("Failed to fetch hospitals for global selector:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHospitals();

        // Initialize from local storage or URL query param if present on load
        const urlHospitalId = searchParams?.get('hospital_id');
        const savedHospitalId = localStorage.getItem('globalHospitalId');
        
        if (urlHospitalId) {
            setSelectedHospitalId(urlHospitalId);
            localStorage.setItem('globalHospitalId', urlHospitalId);
            window.dispatchEvent(new CustomEvent('hospitalChanged', { detail: urlHospitalId }));
        } else if (savedHospitalId) {
            setSelectedHospitalId(savedHospitalId);
        }
    }, [searchParams]);

    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedHospitalId(value);
        
        if (value) {
            localStorage.setItem('globalHospitalId', value);
            window.dispatchEvent(new CustomEvent('hospitalChanged', { detail: value }));
            
            // Navigate to overview with the selected hospital
            const targetPath = `/hospital-overview?hospital_id=${value}`;
            if (pathname === '/hospital-overview') {
                router.replace(targetPath);
            } else {
                router.push(targetPath);
            }
        } else {
            localStorage.removeItem('globalHospitalId');
            window.dispatchEvent(new CustomEvent('hospitalChanged', { detail: '' }));
            
            if (pathname === '/') {
                router.replace(`/`);
            } else {
                router.push(`/`);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg animate-pulse w-48 h-8"></div>
        );
    }

    return (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl relative group transition-colors hover:bg-indigo-500/20">
            <Building2 size={16} className="text-indigo-400 shrink-0" />
            <select
                className="bg-transparent border-none outline-none text-xs font-bold text-indigo-300 uppercase tracking-wider appearance-none pr-4 cursor-pointer"
                value={selectedHospitalId}
                onChange={handleSelectionChange}
            >
                <option value="" className="bg-slate-900 text-slate-300">GLOBAL VIEW</option>
                {hospitals.map(h => (
                    <option key={h.hospital_id} value={h.hospital_id} className="bg-slate-900 text-slate-300">
                        {h.legal_name}
                    </option>
                ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-3 h-3 text-indigo-400 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
        </div>
    );
}
