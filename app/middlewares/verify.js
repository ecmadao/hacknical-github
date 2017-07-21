import config from 'config';
import logger from '../utils/log';

const app = config.get('app');

const verifyMiddlwware = () => async (ctx, next) => {
  const { appName } = ctx.state;
  logger.info(`[VERIFY APPLICATION][${appName}]`);

  const token = ctx.request.query.token || ctx.request.body.token;
  const headers = { 'User-Agent': appName };

  let verify = null;
  if (token && String(token) !== 'undefined' && String(token) !== 'null') {
    // verify = { access_token: token };
    headers.Authorization = `Bearer ${token}`;
  } else {
    const clientId = app[appName].clientId;
    const clientSecret = app[appName].clientSecret;

    verify = {
      client_id: clientId,
      client_secret: clientSecret
    };
  }
  ctx.request.query.verify = {
    qs: verify,
    headers
  };
  await next();
};

export default verifyMiddlwware;
