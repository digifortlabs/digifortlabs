// API Configuration
// Change this to your network IP when accessing from other devices
// Hardcoded for debugging connectivity
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('[Config] API_URL set to:', API_URL);
