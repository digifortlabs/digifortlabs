const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
