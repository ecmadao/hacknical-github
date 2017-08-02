import Koa from 'koa';
import koaLogger from 'koa-logger';
import convert from 'koa-convert';
import bodyParser from 'koa-bodyparser';
import cors from 'kcors';
import config from 'config';
import router from '../modules';
import logger from '../utils/logger';
import params from '../middlewares/params';
import auth from '../middlewares/auth';
import verify from '../middlewares/verify';

const appKey = config.get('appKey');
const port = config.get('port');
const app = new Koa();
app.keys = [appKey];

app.use(convert(cors()));

// bodyparser
app.use(bodyParser());
// koa-logger
app.use(convert(koaLogger()));
// check if validate app
app.use(params.checkApp('x-app-name'));
// auth
app.use(auth({
  whiteList: [
    /^\/api\/github\/(zen)|(octocat)|(verify)/
  ]
}));
// verify token params
app.use(verify());

// router
app.use(router.routes(), router.allowedMethods());
// error
app.on('error', (err) => {
  logger.error(err);
});

app.listen(port, () => {
  logger.info(
    `[SERVER START][${config.get('appName')}][Running at port ${port}]`
  );
});

export default app;
