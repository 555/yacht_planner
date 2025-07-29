import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Get Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the Mapbox token from Supabase secrets
    const { data, error } = await supabase.rpc('get_secret', {
      secret_name: 'MAPBOX_TOKEN'
    });

    if (error) {
      console.error('Error fetching Mapbox token:', error);
      return Response.json({ error: 'Failed to fetch token' }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: 'Mapbox token not found' }, { status: 404 });
    }

    return Response.json({ token: data });
  } catch (error) {
    console.error('Error in get-mapbox-token API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}