import { GraphQLClient } from 'graphql-request';
import config from 'config';
import { GITHUB } from './github';
import logger from './logger';
import cache from './cache';

const {
  API_GRAPHQL,
} = GITHUB;
const retryTimes = config.get('timeouts');

export const getClient = headers =>
  new GraphQLClient(API_GRAPHQL, {
    headers,
  });

const baseFetch = async (client, query, timeout = retryTimes) => {
  let err = null;
  for (let i = 0; i < timeout.length; i += 1) {
    try {
      const result = await client.request(query);
      if (!result) {
        err = new Error('[GRAPHQL:ERROR]No return result');
        continue;
      }
      err = null;
      return result;
    } catch (e) {
      if (e.response && e.response.errors) {
        const errors = e.response.errors;
        err = errors.map(error => `[${error.type}]${error.message}`).join('\n');
      } else {
        err = e;
      }
    }
  }
  if (err) {
    logger.error(err);
  }
  return null;
};

export const fetch = cache.wrapFunc(baseFetch);
