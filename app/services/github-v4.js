/* eslint no-loop-func: "off", no-constant-condition: "off" */

import logger from '../utils/logger';
import adapter from './v4-to-v3';
import {
  fetch,
  getClient,
} from '../utils/request-graphql';

/* =================== PRIVATE =================== */

const wrapFetch = async (func, options = {}) => {
  try {
    return await func(options);
  } catch (e) {
    logger.error(e);
    return null;
  }
};

const fetchMultiDatas = async (options = {}) => {
  const {
    func,
    first,
    login,
    verify,
  } = options;

  const results = [];
  let endCursor = null;

  for (;true;) {
    const result = await wrapFetch(func, {
      login,
      verify,
      first,
      after: endCursor
    });
    if (result && result.results) {
      endCursor = result.endCursor;
      results.push(...result.results);
    }
    if (!result.hasNextPage) break;
  }

  return results;
};

const baseFetch = (query, verify) => {
  const { headers } = verify;
  const client = getClient(headers);
  return fetch(client, query);
};

const baseGetOrgs = async (options = {}) => {
  const {
    login,
    verify,
    after = null,
    first = 100
  } = options;

  let limit = `first: ${first}`;
  if (after) {
    limit = `${limit}, after: "${after}"`;
  }
  const query = `{
    user(login: "${login}") {
      organizations(${limit}) {
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node ${ORG_QUERY}
        }
      }
    }
  }`;
  const fetchResults = await baseFetch(query, verify);
  const { pageInfo, edges } = fetchResults.user.organizations;
  const results = edges.map(edge => adapter.organization(edge.node));
  return {
    results,
    endCursor: pageInfo.endCursor,
    hasNextPage: pageInfo.hasNextPage,
  };
};

const baseGetRepos = async (options = {}) => {
  const {
    login,
    verify,
    after = null,
    first = 100,
    who = 'user',
    what = 'repositories',
  } = options;

  let limit = `first: ${first}`;
  if (after) {
    limit = `${limit}, after: "${after}"`;
  }
  const query = `{
    ${who}(login: "${login}") {
      ${what}(${limit}) {
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node ${REPOSITORY_QUERY}
        }
      }
    }
  }`;
  const fetchResults = await baseFetch(query, verify);
  const { pageInfo, edges } = fetchResults[who][what];
  const results = edges.map(edge => adapter.repository(edge.node));
  return {
    results,
    endCursor: pageInfo.endCursor,
    hasNextPage: pageInfo.hasNextPage,
  };
};

/* ==================== PUBLIC FUNCS ==================== */

const USER_QUERY = `{
  id
  name
  bio
  login
  email
  websiteUrl
  location
  company
  createdAt
  updatedAt
  avatarUrl
  followers {
    totalCount
  }
  following {
    totalCount
  }
  starredRepositories {
    totalCount
  }
  repositories {
    totalCount
  }
  gists {
    totalCount
  }
}`;

const REPOSITORY_QUERY = `{
  url
  name
  isFork
  pushedAt
  updatedAt
  createdAt
  isPrivate
  diskUsage
  databaseId
  description
  homepageUrl
  nameWithOwner
  primaryLanguage {
    name
  }
  languages(first: 100) {
    edges {
      size
      node {
        name
      }
    }
  }
  stargazers {
    totalCount
  }
  forks {
    totalCount
  }
  watchers {
    totalCount
  }
  owner {
    url
    login
    avatarUrl
  }
  repositoryTopics(first: 100) {
    edges {
      node {
        topic {
          name
        }
      }
    }
  }
}`;

const ORG_QUERY = `{
  url
  name
  login
  avatarUrl
  organizationBillingEmail
}`;

const getUserByToken = async (verify) => {
  const query = `{
    viewer ${USER_QUERY}
  }`;
  const result = await baseFetch(query, verify);
  return adapter.user(result.viewer);
};

const getUser = async (login, verify) => {
  const query = `{
    user(login: "${login}") ${USER_QUERY}
  }`;
  const result = await baseFetch(query, verify);
  return adapter.user(result.user);
};

const getRepository = async (fullname, verify) => {
  const [owner, ...names] = fullname.split('/');
  const query = `{
    repository(owner: "${owner}", name: "${names.join('/')}") ${REPOSITORY_QUERY}
  }`;
  const result = await baseFetch(query, verify);
  return adapter.repository(result.repository);
};

const getOrg = async (login, verify) => {
  const query = `{
    organization(login: "${login}") ${ORG_QUERY}
  }`;
  const result = await baseFetch(query, verify);
  return adapter.organization(result.organization);
};

const getUserStarredCount = async (login, verify) => {
  const query = `{
    user(login: "${login}") {
      starredRepositories(first: 1) {
        totalCount
      }
    }
  }`;
  const result = await baseFetch(query, verify);
  try {
    return result.user.starredRepositories.totalCount;
  } catch (e) {
    logger.error(e);
  }
  return 0;
};

const getOrgRepos = async ({ login, verify, after = null, first = 30 }) =>
  await baseGetRepos({
    login,
    verify,
    after,
    first,
    who: 'organization',
    what: 'repositories',
  });

const getUserRepos = async ({ login, verify, after = null, first = 100 }) =>
  await baseGetRepos({
    login,
    verify,
    after,
    first,
    what: 'repositories'
  });

const getUserOrgs = async ({ login, verify, after = null, first = 100 }) =>
  await baseGetOrgs({
    login,
    verify,
    after,
    first,
  });

const getUserStarred = async ({ login, verify, after = null, first = 30 }) =>
  await baseGetRepos({
    login,
    verify,
    after,
    first,
    what: 'starredRepositories'
  });

const getUserContributed = async ({ login, verify, after = null, first = 30 }) =>
  await baseGetRepos({
    login,
    verify,
    after,
    first,
    what: 'contributedRepositories'
  });

const getPersonalPubRepos = async (login, verify, perPage) =>
  await fetchMultiDatas({
    login,
    verify,
    first: perPage,
    func: getUserRepos
  });

const getPersonalPubOrgs = async (login, verify, perPage) =>
  await fetchMultiDatas({
    login,
    verify,
    first: perPage,
    func: getUserOrgs
  });

const getOrgPubRepos = async (login, verify, perPage) =>
  await fetchMultiDatas({
    login,
    verify,
    first: perPage,
    func: getOrgRepos
  });

const getPersonalStarred = async (login, verify, perPage) =>
  await fetchMultiDatas({
    login,
    verify,
    first: perPage,
    func: getUserStarred
  });

const getPersonalContributedRepos = async (login, verify, perPage) =>
  await fetchMultiDatas({
    login,
    verify,
    first: perPage,
    func: getUserContributed
  });

export default {
  getOrg,
  getUser,
  getRepository,
  getUserStarred,
  getOrgPubRepos,
  getUserByToken,
  getUserStarredCount,
  getPersonalStarred,
  getPersonalPubOrgs,
  getPersonalPubRepos,
  getPersonalContributedRepos,
};
