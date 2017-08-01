import mongoose from 'mongoose';
import config from 'config';
import logger from '../../utils/logger';

const mongodbUrl = config.get('database.url');

function handleErr(err) {
  if (err) {
    logger.error(`[MONGO:CONNECT:ERROR][${mongodbUrl}][${err.message}]`);
    // process.exit(1);
  }
}

if (process.env.NODE_ENV === 'production') {
  mongoose.connect(mongodbUrl, {
    auth: { authdb: 'admin' },
    useMongoClient: true
  }, handleErr);
} else {
  mongoose.connect(mongodbUrl, {
    useMongoClient: true
  }, handleErr);
}
logger.info(`[MONGO:CONNECT:SUCCEED][${mongodbUrl}]`);

mongoose.Promise = global.Promise;

export default mongoose;
