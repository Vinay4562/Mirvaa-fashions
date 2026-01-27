// Auto-detect backend URL based on environment
const getBackendUrl = () => {
  // If explicitly set via environment variable, use that
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL.replace(/\/+$/, '');
  }
  
  // Auto-detect based on current hostname
  const hostname = window.location.hostname;
  
  // Production frontend should use production backend
  if (hostname === 'mirvaa-fashions.vercel.app' || hostname.includes('vercel.app')) {
    return 'https://mirvaa-backend-production.up.railway.app';
  }
  
  // Development or localhost
  return 'http://localhost:8000';
};

export const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24px' fill='%239ca3af'%3EImage Not Found%3C/text%3E%3C/svg%3E";

/**
 * Helper function to get the full image URL
 * @param {string} imagePath - The relative or absolute image path
 * @returns {string} - The complete image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    const backendUrl = getBackendUrl();
    const fallbackPath = '/uploads/80819ebe-14af-4328-9fa6-8078050df4f1_Saree.jpg';
    return `${backendUrl}/api/image?path=${encodeURIComponent(fallbackPath)}&w=400&q=80`;
  }
  return getOptimizedImageUrl(imagePath, 400, undefined, 80);
};

/**
 * Helper function to get optimized image URL with size parameters
 * @param {string} imagePath - The relative or absolute image path
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @param {string} quality - Image quality (1-100)
 * @returns {string} - The optimized image URL
 */
export const getOptimizedImageUrl = (imagePath, width = 400, height = undefined, quality = 80) => {
  const backendUrl = getBackendUrl();
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return PLACEHOLDER_IMAGE;
  }
  
  // Trim whitespace
  imagePath = imagePath.trim();
  
  if (isPdf(imagePath)) {
    return getFileUrl(imagePath);
  }
  let relPath = null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    try {
      const imgUrl = new URL(imagePath);
      const beUrl = new URL(backendUrl);
      if (imgUrl.origin === beUrl.origin) {
        relPath = imgUrl.pathname;
      } else {
        return imagePath;
      }
    } catch {
      return imagePath;
    }
  } else if (imagePath.startsWith('/uploads/')) {
    relPath = imagePath;
  } else if (imagePath.startsWith('uploads/')) {
    // Handle paths that start with uploads/ (without leading slash)
    relPath = `/${imagePath}`;
  } else {
    relPath = `/uploads/${imagePath}`;
  }
  const params = new URLSearchParams();
  params.set('path', relPath);
  if (width) params.set('w', width);
  if (height) params.set('h', height);
  if (quality) params.set('q', quality);
  return `${backendUrl}/api/image?${params.toString()}`;
};

/**
 * Helper function to get thumbnail URL
 * @param {string} imagePath - The relative or absolute image path
 * @returns {string} - The thumbnail URL
 */
export const getThumbnailUrl = (imagePath) => {
  return getOptimizedImageUrl(imagePath, 160, undefined, 70);
};

/**
 * Helper function to get medium image URL
 * @param {string} imagePath - The relative or absolute image path
 * @returns {string} - The medium image URL
 */
export const getMediumImageUrl = (imagePath) => {
  return getOptimizedImageUrl(imagePath, 768, undefined, 80);
};

/**
 * Helper function to get large image URL
 * @param {string} imagePath - The relative or absolute image path
 * @returns {string} - The large image URL
 */
export const getLargeImageUrl = (imagePath) => {
  return getOptimizedImageUrl(imagePath, 1600, undefined, 90);
};

/**
 * Helper function to generate srcSet for responsive images
 * @param {string} imagePath - The relative or absolute image path
 * @returns {string} - The srcSet string
 */
export const getSrcSet = (imagePath) => {
  if (!imagePath) return '';
  const small = getThumbnailUrl(imagePath);
  const medium = getImageUrl(imagePath); // 400px
  const large = getMediumImageUrl(imagePath); // 768px
  const extraLarge = getLargeImageUrl(imagePath); // 1600px
  
  return `${small} 160w, ${medium} 400w, ${large} 768w, ${extraLarge} 1600w`;
};

export const onImageError = (e) => {
  const img = e.currentTarget;
  if (!img) return;
  if (img.dataset.fallbackAttempted === 'true') {
    img.src = PLACEHOLDER_IMAGE;
    img.onerror = null;
    return;
  }
  const backendUrl = getBackendUrl();
  const fallbackPath = '/uploads/80819ebe-14af-4328-9fa6-8078050df4f1_Saree.jpg';
  img.dataset.fallbackAttempted = 'true';
  img.src = `${backendUrl}/api/image?path=${encodeURIComponent(fallbackPath)}&w=400&q=80`;
  setTimeout(() => {
    if (!img) return;
    if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
      img.src = PLACEHOLDER_IMAGE;
      img.onerror = null;
    }
  }, 2000);
};

export const isPdf = (path) => {
  if (!path) return false;
  const p = path.toLowerCase();
  return p.endsWith('.pdf');
};

export const getFileUrl = (path) => {
  if (!path) return '';
  const backendUrl = getBackendUrl();
  if (path.startsWith('http://') || path.startsWith('https://')) return encodeURI(path);
  if (path.startsWith('/uploads/')) return `${backendUrl}${encodeURI(path)}`;
  if (!path.startsWith('/')) return `${backendUrl}/uploads/${encodeURI(path)}`;
  return `${backendUrl}${encodeURI(path)}`;
};
