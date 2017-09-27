import mongoose from 'mongoose';
import config from 'config';
import logger from '../../utils/logger';

const mongodbUrl = config.get('database.github');

function handleErr(err) {
  if (err) {
    logger.error(`[MONGO:CONNECT:ERROR][${mongodbUrl}][${err.message}]`);
  }
}

mongoose.connect(mongodbUrl, {
  useMongoClient: true
}, handleErr);
logger.info(`[MONGO:CONNECT:SUCCEED][${mongodbUrl}]`);

mongoose.Promise = global.Promise;

export default mongoose;
