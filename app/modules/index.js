import fs from 'fs';
import path from 'path';
import koaRouter from 'koa-router';

const router = koaRouter();

fs.readdirSync(__dirname)
  .filter((file) => {
    const modPath = path.join(__dirname, file);
    return file !== 'shared' && fs.statSync(modPath).isDirectory()
  })
  .forEach((file) => {
    const modPath = path.join(__dirname, file);
    const route = require(path.join(modPath, '/router.js'));
    console.log(route)
    router.use(route.routes(), route.allowedMethods());
  });

// router.get('/', async (ctx, next) => {
//   ctx.body = {
//     result: 11111
//   }
// });

export default router;
