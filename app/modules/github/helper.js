import config from 'config';
import OrgsModel from '../../databases/github-orgs';
import ReposModel from '../../databases/github-repos';
import CommitsModel from '../../databases/github-commits';
import UsersModel from '../../databases/github-users';

import GitHub from '../../services/github';
import {
  validateReposList,
  sortByCommits
} from '../../utils/github';

/* ================== private helper ================== */

/**
 * =============== repos ===============
 */
const fetchRepos = async (login, verify, pages = 2) => {
  const multiRepos = await GitHub.getPersonalPubRepos(login, verify, pages);
  try {
    const reposLanguages = await GitHub.getAllReposLanguages(multiRepos, verify);
    multiRepos.forEach((repository, index) => repository.languages = reposLanguages[index]);
  } catch (err) {}
  const setResults = await ReposModel.setRepos(login, multiRepos);
  return setResults;
};

const getRepos = async (login, verify, options) => {
  const findResult = await ReposModel.getRepos(login);
  if (findResult.length) {
    return findResult;
  }
  const { publicRepos } = options;
  const pages = Math.ceil(publicRepos / 100);
  return await fetchRepos(login, verify, pages);
};

const getUserPublicRepos = async (login, verify) => {
  const user = await getUser(login, verify);
  const { public_repos } = user;
  const repos = await getRepos(login, verify, {
    publicRepos: public_repos
  });
  return repos;
};

/**
 * =============== commits ===============
 */
const fetchCommits = async (repos, login, verify) => {
  const reposList = validateReposList(repos);
  try {
    const fetchedCommits = await GitHub.getAllReposYearlyCommits(reposList, verify);
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
 * =============== orgs ===============
 */
const fetchOrgDetail = async (orgLogin, verify) => {
  const org = await GitHub.getOrg(orgLogin, verify);
  if (!org.login) {
    return {};
  }

  const repos = await GitHub.getOrgPubRepos(orgLogin, verify);

  // set repos languages
  // try {
  //   const reposLanguages = await GitHub.getAllReposLanguages(repos, verify);
  //   repos.forEach((repository, index) => repository.languages = reposLanguages[index]);
  // } catch (err) {}

  // set repos contributors
  try {
    const reposContributors = await GitHub.getAllReposContributors(repos, verify);
    repos.forEach((repository, index) => repository.contributors = reposContributors[index]);
  } catch (err) {
    console.log(err);
  }

  org.repos = repos;
  await OrgsModel.create(org);
  return org;
};

const fetchUserOrgs = async (login, verify) => {
  const pubOrgs = await GitHub.getPersonalPubOrgs(login, verify);
  await UsersModel.updateUserOrgs(login, pubOrgs);
  return pubOrgs;
};

const getUserOrgs = async (login, verify) => {
  const findUser = await UsersModel.findUser(login);
  const pubOrgs = findUser.orgs;
  if (pubOrgs && pubOrgs.length) { return pubOrgs }
  return await fetchUserOrgs(login, verify);
};

const updateOrgs = async (login, verify) => {
  try {
    const userOrgs = await fetchUserOrgs(login, verify);
    for(let i = 0; i < userOrgs.length; i++) {
      const orgLogin = userOrgs[i].login;
      await fetchOrgDetail(orgLogin, verify);
    }
  } catch (err) {
    console.log(err);
  }
};

const getDetailOrgs = async (pubOrgs, verify) => {
  const orgs = [];
  for(let i = 0; i < pubOrgs.length; i++) {
    const orgLogin = pubOrgs[i].login;
    let org = await OrgsModel.find(orgLogin);
    if (!org) {
      org = await fetchOrgDetail(orgLogin, verify);
    }
    orgs.push(org);
  }
  return orgs;
};

const getOrgs = async (login, verify) => {
  const userOrgs = await getUserOrgs(login, verify);
  return await getDetailOrgs(userOrgs, verify);
};

/*
 * =============== user ===============
 */
const fetchUser = async (login, verify) => {
  const userInfo = await GitHub.getUser(login, verify);
  const addResut = await UsersModel.createGitHubUser(userInfo);
  return addResut.result;
};

const getUser = async (login, verify) => {
  const user = await UsersModel.findUser(login);
  if (user) { return user }
  return await fetchUser(login, verify);
};

export default {
  // repos
  fetchRepos,
  getRepos,
  getUserPublicRepos,
  // commits
  fetchCommits,
  getCommits,
  // orgs
  getOrgs,
  updateOrgs,
  getUser
}
