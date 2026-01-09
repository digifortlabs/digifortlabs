// API Configuration
// Change this to your network IP when accessing from other devices
// Hardcoded for debugging connectivity
// API Configuration
// When on digifortlabs.com, use relative path to utilize Nginx proxy
// Otherwise (local dev), use env var or default to localhost:8000

const isLive = typeof window !== 'undefined' && window.location.hostname.includes('digifortlabs.com');

export const API_URL = isLive ? 'https://digifortlabs.com/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
console.log('[Config] API_URL set to:', API_URL);
