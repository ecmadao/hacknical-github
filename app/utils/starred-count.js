import got from 'got';
import parse from 'parse-link-header';
import { PER_PAGE, GITHUB } from './github';

export const starredPageCount = (login, verify, perPage = PER_PAGE.STARRED) => {
  const { qs, headers } = verify;
  qs.per_page = perPage;
  return new Promise((resolve) => {
    got.get(`${GITHUB.API_USERS}/${login}/starred`, {
      query: qs,
      headers
    }).then((res) => {
      const parsed = parse(res.headers.link);
      const pageCount = (parsed && parsed.last)
        ? parseInt(parsed.last.page, 10)
        : 1;
      resolve(pageCount);
    }).catch(() => resolve(1));
  });
};

export const starredCount = (login, verify) =>
  starredPageCount(login, verify, 1);
