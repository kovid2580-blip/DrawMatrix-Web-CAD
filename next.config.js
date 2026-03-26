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
};

module.exports = nextConfig;
