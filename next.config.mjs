/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure the base path and asset prefix for Webflow Cloud deployment
  // Only apply these in production or when specifically set via environment variables
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  
  // Configure trailing slash behavior
  trailingSlash: true,
  
  // Configure images for Webflow Cloud compatibility
  images: {
    loader: 'custom',
    loaderFile: './imageLoader.js',
  },
  
  // Configure ESLint
  eslint: {
    dirs: ['app', 'components', 'lib', 'types', 'utils']
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  }
};

export default nextConfig;
