import { NextApiRequest, NextApiResponse } from 'next';

interface CloudflareEnv {
  DB: D1Database;
}

// Edge runtime is required for Webflow Cloud deployment
// Comment out the line below for local development to avoid warnings
// // export const runtime = 'edge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { region, bounds } = req.query;
    
    // Check if we have D1 database (CloudFlare deployment)
    const env = process.env as unknown as CloudflareEnv;
    if (env.DB) {
      return handleD1Query(req, res, env);
    }
    
    // Fallback to Webflow API for local development
    return handleWebflowQuery(req, res);
  } catch (error) {
    console.error('Marina API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch marinas',
      details: error instanceof Error ? error.message : 'Unknown error',
      help: 'Check console logs for detailed error information'
    });
  }
}

async function handleD1Query(req: NextApiRequest, res: NextApiResponse, env: CloudflareEnv) {
  const { region, bounds } = req.query;
  
  let query = 'SELECT * FROM marinas WHERE 1=1';
  const params: any[] = [];
  
  // Filter by region if provided
  if (region && typeof region === 'string') {
    query += ' AND region = ?';
    params.push(region);
  }
  
  // Filter by bounds if provided (format: "minLat,minLng,maxLat,maxLng")
  if (bounds && typeof bounds === 'string') {
    const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(Number);
    if (minLat && minLng && maxLat && maxLng) {
      query += ' AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?';
      params.push(minLat, maxLat, minLng, maxLng);
    }
  }
  
  query += ' LIMIT 500'; // Reasonable limit for map display
  
  const result = await env.DB.prepare(query).bind(...params).all();
  
  const marinas = result.results?.map((row: any) => ({
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    description: row.description,
    facilities: row.facilities ? JSON.parse(row.facilities) : [],
    contact: row.contact,
    website: row.website,
    region: row.region
  })) || [];
  
  return res.status(200).json({
    items: marinas,
    total: marinas.length,
    source: 'sqlite',
    debug: {
      query,
      paramCount: params.length,
      hasItems: !!result.results,
      itemCount: result.results?.length || 0
    }
  });
}

async function handleWebflowQuery(req: NextApiRequest, res: NextApiResponse) {
  const { region } = req.query;
  
  // Get Webflow Data API token
  const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
  const SITE_ID = process.env.WEBFLOW_SITE_ID;
  const COLLECTION_ID = process.env.WEBFLOW_MARINA_COLLECTION_ID;
    
    if (!WEBFLOW_API_TOKEN) {
      return res.status(500).json({ 
        error: 'Webflow API token not configured',
        help: 'Add WEBFLOW_API_TOKEN to your .env.local file'
      });
    }

    if (!SITE_ID) {
      return res.status(500).json({ 
        error: 'Webflow Site ID not configured',
        help: 'Add WEBFLOW_SITE_ID to your .env.local file'
      });
    }

    if (!COLLECTION_ID) {
      return res.status(500).json({ 
        error: 'Webflow Marina Collection ID not configured',
        help: 'Add WEBFLOW_MARINA_COLLECTION_ID to your .env.local file'
      });
    }

    // Build the API URL for Webflow Data API v2
    let apiUrl = `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`;
    
    // Add query parameters
    const params = new URLSearchParams();
    params.append('limit', '100');
    
    if (region && typeof region === 'string') {
      // Filter by region if provided - adjust field name as needed
      params.append('filter[region]', region);
    }
    
    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }

    console.log('Making request to:', apiUrl);
    console.log('Using token prefix:', WEBFLOW_API_TOKEN.substring(0, 8) + '...');

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webflow API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: apiUrl
      });
      
      if (response.status === 403) {
        return res.status(403).json({ 
          error: 'Webflow API access denied',
          details: 'Check your API token permissions and site access',
          troubleshooting: {
            apiToken: 'Verify token has cms:read scope',
            siteId: 'Confirm site ID is correct',
            collectionId: 'Ensure collection exists and is accessible'
          }
        });
      }
      
      throw new Error(`Webflow API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
               // Transform Webflow "marinas" collection data to our Marina interface
           const marinas = data.items?.map((item: any) => ({
             id: item.id,
             name: item.fieldData?.name || 'Unnamed Location',
      latitude: parseFloat(item.fieldData?.latitude) || null,
      longitude: parseFloat(item.fieldData?.longitude) || null,
      description: item.fieldData?.description || '',
      facilities: Array.isArray(item.fieldData?.facilities) 
        ? item.fieldData.facilities 
        : (item.fieldData?.facilities ? [item.fieldData.facilities] : []),
      contact: item.fieldData?.contact || '',
      website: item.fieldData?.website || '',
      region: item.fieldData?.region || '',
    })) || [];

    return res.status(200).json({
      items: marinas,
      total: data.items?.length || 0,
      source: 'webflow',
      debug: {
        apiUrl,
        hasItems: !!data.items,
        itemCount: data.items?.length || 0
      }
    });
} 