import { getAZList } from '../scrapper/azlist.js';

export const azlistController = async (c) => {
  const sortOption = c.req.param('sortOption') || 'all';
  const page = parseInt(c.req.query('page')) || 1;

  const data = await getAZList(sortOption, page);
  return c.json({
    success: true,
    data,
  });
};
