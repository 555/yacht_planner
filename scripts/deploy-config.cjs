#!/usr/bin/env node

/**
 * Deploy Configuration Script
 * Automatically enables edge runtime for production deployment to Webflow Cloud
 */

const fs = require('fs');
const path = require('path');

const API_ROUTE_PATH = path.join(__dirname, '../app/api/marinas/route.ts');

function enableEdgeRuntime() {
  try {
    let content = fs.readFileSync(API_ROUTE_PATH, 'utf8');
    
    // Enable edge runtime for production
    content = content.replace(
      '// export const runtime = \'edge\';',
      'export const runtime = \'edge\';'
    );
    
    fs.writeFileSync(API_ROUTE_PATH, content);
    console.log('✅ Edge runtime enabled for production deployment');
  } catch (error) {
    console.error('❌ Failed to enable edge runtime:', error.message);
    process.exit(1);
  }
}

function disableEdgeRuntime() {
  try {
    let content = fs.readFileSync(API_ROUTE_PATH, 'utf8');
    
    // Disable edge runtime for local development
    content = content.replace(
      'export const runtime = \'edge\';',
      '// export const runtime = \'edge\';'
    );
    
    fs.writeFileSync(API_ROUTE_PATH, content);
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
    console.log('Usage: node scripts/deploy-config.js [enable|disable]');
    console.log('  enable  - Enable edge runtime for production');
    console.log('  disable - Disable edge runtime for local development');
    process.exit(1);
} 