// API Configuration - URL computed dynamically at call time, never cached at module level.
// DO NOT convert this to a module-level constant — it must be called each time to
// correctly distinguish between SSR (window undefined) and client-side browser execution.

function getApiUrl(): string {
    // BROWSER: window is always defined → always use the Next.js /api proxy.
    // This path runs for every real user request in the browser.
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Production
        if (hostname.includes('digifortlabs.com')) {
            return 'https://digifortlabs.com/api';
        }
        // Any local dev hostname (localhost, 127.0.0.1, admin.localhost, etc.)
        // → always go through the Next.js proxy to avoid direct cross-origin calls
        return '/api';
    }
    // SERVER-SIDE RENDERING: window is undefined, talk to FastAPI directly.
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

// Export a stable constant for places that import API_URL for non-fetch purposes
// (e.g. constructing download links). In the browser this is always correct because
// the module initialises client-side after hydration.
export const API_URL = typeof window !== 'undefined'
    ? (window.location.hostname.includes('digifortlabs.com') ? 'https://digifortlabs.com/api' : '/api')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');


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
        const res = await fetch(`${getApiUrl()}/auth/csrf-token`, { credentials: 'include' });
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
    // Compute URL dynamically at call time so we always get the browser-side URL
    const baseUrl = getApiUrl();

    // Read token from localStorage — works across all subdomains (admin.localhost, etc.)
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${path}`;

    const method = (options.method || 'GET').toUpperCase();
    const isMutative = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    let currentCsrfToken = null;
    if (isMutative) {
        currentCsrfToken = await getCsrfToken();
    }

    const headers: any = {
        'Content-Type': 'application/json',
        // Send token as Bearer so it works on all subdomains (cookies are domain-restricted)
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    if (currentCsrfToken) {
        headers['X-CSRF-Token'] = currentCsrfToken;
    }

    const response = await fetch(url, {
        credentials: 'include', // Also send cookie as backup
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // On 401, handle session expiry
        if (response.status === 401 && typeof window !== 'undefined') {
            // Check BEFORE removing so we know if user was previously logged in
            const hadToken = !!localStorage.getItem('access_token');
            if (hadToken) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('userRole');
                // Redirect to login with a message — only if there was a real session
                if (!window.location.pathname.startsWith('/login')) {
                    setTimeout(() => {
                        window.location.href = '/login?reason=session_expired';
                    }, 800);
                }
            }
        }

        const error = new Error(errorData.detail || errorData.message || `API Error: ${response.status}`);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
    }

    // Return empty for 204 No Content
    if (response.status === 204) return null;

    return response.json();
}

