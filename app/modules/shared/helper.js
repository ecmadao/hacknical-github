import logger from '../../utils/logger';
import OrgsModel from '../../databases/github-orgs';
import ReposModel from '../../databases/github-repos';
import ReposReadmeModel from '../../databases/github-repos-readme';
import CommitsModel from '../../databases/github-commits';
import UsersModel from '../../databases/github-users';
import UsersInfoModal from '../../databases/github-users-info';
import GitHubV3 from '../../services/github-v3';
import GitHubV4 from '../../services/github-v4';
import Spider from '../../services/spider';
import {
  PER_PAGE,
  sortByCommits,
  validateReposList,
} from '../../utils/github';

/* ================== private helper ================== */
const fetchRepository = async (fullname, verify, repository = {}) => {
  delete repository._id;

  const getReposResult = await GitHubV4.getRepository(fullname, verify);
  const data = Object.assign({}, repository, getReposResult);
  const login = data.owner.login;

  await ReposModel.setRepository(login, data);
  return data;
};

/**
 * =============== repos ===============
 */
const fetchRepositories = async (options = {}) => {
  const {
    login,
    verify,
    perPage,
    fetch = GitHubV4.getPersonalPubRepos,
  } = options;

  const multiRepos =
    await fetch(login, verify, perPage);

  await ReposModel.setRepositories(login, multiRepos);
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

  await UsersInfoModal.updateUserContributions(login, contributions);
  return userContributeds;
};

const getRepository = async (fullname, verify, required = []) => {
  const findResult = await ReposModel.getRepository(fullname);
  if (!findResult || required.some(key => !findResult[key] || !findResult[key].length)) {
    return await fetchRepository(fullname, verify, findResult || {});
  }
  return findResult;
};

const getRepositoryReadme = async (fullname, verify) => {
  let result = await ReposReadmeModel.findOne(fullname);
  if (!result) {
    const readme = await GitHubV3.getRepositoryReadme(fullname, verify);
    result = {
      readme,
      full_name: fullname
    };
    await ReposReadmeModel.update(result);
  }
  return result;
};

const getRepositories = async (fullnames, verify) => {
  const findResult = await ReposModel.getRepositories(fullnames);
  if (findResult.length) {
    return findResult;
  }
  const results = [];
  await Promise.all(fullnames.map(
    async (fullname) => {
      const result = await getRepository(fullname, verify);
      results.push(result);
    }
  ));
  return results;
};

const getUserRepositories = async (login, verify, fetch) => {
  const findResult = await ReposModel.getUserRepositories(login);
  if (findResult.length) {
    return findResult;
  }

  return await fetchRepositories({
    login,
    verify,
    fetch,
    perPage: PER_PAGE.REPOS,
  });
};

const getUserContributed = async (login, verify) => {
  const userInfo = await UsersInfoModal.findOne(login);
  const { contributions } = userInfo;
  if (!contributions || !contributions.length) {
    return await updateContributed({
      login,
      verify,
      perPage: PER_PAGE.REPOS
    });
  }
  const repositories = [];

  await Promise.all(contributions.map(async (contribution) => {
    const fullname = contribution;
    const repository = await getRepository(fullname, verify);
    repositories.push(repository);
  }));
  return repositories;
};

const getStarredRepositories = async (starred, verify) => {
  const repositories = await Promise.all(starred.map(
    async fullname => await getRepository(fullname, verify)
  ));

  return {
    hasNextPage: false,
    results: repositories,
  };
};

const getUserStarred = async (options) => {
  const {
    login,
    after,
    verify,
    perPage = PER_PAGE.STARRED,
  } = options;

  const userInfo = await UsersInfoModal.findOne(login);
  if (userInfo.starredFetched) {
    logger.info(`[STARRED][get ${login} starred from database]`);
    const result = await getStarredRepositories(userInfo.starred, verify);
    if (result.results.length) return result;
  }

  const result = await GitHubV4.getUserStarred({
    after,
    login,
    verify,
    first: perPage
  });

  const { results, hasNextPage } = result;
  const fullnames = [];
  await Promise.all(results.map(async (repository) => {
    const { owner, full_name } = repository;
    fullnames.push(full_name);
    await ReposModel.setRepository(owner.login, repository);
  }));

  await UsersInfoModal.updateUserStarred(login, fullnames, !hasNextPage);

  return result;
};

