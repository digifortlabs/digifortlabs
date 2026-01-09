// API Configuration
// Change this to your network IP when accessing from other devices
// Hardcoded for debugging connectivity
// API Configuration
// Enforce HTTPS on Production to prevent Mixed Content Errors

let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If we are on the live domain, FORCE the secure API proxy
    if (hostname.includes('digifortlabs.com')) {
        apiUrl = 'https://digifortlabs.com/api';
    }
}

export const API_URL = apiUrl;
console.log('[Config] API_URL resolved to:', API_URL);
