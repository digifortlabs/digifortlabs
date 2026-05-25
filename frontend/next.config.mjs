/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Preserve trailing slashes when proxying /api/* to the FastAPI backend.
    // Without this, Next.js 308-redirects "/api/hospitals/?x=1" -> "/api/hospitals?x=1",
    // which then hits FastAPI's "/hospitals/" route and triggers a 307 to an absolute
    // localhost:8000 URL — a cross-origin redirect that drops auth cookies.
    skipTrailingSlashRedirect: true,
};

export default nextConfig;
