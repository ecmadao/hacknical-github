import mongodb from 'mongodb';
import config from 'config';
import logger from './logger';

const instance = {};

/**
 * Wrap mongo connect operation with a promise and hold
 * global connection instance in local env.
 */
const getMongo = (url = config.database.github) => {
  const options = {};

  return new Promise((resolve, reject) => {
    if (instance[url]) {
      resolve(instance[url]);
    } else {
      mongodb.MongoClient.connect(url, options, (err, db) => {
        if (err) {
          reject(err);
        }
        logger.info(`[MONGO:CONNECTION] [${url}]`);
        instance[url] = db;
        resolve(db);
      });
    }
  });
};

export default getMongo;
