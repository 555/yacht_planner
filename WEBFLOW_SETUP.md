# Webflow Data API Setup Guide

## 1. Get Your Site ID
1. Go to your Webflow Designer
2. Click the Settings gear icon (⚙️) 
3. Go to **General** tab
4. Copy the **Site ID** from the Site Info section

## 2. Use Existing "Locations" Collection
Your existing "Locations" collection will be used for marina data.
- **Collection Name**: "Locations" 
- **Collection ID**: `6594a0e49ab7a11567a87669`
- **Expected fields** (the API will work with whatever fields exist):
   - **name** (Single line text) - Primary field
   - **latitude** (Number) - For map positioning
   - **longitude** (Number) - For map positioning
   - **description** (Multi-line text) - Optional
   - **facilities** (Multi-select or Tags) - Optional
   - **contact** (Single line text) - Optional
   - **website** (Link) - Optional
   - **region** (Single line text) - Optional for filtering

## 3. Get API Token
1. Go to [Webflow Account → Apps & Integrations](https://webflow.com/dashboard/account/apps)
2. Click **"Register New App"**
3. Fill in:
   - **App Name**: Yacht Planner
   - **Description**: Marina data for sailing calculator
   - **Homepage URL**: https://yourdomain.com
   - **Redirect URI**: https://yourdomain.com/auth/callback
4. Select scopes:
   - ✅ `cms:read` (required)
   - ✅ `cms:write` (if you plan to add marinas via API)
5. Copy your **API Token**

## 4. Add to Environment Files

### Local Development (.env.local):
```bash
WEBFLOW_API_TOKEN=your_api_token_here
WEBFLOW_SITE_ID=65142014c5bb2454cd8c825b  
WEBFLOW_MARINA_COLLECTION_ID=6594a0e49ab7a11567a87669
```

### Production (Webflow Cloud Dashboard):
Add these variables in your Webflow Cloud environment settings:
```bash
WEBFLOW_API_TOKEN=your_api_token_here  # Mark as "Secret"
WEBFLOW_SITE_ID=65142014c5bb2454cd8c825b
WEBFLOW_MARINA_COLLECTION_ID=6594a0e49ab7a11567a87669
```

## 5. Test Your Setup
```bash
npm run dev
# Visit http://localhost:3000
# The marina list should load (or show an error if not configured)
```

## 6. Verify Your Existing Location Data
Your "Locations" collection should already contain marina/location data with:
- **Name**: Location names
- **Latitude/Longitude**: GPS coordinates for map positioning
- **Other fields**: Any additional details (description, facilities, etc.)

The API will automatically work with whatever fields exist in your collection. 