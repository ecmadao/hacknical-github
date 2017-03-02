const checkQuery = (querys = []) => async (ctx, next) => {
  querys.forEach((q) => {
    if (!ctx.request.query[q]) {
      throw new Error(`query: ${q} missed!`);
    }
  });
  await next();
};

const checkBody = (params = []) => async (ctx, next) => {
  params.forEach((param) => {
    if (!ctx.request.body[param]) {
      throw new Error(`body: ${param} missed!`);
    }
  });
  await next();
};

export default {
  checkQuery,
  checkBody
}
