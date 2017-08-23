import log4js from 'log4js';
import config from 'config';

const appName = config.get('appName');

const logger = log4js.getLogger(`[${appName.toUpperCase()}]`);
log4js.configure({
  appenders: [
    { type: 'console' }
  ]
});

if (!config.logFile) {
  logger.setLevel('DEBUG');
} else {
  logger.setLevel('INFO');
}

export default logger;
