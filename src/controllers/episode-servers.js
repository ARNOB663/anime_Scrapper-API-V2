import { getEpisodeServers } from '../scrapper/episode-servers.js';
import cache from '../utils/cache.js';

export const episodeServersController = async (c) => {
  const animeEpisodeId = c.req.query('animeEpisodeId');

  if (!animeEpisodeId) {
    return c.json(
      {
        success: false,
        error: 'animeEpisodeId query parameter is required',
      },
      400
    );
  }

  const cacheKey = `episode_servers_${animeEpisodeId}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return c.json({
      success: true,
      data: cachedData,
    });
  }

  const data = await getEpisodeServers(animeEpisodeId);
  cache.set(cacheKey, data, 3600); // 1 hour

  return c.json({
    success: true,
    data,
  });
};
