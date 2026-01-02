import { getHomePage } from '../scrapper/home.js';
import cache from '../utils/cache.js';

export const homeController = async (c) => {
  const cacheKey = 'home_data';
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return c.json({
      success: true,
      data: cachedData,
    });
  }

  const data = await getHomePage();
  cache.set(cacheKey, data, 1800); // 30 minutes

  return c.json({
    success: true,
    data,
  });
};
