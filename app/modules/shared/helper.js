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
  validateReposMap,
} from '../../utils/github';

/* ================== private helper ================== */
const fetchRepository = async (fullname, verify, repository = {}) => {
  delete repository._id;

  const getReposResult = await GitHubV4.getRepository(fullname, verify);
  if (!getReposResult) return null;

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
  if (findResult.length) return findResult;
  const results = [];
  await Promise.all(fullnames.map(
    async (fullname) => {
      const result = await getRepository(fullname, verify);
      result && results.push(result);
    }
  ));
  return results;
};

const getUserRepositories = async (login, verify, fetch) => {
  const findResult = await ReposModel.getUserRepositories(login);
  return findResult;
};

const getUserContributed = async (login, verify) => {
  const userInfo = await UsersInfoModal.findOne(login);
  const { contributions = [] } = userInfo;
  const repositories = [];

  await Promise.all(contributions.map(async (contribution) => {
    const fullname = contribution;
    const repository = await getRepository(fullname, verify);
    repository && repositories.push(repository);
  }));
  return repositories;
};

const getStarredRepositories = async (starred, verify) => {
  const repositories = [];
  await Promise.all(starred.map(
    async (fullname) => {
      const result = await getRepository(fullname, verify);
      result && repositories.push(result);
    }
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
const getCommits = async (login, verify) => {
  const findCommits = await CommitsModel.getCommits(login);
  return findCommits;
};

/**
 * =============== orgs ===============
 */
const getReposByFullnames = async repositoriesMap =>
  await ReposModel.getRepositories([...repositoriesMap.values()]);

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
      const contributedsSet = new Set(
        contributeds.map(item => item.full_name)
      );
      const contributedsInOrgSet = new Set();

      repositories.forEach((repository) => {
        if (repository.contributors && repository.contributors.length) {
          results.push(repository);
        } else if (contributedsSet.has(repository.full_name)) {
          contributedsInOrgSet.add(repository.full_name);
        }
      });
      if (contributedsInOrgSet.size) {
        results.push(...await getReposByFullnames(contributedsInOrgSet));
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

/*
 * =============== user ===============
 */
const getUser = async (login, verify) => {
  const user = await UsersModel.findOne(login);
  return user;
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
    || (new Date() - hotmap.updateTime) >= 48 * 60 * 60 * 1000 /* two day */) {
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
  // orgs
  getOrganizations,
  // commits
  getCommits,
  // repos
  getRepository,
  getRepositories,
  getUserStarred,
  getUserRepositories,
  getUserContributed,
  getRepositoryReadme,
};
