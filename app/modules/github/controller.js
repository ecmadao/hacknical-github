import config from 'config';
import UsersModel from '../../databases/github-users';
import GitHub from '../../services/github';
import dateHelper from '../../utils/date';
import Helper from './helper';
import { sortByCommits } from '../../utils/github';

const HALF_AN_HOUR = 30 * 60;
const clientId = config.get('github.clientId');



/* ================== router handler ================== */

const getZen = async (ctx) => {
  const { verify } = ctx.request.query;
  const result = await GitHub.getZen(verify);
  ctx.body = {
    success: true,
    result
  };
};

const getOctocat = async (ctx) => {
  const { verify } = ctx.request.query;
  const result = await GitHub.getOctocat(verify);
  ctx.body = {
    success: true,
    result
  };
};

const getVerify = async (ctx) => {
  ctx.body = {
    success: true,
    result: clientId
  };
};

const getToken = async (ctx, next) => {
  const { code, verify } = ctx.request.query;
  const result = await GitHub.getToken(code, verify);
  const token = result.match(/^access_token=(\w+)&/)[1];
  ctx.body = {
    success: true,
    result: token
  };
};

const getLogin = async (ctx, next) => {
  const { verify } = ctx.request.query;
  const userInfo = await GitHub.getUserByToken(verify);

  const user = await UsersModel.findUser(userInfo.login);
  if (!user) {
    await UsersModel.createGitHubUser(userInfo);
  }

  ctx.body = {
    success: true,
    result: {
      id: userInfo.id,
      login: userInfo.login,
      email: userInfo.email,
      name: userInfo.name || userInfo.login
    }
  };
};

const getUser = async (ctx, next) => {
  const { verify, login } = ctx.request.query;
  const user = await Helper.getUser(login, verify);
  ctx.body = {
    success: true,
    result: user
  };
};

const getUserRepos = async (ctx, next) => {
  const { login, verify } = ctx.request.query;
  const user = await Helper.getUser(login, verify);
  const { public_repos } = user;
  const repos = await Helper.getRepos(login, verify, {
    publicRepos: public_repos
  });
  const commits = await Helper.getCommits(login, verify);

  ctx.body = {
    success: true,
    result: {
      repos,
      commits: sortByCommits(commits)
    }
  };
};

const getUserOrgs = async (ctx, next) => {
  const { login, verify } = ctx.query;
  const orgs = await Helper.getOrgs(login, verify);
  ctx.body = {
    success: true,
    result: orgs
  };
};

const refreshUserDatas = async (ctx, next) => {
  const { login, verify } = ctx.request.query;
  const user = await UsersModel.findUser(login);
  const lastUpdateTime = user.lastUpdateTime || user['created_at']

  const timeInterval = dateHelper.getSeconds(new Date()) - dateHelper.getSeconds(lastUpdateTime);
  if (timeInterval <= HALF_AN_HOUR) {
    return ctx.body = {
      success: false,
      result: parseInt((HALF_AN_HOUR - timeInterval) / 60, 10)
    };
  }

  try {
    const githubUser = await GitHub.getUserByToken(verify);
    const { public_repos } = githubUser;
    const pages = Math.ceil(parseInt(public_repos, 10) / 100);
    const repos = await Helper.fetchRepos(login, verify, pages);
    await Helper.fetchCommits(repos, login, verify);
    await Helper.updateOrgs(login, verify);
    const updateUserResult = await UsersModel.updateUser(githubUser);

    ctx.body = {
      success: true,
      result: updateUserResult.result
    };
  } catch (err) {
    ctx.body = {
      success: false,
      result: new Date()
    };
  }
};

const getUserUpdateTime = async (ctx, next) => {
  const { login } = ctx.request.query;
  const findResult = await UsersModel.findUser(login);
  if (!findResult) {
    throw new Error('can not find target user');
  }
  return ctx.body = {
    success: true,
    result: findResult.lastUpdateTime || findResult['created_at']
  };
};


export default {
  /* ====== */
  getZen,
  getOctocat,
  /* ====== */
  getToken,
  getVerify,
  /* ====== */
  getLogin,
  getUser,
  getUserRepos,
  getUserOrgs,
  refreshUserDatas,
  getUserUpdateTime
}
