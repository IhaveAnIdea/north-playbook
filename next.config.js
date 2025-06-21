/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console.logs in production
  },
  
  // External packages configuration
  serverExternalPackages: ['pg', 'pg-native'],
  
  // Enable faster development builds
  onDemandEntries: {
    // Keep pages in memory longer to avoid recompilation
    maxInactiveAge: 60 * 1000, // 1 minute
    pagesBufferLength: 5, // Keep 5 pages in memory
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: true, // For static export compatibility
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during build
  },
  
  // Webpack configuration for both development and production
  webpack: (config, { isServer }) => {
    // Client-side fallbacks for server-only modules
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        dns: false,
        tls: false,
        pg: false,
        'pg-native': false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig 