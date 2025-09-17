const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for server-side rendering with Amplify
  output: 'standalone',
  
  // Build optimizations
  reactStrictMode: true,
  
  // Disable features not supported in static export
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Base path configuration (if needed for deployment)
  // basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Environment variables
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://your-app.amplifyapp.com',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  
  transpilePackages: [],

  webpack: (config, { isServer }) => {
    // Ensure proper path resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };

    // Exclude PostgreSQL native modules since we're using mock data
    config.externals = config.externals || [];
    config.externals.push({
      'pg-native': 'commonjs pg-native',
      'pg': 'commonjs pg',
    });

    // Handle Node.js modules for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        dns: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        pg: false,
        'pg-native': false,
      };
    }
    
    // Important: return the modified config
    return config;
  },
};

module.exports = nextConfig;
