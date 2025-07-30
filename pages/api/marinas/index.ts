import { NextApiRequest, NextApiResponse } from 'next';

// Edge runtime is required for Webflow Cloud deployment
// Comment out the line below for local development to avoid warnings
// export const runtime = 'edge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    
               // Transform Webflow "Marinas" collection data to our Marina interface
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
      debug: {
        apiUrl,
        hasItems: !!data.items,
        itemCount: data.items?.length || 0
      }
    });

  } catch (error) {
    console.error('Marina API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch marinas',
      details: error instanceof Error ? error.message : 'Unknown error',
      help: 'Check console logs for detailed error information'
    });
  }
} 