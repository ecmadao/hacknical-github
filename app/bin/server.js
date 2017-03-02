import Koa from 'koa';
import path from 'path';
import logger from 'koa-logger';
import convert from 'koa-convert';
import bodyParser from 'koa-bodyparser';
import onerror from 'koa-onerror';
import json from 'koa-json';
import cors from 'kcors';
import config from 'config';
import router from '../modules';

const port = config.get('port');
const app = new Koa();

app.use(convert(cors()));
// error handle
onerror(app);
// bodyparser
app.use(bodyParser());
// json parse
app.use(convert(json()));
// logger
app.use(convert(logger()));

// helper func
// app.use(async (ctx, next) => {
//   ctx.state = Object.assign({}, ctx.state, {
//     env: process.env.NODE_ENV
//   });
//   await next();
// });

// router
app.use(router.routes(), router.allowedMethods());
// error
app.on('error', (err, ctx) => {
  logger.error('server error', err, ctx);
});

app.listen(port, () => {
  console.log(`hacknical-api server is running at port ${port}`);
});

export default app;
