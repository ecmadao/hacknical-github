import request from 'request';
import config from 'config';
import logger from './log';

const retryTimes = config.get('timeouts');

const fetchData = options => new Promise((resolve, reject) => {
  request(options, (err, httpResponse, body) => {
    if (err) {
      reject(err);
    }
    if (body) {
      let result = null;
      try {
        result = JSON.parse(body);
      } catch (e) {
        result = body;
      } finally {
        resolve(result);
      }
    }
    reject(err);
  });
});

const fetch = async (options, timeout = retryTimes) => {
  options.json = true;
  let err = null;
  for (let i = 0; i < timeout.length; i += 1) {
    try {
      options.timeout = timeout[i];
      const result = await fetchData(options);
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

export default {
  get: (options, timeout) => {
    options.method = 'GET';
    return fetch(options, timeout);
  },
  post: (options, timeout) => {
    options.method = 'POST';
    return fetch(options, timeout);
  },
  put: (options, timeout) => {
    options.method = 'PUT';
    return fetch(options, timeout);
  },
  delete: (options, timeout) => {
    options.method = 'DELETE';
    return fetch(options, timeout);
  }
};
