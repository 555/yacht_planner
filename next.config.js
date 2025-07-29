/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/sailing-calculator' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/sailing-calculator' : '',
  images: {
    unoptimized: true,
  },
  experimental: {
    esmExternals: 'loose',
  },
}

module.exports = nextConfig