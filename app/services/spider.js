/* eslint no-nested-ternary: "off" */
import cheerio from 'cheerio';
import fetch from '../utils/request';
import dateHelper from '../utils/date';
import githubParser from '../utils/github-calendar-parser';

const BASE_URL = 'https://github.com';
const DATE_FORMAT = 'YYYY-MM-DD';
const {
  format,
  getDateBeforeYears
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

const getCalendar = async (login, locale = 'en') => {
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
      <span class="text-muted">${getDateBeforeYears(1, DATE_FORMAT)} ~ ${format(DATE_FORMAT)}</span>
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

const __parseHotmap = ($) => {
  const datas = [];
  let total = 0;
  let start = null;
  let end = null;

  const cal = $('.js-contribution-graph');
  const $hotmap = cal.find('.js-calendar-graph-svg');
  $hotmap.find('rect').each((i, ele) => {
    console.log(`rect index: ${i}`);
    const $rect = $(ele);
    const fill = $rect.attr('fill');
    const data = Number($rect.attr('data-count'));
    const date = $rect.attr('data-date');
    if (i === 0) start = date;
    end = date;
    datas.push({
      date,
      data,
      fill,
      level: levelMap[fill] || 0,
    });
    total += data;
  });

  return {
    end,
    start,
    datas,
    total,
  };
};

const __getHotmap = async (login) => {
  const url = `${BASE_URL}/${login}`;
  const page = await fetch.get({
    url,
    json: false
  });
  const $ = cheerio.load(page);
  return $;
};

const hotmap = async (login) => {
  const $ = await __getHotmap(login);
  const result = __parseHotmap($);
  return result;
};

export default {
  hotmap,
  calendar: getCalendar
};
