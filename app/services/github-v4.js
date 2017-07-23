/* eslint no-loop-func: "off" */

import axios from '../utils/axios';
import logger from '../utils/log';
import {
  splitArray,
  flattenObject
} from '../utils/helpers';
import { GITHUB } from '../utils/github';
import adapter from './v4-to-v3';

const {
  API_GRAPHQL,
} = GITHUB;

const baseFetch = (query, verify) => {
  const { headers } = verify;
  return axios.post({
    headers,
    url: API_GRAPHQL,
    data: { query },
  });
};

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
    repository(owner: "${owner}", name: "${names.join('/')}") {
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
    }
  }`;
  const result = await baseFetch(query, verify);
  logger.info(result);
  return adapter.repository(result.data.repository);
};

const getUserReposTotalCount = (user, verify) => {

};

export default {
  getUser,
  getUserByToken,
  getRepository,
};
