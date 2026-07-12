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

  let targetUrl = '';

  if (isLocal) {
     // Local testing constructs localhost URLs with dynamic subdomains
     const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
     const protocol = (typeof window !== 'undefined' ? window.location.protocol : 'http:') || 'http:';
     const port = host.split(':')[1] || '3000';
     targetUrl = `${protocol}//${subdomain}.localhost:${port}${path}`;
  } else {
     // --- Production Logic ---
     const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';

     if (typeof window === 'undefined') {
       // SSR fallback for production
       targetUrl = `https://${subdomain}.${rootDomain}${path}`;
     } else {
       const host = window.location.host;
       const parts = host.split('.');
       
       let baseDomain = rootDomain;
       if (!baseDomain) {
         // Fallback: prod.domain.com -> domain.com
         baseDomain = parts.slice(-2).join('.');
       }

       const protocol = window.location.protocol || 'https:';
       targetUrl = `${protocol}//${subdomain}.${baseDomain}${path}`;
     }
  }

  // --- Cross-subdomain hash handoff generation ---
  if (typeof window !== 'undefined') {
      try {
          const host = window.location.host;
          const parts = host.split('.');
          const currentSubdomain = host.includes('localhost')
              ? (parts.length > 1 && parts[0] !== 'localhost' ? parts[0] : '')
              : (parts.length > 2 ? parts[0] : '');

          if (currentSubdomain === subdomain) {
              return path;
          }

          if (currentSubdomain !== subdomain) {
              const token = localStorage.getItem('access_token');
              if (token) {
                  const role = localStorage.getItem('userRole') || '';
                  const email = localStorage.getItem('userEmail') || '';
                  const specialty = localStorage.getItem('userSpecialty') || '';
                  const modules = JSON.parse(localStorage.getItem('userModules') || '[]');
                  const terminology = JSON.parse(localStorage.getItem('userTerminology') || '{}');
                  
                  const handoff = btoa(JSON.stringify({
                      access_token: token,
                      userRole: role,
                      userEmail: email,
                      userSpecialty: specialty,
                      userModules: modules,
                      userTerminology: terminology,
                      loginTime: Math.floor(Date.now() / 1000),
                  }));
                  targetUrl = `${targetUrl}#_auth=${handoff}`;
              }
          }
      } catch (e) {
          console.warn('[getDomainUrl] Failed to append cross-subdomain auth handoff:', e);
      }
  }

  return targetUrl;
}

export function getRootUrl(path: string = '') {
  const isLocal = process.env.NODE_ENV === 'development' || 
                  (typeof window !== 'undefined' && window.location.host.includes('localhost'));

  let targetUrl = '';

  if (isLocal) {
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
      const protocol = (typeof window !== 'undefined' ? window.location.protocol : 'http:') || 'http:';
      const port = host.split(':')[1] || '3000';
      targetUrl = `${protocol}//localhost:${port}${path}`;
  } else {
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';
      if (typeof window === 'undefined') {
          targetUrl = `https://${rootDomain}${path}`;
      } else {
          const host = window.location.host;
          const parts = host.split('.');
          let baseDomain = rootDomain;
          if (!baseDomain) {
              baseDomain = parts.slice(-2).join('.');
          }
          const protocol = window.location.protocol || 'https:';
          targetUrl = `${protocol}//${baseDomain}${path}`;
      }
  }

  return targetUrl;
}

export function getCurrentSubdomain(): string {
    if (typeof window === 'undefined') return '';
    const host = window.location.host.replace(/:\d+$/, '');
    
    // For localhost development
    if (host.includes('.localhost')) {
        const parts = host.split('.');
        return parts.length >= 2 && parts[0] !== 'localhost' ? parts[0] : '';
    }
    
    // For production (e.g. demo-hospital.digifortlabs.com)
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';
    if (host.endsWith(`.${rootDomain}`)) {
        return host.replace(`.${rootDomain}`, '');
    }
    
    return '';
}

