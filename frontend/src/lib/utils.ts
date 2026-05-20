import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDomainUrl(subdomain: string | null, path: string = '') {
  // If no subdomain, just return path (relative)
  if (!subdomain) return path;

  // Check if we are in local development (works for both SSR and Client)
  const isLocal = process.env.NODE_ENV === 'development' || 
                  (typeof window !== 'undefined' && window.location.host.includes('localhost'));

  if (isLocal) {
     // Local testing constructs localhost URLs with dynamic subdomains
     const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
     const protocol = (typeof window !== 'undefined' ? window.location.protocol : 'http:') || 'http:';
     const port = host.split(':')[1] || '3000';
     return `${protocol}//${subdomain}.localhost:${port}${path}`;
  }
  
  // --- Production Logic ---
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';

  if (typeof window === 'undefined') {
    // SSR fallback for production
    return `https://${subdomain}.${rootDomain}${path}`;
  }

  const host = window.location.host;
  const parts = host.split('.');
  
  let baseDomain = rootDomain;
  if (!baseDomain) {
    // Fallback: prod.domain.com -> domain.com
    baseDomain = parts.slice(-2).join('.');
  }

  const protocol = window.location.protocol || 'https:';
  
  return `${protocol}//${subdomain}.${baseDomain}${path}`;
}
