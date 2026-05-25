import { API_URL as ConfigAPI_URL, getCsrfToken } from '@/config/api';

export async function apiFetch(endpoint: string, options: Omit<RequestInit, 'body'> & { body?: any } = {}) {
    // Automatically include cookies for HttpOnly JWT authentication
    const fetchOptions: RequestInit = {
        ...options,
        credentials: 'include',
    } as any;

    // Auto-detect JSON if body is an object and not FormData
    if (options.body && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams) && typeof options.body === 'object') {
        fetchOptions.body = JSON.stringify(options.body);
        fetchOptions.headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
        fetchOptions.headers = {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const token = await getCsrfToken();
        if (token) {
            fetchOptions.headers = {
                ...fetchOptions.headers,
                'X-CSRF-Token': token
            };
        }
    }

    // Resolve API URL dynamically at call time to prevent the SSR vs client caching issue
    const currentApiUrl = typeof window !== 'undefined'
        ? (window.location.hostname.includes('digifortlabs.com') ? 'https://digifortlabs.com/api' : '/api')
        : ((process.env.ENVIRONMENT === 'development' || process.env.NODE_ENV === 'development') ? 'http://localhost:8000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'));

    const res = await fetch(`${currentApiUrl}${endpoint}`, fetchOptions);
    return res;
}

export async function uploadFile(file: File, patientId: number) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiFetch(`/patients/${patientId}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        throw new Error('Upload failed');
    }

    return res.json();
}

export async function checkHealth() {
    try {
        const res = await fetch(`${ConfigAPI_URL}/health`);
        return res.ok;
    } catch (e) {
        return false;
    }
}
