import { NextRequest, NextResponse } from 'next/server';

// Proxy /api/auth/token to FastAPI and re-set the auth cookie on localhost:3000
// so it's sent correctly on all subsequent /api/* proxy requests.
export async function POST(req: NextRequest) {
    const body = await req.text();
    const headers: Record<string, string> = {
        'Content-Type': req.headers.get('content-type') || 'application/x-www-form-urlencoded',
    };
    if (req.headers.get('x-csrf-token')) headers['X-CSRF-Token'] = req.headers.get('x-csrf-token')!;
    if (req.headers.get('x-device-id')) headers['X-Device-Id'] = req.headers.get('x-device-id')!;

    // Forward cookies from browser to backend (for CSRF)
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const backendRes = await fetch(`${backendUrl}/auth/token`, {
        method: 'POST',
        headers,
        body,
    });

    const data = await backendRes.json();

    const res = NextResponse.json(data, { status: backendRes.status });

    // Re-set the access_token cookie on port 3000 so it's sent on all /api/* requests
    if (backendRes.ok && data.access_token) {
        res.cookies.set('access_token', `Bearer ${data.access_token}`, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
    }

    // Forward any other Set-Cookie headers from backend (CSRF token etc.)
    backendRes.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie' && !value.includes('access_token')) {
            res.headers.append('set-cookie', value);
        }
    });

    return res;
}
