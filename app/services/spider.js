/* eslint no-nested-ternary: "off" */
import githubParser from 'github-calendar-parser';
import cheerio from 'cheerio';
import fetch from '../utils/request';
import dateHelper from '../utils/date';

const BASE_URL = 'https://github.com';
const DATE_FORMAT = 'YYYY-MM-DD';
const {
  format,
  getDateBeforeYears
} = dateHelper;

const getCalendar = async (login) => {
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
    ? `${format(DATE_FORMAT, new Date(parsed.current_streak_range[0]))} \u2013 ${format(DATE_FORMAT, new Date(parsed.current_streak_range[1]))}`
    : parsed.last_contributed
      ? `Last contributed in ${format(DATE_FORMAT, new Date(parsed.last_contributed))}.`
      : 'Rock - Hard Place';
  const longestStreakInfo = parsed.longest_streak
    ? `${format(DATE_FORMAT, new Date(parsed.longest_streak_range[0]))} \u2013 ${format(DATE_FORMAT, new Date(parsed.longest_streak_range[1]))}`
    : parsed.last_contributed
      ? `Last contributed in ${format(DATE_FORMAT, new Date(parsed.last_contributed))}.`
      : 'Rock - Hard Place';

  cal.append(`
    <div class="contrib-column contrib-column-first table-column">
      <span class="text-muted">Contributions in the last year</span>\n
      <span class="contrib-number">${parsed.last_year} total</span>\n
      <span class="text-muted">${getDateBeforeYears(1, DATE_FORMAT)} \u2013 ${format(DATE_FORMAT)}</span>
    </div>
  `);
  cal.append(`
    <div class="contrib-column table-column">
      <span class="text-muted">Longest streak</span>\n
      <span class="contrib-number">${parsed.longest_streak} days</span>\n
      <span class="text-muted">${longestStreakInfo}</span>
    </div>
  `);
  cal.append(`
    <div class="contrib-column contrib-column-first table-column">
      <span class="text-muted">Contributions in the last year</span>\n
      <span class="contrib-number">${parsed.current_streak} days</span>\n
      <span class="text-muted">${currentStreakInfo}</span>
    </div>
  `);

  return cal.html();
};

export default {
  calendar: getCalendar
};
