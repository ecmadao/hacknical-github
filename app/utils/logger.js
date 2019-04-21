
import log4js from 'log4js'
import config from 'config'

const appName = config.get('appName')
const logConfig = config.get('log')

const logger = log4js.getLogger(`[${appName.toUpperCase()}]`)
log4js.configure({
  appenders: [
    logConfig.appender
  ]
})
logger.setLevel(logConfig.level)

export default logger
