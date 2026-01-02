import { getEstimatedSchedule } from '../scrapper/schedule.js';

export const scheduleController = async (c) => {
  const date = c.req.query('date');
  const tzOffset = parseInt(c.req.query('tzOffset')) || -330;

  if (!date) {
    return c.json(
      {
        success: false,
        error: 'Date parameter is required. Format: YYYY-MM-DD',
      },
      400
    );
  }

  const data = await getEstimatedSchedule(date, tzOffset);
  return c.json({
    success: true,
    data,
  });
};
