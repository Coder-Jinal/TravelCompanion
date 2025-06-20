const axios = require('axios');
const NodeCache = require('node-cache');

// Cache with TTL of 1 day
const imageCache = new NodeCache({ stdTTL: 86400 });

/**
 * Get images for a specific destination
 * @param {string} destination - Destination name
 * @returns {Promise<Array>} - Array of image objects
 */
exports.getDestinationImages = async (destination) => {
  // Create a cache key
  const cacheKey = `images-${destination.toLowerCase()}`;
  
  // Check if data exists in cache
  const cachedImages = imageCache.get(cacheKey);
  if (cachedImages) {
    console.log('Retrieved images from cache');
    return cachedImages;
  }
  
  try {
    const response = await axios.get(process.env.PIXABAY_API_URL, {
      params: {
        key: process.env.PIXABAY_API_KEY,
        q: destination,
        image_type: 'photo',
        pretty: true,
        per_page: 24
      }
    });
    
    const images = response.data.hits.map(image => ({
      id: image.id,
      url: image.webformatURL,
      largeUrl: image.largeImageURL,
      width: image.webformatWidth,
      height: image.webformatHeight,
      tags: image.tags,
      photographer: image.user
    }));
    
    // Store in cache
    imageCache.set(cacheKey, images);
    
    return images;
  } catch (error) {
    console.error('Error fetching images:', error);
    throw new Error('Failed to retrieve destination images');
  }
};