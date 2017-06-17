import config from 'config';
import UsersModel from '../../databases/github-users';
import GitHub from '../../services/github';
import dateHelper from '../../utils/date';
import Helper from './helper';
import {
  PER_PAGE,
  sortByCommits
} from '../../utils/github';

const HALF_AN_HOUR = 30 * 60;
const app = config.get('app');


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
    result: app[ctx.state.appName].clientId
  };
};

const getToken = async (ctx) => {
  const { code, verify } = ctx.request.query;
  const result = await GitHub.getToken(code, verify);
  const token = result.access_token;
  ctx.body = {
    success: true,
    result: token
  };
};

const getLogin = async (ctx) => {
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
      name: userInfo.name || userInfo.login,
      avatar_url: userInfo.avatar_url || '',
      html_url: userInfo.html_url || ''
    }
  };
};

const getUser = async (ctx) => {
  const { verify, login } = ctx.request.query;
  const user = await Helper.getUser(login, verify);
  ctx.body = {
    success: true,
    result: user
  };
};

const getUserRepos = async (ctx) => {
  const { login, verify } = ctx.request.query;
  const repos = await Helper.getUserPublicRepos(login, verify);

  ctx.body = {
    success: true,
    result: {
      repos
    }
  };
};

const getUserStarred = async (ctx) => {
  const {
    login,
    verify,
    page = 1,
    perPage = 30,
  } = ctx.request.query;
  const repos = await Helper.getUserStarred({
    login,
    verify,
    page,
    perPage
  });

  ctx.body = {
    success: true,
    result: repos
  };
};

const getUserCommits = async (ctx) => {
  const { login, verify } = ctx.request.query;
  const commits = await Helper.getCommits(login, verify);
  ctx.body = {
    success: true,
    result: {
      commits: sortByCommits(commits)
    }
  };
};

const getUserOrgs = async (ctx) => {
  const { login, verify } = ctx.query;
  const orgs = await Helper.getOrgs(login, verify);
  ctx.body = {
    success: true,
    result: orgs
  };
};

const refreshUserRepos = async (ctx) => {
  const { login, verify } = ctx.request.query;
  const user = await UsersModel.findUser(login);
  const lastUpdateTime = user.lastUpdateTime || user.created_at;

  const timeInterval = dateHelper.getSeconds(new Date()) - dateHelper.getSeconds(lastUpdateTime);
  if (timeInterval <= HALF_AN_HOUR) {
    ctx.body = {
      success: false,
      result: parseInt((HALF_AN_HOUR - timeInterval) / 60, 10)
    };
    return;
  }

  try {
    const githubUser = await GitHub.getUserByToken(verify);
    const { public_repos } = githubUser;
    const pages = Math.ceil(parseInt(public_repos, 10) / PER_PAGE.REPOS);
    await Helper.fetchRepos({
      login,
      verify,
      pages,
      perPage: PER_PAGE.REPOS
    });
    const updateUserResult = await UsersModel.updateUser(githubUser);

    ctx.body = {
      success: true,
      result: updateUserResult.result
    };
  } catch (err) {
    ctx.body = {
      success: false
    };
  }
};

const refreshUserCommits = async (ctx) => {
  const { login, verify } = ctx.request.query;

  try {
    const repos = await Helper.getUserPublicRepos(login, verify);
    await Helper.fetchCommits(repos, login, verify);

    ctx.body = {
      success: true,
      result: new Date()
    };
  } catch (err) {
    ctx.body = {
      success: false
    };
  }
};

const refreshUserOrgs = async (ctx) => {
  const { login, verify } = ctx.request.query;
  try {
    await Helper.updateOrgs(login, verify);
    ctx.body = {
      success: true,
      result: new Date()
    };
  } catch (err) {
    ctx.body = {
      success: false
    };
  }
};

const getUserUpdateTime = async (ctx) => {
  const { login } = ctx.request.query;
  const findResult = await UsersModel.findUser(login);
  if (!findResult) {
    throw new Error('can not find target user');
  }
  ctx.body = {
    success: true,
    result: findResult.lastUpdateTime || findResult.created_at
  };
};

const getRepository = async (ctx) => {
  const {
    verify,
    fullname,
    required = ''
  } = ctx.request.query;

  const repository = await Helper.getRepository(
    fullname, verify, required.split(',')
  );
  ctx.body = {
    success: true,
    result: repository
  };
};

const starRepository = async (ctx) => {
  const { verify } = ctx.request.query;
  const { fullname } = ctx.request.body;
  const result = await GitHub.starRepository(fullname, verify);

  ctx.body = {
    success: true,
    result
  };
};

const unstarRepository = async (ctx) => {
  const { verify } = ctx.request.query;
  const { fullname } = ctx.request.body;
  const result = await GitHub.unstarRepository(fullname, verify);

  ctx.body = {
    success: true,
    result
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
  getRepository,
  starRepository,
  unstarRepository,
  /* ====== */
  getUserRepos,
  getUserStarred,
  getUserCommits,
  getUserOrgs,
  /* ====== */
  refreshUserRepos,
  refreshUserCommits,
  refreshUserOrgs,
  getUserUpdateTime
};
