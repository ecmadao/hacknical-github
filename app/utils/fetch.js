import request from 'request';
import config from 'config';

const retryTimes = config.get('timeouts');

const fetchData = (options) => {
  return new Promise((resolve, reject) => {
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
        // const result = parse ? JSON.parse(body) : body;
        // resolve(result);
      }
      reject(err);
    });
  });
};

const fetch = async (options, timeout = retryTimes) => {
  let err = null;
  for (let i = 0; i < timeout.length; i++) {
    try {
      options.timeout = timeout[i];
      const result = await fetchData(options);
      err = null;
      return result;
    } catch (e) {
      err = e;
    }
  }
  if (err) { throw new Error(err) }
};

export default {
  get: (options, timeout) => {
    options.method = 'GET';
    return fetch(options, timeout)
  },
  post: (options, timeout) => {
    options.method = 'POST';
    return fetch(options, timeout)
  }
};
