import GitHubV4 from '../../services/github-v4';
import Helper from './helper';
import UsersModel from '../../databases/github-users';
import ReposModel from '../../databases/github-repos';

const refreshUser = async (options) => {
  const { login, verify } = options;
  const userInfo = await GitHubV4.getUser(login, verify);
  if (!userInfo) return null;
  await UsersModel.updateUser(userInfo);
};

const refreshRepositories = async (options) => {
  const {
    login,
    verify,
    perPage,
  } = options;

  const multiRepos =
    await GitHubV4.getPersonalPubRepos(login, verify, perPage);
  await ReposModel.setRepositories(login, multiRepos);
};

const refreshCommits = async (options) => {
  const { login, verify } = options;
  const repositories = await ReposModel.getUserRepositories(login);
  await Helper.updateCommits({
    login,
    verify,
    repositories
  });
};

export default {
  refreshUser,
  refreshCommits,
  refreshRepositories,
};
