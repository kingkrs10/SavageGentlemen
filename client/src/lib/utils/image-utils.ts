/**
 * Utility functions for handling images and URLs
 */

/**
 * Converts various image URL formats to usable direct URLs
 * Handles special cases like Google Drive links and local uploads
 */
export function getNormalizedImageUrl(url: string | null): string {
  if (!url) {
    // Use a placeholder image from a reliable source
    return 'https://placehold.co/600x400/222222/FF4136?text=No+Image';
  }

  // Handle local upload URLs (containing uploads/)
  if (url.includes('uploads/')) {
    // Make sure it starts with a slash for correct path resolution
    if (!url.startsWith('/')) {
      return '/' + url;
    }
    // Already has slash, return as is
    return url;
  }

  // Handle Google Drive file URLs
  if (url.includes('drive.google.com/file/d/')) {
    // Extract the file ID from the URL
    const fileIdMatch = url.match(/\/d\/([^/]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

  // Handle Google Drive folder URLs (for future use)
  if (url.includes('drive.google.com/drive/folders/')) {
    // Cannot directly use folder URLs as images
    return 'https://placehold.co/600x400/222222/FF4136?text=Folder+Image';
  }

  // For other URLs, return as is
  return url;
}

/**
 * Checks if an image URL is valid
 */
export function isValidImageUrl(url: string | null): boolean {
  if (!url) return false;
  
  // Basic check for image extensions
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const hasValidExtension = validExtensions.some(ext => url.toLowerCase().endsWith(ext));
  
  // Consider Google Drive URLs valid if they can be normalized
  const isGoogleDrive = url.includes('drive.google.com/file/d/');
  
  return hasValidExtension || isGoogleDrive;
}