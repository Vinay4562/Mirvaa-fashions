/**
 * Helper function to get the full image URL
 * @param {string} imagePath - The relative or absolute image path
 * @returns {string} - The complete image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://via.placeholder.com/400x400?text=No+Image';
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it starts with /uploads, it's a relative path from the backend
  if (imagePath.startsWith('/uploads/')) {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    return `${backendUrl}${imagePath}`;
  }

  // If it's just a filename, assume it's in uploads
  if (!imagePath.startsWith('/')) {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    return `${backendUrl}/uploads/${imagePath}`;
  }

  // For any other relative paths, prepend backend URL
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  return `${backendUrl}${imagePath}`;
};

/**
 * Helper function to get optimized image URL with size parameters
 * @param {string} imagePath - The relative or absolute image path
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @param {string} quality - Image quality (1-100)
 * @returns {string} - The optimized image URL
 */
export const getOptimizedImageUrl = (imagePath, width = 400, height = 400, quality = 80) => {
  const baseUrl = getImageUrl(imagePath);
  
  // For now, return the base URL as we don't have image optimization service
  // In the future, this could be enhanced to use a CDN or image optimization service
  return baseUrl;
};

/**
 * Helper function to get thumbnail URL
 * @param {string} imagePath - The relative or absolute image path
 * @returns {string} - The thumbnail URL
 */
export const getThumbnailUrl = (imagePath) => {
  return getOptimizedImageUrl(imagePath, 150, 150, 70);
};

/**
 * Helper function to get medium image URL
 * @param {string} imagePath - The relative or absolute image path
 * @returns {string} - The medium image URL
 */
export const getMediumImageUrl = (imagePath) => {
  return getOptimizedImageUrl(imagePath, 400, 400, 80);
};

/**
 * Helper function to get large image URL
 * @param {string} imagePath - The relative or absolute image path
 * @returns {string} - The large image URL
 */
export const getLargeImageUrl = (imagePath) => {
  return getOptimizedImageUrl(imagePath, 800, 800, 90);
};
