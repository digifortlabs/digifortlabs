// API Configuration
// Change this to your network IP when accessing from other devices
// Hardcoded for debugging connectivity
// API Configuration
// Enforce HTTPS on Production to prevent Mixed Content Errors

let apiUrl = 'http://localhost:8000'; // Default to local

// Check if we are in the browser
if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // If we are on the live domain OR using HTTPS, FORCE the secure API proxy
    if (hostname.includes('digifortlabs.com') || window.location.protocol === 'https:') {
        apiUrl = 'https://digifortlabs.com/api';
    }
    // Fallback solely for local network testing if needed
    else if (window.location.protocol === 'http:') {
        apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    }
} else {
    // Server-side rendering fallback
    apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

export const API_URL = apiUrl;
// console.log('[Config] API_URL resolved to:', API_URL);
// console.log('[Config] VERSION: v3-Final-HTTPS-Fix (Live)');

console.log('%c[SYSTEM] %cMainframe Connection Established...', 'color:red; font-weight:bold', 'color:green; font-family:monospace');
console.log('%c[ACCESS] %cOverride auth sequence: SUCCESS', 'color:red; font-weight:bold', 'color:green; font-family:monospace');
console.log('%c[STATUS] %cStealth Mode: ENGAGED', 'color:cyan; font-weight:bold', 'color:green; font-family:monospace');
console.log('%c[TARGET] %cDigifort Secure Vault', 'color:yellow; font-weight:bold', 'color:green; font-family:monospace');
