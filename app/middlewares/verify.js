import config from 'config';
import logger from '../utils/log';

const app = config.get('app');

const verifyMiddlwware = () => async (ctx, next) => {
  const { appName } = ctx.state;
  logger.info(`[VERIFY APPLICATION][${appName}][${ctx.request.url}]`);
  const token = ctx.request.query.token || ctx.request.body.token || app[appName].token;
  const headers = { 'User-Agent': appName };

  const clientId = app[appName].clientId;
  const clientSecret = app[appName].clientSecret;
  const verify = {
    client_id: clientId,
    client_secret: clientSecret,
  };
  if (token && String(token) !== 'undefined' && String(token) !== 'null') {
    headers.Authorization = `Bearer ${token}`;
  }
  ctx.request.query.verify = {
    headers,
    qs: verify,
  };
  await next();
};

export default verifyMiddlwware;
