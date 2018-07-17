import config from 'config';
import UsersModel from '../../databases/github-users';
import GitHubV3 from '../../services/github-v3';
import GitHubV4 from '../../services/github-v4';
import Helper from '../shared/helper';
import logger from '../../utils/logger';
import {
  CRAWLER_STATUS,
  CRAWLER_STATUS_CODE,
  CRAWLER_STATUS_TEXT,
} from '../../utils/constant';

const app = config.get('github');
const mqConfig = config.get('mq');
const crawlerMqName = mqConfig.channels['qname-crawler'];
const scientificMqName = mqConfig.channels['qname-scientific'];

/* ================== router handler ================== */

const getZen = async (ctx) => {
  const { verify } = ctx.request.query;
  const result = await GitHubV3.getZen(verify);

  ctx.body = {
    result,
    success: true,
  };
};

const getOctocat = async (ctx) => {
  const { verify } = ctx.request.query;
  const result = await GitHubV3.getOctocat(verify);

  ctx.body = {
    result,
    success: true,
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
  logger.debug(`code: ${code}, verify: ${JSON.stringify(verify)}`);
  const result = await GitHubV3.getToken(code, verify);
  logger.debug(result);

  const token = result.access_token;
  ctx.body = {
    success: true,
    result: token,
  };
};

const getLogin = async (ctx) => {
  const { verify } = ctx.request.query;
  const userInfo = await GitHubV4.getUserByToken(verify);
  logger.debug(userInfo);

  ctx.mq.sendMessage({
    message: userInfo.login,
    qname: scientificMqName
  });
  const user = await UsersModel.findOne(userInfo.login);
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
  const { login } = ctx.params;
  const user = await Helper.getUser(login);
  ctx.body = {
    success: true,
    result: user,
  };
};

const updateUser = async (ctx) => {
  const { login } = ctx.params;
  const { data } = ctx.request.body;

  if (data.status !== undefined && !Number.isNaN(data.status)) {
    data.status = CRAWLER_STATUS_TEXT[data.status];
  }
  data.login = login;
  await UsersModel.updateUser(data);

  ctx.body = {
    success: true,
  };
};

const getUserRepositories = async (ctx) => {
  const { login } = ctx.params;
  const repos = await Helper.getUserRepositories(login);

  ctx.body = {
    success: true,
    result: repos
  };
};

const getUserContributed = async (ctx) => {
  const { login } = ctx.params;
  const repos = await Helper.getUserContributed(login);

  ctx.body = {
    success: true,
    result: repos
  };
};

const getUserStarred = async (ctx) => {
  const { login } = ctx.params;
  const result = await Helper.getUserStarred(login);

  ctx.body = {
    result,
    success: true,
  };
};

const getUserStarredCount = async (ctx) => {
  const { login } = ctx.params;
  const { verify } = ctx.request.query;
  const count = await GitHubV4.getUserStarredCount(login, verify);
  ctx.body = {
    success: true,
    result: count,
  };
};

const getUserCommits = async (ctx) => {
  const { login } = ctx.params;
  const commits = await Helper.getCommits(login);

  ctx.body = {
    success: true,
    result: commits
  };
};

const getUserLanguages = async (ctx) => {
  const { login } = ctx.params;
  const languages = await Helper.getLanguages(login);

  ctx.body = {
    success: true,
    result: languages
  };
};

const getUserOrganizations = async (ctx) => {
  const { login } = ctx.params;
  const organizations = await Helper.getOrganizations(login);
  ctx.body = {
    success: true,
    result: organizations,
  };
};

const updateUserData = async (ctx) => {
  const { login } = ctx.params;
  const { verify } = ctx.request.query;

  await UsersModel.updateUser({
    login,
    status: CRAWLER_STATUS.PENDING
  });

  ctx.mq.sendMessage({
    message: JSON.stringify({
      login,
      verify,
      date: new Date().toString()
    }),
    qname: crawlerMqName
  });

  ctx.body = {
    success: true,
    result: 'User data fetching'
  };
};

const getUpdateStatus = async (ctx) => {
  const { login } = ctx.params;
  const user = await UsersModel.findOne(login);
  const {
    startUpdateAt,
    lastUpdateTime
  } = user;

  let { status } = user;

  if (status === CRAWLER_STATUS.SUCCEED) {
    await UsersModel.updateUser({
      login,
      status: CRAWLER_STATUS.INITIAL
    });
  } else if (status !== CRAWLER_STATUS.INITIAL && startUpdateAt) {
    // 10 min ttl
    if (new Date() - new Date(startUpdateAt) >= 10 * 60 * 1000) {
      status = CRAWLER_STATUS.SUCCEED;
      await UsersModel.updateUser({
        login,
        status: CRAWLER_STATUS.INITIAL
      });
    }
  }

  ctx.body = {
    success: true,
    result: {
      lastUpdateTime,
      status: CRAWLER_STATUS_CODE[status],
    },
  };
};

const getRepository = async (ctx) => {
  const {
    fullname,
  } = ctx.request.query;
  const repository = await Helper.getRepository(fullname);

  ctx.body = {
    success: true,
    result: repository,
  };
};

const getRepositoryReadme = async (ctx) => {
  const {
    fullname,
  } = ctx.request.query;
  const data = await Helper.getRepositoryReadme(fullname);

  ctx.body = {
    success: true,
    result: data.readme,
  };
};

const starRepository = async (ctx) => {
  const { verify } = ctx.request.query;
  const { fullname } = ctx.request.body;
  const result = await GitHubV3.starRepository(fullname, verify);

  ctx.body = {
    result,
    success: true,
  };
};

const unstarRepository = async (ctx) => {
  const { verify } = ctx.request.query;
  const { fullname } = ctx.request.body;
  const result = await GitHubV3.unstarRepository(fullname, verify);

  ctx.body = {
    result,
    success: true,
  };
};

const getHotmap = async (ctx) => {
  const { login } = ctx.params;
  const hotmap = await Helper.getHotmap(login);

  ctx.body = {
    result: hotmap,
    success: true
  };
};

export default {
  /* ====== */
  getHotmap,
  /* ====== */
  getZen,
  getOctocat,
  /* ====== */
  getToken,
  getVerify,
  /* ====== */
  getUser,
  updateUser,
  getLogin,
  getRepository,
  starRepository,
  unstarRepository,
  getRepositoryReadme,
  /* ====== */
  getUserStarred,
  getUserCommits,
  getUserLanguages,
  getUserContributed,
  getUserStarredCount,
  getUserRepositories,
  getUserOrganizations,
  /* ====== */
  updateUserData,
  getUpdateStatus,
};
