
import config from 'config'
import logger from '../utils/logger'
import mq from 'mq-utils'

const mqConfig = config.get('mq')
const MQ = mq[mqConfig.source](mqConfig.config)

const mqMiddleware = () => {
  const mqDict = {}
  for (const key of Object.keys(mqConfig.channels)) {
    const qName = mqConfig.channels[key]
    try {
      mqDict[key] = new MQ(qName, mqConfig.options)
    } catch (e) {
      logger.error(e)
    }
  }

  return async (ctx, next) => {
    ctx.mq = mqDict
    await next()
  }
}

export default mqMiddleware
