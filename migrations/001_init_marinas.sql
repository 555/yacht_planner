-- Create marinas table to store marina data locally
CREATE TABLE IF NOT EXISTS marinas (
  id TEXT PRIMARY KEY,
  webflow_id TEXT UNIQUE,
  name TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  description TEXT,
  facilities TEXT, -- JSON array as text
  contact TEXT,
  website TEXT,
  region TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for efficient location-based queries
CREATE INDEX IF NOT EXISTS idx_marinas_location ON marinas(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_marinas_region ON marinas(region);
CREATE INDEX IF NOT EXISTS idx_marinas_webflow_id ON marinas(webflow_id);

-- Create sync tracking table
CREATE TABLE IF NOT EXISTS sync_status (
  id INTEGER PRIMARY KEY,
  last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_marinas INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'pending'
);