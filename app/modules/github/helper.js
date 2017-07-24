import logger from '../../utils/log';
import OrgsModel from '../../databases/github-orgs';
import ReposModel from '../../databases/github-repos';
import CommitsModel from '../../databases/github-commits';
import UsersModel from '../../databases/github-users';
import GitHubV3 from '../../services/github-v3';
import GitHubV4 from '../../services/github-v4';
import {
  PER_PAGE,
  sortByCommits,
  validateReposList,
} from '../../utils/github';

/* ================== private helper ================== */
const fetchRepository = async (fullname, verify, repos = {}) => {
  delete repos._id;

  const getReposResult = await GitHubV4.getRepository(fullname, verify);
  const repository = Object.assign({}, repos, getReposResult);

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
  } = options;

  const multiRepos =
    await GitHubV4.getPersonalPubRepos(login, verify, perPage);

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

const getUserStarred = async ({ login, verify, after, perPage = PER_PAGE.STARRED }) => {
  const repos = await GitHubV4.getUserStarred({
    after,
    login,
    verify,
    first: perPage
  });

  const results = [];
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
    const fetchedCommits = await GitHubV3.getAllReposYearlyCommits(reposList, verify);
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
  const org = await GitHubV3.getOrg(orgLogin, verify);
  if (!org.login) {
    return {};
  }

  const repos = await GitHubV4.getOrgPubRepos(orgLogin, verify, PER_PAGE.REPOS);

  // set repos contributors
  if (repos && repos.length) {
    try {
      const reposContributors =
        await GitHubV3.getAllReposContributors(repos, verify);
      repos.forEach((repository, index) => {
        const contributors = reposContributors[index];
        if (contributors && contributors.length) {
          repository.contributors = contributors;
        }
      });
    } catch (err) {
      logger.error(err);
    }
  }

  org.repos = repos;
  await OrgsModel.update(org);
  return org;
};

const fetchUserOrgs = async (login, verify) => {
  const pubOrgs = await GitHubV3.getPersonalPubOrgs(login, verify, PER_PAGE.ORGS);
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
    logger.error(err);
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
  const userInfo = await GitHubV4.getUser(login, verify);
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
  getUser,
};
