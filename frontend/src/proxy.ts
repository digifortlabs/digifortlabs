import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/demo',
  '/about',
  '/contact',
  '/services',
  '/legal',
  '/pricing',
  '/invoice-preview',
  '/forgot-password',
  '/site-map',
];

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;

  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (url.pathname.includes('.') || url.pathname.startsWith('/logo/') || url.pathname.startsWith('/_static/')) {
    return NextResponse.next();
  }

  const host = req.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digifortlabs.com';
  const hostname = host.replace(/:\d+$/, '').replace('.localhost', `.${rootDomain}`);

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;

  const subdomain = hostname.endsWith(`.${rootDomain}`)
    ? hostname.replace(`.${rootDomain}`, '')
    : '';

  if (subdomain === 'admin') {
    const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`));
    if (isPublicPath) return NextResponse.next();
    if (path.startsWith('/admin')) return NextResponse.next();
    return NextResponse.rewrite(new URL(`/admin${path === '/' ? '' : path}`, req.url));
  }

    if (subdomain && subdomain !== 'www') {
    const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`));
    if (isPublicPath) return NextResponse.next();

    // If the path already explicitly starts with /hospital or /doctor, let it pass
    if (path.startsWith('/hospital') || path.startsWith('/doctor')) {
      const response = NextResponse.next();
      response.headers.set('x-hospital-slug', subdomain);
      if (subdomain.startsWith('dr-')) {
          response.headers.set('x-doctor-slug', subdomain);
      }
      return response;
    }

    // Route doctor subdomains to /doctor
    if (subdomain.startsWith('dr-')) {
        const response = NextResponse.rewrite(new URL(`/doctor${path === '/' ? '' : path}`, req.url));
        response.headers.set('x-doctor-slug', subdomain);
        return response;
    }

    // Default to /hospital for tenant subdomains (so /records goes to /hospital/records)
    const response = NextResponse.rewrite(new URL(`/hospital${path === '/' ? '' : path}`, req.url));
    response.headers.set('x-hospital-slug', subdomain);
    return response;
  }

  return NextResponse.next();
}
