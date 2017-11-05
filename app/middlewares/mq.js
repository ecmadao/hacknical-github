import config from 'config';
import getMQ from '../utils/mq';
import logger from '../utils/logger';

let mq = null;
const mqConfig = config.get('mq');
const scientificMqName = mqConfig['qname-scientific'];
const predictionMqName = mqConfig['qname-prediction'];

const mqMiddleware = (options = {}) => {
  if (!mq) mq = getMQ(options);
  try {
    mq.createQueue(scientificMqName);
  } catch (e) {
    logger.error(e);
  }
  try {
    mq.createQueue(predictionMqName);
  } catch (e) {
    logger.error(e);
  }

  return async (ctx, next) => {
    ctx.mq = mq;
    await next();
  };
};

export default mqMiddleware;
