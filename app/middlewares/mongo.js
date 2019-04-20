
import config from 'config'
import getMongo from '../utils/database'
import logger from '../utils/logger'

const scientificUrl = config.get('database.scientific')
const githubUrl = config.get('database.github')

const mongoMiddleware = () => async (ctx, next) => {
  try {
    ctx.scientificDB = await getMongo(scientificUrl)
    ctx.githubDB = await getMongo(githubUrl)
  } catch (e) {
    logger.error(e)
  }
  await next()
}

export default mongoMiddleware
