import verifyApp from '../utils/verify';

const checkQuery = (params = []) => async (ctx, next) => {
  params.forEach((param) => {
    if (!ctx.request.query[param]) {
      throw new Error(`query: ${param} missed!`);
    }
  });
  await next();
};

const checkBody = (params = []) => async (ctx, next) => {
  params.forEach((param) => {
    if (!ctx.request.body[param]) {
      throw new Error(`body: ${param} missed!`);
    }
  });
  await next();
};

const checkHeaders = (params = []) => async (ctx, next) => {
  params.forEach((param) => {
    if (!ctx.headers[param]) {
      throw new Error(`header: ${param} missed!`);
    }
  });
  await next();
};

const checkApp = (key = 'x-app-name') => async (ctx, next) => {
  const appName = ctx.headers[key];
  ctx.state.appName = verifyApp(appName);
  await next();
};

export default {
  checkQuery,
  checkBody,
  checkHeaders,
  checkApp
};
