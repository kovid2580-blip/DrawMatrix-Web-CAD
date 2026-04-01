/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minify with the Rust-based SWC compiler (faster builds, smaller bundle)
  swcMinify: true,

  // Compress responses with gzip/brotli
  compress: true,

  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }];
    return config;
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable React strict mode for catching subtle runtime issues early
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    console.log(`[Next.js Config] Backend URL for rewrites: ${backendUrl}`);

    return [
      {
        source: '/api/schedules/:path*',
        destination: `${backendUrl}/api/schedules/:path*`,
      },
      {
        source: '/api/projects/:path*',
        destination: `${backendUrl}/api/projects/:path*`,
      },
      {
        source: '/api/messages/:path*',
        destination: `${backendUrl}/api/messages/:path*`,
      },
      {
        source: '/api/presence',
        destination: `${backendUrl}/api/presence`,
      },
      {
        source: '/get-users',
        destination: `${backendUrl}/get-users`,
      },
    ];
  },
};

module.exports = nextConfig;
