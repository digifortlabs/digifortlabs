// API Configuration
// Change this to your network IP when accessing from other devices
// Hardcoded for debugging connectivity
// API Configuration
// Enforce HTTPS on Production to prevent Mixed Content Errors

let apiUrl = '/api'; // Default to proxy

// Check if we are in the browser
if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // If we are on the live domain, FORCE the secure API proxy
    if (hostname.includes('digifortlabs.com')) {
        apiUrl = 'https://digifortlabs.com/api';
    }
    // If we are running Next.js locally, use the secure Next.js Proxy rewrite (/api)
    else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        apiUrl = '/api';
    }
    // Fallback solely for local network testing if needed
    else {
        apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    }
} else {
    // Server-side rendering fallback
    apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

export const API_URL = apiUrl;

// CSRF Token Management
let csrfToken: string | null = null;
let fetchingCsrf = false;

export async function getCsrfToken(): Promise<string | null> {
    if (csrfToken) return csrfToken;
    if (fetchingCsrf) {
        // Wait for the token to be fetched by another call
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (!fetchingCsrf) {
                    clearInterval(check);
                    resolve(csrfToken);
                }
            }, 50);
        });
    }
    fetchingCsrf = true;
    try {
        const res = await fetch(`${API_URL}/auth/csrf-token`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            csrfToken = data.csrf_token;
        }
    } catch (e) {
        console.error("Failed to fetch CSRF token", e);
    }
    fetchingCsrf = false;
    return csrfToken;
}

/**
 * Enhanced fetch wrapper for Digifort API
 * Automatically handles:
 * 1. Base URL prefixing
 * 2. JWT Authorization headers
 * 3. Standard JSON content-type
 * 4. Error response handling
 */
export async function apiFetch(endpoint: string, options: any = {}) {
    const token = null; // Token is handled by httponly cookies

    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${path}`;

    const method = (options.method || 'GET').toUpperCase();
    const isMutative = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    let currentCsrfToken = null;
    if (isMutative) {
        currentCsrfToken = await getCsrfToken();
    }

    const headers: any = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    if (currentCsrfToken) {
        headers['X-CSRF-Token'] = currentCsrfToken;
    }

    const response = await fetch(url, {
        credentials: 'include',
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

