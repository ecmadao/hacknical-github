import githubCalendarLegend from 'github-calendar-legend';

/**
 * parseGitHubCalendarSvg
 * Parses the SVG input (as string).
 *
 * @name parseGitHubCalendarSvg
 * @function
 * @param {String} input The SVG code of the contributions calendar.
 * @return {Object} An object containing:
 *
 *  - `last_year` (Number): The total contributions in the last year.
 *  - `longest_streak` (Number): The longest streak.
 *  - `longest_streak_range` (Array): An array of two date objects representing the date range.
 *  - `current_streak` (Number): The current streak.
 *  - `current_streak_range` (Array): An array of two date objects representing the date range.
 *  - `days` (Array): An array of day objects:
 *       - `fill` (String): The hex color.
 *       - `date` (Date): The day date.
 *       - `count` (Number): The number of commits.
 *       - `level` (Number): A number between 0 and 4 (inclusive)
 *          representing the contribution level (more commits, higher value).
 *  - `weeks` (Array): The day objects grouped by weeks (arrays).
 *  - `last_contributed` (Date): The last contribution date.
 */
const parseGitHubCalendarSvg = (input) => {
  const data = {
    last_year: 0,
    longest_streak: -1,
    longest_streak_range: [],
    current_streak: 0,
    current_streak_range: [],
    weeks: [],
    days: [],
    last_contributed: null
  };
  let lastWeek = [];
  const updateLongestStreak = () => {
    if (data.current_streak > data.longest_streak) {
      data.longest_streak = data.current_streak;
      data.longest_streak_range[0] = data.current_streak_range[0];
      data.longest_streak_range[1] = data.current_streak_range[1];
    }
  };

  const sections = input.split('\n').slice(2).map(c => c.trim());
  for (let i = 0; i < sections.length; i += 1) {
    const section = sections[i];
    if (section.startsWith('<g transform')) {
      if (lastWeek.length && data.weeks.push(lastWeek)) {
        lastWeek = [];
      }
      continue;
    }

    let fill = section.match(/fill="(#[a-zA-Z0-9]+)"/);
    let date = section.match(/data-date="([0-9\-]+)"/);
    let count = section.match(/data-count="([0-9]+)"/);

    fill = fill && fill[1];
    date = date && date[1];
    count = count && +count[1];

    if (!fill) {
      continue;
    }

    const obj = {
      fill,
      count,
      date: new Date(date),
      level: githubCalendarLegend.indexOf(fill)
    };

    if (data.current_streak === 0) {
      data.current_streak_range[0] = obj.date;
    }

    if (obj.count) {
      data.current_streak += 1;
      data.last_year += obj.count;
      data.last_contributed = obj.date;
      data.current_streak_range[1] = obj.date;
    } else {
      updateLongestStreak();
      data.current_streak = 0;
    }

    lastWeek.push(obj);
    data.days.push(obj);
  }

  updateLongestStreak();
  return data;
};

export default parseGitHubCalendarSvg;
