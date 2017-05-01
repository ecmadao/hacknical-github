import config from 'config';
import { flattenObject } from '../utils/helpers';

const app = config.get('app');

const verifyMiddlwware = () => async (ctx, next) => {
  const token = ctx.request.query.token || ctx.request.body.token;
  const { appName } = ctx.state;
  const headers = { 'User-Agent': appName };

  let verify = {};
  if (token && token != 'undefined' && token != 'null') {
    verify = { access_token: token };
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
