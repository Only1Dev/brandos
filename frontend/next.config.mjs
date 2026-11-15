/** @type {import('next').NextConfig} */
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brandos-xwh1.onrender.com';

const nextConfig = {
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
