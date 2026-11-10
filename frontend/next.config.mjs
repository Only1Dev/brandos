/** @type {import('next').NextConfig} */
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

const nextConfig = {
  reactStrictMode: false,
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
