/* eslint no-loop-func: "off", no-constant-condition: "off" */

import axios from '../utils/axios';
import logger from '../utils/log';
import { GITHUB } from '../utils/github';
import adapter from './v4-to-v3';

const {
  API_GRAPHQL,
} = GITHUB;

/* =================== PRIVATE =================== */

const wrapFetch = async (func, options) => {
  try {
    return await func(options);
  } catch (e) {
    logger.error(e);
    return null;
  }
};

const fetchMultiDatas = async (options = {}) => {
  const {
    login,
    verify,
    first,
    func,
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
    if (!result) break;
    endCursor = result.endCursor;
    results.push(...result.results);
    if (!result.hasNextPage) break;
  }

  return results;
};

const baseFetch = (query, verify) => {
  const { headers } = verify;
  return axios.post({
    headers,
    url: API_GRAPHQL,
    data: { query },
  });
};

const baseGetOrgs = async ({ login, verify, after = null, first = 100 }) => {
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
  const { pageInfo, edges } = fetchResults.data.user.organizations;
  const results = edges.map(edge => adapter.organization(edge.node));
  return {
    results,
    endCursor: pageInfo.endCursor,
    hasNextPage: pageInfo.hasNextPage,
  };
};

const baseGetRepos = async ({ login, verify, after = null, first = 100, what = 'repositories', who = 'user' }) => {
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
  const { pageInfo, edges } = fetchResults.data[who][what];
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
        color
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
  logger.info(result);
  return adapter.user(result.data.viewer);
};

const getUser = async (login, verify) => {
  const query = `{
    user(login: "${login}") ${USER_QUERY}
  }`;
  const result = await baseFetch(query, verify);
  logger.info(result);
  return adapter.user(result.data.user);
};

const getRepository = async (fullname, verify) => {
  const [owner, ...names] = fullname.split('/');
  const query = `{
    repository(owner: "${owner}", name: "${names.join('/')}") ${REPOSITORY_QUERY}
  }`;
  const result = await baseFetch(query, verify);
  logger.info(result);
  return adapter.repository(result.data.repository);
};

const getOrg = async (login, verify) => {
  const query = `{
    organization(login: "${login}") ${ORG_QUERY}
  }`;
  const result = await baseFetch(query, verify);
  logger.info(result);
  return adapter.organization(result.data.organization);
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
  getUser,
  getOrg,
  getOrgPubRepos,
  getUserByToken,
  getRepository,
  getUserStarred,
  getPersonalStarred,
  getPersonalPubRepos,
  getPersonalPubOrgs,
  getPersonalContributedRepos,
};
