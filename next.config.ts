import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Configure the base path and asset prefix for Webflow Cloud deployment
  // Only apply these in production or when specifically set via environment variables
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  
  // Configure trailing slash behavior
  trailingSlash: true,
  
  // Configure images for Webflow Cloud compatibility and DevLink
  images: {
    loader: 'custom',
    loaderFile: './imageLoader.js',
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploads-ssl.webflow.com",
      },
    ],
  },
  
  // Configure ESLint
  eslint: {
    dirs: ['pages', 'components', 'lib', 'types', 'utils']
  },
  
  // Enable standalone output for OpenNext CloudFlare
  output: 'standalone',
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  }
};

export default nextConfig;
