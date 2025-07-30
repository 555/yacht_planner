# Webflow Cloud App Deployment Guide

This Next.js application has been successfully configured for deployment as a Webflow Cloud app with proper asset prefix handling.

## ✅ Configuration Status

### Asset Prefix & Base Path
The app is configured to use Webflow Cloud environment variables for proper asset handling:

```javascript
// next.config.mjs
basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
```

### Image Handling
Custom image loader configured for Webflow Cloud compatibility:

```javascript
images: {
  loader: 'custom',
  loaderFile: './imageLoader.js',
}
```

## Prerequisites

- Node.js 18.18.0 or higher (required for Next.js 15)
- npm or yarn package manager
- Mapbox API token (get one free at https://mapbox.com)

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Mapbox token to `.env.local`:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
   ```

## Build Commands

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Static Export
```bash
npm run export
```

## Webflow Cloud Deployment

1. Set the `NEXT_PUBLIC_ASSET_PREFIX` environment variable to your CDN URL
2. Run `npm run build` to create the production build
3. Upload the contents of the `out` directory to your Webflow Cloud app hosting

## Features Preserved

- ✅ Sailing distance calculator functionality
- ✅ Interactive map with Mapbox integration
- ✅ Waypoint management and route calculation
- ✅ Local storage for settings persistence
- ✅ Responsive design with Tailwind CSS
- ✅ All shadcn/ui components
- ✅ Client-side rendering for map components
- ✅ SSR compatibility with proper hydration

## Technical Notes

- Uses Next.js App Router (app directory structure)
- Client components are properly marked with "use client" directive
- TypeScript configuration updated for Next.js
- ESLint configuration updated for Next.js
- All browser APIs (localStorage, etc.) have SSR-safe checks
