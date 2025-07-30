#!/usr/bin/env node

/**
 * Deploy Configuration Script for Pages Router
 * Automatically enables edge runtime for production deployment to CloudFlare Pages
 * Updated: 2025-01-30 - Fixed for Pages Router structure
 */

const fs = require('fs');
const path = require('path');

// API routes for Pages Router
const API_ROUTES = [
  path.join(__dirname, '../pages/api/marinas/index.ts'),
  path.join(__dirname, '../pages/api/marinas/status.ts'),
  path.join(__dirname, '../pages/api/marinas/sync.ts'),
];

function enableEdgeRuntime() {
  try {
    console.log('🔧 Deploy Config: Pages Router Structure (Updated 2025-01-30)');
    console.log('📁 API Routes to process:', API_ROUTES.length);
    
    API_ROUTES.forEach(routePath => {
      console.log(`📂 Checking: ${routePath}`);
      if (fs.existsSync(routePath)) {
        let content = fs.readFileSync(routePath, 'utf8');
        
        // Enable edge runtime for production
        content = content.replace(
          '// export const runtime = \'edge\';',
          'export const runtime = \'edge\';'
        );
        
        fs.writeFileSync(routePath, content);
        console.log(`✅ Edge runtime enabled for ${path.basename(routePath)}`);
      } else {
        console.log(`⚠️  File not found: ${routePath}`);
      }
    });
    console.log('✅ Edge runtime enabled for production deployment (Pages Router)');
  } catch (error) {
    console.error('❌ Failed to enable edge runtime:', error.message);
    console.error('📁 Working directory:', process.cwd());
    console.error('📂 Script directory:', __dirname);
    process.exit(1);
  }
}

function disableEdgeRuntime() {
  try {
    API_ROUTES.forEach(routePath => {
      if (fs.existsSync(routePath)) {
        let content = fs.readFileSync(routePath, 'utf8');
        
        // Disable edge runtime for local development
        content = content.replace(
          'export const runtime = \'edge\';',
          '// export const runtime = \'edge\';'
        );
        
        fs.writeFileSync(routePath, content);
        console.log(`✅ Edge runtime disabled for ${path.basename(routePath)}`);
      }
    });
    console.log('✅ Edge runtime disabled for local development');
  } catch (error) {
    console.error('❌ Failed to disable edge runtime:', error.message);
    process.exit(1);
  }
}

const command = process.argv[2];

switch (command) {
  case 'enable':
    enableEdgeRuntime();
    break;
  case 'disable':
    disableEdgeRuntime();
    break;
  default:
    console.log('Usage: node scripts/deploy-config.cjs [enable|disable]');
    console.log('  enable  - Enable edge runtime for production (Pages Router)');
    console.log('  disable - Disable edge runtime for local development (Pages Router)');
    process.exit(1);
} 