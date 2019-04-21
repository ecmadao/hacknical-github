/* eslint no-loop-func: "off", no-constant-condition: "off" */

import logger from '../utils/logger'
import adapter from './v4-to-v3'
import {
  fetch,
  getClient,
} from '../utils/request-graphql'

/* =================== PRIVATE =================== */

const baseFetch = (query, verify) => {
  const { headers } = verify
  const client = getClient(headers)
  return fetch(client, query)
}

/* ==================== PUBLIC FUNCS ==================== */

const USER_QUERY = `{
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
}`

const getUserByToken = async (verify) => {
  const query = `{
    viewer ${USER_QUERY}
  }`
  const result = await baseFetch(query, verify)
  return adapter.user(result.viewer)
}

const getUserStarredCount = async (login, verify) => {
  const query = `{
    user(login: "${login}") {
      starredRepositories(first: 1) {
        totalCount
      }
    }
  }`
  const result = await baseFetch(query, verify)
  try {
    return result.user.starredRepositories.totalCount
  } catch (e) {
    logger.error(e)
  }
  return 0
}

export default {
  getUserByToken,
  getUserStarredCount
}
