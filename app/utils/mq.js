import RedisSMQ from 'rsmq';
import config from 'config';
import logger from './logger';

const mqConfig = config.get('mq');

const wrap = (func, ...params) =>
  new Promise((resolve, reject) => {
    func(...params, (error, result) => {
      if (error) reject(error);
      resolve(result);
    });
  });

class MessageQueue {
  constructor(options = {}) {
    const initOptions = Object.assign({}, mqConfig.config, options);
    this.mq = new RedisSMQ(initOptions);
    logger.info(`[MQ:CONNECT][${initOptions.host}:${initOptions.port}]`);
  }

  createQueue(qname) {
    return wrap(this.mq.createQueue, { qname });
  }

  sendMessage(options = {}) {
    const {
      message = '',
      qname = '',
    } = options;
    if (!message || !qname) return;
    logger.info(`[MQ:SEND][${qname}:${message}]`);
    return wrap(this.mq.sendMessage, {
      qname,
      message
    });
  }
}

let instance = null;

const getMQ = (options) => {
  if (instance) return instance;
  instance = new MessageQueue(options);
  return instance;
};

export default getMQ;