/**
 * =============== commits ===============
 */
const updateCommits = async ({ login, verify, repositories }) => {
  const reposList = validateReposList(repositories);
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
  const repositories = await getUserRepositories(login, verify);
  return await updateCommits({ login, verify, repositories });
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

  await ReposModel.setRepositories(login, repos);
  return repos;
};

const getOrgRepositories = async (options = {}) => {
  const {
    org,
    login,
    verify,
    fetch = GitHubV4.getOrgPubRepos
  } = options;

  const results = [];
  let repositories = [];
  try {
    repositories =
      await getUserRepositories(org.login, verify, fetch);
  } catch (e) {
    repositories = [];
    logger.error(e);
  }

  if (repositories && repositories.length) {
    try {
      const contributeds = await getUserContributed(login, verify);
      const contributedsInOrg = [];

      repositories.forEach((repository) => {
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

const fetchUserOrganizations = async (login, verify) => {
  const pubOrganizations =
    await GitHubV3.getPersonalPubOrgs(login, verify, PER_PAGE.ORGS);
  await UsersInfoModal.updateUserOrganizations(login, pubOrganizations);
  return pubOrganizations;
};

const getUserOrganizations = async (login, verify) => {
  const userInfo = await UsersInfoModal.findOne(login);
  const { organizations } = userInfo;
  if (organizations && organizations.length) return organizations;
  return await fetchUserOrganizations(login, verify);
};

const getOrganizationsInfo = async (pubOrgs, verify) => {
  const organizations = [];

  await Promise.all(pubOrgs.map(async (pubOrg) => {
    const orgLogin = pubOrg.login;
    let organization = await OrgsModel.findOne(orgLogin);
    if (!organization) {
      organization = await GitHubV3.getOrg(orgLogin, verify);
      await OrgsModel.update(organization);
    }
    organizations.push(organization);
  }));
  return organizations;
};

const getOrganizations = async (login, verify) => {
  const userOrganizations = await getUserOrganizations(login, verify);
  const organizations =
    await getOrganizationsInfo(userOrganizations, verify, login);

  // get organizations repositories
  const results = await Promise.all(organizations.map(async (org) => {
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

const updateOrganizations = async ({ login, verify }) => {
  try {
    const userOrgs = await fetchUserOrganizations(login, verify);

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
  const user = await UsersModel.findOne(login);
  if (user) { return user; }
  return await fetchUser(login, verify);
};

/*
 * =============== hotmap ===============
 * */

const fetchHotmap = async (login, start) => {
  const hotmap = await Spider.hotmap(login, start);
  const update = await UsersInfoModal.updateUserHotmap(login, hotmap);
  return update.result;
};

const getHotmap = async (login) => {
  const userInfo = await UsersInfoModal.findOne(login);
  let { hotmap } = userInfo;
  if (!hotmap
    || !hotmap.datas.length
    || !hotmap.allFetched
    || (new Date() - hotmap.updateTime) >= 12 * 60 * 60 * 1000) {
    const user = await UsersModel.findOne(login);
    const start = user.created_at;
    hotmap = await fetchHotmap(login, start);
  }
  return hotmap;
};


export default {
  // user
  getUser,
  // hotmap
  getHotmap,
  fetchHotmap,
  // orgs
  getOrganizations,
  updateOrganizations,
  // commits
  getCommits,
  updateCommits,
  // repos
  getRepository,
  getRepositories,
  getUserStarred,
  getUserRepositories,
  updateContributed,
  getUserContributed,
  getRepositoryReadme,
};
