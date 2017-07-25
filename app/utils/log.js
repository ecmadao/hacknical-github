import log4js from 'log4js';
import config from 'config';

const appName = config.get('appName');

const logger = log4js.getLogger(`[${appName.toUpperCase()}]`);

if (!config.logFile) {
  log4js.configure({
    appenders: [
      { type: 'console' }
    ]
  });
  logger.setLevel('DEBUG');
} else {
  log4js.configure({
    appenders: [
      { type: 'file', filename: config.logFile, }
    ]
  });
  logger.setLevel('INFO');
}

export default logger;
