/** @type {import('next').NextConfig} */
const nextConfig = {
  // Base path for production deployment behind nginx proxy (leave empty for local dev at /)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Asset prefix for static assets
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Standalone output for Docker deployment
  output: 'standalone',

  // Lower memory usage when using Webpack (next dev --webpack / next build --webpack)
  experimental: {
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
  },
};

export default nextConfig;
