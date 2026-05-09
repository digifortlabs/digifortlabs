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

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname of request (e.g. demo.localhost:3000)
  const hostname = req.headers
    .get('host')!
    .replace('.localhost:3000', `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com'}`);

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
    if (path.startsWith('/admin')) {
        return NextResponse.next();
    }
    return NextResponse.rewrite(new URL(`/admin${path}`, req.url));
  }

  // 2. Hospital Subdomain (e.g., dixithospital, demo)
  if (subdomain && subdomain !== 'www' && subdomain !== 'dashboard') {
    // Rewrite to /dashboard and pass the hospital slug in a header
    const response = NextResponse.rewrite(new URL(`/dashboard${path}`, req.url));
    response.headers.set('x-hospital-slug', subdomain);
    return response;
  }

  // 3. Main Domain (Landing Page)
  return NextResponse.next();
}
