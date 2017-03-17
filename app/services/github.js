import config from 'config';
import fetch from '../utils/fetch';

const appName = config.get('github.appName');

const BASE_URL = 'https://api.github.com';
const API_TOKEN = 'https://github.com/login/oauth/access_token';
const API_GET_USER = `${BASE_URL}/user`;

const API_USERS = `${BASE_URL}/users`;
const API_ORGS = `${BASE_URL}/orgs`;
const API_REPOS = `${BASE_URL}/repos`;

/* =========================== basic funcs =========================== */

const fetchGitHub = (url, option = {}) => {
  const options = {
    url,
    headers: { 'User-Agent': appName }
  };
  return fetch.get(options, option.parse);
};

const postGitHub = (url) => {
  const options = {
    url
  };
  return fetch.post(options);
};

/* =========================== private funcs =========================== */

const getUserRepos = (login, params, page = 1) => {
  return fetchGitHub(`${API_USERS}/${login}/repos?per_page=100&page=${page}&${params}`, {
    parse: true
  });
};

const getOrgRepos = (org, params, page = 1) => {
  return fetchGitHub(`${API_ORGS}/${org}/repos?per_page=100&page=${page}&${params}`, {
    parse: true
  });
}

const getUserPubOrgs = (login, params, page = 1) => {
  return fetchGitHub(`${API_USERS}/${login}/orgs?per_page=100&page=${page}&${params}`, {
    parse: true
  });
};

const getReposYearlyCommits = (fullname, params) => {
  return new Promise(async (resolve, reject) => {
    const result = await fetchGitHub(`${API_REPOS}/${fullname}/stats/commit_activity?${params}`, {
      parse: true
    });
    resolve(result);
  }).catch((err) => {
    console.log(err);
    return Promise.resolve([]);
  });
};

const getReposLanguages = (fullname, params) => {
  return new Promise(async (resolve, reject) => {
    let result = {};
    const languages = await fetchGitHub(`${API_REPOS}/${fullname}/languages?${params}`, {
      parse: true
    });
    let total = 0;
    Object.keys(languages).forEach(key => total += languages[key]);
    Object.keys(languages).forEach(key => result[key] = languages[key] / total);
    resolve(result);
  }).catch((err) => {
    console.log(err);
    return Promise.resolve({});
  })
};

const getReposContributors = (fullname, params) => {
  return new Promise(async (resolve, reject) => {
    const contributors = await fetchGitHub(`${API_REPOS}/${fullname}/stats/contributors?${params}`, {
      parse: true
    });
    console.log(contributors);
    const results = contributors.map((contributor, index) => {
      const { total, weeks, author } = contributor;
      const weeklyCommits = weeks.map((week, index) => {
        const { w, a, d, c } = week;
        return {
          week: w,
          data: parseInt((a + d + c), 10)
        }
      });
      const { avatar_url, login } = author;
      return {
        total,
        login,
        avatar_url,
        weeks: weeklyCommits
      }
    });
    resolve(results);
  }).catch((err) => {
    console.log(err);
    return Promise.resolve([]);
  });
};


/* =========================== github api =========================== */

const getOctocat = (params) => {
  return fetchGitHub(`${BASE_URL}/octocat?${params}`);
};

const getZen = (params) => {
  return fetchGitHub(`${BASE_URL}/zen?${params}`);
};

const getToken = (code, params) => {
  return postGitHub(`${API_TOKEN}?code=${code}&${params}`)
};

const getUser = (login, params) => {
  return fetchGitHub(`${API_USERS}/${login}?${params}`, {
    parse: true
  });
};

const getUserByToken = (params) => {
  return fetchGitHub(`${API_GET_USER}?${params}`, {
    parse: true
  });
}

const getOrg = (org, params) => {
  return fetchGitHub(`${API_ORGS}/${org}?${params}`, {
    parse: true
  });
};

const getOrgPubRepos = (org, params, pages = 1) => {
  const promiseList = new Array(pages).fill(0).map((item, index) => {
    return getOrgRepos(org, params, index + 1);
  });
  return Promise.all(promiseList).then((datas) => {
    let results = [];
    datas.forEach(data => results = [...results, ...data]);
    return Promise.resolve(results);
  }).catch(() => Promise.resolve([]));
};

const getPersonalPubRepos = (login, params, pages = 3) => {
  const promiseList = new Array(pages).fill(0).map((item, index) => {
    return getUserRepos(login, params, index + 1);
  });
  return Promise.all(promiseList).then((datas) => {
    let results = [];
    datas.forEach(data => results = [...results, ...data]);
    return Promise.resolve(results);
  }).catch(() => Promise.resolve([]));
};

const getPersonalPubOrgs = (login, params, pages = 1) => {
  const promiseList = new Array(pages).fill(0).map((item, index) => {
    return getUserPubOrgs(login, params, index + 1);
  });
  return Promise.all(promiseList).then((datas) => {
    let results = [];
    datas.forEach(data => results = [...results, ...data]);
    return Promise.resolve(results);
  }).catch(() => Promise.resolve([]));
};

const getAllReposYearlyCommits = (repos, params) => {
  const promiseList = repos.map((item, index) => {
    return getReposYearlyCommits(item.fullname || item.full_name, params);
  });
  return Promise.all(promiseList).then(datas => Promise.resolve(datas)).catch(() => Promise.resolve([]));
};

const getAllReposLanguages = (repos, params) => {
  const promiseList = repos.map((item, index) => {
    return getReposLanguages(item.fullname || item.full_name, params);
  });
  return Promise.all(promiseList).then(datas => Promise.resolve(datas)).catch(() => Promise.resolve([]));
};

const getAllReposContributors = (repos, params) => {
  const promiseList = repos.map((item, index) => {
    return getReposContributors(item.fullname || item.full_name, params);
  });
  return Promise.all(promiseList).then(datas => Promise.resolve(datas)).catch(() => Promise.resolve([]));
};

export default {
  // others
  getZen,
  getOctocat,
  getToken,
  // user
  getUser,
  getUserByToken,
  getPersonalPubRepos,
  getPersonalPubOrgs,
  // org
  getOrg,
  getOrgPubRepos,
  // repos
  getAllReposYearlyCommits,
  getAllReposLanguages,
  getAllReposContributors
}
