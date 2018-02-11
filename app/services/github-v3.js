/* eslint no-loop-func: "off" */

import fetch from '../utils/request';
import logger from '../utils/logger';
import {
  SPLIT_NUM,
  splitArray,
  flattenObject,
} from '../utils/helpers';
import { GITHUB } from '../utils/github';

const {
  API_ORGS,
  API_TOKEN,
  API_USERS,
  API_REPOS,
  API_GET_USER,
} = GITHUB;

/* ===================== repository =====================*/
const getRepository = (fullname, verify) => {
  const { qs, headers } = verify;
  headers.Accept = 'application/vnd.github.mercy-preview+json';
  return fetch.get({
    qs,
    headers,
    url: `${API_REPOS}/${fullname}`
  });
};

const getRepositoryReadme = (fullname, verify) => {
  const { qs, headers } = verify;
  headers.Accept = 'application/vnd.github.v3.raw';
  return fetch.get({
    qs,
    headers,
    url: `${API_REPOS}/${fullname}/readme`
  });
};

const starRepository = (fullname, verify) => {
  const { qs, headers } = verify;
  return fetch.put({
    qs,
    headers,
    url: `${API_GET_USER}/starred/${fullname}`
  });
};

const unstarRepository = (fullname, verify) => {
  const { qs, headers } = verify;
  return fetch.delete({
    qs,
    headers,
    url: `${API_GET_USER}/starred/${fullname}`
  });
};

const getUserRepos = ({ login, verify, page = 1, perPage = 100 }) => {
  const { qs, headers } = verify;
  qs.per_page = perPage;
  qs.page = page;

  return fetch.get({
    qs,
    headers,
    url: `${API_USERS}/${login}/repos`
  });
};

const getUserStarred = ({ login, verify, page = 1, perPage = 30 }) => {
  const { qs, headers } = verify;
  qs.per_page = perPage;
  qs.page = page;

  return fetch.get({
    qs,
    headers,
    url: `${API_USERS}/${login}/starred`
  });
};

const getOrgRepos = ({ org, verify, page = 1, perPage = 100 }) => {
  const { qs, headers } = verify;
  qs.per_page = perPage;
  qs.page = page;

  return fetch.get({
    qs,
    headers,
    url: `${API_ORGS}/${org}/repos`
  });
};

const getUserPubOrgs = ({ login, verify, page = 1, perPage = 100 }) => {
  const { qs, headers } = verify;
  qs.per_page = perPage;
  qs.page = page;

  return fetch.get({
    qs,
    headers,
    url: `${API_USERS}/${login}/orgs`
  });
};

const getReposYearlyCommits = ({ fullname, verify }) => {
  const { qs, headers } = verify;
  return fetch.get({
    qs,
    headers,
    url: `${API_REPOS}/${fullname}/stats/commit_activity`
  });
};

const getReposLanguages = async ({ fullname, verify }) => {
  const result = {};
  const { qs, headers } = verify;
  try {
    const languages = await fetch.get({
      qs,
      headers,
      url: `${API_REPOS}/${fullname}/languages`
    });
    let total = 0;
    Object.keys(languages).forEach(key => (total += languages[key]));
    Object.keys(languages).forEach(key => (result[key] = languages[key] / total));
  } catch (e) {
    logger.error(e);
  }
  return result;
};

const getReposContributors = async ({ fullname, verify }) => {
  const { qs, headers } = verify;
  const contributors = await fetch.get({
    qs,
    headers,
    url: `${API_REPOS}/${fullname}/stats/contributors`
  });
  const results = contributors.map((contributor) => {
    const { total, weeks, author } = contributor;
    const weeklyCommits = weeks.map((week) => {
      const { w, a, d, c } = week;
      return {
        week: w,
        data: parseInt((a + d + c), 10)
      };
    });
    const { avatar_url, login } = author;
    return {
      total,
      login,
      avatar_url,
      weeks: weeklyCommits,
    };
  });
  return results;
};

const fetchByPromiseList = promiseList =>
  Promise.all(promiseList).then((datas) => {
    let results = [];
    datas.forEach(data => (results = [...results, ...data]));
    return results;
  });

