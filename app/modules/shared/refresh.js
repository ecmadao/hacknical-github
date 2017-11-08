import GitHubV3 from '../../services/github-v3';
import Helper from './helper';
import UsersModel from '../../databases/github-users';
import ReposModel from '../../databases/github-repos';
import UsersInfoModal from '../../databases/github-users-info';
import {
  PER_PAGE,
} from '../../utils/github';

const refreshUser = async (options) => {
  const { login, verify } = options;
  const userInfo = await GitHubV3.getUser(login, verify);
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
    await GitHubV3.getPersonalPubRepos(login, verify, perPage);
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
