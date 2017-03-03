import OrgsModel from '../../databases/github-orgs';
import ReposModel from '../../databases/github-repos';
import CommitsModel from '../../databases/github-commits';
import UsersModel from '../../databases/github-users';
import Github from '../../services/github';
import { flattenObject } from '../../utils/helpers';
import {
  validateReposList,
  sortByCommits
} from '../../utils/github';
import dateHelper from '../../utils/date';

/* ================== private helper ================== */

/**
 * ===== repos =====
 */
const fetchRepos = async (login, verify, pages = 2) => {
  const multiRepos = await Github.getPersonalPubRepos(login, verify, pages);
  try {
    const reposLanguages = await Github.getAllReposLanguages(multiRepos, verify);
    multiRepos.forEach((repository, index) => repository.languages = reposLanguages[index]);
  } catch (err) {}
  const setResults = await ReposModel.setRepos(login, multiRepos);
  return setResults;
};

const getRepos = async (login, verify, options) => {
  const { publicRepos } = options;
  const pages = Math.ceil(publicRepos / 100);
  const findResult = await ReposModel.getRepos(login);
  if (findResult.length) {
    return findResult;
  }
  return await fetchRepos(login, verify, pages);
};

/**
 * ===== commits =====
 */
const fetchCommits = async (repos, login, verify) => {
  const reposList = validateReposList(repos);
  try {
    const fetchedCommits = await Github.getAllReposYearlyCommits(reposList, verify);
    const results = fetchedCommits.map((commits, index) => {
      const repository = reposList[index];
      const { reposId, name, created_at, pushed_at } = repository;
      let totalCommits = 0;
      commits.forEach(commit => totalCommits += commit.total);
      return {
        commits,
        totalCommits,
        reposId,
        name,
        created_at,
        pushed_at
      }
    });
    const sortResult = sortByCommits(results);
    await CommitsModel.setCommits(login, sortResult);
    return sortResult;
  } catch (err) {
    return [];
  }
};

const getCommits = async (login, verify) => {
  const findCommits = await CommitsModel.getCommits(login);
  if (findCommits.length) {
    return sortByCommits(findCommits);
  }
  const findRepos = await ReposModel.getRepos(login);
  return await fetchCommits(findRepos, login, verify);
};

/**
 * ===== orgs =====
 */
const fetchOrg = async (orgLogin, verify) => {
  const org = await Github.getOrg(orgLogin, verify);
  if (!org.login) {
    return {};
  }

  const repos = await Github.getOrgPubRepos(orgLogin, verify);

  // set repos languages
  try {
    const reposLanguages = await Github.getAllReposLanguages(repos, verify);
    repos.forEach((repository, index) => repository.languages = reposLanguages[index]);
  } catch (err) {}

  // set repos contributors
  try {
    const reposContributors = await Github.getAllReposContributors(repos, verify);
    repos.forEach((repository, index) => repository.contributors = reposContributors[index]);
  } catch (err) {}

  org.repos = repos;
  await OrgsModel.create(org);
  return org;
};

const fetchOrgs = async (login, verify) => {
  const pubOrgs = await Github.getPersonalPubOrgs(login, verify);
  const orgs = await getDetailOrgs(pubOrgs);
  await UsersModel.updateUserOrgs(login, pubOrgs);
  return orgs;
};

const getDetailOrgs = async (pubOrgs, verify) => {
  const orgs = [];
  for(let i = 0; i < pubOrgs.length; i++) {
    const orgLogin = pubOrgs[i].login;
    let org = await OrgsModel.find(orgLogin);
    if (!org) {
      org = await fetchOrg(orgLogin, verify);
    }
    orgs.push(org);
  }
  return orgs;
};

const getOrgs = async (login, verify) => {
  const findUser = await UsersModel.findUser(login);
  const pubOrgs = findUser.orgs;
  if (pubOrgs && pubOrgs.length) {
    return await getDetailOrgs(pubOrgs, verify);
  }
  return await fetchOrgs(login, verify);
};

/*
 * ==== user =====
 */
const fetchGithubUser = async (login, verify) => {
  const userInfo = await Github.getUser(login, verify);
  const addResut = await UsersModel.createGithubUser(userInfo);
  return addResut.result;
};

const getGithubUser = async (login, verify) => {
  const user = await UsersModel.findUser(login);
  if (user) { return user }
  return await fetchGithubUser(login, verify);
};


/* ================== router handler ================== */

const getZen = async (ctx) => {
  const result = await Github.getZen();
  ctx.body = {
    success: true,
    result
  }
};

const getOctocat = async (ctx) => {
  const result = await Github.getOctocat();
  ctx.body = {
    success: true,
    result
  }
};

const getToken = async (ctx, next) => {
  const { code } = ctx.request.query;
  const token = await Github.getToken(code);
  ctx.body = {
    success: true,
    result: token
  }
};

const getUser = async (ctx, next) => {
  const { verify, login } = ctx.request.query;
  console.log(verify);
  const user = await getGithubUser(login, verify);
  ctx.body = {
    success: true,
    result: user
  };
};

const getUserDatas = async (ctx, next) => {
  const { login, verify } = ctx.request.query;
  const user = await getGithubUser(login, verify);
  const { public_repos } = user;
  const repos = await getRepos(login, verify, {
    publicRepos: public_repos
  });
  const commits = await getCommits(login, verify);
  ctx.body = {
    success: true,
    result: {
      repos,
      commits: sortByCommits(commits)
    }
  }
};


export default {
  /* ====== */
  getZen,
  getOctocat,
  /* ====== */
  getToken,
  getUser,
  getUserDatas
}
