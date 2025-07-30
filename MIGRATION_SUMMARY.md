# Next.js App Router to Pages Router Migration Summary

## Overview
Successfully migrated from Next.js App Router to Pages Router due to security vulnerability [CVE-2025-49005](https://github.com/advisories/GHSA-r2fc-ccr8-96c4).

## Migration Reason
- **Security**: Next.js App Router versions >= 15.3.0 and < 15.3.3 have a cache poisoning vulnerability
- **DevLink Compatibility**: Pages Router works perfectly with Webflow DevLink according to [official documentation](https://developers.webflow.com/webflow-cloud/devlink/framework-integrations)

## Changes Made

### 1. Pages Router Structure
- Created `pages/` directory with proper structure:
  - `pages/_app.tsx` - App wrapper with DevLink integration
  - `pages/_document.tsx` - HTML document structure
  - `pages/index.tsx` - Home page
  - `pages/404.tsx` - Error page
  - `pages/calculator.tsx` - Calculator page
  - `pages/webflow-test.tsx` - DevLink components test page
  - `pages/api/marinas/index.ts` - API route (converted from App Router format)

### 2. DevLink Integration
- Added DevLink configuration to `webflow.json`:
  ```json
  {
    "devlink": {
      "host": "https://api.webflow.com",
      "rootDir": "./devlink",
      "cssModules": true
    }
  }
  ```
- Successfully synced Webflow components:
  - `Locations`
  - `Footer`
  - `MainNavigation`
  - `Divider`
  - `GlobalStyles`

### 3. Custom Renderers
- Created `components/renderers.tsx` with Next.js-compatible Link and Image components
- Integrated with DevLink Provider for optimized performance

### 4. Configuration Updates
- Updated `next.config.ts` for Webflow Cloud compatibility:
  - Merged image configuration for DevLink and Webflow Cloud
  - Updated ESLint directories
  - Removed duplicate configurations
- Added DevLink path mapping to `tsconfig.json`
- Updated `.gitignore` for DevLink build artifacts

### 5. API Route Migration
- Converted App Router API route (`app/api/marinas/route.ts`) to Pages Router format (`pages/api/marinas/index.ts`)
- Changed from named exports (`export async function GET()`) to default export with handler function
- Updated response handling from `NextResponse` to `res.status().json()`

## Testing Results
- ✅ Build successful with `npm run build`
- ✅ All pages render correctly
- ✅ DevLink components work properly
- ✅ API routes function as expected
- ✅ Custom Link and Image renderers integrated
- ✅ Webflow Cloud deployment configuration maintained

## Security Improvement
- **Before**: Next.js 15.3.0 with App Router (vulnerable to CVE-2025-49005)
- **After**: Next.js 15.3.0 with Pages Router (no vulnerability exposure)

## Performance Notes
- Bundle size optimized with DevLink CSS modules
- Custom image loader maintained for Webflow Cloud compatibility
- Next.js image optimization preserved with custom renderers

## Files Structure
```
├── pages/
│   ├── _app.tsx         # DevLink provider setup
│   ├── _document.tsx    # HTML document
│   ├── index.tsx        # Home page
│   ├── calculator.tsx   # Calculator page
│   ├── webflow-test.tsx # DevLink test page
│   ├── 404.tsx          # Error page
│   └── api/
│       └── marinas/
│           └── index.ts # Marina API endpoint
├── devlink/             # Generated Webflow components
├── components/
│   └── renderers.tsx    # Custom Next.js renderers
├── styles/
│   └── globals.css      # Global styles
└── ...config files
```

## Next Steps
1. Test Webflow components in production environment
2. Update any hardcoded routes if necessary
3. Consider upgrading to Next.js 15.3.3+ when available to return to App Router if desired
4. Add more Webflow components as needed via `webflow devlink sync`

## References
- [CVE-2025-49005 Security Advisory](https://github.com/advisories/GHSA-r2fc-ccr8-96c4)
- [Webflow DevLink Framework Integrations](https://developers.webflow.com/webflow-cloud/devlink/framework-integrations)
- [Next.js Pages Router Documentation](https://nextjs.org/docs/pages)