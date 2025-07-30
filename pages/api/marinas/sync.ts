import { NextApiRequest, NextApiResponse } from 'next';

interface CloudflareEnv {
  DB: D1Database;
  WEBFLOW_API_TOKEN?: string;
  WEBFLOW_SITE_ID?: string;
  WEBFLOW_MARINA_COLLECTION_ID?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For local development, return a message about CloudFlare deployment
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        message: 'Sync endpoint is only available in CloudFlare Pages deployment with D1 database',
        help: 'Deploy to CloudFlare Pages to use the sync functionality'
      });
    }

    // This code will run in CloudFlare Pages environment
    const env = process.env as unknown as CloudflareEnv;
    
    if (!env.DB) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    if (!env.WEBFLOW_API_TOKEN || !env.WEBFLOW_MARINA_COLLECTION_ID) {
      return res.status(500).json({ 
        error: 'Webflow configuration missing',
        help: 'Configure WEBFLOW_API_TOKEN and WEBFLOW_MARINA_COLLECTION_ID environment variables'
      });
    }

    // Fetch all marinas from Webflow (with pagination to get more than 100)
    const allMarinas: any[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const apiUrl = `https://api.webflow.com/v2/collections/${env.WEBFLOW_MARINA_COLLECTION_ID}/items?limit=${limit}&offset=${offset}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${env.WEBFLOW_API_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Webflow API error: ${response.status}`);
      }

      const data = await response.json();
      const items = data.items || [];
      
      allMarinas.push(...items);
      
      hasMore = items.length === limit;
      offset += limit;
    }

    // Clear existing marinas and insert new ones
    await env.DB.prepare('DELETE FROM marinas').run();

    // Insert marinas in batches
    const batchSize = 25;
    for (let i = 0; i < allMarinas.length; i += batchSize) {
      const batch = allMarinas.slice(i, i + batchSize);
      
      for (const item of batch) {
        await env.DB.prepare(`
          INSERT INTO marinas (
            id, webflow_id, name, latitude, longitude, 
            description, facilities, contact, website, region
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          item.id,
          item.id,
          item.fieldData?.name || 'Unnamed Marina',
          parseFloat(item.fieldData?.latitude) || null,
          parseFloat(item.fieldData?.longitude) || null,
          item.fieldData?.description || '',
          JSON.stringify(item.fieldData?.facilities || []),
          item.fieldData?.contact || '',
          item.fieldData?.website || '',
          item.fieldData?.region || ''
        ).run();
      }
    }

    // Update sync status
    await env.DB.prepare(`
      INSERT OR REPLACE INTO sync_status (id, last_sync_at, total_marinas, sync_status)
      VALUES (1, datetime('now'), ?, 'completed')
    `).bind(allMarinas.length).run();

    return res.status(200).json({
      success: true,
      message: `Successfully synced ${allMarinas.length} marinas`,
      total: allMarinas.length
    });

  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({ 
      error: 'Failed to sync marinas',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}