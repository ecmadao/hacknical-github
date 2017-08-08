import logger from '../../utils/logger';
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

  await ReposModel.setRepository(login, repository);
  return repository;
};

/**
 * =============== repos ===============
 */
const fetchRepos = async (options = {}) => {
  const {
    login,
    verify,
    perPage,
    fetch = GitHubV4.getPersonalPubRepos,
  } = options;

  const multiRepos =
    await fetch(login, verify, perPage);

  await ReposModel.setRepos(login, multiRepos);
  return multiRepos;
};

const updateContributed = async (options) => {
  const {
    login,
    verify,
    perPage = PER_PAGE.REPOS,
  } = options;

  const multiRepos =
    await GitHubV4.getPersonalContributedRepos(login, verify, perPage);

  const userContributeds = multiRepos.filter(
    repository => repository.owner.login !== login
  );
  const contributions = userContributeds.map(
    repository => repository.full_name
  );

  await Promise.all(userContributeds.map(async (repository) => {
    const owner = repository.owner.login || repository.full_name.split('/')[0];
    await ReposModel.setRepository(owner, repository);
  }));

  await UsersModel.updateUserContributions(login, contributions);
  return userContributeds;
};

const getRepository = async (fullname, verify, required = []) => {
  const findResult = await ReposModel.getRepository(fullname);
  if (!findResult || required.some(key => !findResult[key] || !findResult[key].length)) {
    return await fetchRepository(fullname, verify, findResult || {});
  }
  return findResult;
};

const getRepos = async (login, verify, fetch) => {
  const findResult = await ReposModel.getRepos(login);
  if (findResult.length) {
    return findResult;
  }

  return await fetchRepos({
    login,
    verify,
    fetch,
    perPage: PER_PAGE.REPOS,
  });
};

const getUserContributed = async (login, verify) => {
  const user = await getUser(login, verify);
  const { contributions } = user;
  if (!contributions || !contributions.length) {
    return await updateContributed({
      login,
      verify,
      perPage: PER_PAGE.REPOS
    });
  }
  const repos = [];

  await Promise.all(contributions.map(async (contribution) => {
    const fullname = contribution;
    const repository = await getRepository(fullname, verify);
    repos.push(repository);
  }));
  return repos;
};

const getUserPublicRepos = async (login, verify) =>
  await getRepos(login, verify);

const getUserContributedRepos = async (login, verify) =>
  await getUserContributed(login, verify);

const getUserStarred = async ({ login, verify, after, perPage = PER_PAGE.STARRED }) => {
  const result = await GitHubV4.getUserStarred({
    after,
    login,
    verify,
    first: perPage
  });
  const {
    results = [],
  } = result;

  await Promise.all(results.map(async (repository) => {
    const { owner } = repository;
    await ReposModel.setRepository(owner.login, repository);
  }));
  return result;
};

/**
 * =============== commits ===============
 */
const updateCommits = async ({ login, verify }) => {
  const repos = await getUserPublicRepos(login, verify);
  const reposList = validateReposList(repos);
  try {
    const fetchedResults =
      await GitHubV3.getAllReposYearlyCommits(reposList, verify);
    const results = fetchedResults.map((fetchedResult) => {
      const { full_name, data } = fetchedResult;
      const repository = reposList.find(
        item => item.full_name === full_name
      );
      if (!repository || !data.length) return {};
      const { name, created_at, pushed_at } = repository;
      const totalCommits = data.reduce(
        (pre, next, i) => (i === 0 ? 0 : pre) + next.total, 0
      );
      return {
        name,
        pushed_at,
        created_at,
        totalCommits,
        commits: data,
      };
    });
    const sortResult = sortByCommits(results);
    if (sortResult && sortResult.length) {
      await CommitsModel.setCommits(login, sortResult);
    }
    return sortResult;
  } catch (err) {
    logger.error(err);
    return [];
  }
};

const getCommits = async (login, verify) => {
  const findCommits = await CommitsModel.getCommits(login);
  if (findCommits.length) {
    return findCommits;
  }
  return await updateCommits({ login, verify });
};

