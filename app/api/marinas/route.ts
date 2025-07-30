import { NextRequest, NextResponse } from 'next/server';

// Edge runtime is required for Webflow Cloud deployment
// Comment out the line below for local development to avoid warnings
// // export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    
    // Get Webflow Data API token
    const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
    
    if (!WEBFLOW_API_TOKEN) {
      return NextResponse.json(
        { error: 'Webflow API token not configured' },
        { status: 500 }
      );
    }

    // Example: Replace with your actual site ID and collection ID
    const SITE_ID = process.env.WEBFLOW_SITE_ID || 'your_site_id';
    const COLLECTION_ID = process.env.WEBFLOW_MARINA_COLLECTION_ID || 'your_collection_id';

    // Build the API URL for Webflow Data API v2
    let apiUrl = `https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`;
    
    // Add query parameters
    const params = new URLSearchParams();
    params.append('limit', '100');
    
    if (region) {
      // Filter by region if provided - adjust field name as needed
      params.append('filter[region]', region);
    }
    
    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${WEBFLOW_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Webflow API error:', response.status, response.statusText);
      throw new Error(`Webflow API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Webflow CMS data to our Marina interface
    const marinas = data.items?.map((item: any) => ({
      id: item.id,
      name: item.fieldData?.name || 'Unnamed Marina',
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

    return NextResponse.json({
      items: marinas,
      total: data.items?.length || 0,
    });

  } catch (error) {
    console.error('Marina API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch marinas',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 