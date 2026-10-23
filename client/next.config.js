const API_URL = process.env.API_URL || 'http://localhost:5000';

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Same-origin proxy: the httpOnly auth cookie is set on the Next.js origin, so no CORS or third-party-cookie issues.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};
