
import Koa from 'koa'
import koaLogger from 'koa-logger'
import bodyParser from 'koa-bodyparser'
import cors from '@koa/cors'
import config from 'config'
import router from './modules'
import logger from './utils/logger'
import params from './middlewares/params'
import auth from './middlewares/auth'
import verify from './middlewares/verify'
import mongo from './middlewares/mongo'
import mq from './middlewares/mq'
import { initIndex } from './databases/db'

const appKey = config.get('appKey')
const port = config.get('port')

const app = new Koa()
app.keys = [appKey]

// koa-logger
app.use(koaLogger())

app.use(cors())

// bodyparser
app.use(bodyParser({
  onerror: (err, ctx) => {
    ctx.throw('body parse error', 422)
  }
}))
// check if validate app
app.use(params.checkApp('x-app-name'))
// auth
app.use(auth({
  whiteList: [
    /^\/api\/github\/(zen)|(octocat)|(verify)/,
    /^\/favicon.ico/,
    /^\/robots.txt/,
  ]
}))
// verify token params
app.use(verify())

// mq
app.use(mq())
// mongo
app.use(mongo())

// router
app.use(router.routes(), router.allowedMethods())
// error
app.on('error', (err) => {
  logger.error(err)
})

const init = async () => {
  try {
    await initIndex()
  } catch (e) {
    logger.error(e)
  }
  try {
    app.listen(port, () => {
      logger.info(
        `[SERVER START][${config.get('appName')}][Running at port ${port}]`
      )
    })
  } catch (err) {
    logger.error(`[ERROR][${err || err.stack}]`)
  }
}

init()

export default app
