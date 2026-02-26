import { API_URL as ConfigAPI_URL, getCsrfToken } from '@/config/api';
const API_URL = ConfigAPI_URL;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    // Automatically include cookies for HttpOnly JWT authentication
    const fetchOptions: RequestInit = {
        ...options,
        credentials: 'include',
    };

    // Auto-detect JSON if body is an object and not FormData
    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
        fetchOptions.body = JSON.stringify(options.body);
        fetchOptions.headers = {
            'Content-Type': 'application/json',
            ...options.headers,
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

    const res = await fetch(`${API_URL}${endpoint}`, fetchOptions);
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
        const res = await fetch(`${API_URL}/health`);
        return res.ok;
    } catch (e) {
        return false;
    }
}
