import { NextApiRequest, NextApiResponse } from 'next';

interface CloudflareEnv {
  DB: D1Database;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For local development
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        status: 'development',
        storage: 'webflow-api',
        message: 'Using Webflow API directly in development mode'
      });
    }

    // For CloudFlare Pages deployment
    const env = process.env as unknown as CloudflareEnv;
    if (!env.DB) {
      return res.status(200).json({
        status: 'no-database',
        storage: 'webflow-api',
        message: 'D1 database not configured, falling back to Webflow API'
      });
    }

    // Check sync status from database
    const result = await env.DB.prepare(
      'SELECT * FROM sync_status ORDER BY last_sync_at DESC LIMIT 1'
    ).first();

    if (!result) {
      return res.status(200).json({
        status: 'needs-sync',
        storage: 'sqlite',
        message: 'Database configured but no sync performed yet',
        action: 'POST /api/marinas/sync to sync data from Webflow'
      });
    }

    return res.status(200).json({
      status: 'ready',
      storage: 'sqlite',
      lastSync: result.last_sync_at,
      totalMarinas: result.total_marinas,
      syncStatus: result.sync_status
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ 
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}