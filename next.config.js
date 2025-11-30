/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdfkit', '@google-cloud/vision', 'pdfjs-dist', 'canvas', 'pdf-parse'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  // Add empty turbopack config to silence warning, or use webpack explicitly
  turbopack: {},
  // Keep webpack config for production builds
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle these native modules - they'll be loaded at runtime
      config.externals = [...(config.externals || []), 'canvas', 'pdfjs-dist'];
    }
    return config;
  },
}

module.exports = nextConfig
