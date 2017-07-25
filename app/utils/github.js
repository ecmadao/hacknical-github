import dateHelper from './date';

export const getReposInYears = (repos, years = 1) => {
  const oneYearBefore = dateHelper.getDateBeforeYears(years);
  const seconds = dateHelper.getSeconds(oneYearBefore);
  return repos.filter(
    repository => dateHelper.getSeconds(repository.created_at) >= seconds
  );
};

export const validateReposList = (repos) => {
  const reposList = repos
    .filter(repository => !repository.fork)
    .map((repository) => {
      const { name, full_name, reposId, created_at, pushed_at } = repository;
      return {
        name,
        reposId,
        pushed_at,
        created_at,
        fullname: full_name,
      };
    });
  return reposList;
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
