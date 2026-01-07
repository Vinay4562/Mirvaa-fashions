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
    return 'https://mirvaa-backend.onrender.com';
  }
  
  // Development or localhost
  return 'http://localhost:8000';
};

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
    return 'https://via.placeholder.com/400x400?text=No+Image';
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

export const onImageError = (e) => {
  // Prevent infinite loop if fallback also fails
  if (e.currentTarget.dataset.fallbackAttempted === 'true') {
    e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
    e.currentTarget.onerror = null;
    return;
  }
  
  const backendUrl = getBackendUrl();
  const fallbackPath = '/uploads/80819ebe-14af-4328-9fa6-8078050df4f1_Saree.jpg';
  e.currentTarget.dataset.fallbackAttempted = 'true';
  e.currentTarget.src = `${backendUrl}/api/image?path=${encodeURIComponent(fallbackPath)}&w=400&q=80`;
  // Set a timeout to prevent infinite loops
  setTimeout(() => {
    if (e.currentTarget.complete === false || e.currentTarget.naturalWidth === 0) {
      e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
      e.currentTarget.onerror = null;
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
