export default function imageLoader({ src, width, quality }) {
  // For Webflow Cloud apps, we need to handle image loading differently
  // This loader will work with the assetPrefix for proper CDN support
  const params = new URLSearchParams();
  params.set('w', width.toString());
  if (quality) {
    params.set('q', quality.toString());
  }
  
  // If there's an asset prefix, use it for image URLs
  const prefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || '';
  const baseUrl = prefix ? prefix : '';
  
  // Handle both absolute and relative URLs
  if (src.startsWith('http')) {
    return src; // Return absolute URLs as-is
  }
  
  // For relative URLs, prepend the asset prefix
  return `${baseUrl}${src}`;
}
