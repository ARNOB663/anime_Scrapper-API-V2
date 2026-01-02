import { getAnimeAboutInfo } from '../scrapper/anime.js';
import cache from '../utils/cache.js';

/**
 * Controller for anime info endpoint
 */
export const animeController = async (c) => {
  const animeId = c.req.param('animeId');

  if (!animeId) {
    return c.json(
      {
        success: false,
        error: 'animeId parameter is required',
      },
      400
    );
  }

  const cacheKey = `anime_details_${animeId}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return c.json({
      success: true,
      data: cachedData,
    });
  }

  const data = await getAnimeAboutInfo(animeId);
  cache.set(cacheKey, data, 3600); // 1 hour

  return c.json({
    success: true,
    data,
  });
};
