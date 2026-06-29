/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Hide Next.js version
  
  // Compress responses
  compress: true,
  
  // Security: prevent env leak
  serverRuntimeConfig: {
    // Only available server-side
  },
  
  // Allowed image domains
  images: {
    domains: ['avatars.githubusercontent.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers for extra security (also set in middleware)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ]
  },

  // Webpack: prevent sensitive module exposure
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent server-only modules from being bundled on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    return config
  },

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['archiver'],
  },
}

module.exports = nextConfig
