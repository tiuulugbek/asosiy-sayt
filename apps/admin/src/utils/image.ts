/**
 * Normalize image URL for display in admin panel
 * Converts relative URLs to absolute URLs using the API base URL
 * Also handles incorrect domain patterns like acoustic.uz/api/uploads/
 */
export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // If already absolute URL, ensure pathname is properly encoded and fix domain
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      
      // Fix incorrect domain: acoustic.uz -> a.acoustic.uz
      if (urlObj.hostname === 'acoustic.uz' || urlObj.hostname === 'www.acoustic.uz') {
        urlObj.hostname = 'a.acoustic.uz';
      }
      
      // Fix incorrect domain: localhost:3001 -> a.acoustic.uz (in production)
      if (urlObj.hostname === 'localhost' && urlObj.port === '3001') {
        urlObj.hostname = 'a.acoustic.uz';
        urlObj.port = '';
        urlObj.protocol = 'https:';
      }
      
      // Fix api.acoustic.uz -> a.acoustic.uz (old API domain)
      if (urlObj.hostname === 'api.acoustic.uz') {
        urlObj.hostname = 'a.acoustic.uz';
      }
      
      // Remove /api from pathname if present (uploads should be directly under domain)
      if (urlObj.pathname.startsWith('/api/uploads/')) {
        urlObj.pathname = urlObj.pathname.replace('/api/uploads/', '/uploads/');
      } else if (urlObj.pathname.startsWith('/api/') && urlObj.pathname.includes('/uploads/')) {
        // Handle cases like /api/something/uploads/...
        urlObj.pathname = urlObj.pathname.replace(/\/api\//, '/');
      }
      
      // For /uploads/ paths, do not encode filename (e.g. . -> %2E can cause 404 on some servers)
      if (!urlObj.pathname.startsWith('/uploads/')) {
        const pathParts = urlObj.pathname.split('/');
        const filename = pathParts.pop();
        if (filename) {
          const encodedFilename = encodeURIComponent(filename);
          urlObj.pathname = [...pathParts, encodedFilename].join('/');
        }
      }
      return urlObj.toString();
    } catch {
      // If URL parsing fails, try simple string replacement as fallback
      let fixedUrl = url;
      
      // Fix acoustic.uz/api/uploads/ -> a.acoustic.uz/uploads/
      fixedUrl = fixedUrl.replace(/https?:\/\/acoustic\.uz\/api\/uploads\//g, 'https://a.acoustic.uz/uploads/');
      fixedUrl = fixedUrl.replace(/https?:\/\/www\.acoustic\.uz\/api\/uploads\//g, 'https://a.acoustic.uz/uploads/');
      
      // Fix localhost:3001 -> a.acoustic.uz
      fixedUrl = fixedUrl.replace(/http:\/\/localhost:3001\/uploads\//g, 'https://a.acoustic.uz/uploads/');
      fixedUrl = fixedUrl.replace(/http:\/\/localhost:3001\/api\/uploads\//g, 'https://a.acoustic.uz/uploads/');
      
      // Fix api.acoustic.uz -> a.acoustic.uz (old API domain)
      fixedUrl = fixedUrl.replace(/https?:\/\/api\.acoustic\.uz\//g, 'https://a.acoustic.uz/');
      
      return fixedUrl;
    }
  }
  
  // If relative URL starting with /uploads/, make it absolute
  // Always use production URL for uploads since files are stored on production server
  if (url.startsWith('/uploads/')) {
    const baseUrl = 'https://a.acoustic.uz';
    // Do not encode filename: backend generates safe names; encoding . as %2E can cause 404 on some servers
    return `${baseUrl}${url}`;
  }
  
  return url;
}






