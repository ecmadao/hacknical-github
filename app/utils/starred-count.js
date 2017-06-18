import got from 'got';
import parse from 'parse-link-header';
import config from 'config';
import logger from './log';
import { PER_PAGE, GITHUB } from './github';

const retryTimes = config.get('timeouts');

const fetchData = (url, options = {}) =>
  new Promise((resolve, reject) => {
    got.get(url, options).then((res) => {
      const parsed = parse(res.headers.link);
      const pageCount = (parsed && parsed.last)
        ? parseInt(parsed.last.page, 10)
        : 1;
      resolve(pageCount);
    }).catch((e) => {
      reject(e);
    });
  });

const fetch = async (url, options, timeout = retryTimes) => {
  let err = null;
  for (let i = 0; i < timeout.length; i += 1) {
    try {
      logger.info(`[FETCH RETRY][TIMES ${i}]`);
      options.timeout = timeout[i];
      const result = await fetchData(url, options);
      err = null;
      return result;
    } catch (e) {
      err = e;
    }
  }
  if (err) {
    logger.error(err);
  }
  return null;
};

export const starredPageCount = async (login, verify, perPage = PER_PAGE.STARRED) => {
  const { qs, headers } = verify;
  qs.per_page = perPage;
  const options = {
    query: qs,
    headers
  };
  const url = `${GITHUB.API_USERS}/${login}/starred`;
  return await fetch(url, options);
};

export const starredCount = (login, verify) =>
  starredPageCount(login, verify, 1);
