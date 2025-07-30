# Webflow API 403 Forbidden - Troubleshooting Guide

## Common Causes & Solutions

### 1. Missing Environment Variables
Check your `.env.local` file contains:
```bash
WEBFLOW_API_TOKEN=your_actual_api_token_here
WEBFLOW_SITE_ID=your_site_id_here  
WEBFLOW_MARINA_COLLECTION_ID=your_collection_id_here
```

### 2. Invalid API Token
**Problem**: API token is missing, expired, or incorrect
**Solution**: 
1. Go to [Webflow Account → Apps & Integrations](https://webflow.com/dashboard/account/apps)
2. Create a new app or regenerate token
3. Ensure scopes include `cms:read`

### 3. Wrong Site ID
**Problem**: Using incorrect Site ID
**Solution**:
1. Go to Webflow Designer
2. Settings (⚙️) → General → Site Info
3. Copy the correct Site ID

### 4. Collection Doesn't Exist
**Problem**: Marina collection not created or wrong ID
**Solution**:
1. Create "Marinas" collection in Webflow CMS
2. Add required fields (name, latitude, longitude, etc.)
3. Copy the Collection ID from collection settings

### 5. API Endpoint Issues
**Problem**: Using wrong API version or endpoint
**Solution**: Verify you're using Webflow API v2:
```
https://api.webflow.com/v2/collections/{collection_id}/items
```

## Quick Fix Commands

### Test API Token:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     https://api.webflow.com/v2/sites/YOUR_SITE_ID
```

### Test Collection Access:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     https://api.webflow.com/v2/collections/YOUR_COLLECTION_ID/items?limit=1
```

## Environment Variable Template
Add this to your `.env.local`:
```bash
# Get from Webflow Account → Apps & Integrations
WEBFLOW_API_TOKEN=wf_live_xxx...

# Get from Webflow Designer → Settings → General
WEBFLOW_SITE_ID=66xxx...

# Get from Webflow CMS → Collection Settings
WEBFLOW_MARINA_COLLECTION_ID=66xxx...
``` 