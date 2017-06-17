import log from '../../utils/log';
import OrgsModel from '../../databases/github-orgs';
import ReposModel from '../../databases/github-repos';
import CommitsModel from '../../databases/github-commits';
import UsersModel from '../../databases/github-users';

import GitHub from '../../services/github';
import {
  PER_PAGE,
  sortByCommits,
  validateReposList,
} from '../../utils/github';

/* ================== private helper ================== */
const fetchRepository = async (fullname, verify, repos = {}) => {
  delete repos._id;
  const getReposResult = await GitHub.getRepository(fullname, verify);
  const repository = Object.assign({}, repos, getReposResult);
  if (!repository.languages) {
    repository.languages = await GitHub.getReposLanguages(fullname, verify);
  }
  const login = repository.owner.login;
  const setResult = await ReposModel.setRepository(login, repository);
  delete setResult._id;
  return setResult;
};

/**
 * =============== repos ===============
 */
const fetchRepos = async (options = {}) => {
  const {
    login,
    verify,
    perPage,
    pages = 2
  } = options;

  const multiRepos =
    await GitHub.getPersonalPubRepos(login, verify, perPage, pages);

  try {
    const reposLanguages =
      await GitHub.getAllReposLanguages(multiRepos, verify);
    multiRepos.forEach(
      (repository, index) => (repository.languages = reposLanguages[index]));
  } catch (err) {
    log.error(err);
  }
  const setResults = await ReposModel.setRepos(login, multiRepos);
  return setResults;
};

const getRepository = async (fullname, verify, required = []) => {
  const findResult = await ReposModel.getRepository(fullname);
  if (!findResult || required.some(key => !findResult[key] || !findResult[key].length)) {
    return await fetchRepository(fullname, verify, findResult || {});
  }
  return findResult;
};

const getRepos = async (login, verify, options) => {
  const findResult = await ReposModel.getRepos(login);
  if (findResult.length) {
    return findResult;
  }

  const { publicRepos } = options;
  const pages = Math.ceil(publicRepos / PER_PAGE.REPOS);
  return await fetchRepos({
    login,
    verify,
    pages,
    perPage: PER_PAGE.REPOS
  });
};

const getUserPublicRepos = async (login, verify) => {
  const user = await getUser(login, verify);
  const { public_repos } = user;
  const repos = await getRepos(login, verify, {
    publicRepos: public_repos
  });
  return repos;
};

const getUserStarred = async ({ login, verify, per_page = PER_PAGE.STARRED, page = 1 }) => {
  const repos = GitHub.getUserStarred({
    page,
    login,
    verify,
    per_page
  });

  const results = [];
  // TODO save repos to user-starred schema
  for (let i = 0; i < repos.length; i += 1) {
    const repository = repos[i];
    const { owner } = repository;

    const result = await ReposModel.setRepository(owner.login, repository);
    results.push(result);
  }
  return results;
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
      commits.forEach(commit => (totalCommits += commit.total));
      return {
        commits,
        totalCommits,
        reposId,
        name,
        created_at,
        pushed_at
      };
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

  const repos = await GitHub.getOrgPubRepos(orgLogin, verify, PER_PAGE.REPOS);

  // set repos languages
  // try {
  //   const reposLanguages = await GitHub.getAllReposLanguages(repos, verify);
  //   repos.forEach((repository, index) => repository.languages = reposLanguages[index]);
  // } catch (err) {}

  // set repos contributors
  try {
    const reposContributors =
      await GitHub.getAllReposContributors(repos, verify);
    repos.forEach((repository, index) =>
      (repository.contributors = reposContributors[index]));
  } catch (err) {
    log.error(err);
  }

  org.repos = repos;
  await OrgsModel.create(org);
  return org;
};

const fetchUserOrgs = async (login, verify) => {
  const pubOrgs = await GitHub.getPersonalPubOrgs(login, verify, PER_PAGE.ORGS);
  await UsersModel.updateUserOrgs(login, pubOrgs);
  return pubOrgs;
};

const getUserOrgs = async (login, verify) => {
  const findUser = await UsersModel.findUser(login);
  const pubOrgs = findUser.orgs;
  if (pubOrgs && pubOrgs.length) { return pubOrgs; }
  return await fetchUserOrgs(login, verify);
};

const updateOrgs = async (login, verify) => {
  try {
    const userOrgs = await fetchUserOrgs(login, verify);
    for (let i = 0; i < userOrgs.length; i += 1) {
      const orgLogin = userOrgs[i].login;
      await fetchOrgDetail(orgLogin, verify);
    }
  } catch (err) {
    log.error(err);
  }
};

const getDetailOrgs = async (pubOrgs, verify) => {
  const orgs = [];
  for (let i = 0; i < pubOrgs.length; i += 1) {
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
  if (user) { return user; }
  return await fetchUser(login, verify);
};

export default {
  // repos
  fetchRepos,
  getRepos,
  getRepository,
  getUserStarred,
  getUserPublicRepos,
  // commits
  fetchCommits,
  getCommits,
  // orgs
  getOrgs,
  updateOrgs,
  getUser
};
