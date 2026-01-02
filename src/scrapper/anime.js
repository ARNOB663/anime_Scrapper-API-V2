import { load } from 'cheerio';
import axios from 'axios';

import { SRC_BASE_URL, USER_AGENT } from '../utils/constants.js';

// --- Helpers ---
const text = ($, selector) => $(selector).text()?.trim() || null;
const attr = ($, selector, attribute) => $(selector).attr(attribute)?.trim() || null;

const extractAnimes = ($, selector) => {
  return $(selector).map((_, el) => {
    const $el = $(el);
    const filmName = $el.find('.film-detail .film-name .dynamic-name');
    const fdInfor = $el.find('.film-detail .fd-infor');

    return {
      id: filmName.attr('href')?.slice(1).split('?ref=search')[0] || null,
      name: filmName.text()?.trim(),
      jname: filmName.attr('data-jname')?.trim() || null,
      poster: attr($el, '.film-poster .film-poster-img', 'data-src'),
      duration: text($el, '.film-detail .fd-infor .fdi-item.fdi-duration'),
      type: fdInfor.find('.fdi-item:nth-of-type(1)').text()?.trim(),
      rating: text($el, '.film-poster .tick-rate'),
      episodes: {
        sub: Number(text($el, '.film-poster .tick-sub')?.split(' ').pop()) || null,
        dub: Number(text($el, '.film-poster .tick-dub')?.split(' ').pop()) || null,
      },
    };
  }).get();
};

const extractMostPopularAnimes = ($, selector) => {
  return $(selector).map((_, el) => {
    const $el = $(el);
    const filmDetail = $el.find('.film-detail .dynamic-name');
    const tick = $el.find('.fd-infor .tick');

    return {
      id: filmDetail.attr('href')?.slice(1).trim() || null,
      name: filmDetail.text()?.trim() || null,
      jname: $el.find('.film-detail .film-name .dynamic-name').attr('data-jname')?.trim() || null,
      poster: attr($el, '.film-poster .film-poster-img', 'data-src'),
      episodes: {
        sub: Number(tick.find('.tick-sub').text()?.trim()) || null,
        dub: Number(tick.find('.tick-dub').text()?.trim()) || null,
      },
      type: tick.text()?.trim()?.replace(/[\s\n]+/g, ' ')?.split(' ')?.pop() || null,
    };
  }).get();
};

