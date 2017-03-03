import config from 'config';
import { flattenObject } from '../utils/helpers';

const clientId = config.get('github.clientId');
const clientSecret = config.get('github.clientSecret');
const appName = config.get('github.appName');

const verifyMiddlwware = () => async (ctx, next) => {
  const { token } = ctx.request.query;
  let verify = {};
  if (token) {
    verify = {
      access_token: token
    };
  } else {
    verify = {
      client_id: clientId,
      client_secret: clientSecret
    }
  }
  ctx.request.query.verify = flattenObject(verify);
  await next();
};

export default verifyMiddlwware;
