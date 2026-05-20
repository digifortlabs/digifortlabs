import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

// Paths that must pass through without subdomain rewriting
// (auth pages, marketing pages, etc.)
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/demo',
  '/about',
  '/contact',
  '/services',
  '/legal',
  '/pricing',
];

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;

  // Bypass proxy/rewrite for static assets and public subdirectory files
  if (url.pathname.includes('.') || url.pathname.startsWith('/logo/') || url.pathname.startsWith('/_static/')) {
    return NextResponse.next();
  }

  // Get hostname of request (e.g. demo.localhost:3000)
  const host = req.headers.get('host') || '';
  const hostname = host.replace(/:\d+$/, '').replace('.localhost', `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com'}`);

  // Get the current path (e.g. /inventory)
  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';
  
  // Extract subdomain
  const subdomain = hostname.endsWith(`.${rootDomain}`) 
    ? hostname.replace(`.${rootDomain}`, '') 
    : '';

  // 1. Admin Subdomain
  if (subdomain === 'admin') {
    // Allow public/auth paths to pass through unchanged
    const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`));
    if (isPublicPath) {
      return NextResponse.next();
    }
    // Rewrite admin subdomain paths to /dashboard
    return NextResponse.rewrite(new URL(`/dashboard${path}`, req.url));
  }

  // 2. Hospital Subdomain (e.g., dixithospital, demo)
  if (subdomain && subdomain !== 'www' && subdomain !== 'dashboard') {
    // Allow public/auth paths to pass through unchanged
    const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`));
    if (isPublicPath) {
      return NextResponse.next();
    }

    // Already on /dashboard — just pass through but still set the slug header
    if (path.startsWith('/dashboard')) {
      const response = NextResponse.next();
      response.headers.set('x-hospital-slug', subdomain);
      return response;
    }

    // Rewrite all other paths to /dashboard and pass the hospital slug
    const response = NextResponse.rewrite(new URL(`/dashboard${path}`, req.url));
    response.headers.set('x-hospital-slug', subdomain);
    return response;
  }

  // 3. Main Domain (Landing Page)
  return NextResponse.next();
}
