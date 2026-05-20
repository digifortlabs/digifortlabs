"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch } from '@/config/api';

interface UseDashboardOptions<T> {
    endpoint: string;
    searchFields: (keyof T)[];
    initialSort?: { key: keyof T; direction: 'asc' | 'desc' };
    dependencies?: any[];
}

export function useDashboard<T>({
    endpoint,
    searchFields,
    initialSort,
    dependencies = []
}: UseDashboardOptions<T>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(initialSort || null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiFetch(endpoint);
            setData(result || []);
        } catch (err: any) {
            console.error(`Error fetching from ${endpoint}:`, err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        fetchData();
    }, [fetchData, ...dependencies]);

    const handleSort = (key: keyof T) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredData = useMemo(() => {
        let filtered = [...data];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter((item) =>
                searchFields.some((field) => {
                    const value = item[field];
                    return value && String(value).toLowerCase().includes(lowerSearch);
                })
            );
        }

        if (sortConfig) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [data, searchTerm, sortConfig, searchFields]);

    return {
        data: filteredData,
        rawData: data,
        loading,
        searchTerm,
        setSearchTerm,
        sortConfig,
        handleSort,
        refresh: fetchData,
        error
    };
}
