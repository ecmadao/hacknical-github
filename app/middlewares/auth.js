
import passport from 'koa-passport'
import bodyParser from 'koa-bodyparser'
import crypto from 'crypto'
import config from 'config'

const auth = config.get('auth')

const isEmpty = obj => Object.keys(obj).length === 0

const getSignString = (request, secretKey) => {
  const contentType = request.headers['content-type'] || ''
  const type = contentType.split(';')[0]
  const body = request.rawBody || ''
  return crypto.createHmac('sha1', secretKey)
    .update(
      new Buffer(
        [
          request.method,
          crypto.createHash('md5').update(body, 'utf8').digest('hex'),
          type,
          request.headers.date
        ].join('\n'),
        'utf-8'
      )
    ).digest('hex')
}

class HmacStrategy extends passport.Strategy {
  constructor(name) {
    super()
    this.name = name
  }

  authenticate(request) {
    const authString = request.headers.authorization
    if (!authString) {
      throw new Error('Authorization header not present')
    }

    const matches = authString.match(/^([^ ]+) ([^:]+):((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)$/)

    if (!matches) {
      throw new Error('Bad authorization header')
    }

    const publicKey = matches[2]
    const signature = new Buffer(matches[3] || '', 'base64').toString('hex')

    try {
      const getAuth = auth.find(item => item.publicKey === publicKey)
      if (getAuth) {
        const secretKey = getAuth.secretKey

        if (getSignString(request, secretKey) !== signature) {
          throw new Error('Bad signature')
        }
        return this.success(getAuth, {})
      }
      throw new Error('Bad credentials')
    } catch (e) {
      throw e
    }
  }
}

passport.use(new HmacStrategy('hmac'))

const initialize = passport.initialize()

const rawBodyParser = bodyParser({
  enableTypes: ['text'],
  extendTypes: {
    text: 'application/json'
  }
})

const authMiddleware = (options = {}) => async (ctx, next) => {
  const whiteList = options.whiteList || []
  const { url } = ctx.request

  if (whiteList.some(reg => reg.test(url))) {
    return await next()
  }
  await rawBodyParser(ctx, async () => {
    ctx.request.rawBody = ''
    if (isEmpty(ctx.request.body)) {
      ctx.request.body = ''
    } else {
      try {
        ctx.request.rawBody = JSON.stringify(ctx.request.body)
      } catch (err) {
        ctx.request.rawBody = ''
      }
    }

    await initialize(ctx, async () => {
      await passport.authenticate('hmac', { session: false }, async (err) => {
        if (err) {
          throw new Error(err)
        }
        await next()
      })(ctx, next)
    })
  })
}

export default authMiddleware
