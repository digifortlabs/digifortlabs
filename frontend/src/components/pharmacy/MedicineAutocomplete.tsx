import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/config/api';

interface MedicineAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function MedicineAutocomplete({ value, onChange, className }: MedicineAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchSuggestions = async (query: string) => {
        if (!query || query.length < 2) {
            setSuggestions([]);
            return;
        }
        try {
            const data = await apiFetch(`/pharmacy/medicines/search?query=${encodeURIComponent(query)}`);
            setSuggestions(data || []);
        } catch (e) {
            console.error("Failed to fetch medicines", e);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);
        setIsOpen(true);
        fetchSuggestions(val);
    };

    const handleSelect = (name: string) => {
        onChange(name);
        setIsOpen(false);
    };

    const handleBlur = async () => {
        // Auto-add medicine if it doesn't exist and the user leaves the field
        if (value && value.trim().length > 1) {
            try {
                // Background fire and forget auto-add
                apiFetch(`/pharmacy/medicines/auto-add?name=${encodeURIComponent(value.trim())}`, {
                    method: 'POST'
                });
            } catch (e) {
                // Ignore silent background fail
            }
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <Input 
                value={value} 
                onChange={handleInputChange} 
                onFocus={() => { if(value.length >= 2) { setIsOpen(true); fetchSuggestions(value); } }}
                onBlur={handleBlur}
                placeholder="Search or add medicine..."
                className={`w-full ${className}`}
            />
            
            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-auto">
                    {suggestions.map((med) => (
                        <li 
                            key={med.id} 
                            className="px-3 py-2 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0 text-sm"
                            onMouseDown={(e) => {
                                // Prevent blur from firing before click is processed
                                e.preventDefault(); 
                                handleSelect(med.name);
                            }}
                        >
                            <div className="font-medium text-slate-800">{med.name}</div>
                        </li>
                    ))}
                </ul>
            )}
            {isOpen && suggestions.length === 0 && value.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg p-2 text-xs text-slate-500">
                    "{value}" will be auto-added to the Master List.
                </div>
            )}
        </div>
    );
}
