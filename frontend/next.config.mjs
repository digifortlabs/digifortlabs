/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8000/:path*', // Proxy to Backend
            },
        ];
    },
};

export default nextConfig;
