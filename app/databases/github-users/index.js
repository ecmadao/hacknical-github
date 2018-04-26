import GitHubUsers from './schema';

/**
 * private
 */
const getGitHubInfo = userInfo => ({
  login: userInfo.login,
  name: userInfo.name,
  avatar_url: userInfo.avatar_url,
  company: userInfo.company,
  blog: userInfo.blog,
  location: userInfo.location,
  email: userInfo.email,
  bio: userInfo.bio,
  created_at: userInfo.created_at,
  updated_at: userInfo.updated_at,
  public_repos: userInfo.public_repos,
  public_gists: userInfo.public_gists,
  followers: userInfo.followers,
  following: userInfo.following,
});

const findUser = async login => await GitHubUsers.findOne({ login });

const updateUserInfo = async (userInfo) => {
  const user = await findUser(userInfo.login);
  Object.assign(user, userInfo);
  await user.save();
  return {
    success: true,
  };
};

const updateUser = async (userInfo) => {
  const lastUpdateTime = new Date();
  const user = await findUser(userInfo.login);
  Object.assign(user, userInfo, { lastUpdateTime });
  await user.save();
  return {
    success: true,
    result: lastUpdateTime
  };
};

const createGitHubUser = async (userInfo) => {
  const user = await findUser(userInfo.login);
  if (user) {
    return await updateUser(userInfo);
  }
  const newGitHubInfo = getGitHubInfo(userInfo);
  newGitHubInfo.lastUpdateTime = new Date();
  const newUser = await GitHubUsers.create(newGitHubInfo);
  return {
    success: true,
    result: newUser
  };
};

export default {
  updateUser,
  updateUserInfo,
  createGitHubUser,
  findOne: findUser,
};
