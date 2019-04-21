
import verifyApp from '../utils/verify'

const baseCheck = (options = {}) => {
  const {
    msg,
    params,
    object,
  } = options
  params.forEach((param) => {
    if (!object[param]) {
      throw new Error(msg.replace(/%s/, param))
    }
  })
}

const checkQuery = (params = []) => async (ctx, next) => {
  baseCheck({
    params,
    object: ctx.request.query,
    msg: 'Required query: %s missed!'
  })
  await next()
}

const checkBody = (params = []) => async (ctx, next) => {
  baseCheck({
    params,
    object: ctx.request.body,
    msg: 'Required body: %s missed!'
  })
  await next()
}

const checkHeaders = (params = []) => async (ctx, next) => {
  baseCheck({
    params,
    object: ctx.headers,
    msg: 'Required header: %s missed!'
  })
  await next()
}

const checkApp = (key = 'x-app-name') => async (ctx, next) => {
  const appName = ctx.headers[key]
  ctx.state.appName = verifyApp(appName)
  await next()
}

export default {
  checkQuery,
  checkBody,
  checkHeaders,
  checkApp
}
