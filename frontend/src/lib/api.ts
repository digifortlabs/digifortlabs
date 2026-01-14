import { API_URL as ConfigAPI_URL } from '@/config/api';
const API_URL = ConfigAPI_URL;

export async function uploadFile(file: File, patientId: number) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/patients/${patientId}/upload`, {
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
