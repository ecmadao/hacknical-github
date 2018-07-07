
import request from 'request';
import config from 'config';
import logger from './logger';

const retryTimes = config.get('timeouts');

const handleBody = (httpResponse, body) => {
  if (body) {
    let result = body;
    try {
      result = JSON.parse(body);
    } catch (e) {
      result = body;
    }
    return result;
  }
};

const fetchData = (options, handler) =>
  new Promise((resolve, reject) => {
    request(options, (err, httpResponse, body) => {
      if (err) {
        reject(err);
      }
      const result = handler(httpResponse, body);
      if (!result || result.message) reject(result);
      resolve(result);
    });
  });


export const baseFetch = async (options, timeout = retryTimes, handler = handleBody) => {
  if (options.json === undefined) {
    options.json = true;
  }
  let err = null;
  for (let i = 0; i < timeout.length; i += 1) {
    try {
      options.timeout = timeout[i];
      logger.info(`[FETCH:GITHUB:V3][${options.url}]`);
      const result = await fetchData(options, handler);
      err = null;
      return result;
    } catch (e) {
      err = e;
    }
  }
  if (err) {
    logger.error(err);
  }
  return null;
};

const handler = {
  get: (target, name) => {
    return (...args) => {
      const [options, timeout] = args;
      options.method = name.toUpperCase();
      return baseFetch(options, timeout);
    };
  }
};

const proxy = new Proxy({}, handler);
export default proxy;
