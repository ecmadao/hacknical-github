import parse from 'parse-link-header';
import config from 'config';
import logger from './log';
import { PER_PAGE, GITHUB } from './github';
import { fetch } from './fetch';

const retryTimes = config.get('timeouts');

const handleResponse = (httpResponse) => {
  try {
    const parsed = parse(httpResponse.headers.link);
    const pageCount = (parsed && parsed.last)
      ? parseInt(parsed.last.page, 10)
      : 1;
    return pageCount;
  } catch (e) {
    logger.error(e);
  }
  return null;
};

export const starredPageCount = async (login, verify, perPage = PER_PAGE.STARRED) => {
  const { qs, headers } = verify;
  qs.per_page = perPage;
  const options = {
    qs,
    headers,
    method: 'GET',
    url: `${GITHUB.API_USERS}/${login}/starred`
  };
  return await fetch(options, retryTimes, handleResponse);
};

export const starredCount = (login, verify) =>
  starredPageCount(login, verify, 1);
