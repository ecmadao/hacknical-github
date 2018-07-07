import logger from '../../utils/logger';
import OrgsModel from '../../databases/github-orgs';
import ReposModel from '../../databases/github-repos';
import ReposReadmeModel from '../../databases/github-repos-readme';
import CommitsModel from '../../databases/github-commits';
import UsersModel from '../../databases/github-users';
import UsersInfoModal from '../../databases/github-users-info';

/**
 * =============== repos ===============
 */

const getRepository = async fullname =>
  await ReposModel.getRepository(fullname);

const getRepositoryReadme = async fullname =>
  await ReposReadmeModel.findOne(fullname);

const getRepositories = async fullnames =>
  await ReposModel.getRepositories(fullnames);

const getUserRepositories = async login =>
  await ReposModel.getUserRepositories(login);

const getUserContributed = async (login) => {
  const userInfo = await UsersInfoModal.findOne(login);
  const { contributions = [] } = userInfo;
  const repositories = [];

  await Promise.all(contributions.map(async (contribution) => {
    const fullname = contribution;
    const repository = await getRepository(fullname);
    repository && repositories.push(repository);
  }));
  return repositories;
};

const getStarredRepositories = async (starred) => {
  const repositories = [];
  await Promise.all(starred.map(
    async (fullname) => {
      const result = await getRepository(fullname);
      result && repositories.push(result);
    }
  ));

  return {
    hasNextPage: false,
    results: repositories,
  };
};

const getUserStarred = async (login) => {
  const userInfo = await UsersInfoModal.findOne(login);
  if (userInfo.starredFetched) {
    logger.info(`[STARRED][get ${login} starred from database]`);
    const result = await getStarredRepositories(userInfo.starred);
    if (result.results.length) return result;
  }

  return [];
};

/**
 * =============== commits ===============
 */
const getCommits = async login =>
  await CommitsModel.getCommits(login);

/**
 * =============== orgs ===============
 */
const getReposByFullnames = async repositoriesMap =>
  await ReposModel.getRepositories([...repositoriesMap.values()]);

const getOrgRepositories = async (options = {}) => {
  const {
    org,
    login,
  } = options;

  const results = [];
  let repositories = [];
  try {
    repositories = await getUserRepositories(org.login);
  } catch (e) {
    repositories = [];
    logger.error(e);
  }

  if (repositories && repositories.length) {
    try {
      const contributeds = await getUserContributed(login);
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


const getUserOrganizations = async (login) => {
  const userInfo = await UsersInfoModal.findOne(login);
  const { organizations = [] } = userInfo;
  return organizations;
};

const getOrganizationsInfo = async (pubOrgs) => {
  const organizations = [];

  await Promise.all(pubOrgs.map(async (pubOrg) => {
    const orgLogin = pubOrg.login;
    const organization = await OrgsModel.findOne(orgLogin);
    if (organization) {
      organizations.push(organization);
    }
  }));
  return organizations;
};

const getOrganizations = async (login) => {
  const userOrganizations = await getUserOrganizations(login);
  const organizations =
    await getOrganizationsInfo(userOrganizations);

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
const getUser = async login => await UsersModel.findOne(login);

/*
 * =============== hotmap ===============
 * */

const getHotmap = async (login) => {
  const userInfo = await UsersInfoModal.findOne(login);
  return userInfo.hotmap
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
