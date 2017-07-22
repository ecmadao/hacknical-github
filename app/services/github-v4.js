/* eslint no-loop-func: "off" */

import axios from '../utils/axios';
import logger from '../utils/log';
import {
  splitArray,
  flattenObject
} from '../utils/helpers';
import { GITHUB } from '../utils/github';
import convert from './v4-to-v3';

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

const getUserByToken = async (verify) => {
  const query = `{
    viewer {
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
    }
  }`;
  const result = await baseFetch(query, verify);
  logger.info(result);
  return convert.user(result.data.viewer);
};

const getUser = async (login, verify) => {
  const query = `{
    user(login: "${login}") {
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
    }
  }`;
  const result = await baseFetch(query, verify);
  logger.info(result);
  return convert.user(result.data.user);
};

const getUserReposTotalCount = (user, verify) => {

};

export default {
  getUser,
  getUserByToken
};