const fetchDatas = (func, options = {}) =>
  func(options).catch((e) => {
    logger.error(e);
    return [];
  });

const fetchMultiDatas = async (pages, func,  options = {}) => {
  let page = 0;
  const results = [];
  const pagesArray  = splitArray(new Array(pages).fill(0));

  for (let i = 0; i < pagesArray.length; i += 1) {
    const pageArray = pagesArray[i];
    const promiseList = pageArray.map((item, index) => {
      page += (index + 1);
      return fetchDatas(func, {
        page,
        ...options,
      });
    });
    const datas = await fetchByPromiseList(promiseList);
    results.push(...datas);
  }

  return results;
};

const mapReposToGet = async ({ repositories, params }, func) => {
  let index = 0;
  const results = [];
  let reposArray = [];
  let reposPromiseArray = [];
  for (let repository of repositories) {
    const repositoryPromise = fetchDatas(func, {
      verify: params,
      fullname: repository.full_name
    });
    if (index === SPLIT_NUM) {
      const datas = await Promise.all(reposPromiseArray);
      results.push(...datas.map((data, i) => ({
        data,
        full_name: reposArray[i].full_name
      })));
      index = 0;
      reposArray = [];
      reposPromiseArray = [];
    }
    reposArray.push(repository);
    reposPromiseArray.push(repositoryPromise);
    index += 1;
  }

  return results;
};

/* =========================== github api =========================== */

const getOctocat = (verify) => {
  const { qs, headers } = verify;
  return fetch.get({
    qs,
    headers,
    url: GITHUB.OCTOCAT
  });
};

const getZen = (verify) => {
  const { qs, headers } = verify;
  return fetch.get({
    qs,
    headers,
    url: GITHUB.ZEN
  });
};

const getToken = (code, verify) => {
  const { qs, headers } = verify;
  return fetch.post({
    headers,
    url: `${API_TOKEN}?code=${code}&${flattenObject(qs)}`
  });
};

const getUser = (login, verify) => {
  const { qs, headers } = verify;
  return fetch.get({
    qs,
    headers,
    url: `${API_USERS}/${login}`
  });
};

const getUserByToken = (verify) => {
  const { qs, headers } = verify;
  return fetch.get({
    qs,
    headers,
    url: `${API_GET_USER}`
  });
};

const getOrg = (org, verify) => {
  const { qs, headers } = verify;
  return fetch.get({
    qs,
    headers,
    url: `${API_ORGS}/${org}`
  });
};

const getOrgPubRepos = (org, verify, perPage, pages = 2) =>
  fetchMultiDatas(pages, getOrgRepos, {
    org,
    perPage,
    verify,
  });

const getPersonalStarred = (login, verify, perPage, pages = 1) =>
  fetchMultiDatas(pages, getUserStarred, {
    login,
    perPage,
    verify,
  });

const getPersonalPubRepos = (login, verify, perPage, pages = 6) =>
  fetchMultiDatas(pages, getUserRepos, {
    login,
    perPage,
    verify,
  });

const getPersonalPubOrgs = (login, verify, perPage, pages = 2) =>
  fetchMultiDatas(pages, getUserPubOrgs, {
    login,
    perPage,
    verify,
  });

const getAllReposYearlyCommits = async (repositories, params) =>
  await mapReposToGet({ repositories, params }, getReposYearlyCommits);

const getAllReposLanguages = async (repositories, params) =>
  await mapReposToGet({ repositories, params }, getReposLanguages);

const getAllReposContributors = async (repositories, params) =>
  await mapReposToGet({ repositories, params }, getReposContributors);

export default {
  // others
  getZen,
  getOctocat,
  getToken,
  // repos
  getRepository,
  starRepository,
  unstarRepository,
  getRepositoryReadme,
  // user
  getUser,
  getUserByToken,
  getUserStarred,
  getPersonalStarred,
  getPersonalPubRepos,
  getPersonalPubOrgs,
  // org
  getOrg,
  getOrgPubRepos,
  // repos
  getAllReposYearlyCommits,
  getAllReposLanguages,
  getReposLanguages,
  getAllReposContributors,
};
