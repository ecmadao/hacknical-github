import config from 'config';
import MessageQueue from '../utils/mq';
import logger from '../utils/logger';

const mqChannels = config.get('mq.channels');

const mqMiddleware = () => {
  const mq = {};
  for (const key of Object.keys(mqChannels)) {
    const qName = mqChannels[key];
    try {
      mq[key] = new MessageQueue(qName);
    } catch (e) {
      logger.error(e);
    }
  }

  return async (ctx, next) => {
    ctx.mq = mq;
    await next();
  };
};

export default mqMiddleware;
