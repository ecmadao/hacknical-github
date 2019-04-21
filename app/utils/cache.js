
import cacheManager from 'cache-manager'
import config from 'config'
import logger from './logger'

const appName = config.get('appName').toLowerCase()
const cache = cacheManager.caching({ store: 'memory', max: 3000 })

const getCacheKey = (key, args) => {
  let catchKey = ''
  args.forEach((arg) => {
    if (Array.isArray(arg)) {
      catchKey += `${arg.toString()}-`
    } else if (Object.prototype.toString.call(arg) === '[object Object]') {
      catchKey += `${JSON.stringify(arg)}-`
    } else {
      catchKey += `${arg}-`
    }
  })
  if (key) {
    catchKey = `${key.toUpperCase()}.${catchKey}`
  }
  catchKey = catchKey.slice(0, -1)
  return catchKey
}

const wrapFn = (fn, options = {}) => {
  const {
    key = '',
    ttl = 300, // default 5 min
    prefix = appName,
  } = options
  const finallyOptions = { ttl }

  return (...args) => {
    let hitCache = true
    const catchKey = getCacheKey(key, args)

    return cache.wrap(`${prefix}.${catchKey}`, () => {
      hitCache = false
      return fn(...args)
    }, finallyOptions).then((data) => {
      if (hitCache) {
        logger.info(`[CACHE:GET][${catchKey}]`)
      } else {
        logger.info(`[CACHE:SET][${catchKey}]`)
      }
      return data
    })
  }
}

const wrapFunc = func => wrapFn(func, { key: func.name })

export default {
  wrapFunc
}
