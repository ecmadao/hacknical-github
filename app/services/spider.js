/* eslint no-nested-ternary: "off" */
import cheerio from 'cheerio';
import fetch from '../utils/request';
import dateHelper from '../utils/date';
import githubParser from '../utils/github-calendar-parser';

const BASE_URL = 'https://github.com';
const BASE_URL_USERS = `${BASE_URL}/users`;
const DATE_FORMAT = 'YYYY-MM-DD';
const {
  format,
  getDateAfterYears,
  getDateBeforeYears,
} = dateHelper;
const TEXTS = {
  en: {
    LAST_CONTRIBUTED: 'Last contributed in %s',
    TOTAL: 'Contributions in the last year',
    TOTAL_COUNT: '%s total',
    LONGEST_STREAK: 'Longest streak',
    STREAK_COUNT: '%s days',
    CURRENT_STREAK: 'Current streak'
  },
  zh: {
    LAST_CONTRIBUTED: '上一次提交是在 %s',
    TOTAL: '过去一年的提交数',
    TOTAL_COUNT: '总计 %s',
    LONGEST_STREAK: '最长连击数',
    STREAK_COUNT: '%s 天',
    CURRENT_STREAK: '当前连击数',
  },
};

const calendar = async (login, locale = 'en') => {
  const LOCAL_TEXTS = TEXTS[locale];
  const url = `${BASE_URL}/${login}`;
  const page = await fetch.get({
    url,
    json: false
  });
  const $ = cheerio.load(page);
  const cal = $('.js-contribution-graph');
  const calSvg = cal.find('.js-calendar-graph').html();

  const parsed = githubParser(calSvg);
  const currentStreakInfo = parsed.current_streak
    ? `${format(DATE_FORMAT, new Date(parsed.current_streak_range[0]))} ~ ${format(DATE_FORMAT, new Date(parsed.current_streak_range[1]))}`
    : parsed.last_contributed
      ? `${LOCAL_TEXTS.LAST_CONTRIBUTED.replace('%s', format(DATE_FORMAT, new Date(parsed.last_contributed)))}.`
      : 'Rock - Hard Place';
  const longestStreakInfo = parsed.longest_streak
    ? `${format(DATE_FORMAT, new Date(parsed.longest_streak_range[0]))} ~ ${format(DATE_FORMAT, new Date(parsed.longest_streak_range[1]))}`
    : parsed.last_contributed
      ? `${LOCAL_TEXTS.LAST_CONTRIBUTED.replace('%s', format(DATE_FORMAT, new Date(parsed.last_contributed)))}.`
      : 'Rock - Hard Place';

  cal.append(`
    <div class="contrib-column contrib-column-first table-column">
      <span class="text-muted">${LOCAL_TEXTS.TOTAL}</span>\n
      <span class="contrib-number">${LOCAL_TEXTS.TOTAL_COUNT.replace('%s', parsed.last_year)}</span>\n
      <span class="text-muted">${getDateBeforeYears({ years: 1, format: DATE_FORMAT })} ~ ${format(DATE_FORMAT)}</span>
    </div>
  `);
  cal.append(`
    <div class="contrib-column table-column">
      <span class="text-muted">${LOCAL_TEXTS.LONGEST_STREAK}</span>\n
      <span class="contrib-number">${LOCAL_TEXTS.STREAK_COUNT.replace('%s', parsed.longest_streak)}</span>\n
      <span class="text-muted">${longestStreakInfo}</span>
    </div>
  `);
  cal.append(`
    <div class="contrib-column table-column">
      <span class="text-muted">${LOCAL_TEXTS.CURRENT_STREAK}</span>\n
      <span class="contrib-number">${LOCAL_TEXTS.STREAK_COUNT.replace('%s', parsed.current_streak)}</span>\n
      <span class="text-muted">${currentStreakInfo}</span>
    </div>
  `);

  return cal.html();
};

const levelMap = {
  '#eee': 0,
  '#c6e48b': 1,
  '#7bc96f': 2,
  '#239a3b': 3,
  '#196127': 4,
};

const __parseHotmap = ($rects) => {
  const datas = [];
  const cache = new Set();

  for (let i = 0; i < $rects.length; i += 1) {
    const $rect = $rects[i];
    const fill = $rect.attr('fill');
    const data = Number($rect.attr('data-count'));
    const date = $rect.attr('data-date');
    if (cache.has(date)) continue;

    const level = levelMap[fill.toLowerCase()] || 0;
    datas.push({
      date,
      data,
      level,
    });
    cache.add(date);
  }

  datas.sort((pre, next) => pre.date > next.date);
  const start = datas[0].date;
  const end = datas[datas.length - 1].date;

  return {
    end,
    start,
    datas,
  };
};

const __getHotmap = async (login, start) => {
  let end = format(DATE_FORMAT);
  end = getDateAfterYears({ years: 1, date: end, format: DATE_FORMAT });
  const rects = [];
  const baseUrl = `${BASE_URL_USERS}/${login}/contributions?full_graph=1`;

  while (end > start) {
    const startTmp = getDateBeforeYears({ years: 1, date: end, format: DATE_FORMAT });
    const url = `${baseUrl}&from=${startTmp}&to=${end}`;
    const page = await fetch.get({
      url,
      json: false
    });
    const $ = cheerio.load(page);
    const $hotmap = $('.js-calendar-graph-svg');
    $hotmap.find('rect').each((i, ele) => {
      const $rect = $(ele);
      rects.push($rect);
    });
    end = startTmp;
  }
  return rects;
};

const hotmap = async (login, start) => {
  const $rects = await __getHotmap(login, start);
  const result = __parseHotmap($rects);
  return result;
};

export default {
  hotmap,
  calendar
};
