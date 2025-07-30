#!/usr/bin/env node

/**
 * Webflow API Test Script
 * Tests your environment variables and API access
 */

require('dotenv').config({ path: '.env.local' });

const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
const WEBFLOW_SITE_ID = process.env.WEBFLOW_SITE_ID;
const WEBFLOW_MARINA_COLLECTION_ID = process.env.WEBFLOW_MARINA_COLLECTION_ID;

console.log('🔍 Webflow API Configuration Test\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`✅ API Token: ${WEBFLOW_API_TOKEN ? 'Set (' + WEBFLOW_API_TOKEN.substring(0, 8) + '...)' : '❌ Missing'}`);
console.log(`✅ Site ID: ${WEBFLOW_SITE_ID || '❌ Missing'}`);
console.log(`✅ Collection ID: ${WEBFLOW_MARINA_COLLECTION_ID || '❌ Missing'}\n`);

if (!WEBFLOW_API_TOKEN || !WEBFLOW_SITE_ID || !WEBFLOW_MARINA_COLLECTION_ID) {
  console.log('❌ Missing required environment variables.');
  console.log('📝 Add them to your .env.local file:\n');
  console.log('WEBFLOW_API_TOKEN=your_token_here');
  console.log('WEBFLOW_SITE_ID=your_site_id_here');
  console.log('WEBFLOW_MARINA_COLLECTION_ID=your_collection_id_here\n');
  process.exit(1);
}

// Test API access
async function testAPI() {
  try {
    console.log('🌐 Testing API Access...\n');
    
    // Test 1: Site access
    console.log('1️⃣ Testing site access...');
    const siteResponse = await fetch(`https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}`, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    if (siteResponse.ok) {
      const siteData = await siteResponse.json();
      console.log(`✅ Site access OK: ${siteData.displayName || 'Unknown site'}`);
    } else {
      console.log(`❌ Site access failed: ${siteResponse.status} ${siteResponse.statusText}`);
      const errorText = await siteResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
    // Test 2: Collection access
    console.log('\n2️⃣ Testing collection access...');
    const collectionResponse = await fetch(`https://api.webflow.com/v2/collections/${WEBFLOW_MARINA_COLLECTION_ID}/items?limit=1`, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    if (collectionResponse.ok) {
      const collectionData = await collectionResponse.json();
      console.log(`✅ Collection access OK: Found ${collectionData.items?.length || 0} items`);
      if (collectionData.items?.length > 0) {
        console.log(`   Sample item: ${collectionData.items[0].fieldData?.name || 'Unnamed'}`);
      }
    } else {
      console.log(`❌ Collection access failed: ${collectionResponse.status} ${collectionResponse.statusText}`);
      const errorText = await collectionResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
    console.log('\n🎉 API test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI(); 