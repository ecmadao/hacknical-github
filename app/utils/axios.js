import axios from 'axios';
import config from 'config';
import logger from './log';

const retryTimes = config.get('timeouts');

const axiosFetch = async (options, timeout = retryTimes) => {
  let err = null;
  for (let i = 0; i < timeout.length; i += 1) {
    try {
      options.timeout = timeout[i];
      const result = await axios(options);
      if (!result) {
        throw new Error('[AXIOS:ERROR]None return result');
      }
      if (result.errors) {
        throw new Error(
          result.errors.map(e => `[${e.type}]${e.message}`).join('\n')
        );
      }
      err = null;
      return result.data;
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
    options.method = 'get';
    return axiosFetch(options, timeout);
  },
  post: (options, timeout) => {
    options.method = 'post';
    return axiosFetch(options, timeout);
  },
};
