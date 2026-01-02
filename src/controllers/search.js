import { getAnimeSearchResults } from '../scrapper/search.js';
import cache from '../utils/cache.js';

export const searchController = async (c) => {
  const q = c.req.query('q');
  const page = parseInt(c.req.query('page')) || 1;

  if (!q) {
    return c.json(
      {
        success: false,
        error: 'Query parameter "q" is required',
      },
      400
    );
  }

  const cacheKey = `search_${q}_${page}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return c.json({
      success: true,
      data: cachedData,
    });
  }

  const data = await getAnimeSearchResults(q, page);
  cache.set(cacheKey, data, 900); // 15 minutes

  return c.json({
    success: true,
    data,
  });
};
