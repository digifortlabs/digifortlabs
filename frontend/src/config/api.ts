// API Configuration
// Change this to your network IP when accessing from other devices
// Hardcoded for debugging connectivity
// API Configuration
// Enforce HTTPS on Production to prevent Mixed Content Errors

let apiUrl = 'http://localhost:8000'; // Default to local

// Check if we are in the browser
if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // If we are on the live domain OR using HTTPS, FORCE the secure API proxy
    if (hostname.includes('digifortlabs.com') || window.location.protocol === 'https:') {
        apiUrl = 'https://digifortlabs.com/api';
    }
    // Fallback solely for local network testing if needed
    else if (window.location.protocol === 'http:') {
        apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    }
} else {
    // Server-side rendering fallback
    apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

export const API_URL = apiUrl;

/**
 * Enhanced fetch wrapper for Digifort API
 * Automatically handles:
 * 1. Base URL prefixing
 * 2. JWT Authorization headers
 * 3. Standard JSON content-type
 * 4. Error response handling
 */
export async function apiFetch(endpoint: string, options: any = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${path}`;

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.detail || errorData.message || `API Error: ${response.status}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
    }

    // Return empty for 204 No Content
    if (response.status === 204) return null;

    return response.json();
}
