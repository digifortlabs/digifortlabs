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
    const isDev = process.env.ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development';
    return isDev ? 'http://localhost:8000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
}

// Export a stable constant for places that import API_URL for non-fetch purposes
// (e.g. constructing download links). In the browser this is always correct because
// the module initialises client-side after hydration.
export const API_URL = typeof window !== 'undefined'
    ? (window.location.hostname.includes('digifortlabs.com') ? 'https://digifortlabs.com/api' : '/api')
    : ((process.env.ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development') ? 'http://localhost:8000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'));


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
async function doFetch(url: string, _path: string, options: any, token: string | null): Promise<Response> {
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

    // Auto-serialize plain object bodies to JSON
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof URLSearchParams) && !(body instanceof FormData)) {
        body = JSON.stringify(body);
    }

    return fetch(url, {
        credentials: 'include',
        ...options,
        body,
        headers,
    });
}

export async function apiFetch(endpoint: string, options: any = {}) {
    // Normalize endpoint slashes to prevent FastAPI redirect issues on production subdomains
    let normalizedEndpoint = endpoint;
    if (normalizedEndpoint) {
        const qIndex = normalizedEndpoint.indexOf('?');
        let pathPart = qIndex !== -1 ? normalizedEndpoint.substring(0, qIndex) : normalizedEndpoint;
        const queryPart = qIndex !== -1 ? normalizedEndpoint.substring(qIndex) : '';

        // Append trailing slash to bare resource paths (e.g. "patients", "hms/beds") to avoid backend redirects
        if (/^[a-zA-Z_\-]+(\/[a-zA-Z_\-]+)*$/.test(pathPart)) {
            pathPart += '/';
        }
        normalizedEndpoint = `${pathPart}${queryPart}`;
    }

    const baseUrl = getApiUrl();
    const path = normalizedEndpoint.startsWith('/') ? normalizedEndpoint : `/${normalizedEndpoint}`;
    const url = `${baseUrl}${path}`;

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    let response = await doFetch(url, path, options, token);

    // If 401 and we have no token yet (race condition during handoff), wait briefly and retry once
    if (response.status === 401 && !token && typeof window !== 'undefined') {
        await new Promise(r => setTimeout(r, 300));
        const retryToken = localStorage.getItem('access_token');
        if (retryToken) {
            response = await doFetch(url, path, options, retryToken);
        }
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401 && typeof window !== 'undefined') {
            const isAuthCheck = path === '/users/me';
            if (isAuthCheck) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('userRole');
                if (!window.location.pathname.startsWith('/login')) {
                    setTimeout(() => {
                        window.location.href = '/login?reason=session_expired';
                    }, 800);
                }
            }
        }

        let errorMessage = errorData.detail || errorData.message || `API Error: ${response.status}`;
        
        // Handle FastAPI validation errors which are arrays of objects
        if (Array.isArray(errorMessage)) {
            errorMessage = errorMessage.map((e: any) => {
                if (e.msg && e.loc) {
                    return `${e.loc[e.loc.length - 1]}: ${e.msg}`;
                }
                return JSON.stringify(e);
            }).join(', ');
        } else if (typeof errorMessage === 'object') {
            errorMessage = JSON.stringify(errorMessage);
        }

        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
    }

    if (response.status === 204) return null;
    return response.json();
}

const SESSION_KEYS = [
    'access_token', 'userRole', 'userEmail', 'userSpecialty', 'userModules',
    'userTerminology', 'loginTime', 'hospital_id', 'globalHospitalId',
    'mrd_hospital_id', 'dental_hospital_id', 'ent_hospital_id', 'clinic_hospital_id', 'hms_hospital_id', 'inventory_hospital_id',
    'userGroupId', 'sidebarCollapsed'
];

export async function logout(): Promise<void> {
    try {
        await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
        console.error('Logout API call failed:', e);
    } finally {
        SESSION_KEYS.forEach(k => localStorage.removeItem(k));
        // Reset cached CSRF token so next login fetches a fresh one
        csrfToken = null;
        window.location.href = '/login';
    }
}

