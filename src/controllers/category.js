import { getAnimeCategory } from '../scrapper/category.js';

export const categoryController = async (c) => {
  const name = c.req.param('name');
  const page = parseInt(c.req.query('page')) || 1;

  if (!name) {
    return c.json(
      {
        success: false,
        error: 'Category name parameter is required',
      },
      400
    );
  }

  const data = await getAnimeCategory(name, page);
  return c.json({
    success: true,
    data,
  });
};
