# Webflow Data API Setup Guide

## 1. Get Your Site ID
1. Go to your Webflow Designer
2. Click the Settings gear icon (⚙️) 
3. Go to **General** tab
4. Copy the **Site ID** from the Site Info section

## 2. Create Marina Collection
1. In Webflow Designer, go to **CMS** tab
2. Click **+ Create Collection**
3. Name it "Marinas"
4. Add these fields:
   - **name** (Single line text) - Required
   - **latitude** (Number)
   - **longitude** (Number) 
   - **description** (Multi-line text)
   - **facilities** (Multi-select or Tags)
   - **contact** (Single line text)
   - **website** (Link)
   - **region** (Single line text)
5. Copy the **Collection ID** from the collection settings

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
WEBFLOW_SITE_ID=your_site_id_here  
WEBFLOW_MARINA_COLLECTION_ID=your_collection_id_here
```

### Production (Webflow Cloud Dashboard):
Add the same variables in your environment settings, marking the API token as "Secret".

## 5. Test Your Setup
```bash
npm run dev
# Visit http://localhost:3000
# The marina list should load (or show an error if not configured)
```

## 6. Add Sample Marina Data
In your Webflow CMS, add a few sample marinas to test:
- **Name**: "Marina Bay"
- **Latitude**: 37.7749
- **Longitude**: -122.4194
- **Description**: "Beautiful marina in the bay"
- **Facilities**: ["Fuel", "WiFi", "Restaurant"]
- **Region**: "San Francisco Bay" 