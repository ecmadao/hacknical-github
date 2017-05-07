import config from 'config';
import log from '../utils/log';

const app = config.get('app');

const verifyMiddlwware = (auth, ctx) => {
  const appName = auth.name;
  log.info(`verify of : ${appName}`);

  const token = ctx.request.query.token || ctx.request.body.token;
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
};

export default verifyMiddlwware;
