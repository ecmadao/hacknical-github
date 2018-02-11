import dateHelper from './date';

export const getReposInYears = (repos, years = 1) => {
  const oneYearBefore = dateHelper.getDateBeforeYears({ years });
  const seconds = dateHelper.getSeconds(oneYearBefore);
  return repos.filter(
    repository => dateHelper.getSeconds(repository.created_at) >= seconds
  );
};

export const validateReposMap = (repos) => {
  const map = new Map();
  for (let repository of repos) {
    if (repository.fork || map.has(repository.full_name)) continue;
    const { name, full_name, created_at, pushed_at } = repository;
    map.set(full_name, {
      name,
      pushed_at,
      created_at,
      full_name,
    });
  }
  return map;
};

const sortCommits = (thisRepos, nextRepos) =>
  nextRepos.totalCommits - thisRepos.totalCommits;

export const sortByCommits = repos => repos.sort(sortCommits);

/* ========= CONST VALUE ========== */
export const PER_PAGE = {
  REPOS: 50,
  ORGS: 20,
  STARRED: 70
};

export const BASE_URL = 'https://api.github.com';

export const GITHUB = {
  BASE: 'https://github.com',
  API_GET_USER: `${BASE_URL}/user`,
  API_USERS: `${BASE_URL}/users`,
  API_ORGS: `${BASE_URL}/orgs`,
  API_REPOS: `${BASE_URL}/repos`,
  OCTOCAT: `${BASE_URL}/octocat`,
  ZEN: `${BASE_URL}/zen`,
  API_GRAPHQL: 'https://api.github.com/graphql',
  API_TOKEN: 'https://github.com/login/oauth/access_token'
};