export async function getAnimeAboutInfo(animeId) {
  const res = {
    anime: {
      info: {
        id: null,
        anilistId: null,
        malId: null,
        name: null,
        poster: null,
        description: null,
        stats: {
          rating: null,
          quality: null,
          episodes: {
            sub: null,
            dub: null,
          },
          type: null,
          duration: null,
        },
        promotionalVideos: [],
        charactersVoiceActors: [],
      },
      moreInfo: {},
    },
    seasons: [],
    mostPopularAnimes: [],
    relatedAnimes: [],
    recommendedAnimes: [],
  };

  try {
    if (animeId.trim() === '' || animeId.indexOf('-') === -1) {
      throw new Error('Invalid anime id');
    }

    const animeUrl = `${SRC_BASE_URL}/${animeId}`;
    const { data } = await axios.get(animeUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    const $ = load(data);

    // Extract anilist and MAL IDs
    try {
      const syncData = JSON.parse($('body')?.find('#syncData')?.text());
      res.anime.info.anilistId = Number(syncData?.anilist_id) || null;
      res.anime.info.malId = Number(syncData?.mal_id) || null;
    } catch (err) {
      res.anime.info.anilistId = null;
      res.anime.info.malId = null;
    }

    const selector = '#ani_detail .container .anis-content';

    res.anime.info.id = $(selector)
      ?.find('.anisc-detail .film-buttons a.btn-play')
      ?.attr('href')
      ?.split('/')
      ?.pop() || null;

    res.anime.info.name = text($, `${selector} .anisc-detail .film-name.dynamic-name`);

    res.anime.info.description = $(selector)
      ?.find('.anisc-detail .film-description .text')
      .text()
      ?.split('[')
      ?.shift()
      ?.trim() || null;

    res.anime.info.poster = attr($, `${selector} .film-poster .film-poster-img`, 'src');

    // Stats
    res.anime.info.stats.rating = text($, `${selector} .film-stats .tick .tick-pg`);
    res.anime.info.stats.quality = text($, `${selector} .film-stats .tick .tick-quality`);
    res.anime.info.stats.episodes = {
      sub: Number(text($, `${selector} .film-stats .tick .tick-sub`)) || null,
      dub: Number(text($, `${selector} .film-stats .tick .tick-dub`)) || null,
    };

    const statsTickFn = $(`${selector} .film-stats .tick`)
      ?.text()
      ?.trim()
      ?.replace(/[\s\n]+/g, ' ')
      ?.split(' ');

    res.anime.info.stats.type = statsTickFn?.at(-2) || null;
    res.anime.info.stats.duration = statsTickFn?.pop() || null;

    // Promotional videos
    $('.block_area.block_area-promotions .block_area-promotions-list .screen-items .item').each((_, el) => {
      res.anime.info.promotionalVideos.push({
        title: $(el).attr('data-title'),
        source: $(el).attr('data-src'),
        thumbnail: $(el).find('img').attr('src'),
      });
    });

    // Characters and voice actors
    $('.block_area.block_area-actors .block-actors-content .bac-list-wrap .bac-item').each((_, el) => {
      const $el = $(el);
      res.anime.info.charactersVoiceActors.push({
        character: {
          id: $el.find('.per-info.ltr .pi-avatar').attr('href')?.split('/')[2] || '',
          poster: attr($el, '.per-info.ltr .pi-avatar img', 'data-src') || '',
          name: text($el, '.per-info.ltr .pi-detail a'),
          cast: text($el, '.per-info.ltr .pi-detail .pi-cast'),
        },
        voiceActor: {
          id: $el.find('.per-info.rtl .pi-avatar').attr('href')?.split('/')[2] || '',
          poster: attr($el, '.per-info.rtl .pi-avatar img', 'data-src') || '',
          name: text($el, '.per-info.rtl .pi-detail a'),
          cast: text($el, '.per-info.rtl .pi-detail .pi-cast'),
        },
      });
    });

    // More information
    $(`${selector} .anisc-info-wrap .anisc-info .item:not(.w-hide)`).each((_, el) => {
      let key = $(el)
        .find('.item-head')
        .text()
        .toLowerCase()
        .replace(':', '')
        .trim();
      key = key.includes(' ') ? key.replace(' ', '') : key;

      const value = [
        ...$(el)
          .find('*:not(.item-head)')
          .map((_, el) => $(el).text().trim()),
      ]
        .map((i) => `${i}`)
        .toString()
        .trim();

      if (key === 'genres' || key === 'producers') {
        res.anime.moreInfo[key] = value.split(',').map((i) => i.trim());
        return;
      }
      res.anime.moreInfo[key] = value;
    });

    // Seasons
    const seasonsSelector = '#main-content .os-list a.os-item';
    $(seasonsSelector).each((_, el) => {
      const $el = $(el);
      res.seasons.push({
        id: $el.attr('href')?.slice(1)?.trim() || null,
        name: $el.attr('title')?.trim() || null,
        title: text($el, '.title'),
        poster: $el.find('.season-poster')
          ?.attr('style')
          ?.split(' ')
          ?.pop()
          ?.split('(')
          ?.pop()
          ?.split(')')[0] || null,
        isCurrent: $el.hasClass('active'),
      });
    });

    // Related animes
    const relatedAnimeSelector = '#main-sidebar .block_area.block_area_sidebar.block_area-realtime:nth-of-type(1) .anif-block-ul ul li';
    res.relatedAnimes = extractMostPopularAnimes($, relatedAnimeSelector);

    // Most popular animes
    const mostPopularSelector = '#main-sidebar .block_area.block_area_sidebar.block_area-realtime:nth-of-type(2) .anif-block-ul ul li';
    res.mostPopularAnimes = extractMostPopularAnimes($, mostPopularSelector);

    // Recommended animes
    const recommendedAnimeSelector = '#main-content .block_area.block_area_category .tab-content .flw-item';
    res.recommendedAnimes = extractAnimes($, recommendedAnimeSelector);

    return res;
  } catch (error) {
    throw new Error(`Failed to get anime info: ${error.message}`);
  }
}
