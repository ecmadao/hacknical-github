/* eslint global-require: "off", import/no-dynamic-require: "off" */
import fs from 'fs';
import path from 'path';
import koaRouter from 'koa-router';

const router = koaRouter();

fs.readdirSync(__dirname)
  .filter((file) => {
    const modPath = path.join(__dirname, file);
    return file !== 'shared' && fs.statSync(modPath).isDirectory();
  })
  .forEach((file) => {
    const modPath = path.join(__dirname, file);
    const route = require(path.join(modPath, '/router.js'));
    router.use(route.routes(), route.allowedMethods());
  });

router.get('/', async ctx => (ctx.body = 'welcome to hacknical core server!'));

export default router;
