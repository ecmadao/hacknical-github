/* eslint no-nested-ternary: "off" */
import cheerio from 'cheerio';
import fetch from '../utils/request';
import dateHelper from '../utils/date';

const BASE_URL = 'https://github.com';
const BASE_URL_USERS = `${BASE_URL}/users`;
const DATE_FORMAT = 'YYYY-MM-DD';
const {
  format,
  getDateAfterYears,
  getDateBeforeYears,
} = dateHelper;

const levelMap = {
  '#eee': 0,
  '#c6e48b': 1,
  '#7bc96f': 2,
  '#239a3b': 3,
  '#196127': 4,
};

const __parseHotmap = ($rects) => {
  const datas = [];
  let start = null;
  let end = null;

  for (let i = 0; i < $rects.length; i += 1) {
    const $rect = $rects[i];
    const fill = $rect.attr('fill');
    const data = Number($rect.attr('data-count'));
    const date = $rect.attr('data-date');

    const ms = new Date(date).getTime();
    if (!start || start > ms) start = ms;
    if (!end || end < ms) end = ms;

    const level = levelMap[fill.toLowerCase()] || 0;
    datas.push({
      date,
      data,
      level,
    });
  }

  return {
    end,
    start,
    datas,
  };
};

const __getHotmap = async (login, start) => {
  let end = format(DATE_FORMAT);
  end = getDateAfterYears({ years: 1, date: end, format: DATE_FORMAT });
  let rects = [];
  const baseUrl = `${BASE_URL_USERS}/${login}/contributions?full_graph=1`;
  const tmp = new Set();

  while (end > start) {
    const startTmp = getDateBeforeYears({ years: 1, date: end, format: DATE_FORMAT });
    const url = `${baseUrl}&from=${startTmp}&to=${end}`;
    const page = await fetch.get({
      url,
      json: false
    });
    const $ = cheerio.load(page);
    const $hotmap = $('.js-calendar-graph-svg');
    const pureRects = [];
    $hotmap.find('rect').each((i, ele) => {
      const $rect = $(ele);
      const date = $rect.attr('data-date');
      if (!tmp.has(date)) {
        pureRects.push($rect);
      }
      tmp.add(date);
    });
    rects = pureRects.concat(rects);
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
};
