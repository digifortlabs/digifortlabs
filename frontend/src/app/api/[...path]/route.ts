import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function proxy(req: NextRequest) {
    const host = req.headers.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const backendUrl = isLocal ? 'http://localhost:8000' : BACKEND;

    // Strip /api/ prefix to get the backend path
    const backendPath = req.nextUrl.pathname.replace(/^\/api\//, '');
    const search = req.nextUrl.search;
    const url = `${backendUrl}/${backendPath}${search}`;

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'host') {
            headers[key] = value;
        }
    });

    let body: string | undefined;
    if (!['GET', 'HEAD'].includes(req.method)) {
        body = await req.text();
    }

    // SSRF Prevention: Validate dynamically constructed URLs
    let isSafe = false;
    try {
        const parsedUrl = new URL(url);
        const allowedDomains = ['localhost', '127.0.0.1', 'digifortlabs.com', 'api.digifortlabs.com'];
        // Also allow whatever is specifically set in NEXT_PUBLIC_API_URL
        if (BACKEND) {
            try {
                const backendParsed = new URL(BACKEND);
                allowedDomains.push(backendParsed.hostname);
            } catch (e) {}
        }
        
        if (allowedDomains.includes(parsedUrl.hostname)) {
            isSafe = true;
        }
    } catch {
        isSafe = false;
    }

    if (!isSafe) {
        return NextResponse.json({ error: 'Blocked: Target URL is not in the allowed list.' }, { status: 403 });
    }

    const backendRes = await fetch(url, {
        method: req.method,
        headers,
        body,
    });

    const resHeaders = new Headers();
    backendRes.headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'transfer-encoding') {
            resHeaders.set(key, value);
        }
    });

    return new NextResponse(backendRes.body, {
        status: backendRes.status,
        headers: resHeaders,
    });
}

export async function GET(req: NextRequest) { return proxy(req); }
export async function POST(req: NextRequest) { return proxy(req); }
export async function PUT(req: NextRequest) { return proxy(req); }
export async function PATCH(req: NextRequest) { return proxy(req); }
export async function DELETE(req: NextRequest) { return proxy(req); }