/**
 * =============== orgs ===============
 */
const getReposContributors = async (options = {}) => {
  const {
    login,
    repos,
    verify,
  } = options;

  const fetchedResults =
    await GitHubV3.getAllReposContributors(repos, verify);

  fetchedResults.forEach((fetchedResult) => {
    const { full_name, data } = fetchedResult;
    const repository = repos.find(item => item.full_name === full_name);
    if (repository && data.length) {
      repository.contributors = data;
    } else {
      repository.contributors = [];
    }
  });

  await ReposModel.setRepos(login, repos);
  return repos;
};

const getOrgRepositories = async (options = {}) => {
  const {
    org,
    login,
    verify,
  } = options;

  const results = [];
  let repos = [];
  try {
    repos = await getRepos(org.login, verify, GitHubV4.getOrgPubRepos);
  } catch (e) {
    repos = [];
    logger.error(e);
  }

  if (repos && repos.length) {
    try {
      const contributeds = await getUserContributedRepos(login, verify);
      const contributedsInOrg = [];

      repos.forEach((repository) => {
        if (repository.contributors && repository.contributors.length) {
          results.push(repository);
        } else if (contributeds.find(item => item.full_name === repository.full_name)) {
          contributedsInOrg.push(repository);
        }
      });

      if (contributedsInOrg.length) {
        const reposWithContributors = await getReposContributors({
          verify,
          login: org.login,
          repos: contributedsInOrg,
        });
        results.push(...reposWithContributors);
      }
    } catch (err) {
      logger.error(err);
    }
  }
  return results;
};

const fetchUserOrgs = async (login, verify) => {
  const pubOrgs =
    await GitHubV3.getPersonalPubOrgs(login, verify, PER_PAGE.ORGS);
  await UsersModel.updateUserOrgs(login, pubOrgs);
  return pubOrgs;
};

const getUserOrgs = async (login, verify) => {
  const findUser = await UsersModel.findUser(login);
  const pubOrgs = findUser.orgs;
  if (pubOrgs && pubOrgs.length) return pubOrgs;
  return await fetchUserOrgs(login, verify);
};

const getOrgsInfo = async (pubOrgs, verify) => {
  const orgs = [];

  await Promise.all(pubOrgs.map(async (pubOrg) => {
    const orgLogin = pubOrg.login;
    let org = await OrgsModel.find(orgLogin);
    if (!org) {
      org = await GitHubV3.getOrg(orgLogin, verify);
      await OrgsModel.update(org);
    }
    orgs.push(org);
  }));
  return orgs;
};

const getOrgs = async (login, verify) => {
  const userOrgs = await getUserOrgs(login, verify);
  const orgs = await getOrgsInfo(userOrgs, verify, login);
  // get orgs repositories
  const results = await Promise.all(orgs.map(async (org) => {
    const {
      name,
      blog,
      html_url,
      created_at,
      avatar_url,
      description,
      public_repos,
    } = org;
    const repositories = await getOrgRepositories({
      org,
      login,
      verify,
    });
    return {
      name,
      blog,
      html_url,
      avatar_url,
      created_at,
      description,
      public_repos,
      login: org.login,
      repos: repositories
    };
  }));
  return results;
};

const updateOrgs = async ({ login, verify }) => {
  try {
    const userOrgs = await fetchUserOrgs(login, verify);

    await Promise.all(userOrgs.map(async (userOrg) => {
      const orgLogin = userOrg.login;
      const org = await GitHubV3.getOrg(orgLogin, verify);
      await OrgsModel.update(org);
      await getOrgRepositories({
        org,
        login,
        verify,
      });
    }));
  } catch (err) {
    logger.error(err);
  }
};

/*
 * =============== user ===============
 */
const fetchUser = async (login, verify) => {
  const userInfo = await GitHubV4.getUser(login, verify);
  if (!userInfo) return null;

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
  getUserContributed,
  updateContributed,
  // commits
  updateCommits,
  getCommits,
  // orgs
  getOrgs,
  updateOrgs,
  // user
  getUser,
};
