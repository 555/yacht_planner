# SQLite Storage Implementation

This document outlines the SQLite storage implementation for overcoming Webflow's 100-item collection limit and enabling dynamic marina loading.

## Overview

The application now supports two storage modes:
1. **Development Mode**: Direct Webflow API calls (limited to 100 items)
2. **Production Mode**: SQLite database with CloudFlare D1 (unlimited items with pagination)

## Features

### 🗄️ SQLite Database Schema
- **marinas table**: Stores all marina data locally
- **sync_status table**: Tracks synchronization status
- Spatial indexing for efficient location-based queries

### 🔄 Data Synchronization
- **Endpoint**: `POST /api/marinas/sync`
- Fetches ALL marinas from Webflow (overcoming 100-item limit)
- Stores data in SQLite for fast querying
- Supports pagination to handle large datasets

### 🗺️ Dynamic Loading
- Marinas load dynamically based on map viewport
- 1-second debouncing to prevent excessive API calls
- Bounds-based filtering: `GET /api/marinas?bounds=minLat,minLng,maxLat,maxLng`
- Up to 500 marinas per request for optimal performance

### 📊 Status Monitoring
- **Endpoint**: `GET /api/marinas/status`
- Check storage mode and sync status
- Monitor database health

## API Endpoints

### 1. Get Marinas
```
GET /api/marinas/
GET /api/marinas/?region=caribbean
GET /api/marinas/?bounds=25.0,-80.0,26.0,-79.0
```

**Response:**
```json
{
  "items": [...],
  "total": 150,
  "source": "sqlite|webflow",
  "debug": {...}
}
```

### 2. Sync Data
```
POST /api/marinas/sync
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully synced 250 marinas",
  "total": 250
}
```

### 3. Check Status
```
GET /api/marinas/status
```

**Response:**
```json
{
  "status": "ready",
  "storage": "sqlite",
  "lastSync": "2024-01-15T10:30:00Z",
  "totalMarinas": 250,
  "syncStatus": "completed"
}
```

## Deployment Setup

### 1. CloudFlare D1 Database

Create D1 database:
```bash
npx wrangler d1 create yacht_planner_db
```

Update `wrangler.jsonc` with the database ID:
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "yacht_planner_db",
      "database_id": "your-actual-database-id",
      "migrations_dir": "./migrations"
    }
  ]
}
```

### 2. Run Migrations

```bash
npx wrangler d1 migrations apply yacht_planner_db --remote
```

### 3. Initial Data Sync

After deployment, sync data from Webflow:
```bash
curl -X POST https://your-app.pages.dev/api/marinas/sync
```

## Environment Variables

```env
# Required for both modes
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Required for Webflow API access
WEBFLOW_API_TOKEN=your_webflow_token
WEBFLOW_SITE_ID=your_site_id
WEBFLOW_MARINA_COLLECTION_ID=your_collection_id
```

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Storage | Webflow API | SQLite (D1) |
| Item Limit | 100 items | Unlimited |
| Performance | Direct API | Cached locally |
| Dynamic Loading | ❌ No bounds filtering | ✅ Bounds-based queries |
| Offline Support | ❌ No | ✅ Yes (after sync) |

## Benefits

### 🚀 Performance
- Reduced API calls to Webflow
- Faster query responses from local SQLite
- Efficient spatial indexing for location queries

### 📈 Scalability
- No 100-item limit from Webflow collections
- Handle thousands of marinas efficiently
- Pagination support for large datasets

### 🎯 User Experience
- Dynamic loading based on map viewport
- Smooth map interaction without API delays
- Real-time marina discovery as users explore

### 💰 Cost Efficiency
- Reduced Webflow API usage
- Lower CloudFlare function execution time
- Optimized bandwidth usage

## Migration Path

1. **Phase 1**: Deploy with SQLite support (current)
2. **Phase 2**: Copy Locations collection to Marinas in Webflow
3. **Phase 3**: Run initial sync to populate SQLite
4. **Phase 4**: Test dynamic loading functionality
5. **Phase 5**: Add more marinas to Webflow collection (>100 items)

## Monitoring

Check system status:
```bash
curl https://your-app.pages.dev/api/marinas/status
```

Monitor sync health and trigger re-sync if needed:
```bash
curl -X POST https://your-app.pages.dev/api/marinas/sync
```