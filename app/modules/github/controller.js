import Github from '../../services/github';

const getZen = async (ctx) => {
  const result = await Github.getZen();
  ctx.body = {
    success: true,
    result
  }
};

const getOctocat = async (ctx) => {
  const result = await Github.getOctocat();
  ctx.body = {
    success: true,
    result
  }
};

const getToken = async (ctx, next) => {
  const { code } = ctx.request.query;
  const token = await Github.getToken(code);
  ctx.body = {
    success: true,
    result: token
  }
};

const getUser = async (ctx, next) => {
  const { token } = ctx.request.query;
  const userInfo = await Github.getUser(token);
  ctx.body = {
    success: true,
    result: userInfo
  }
};


export default {
  /* ====== */
  getZen,
  getOctocat,
  /* ====== */
  getToken,
  getUser
}
