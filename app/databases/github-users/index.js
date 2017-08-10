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

const updateUser = async (userInfo) => {
  const newGitHubInfo = getGitHubInfo(userInfo);
  const lastUpdateTime = new Date();
  newGitHubInfo.lastUpdateTime = lastUpdateTime;
  const user = await findUser(userInfo.login);
  Object.assign(user, newGitHubInfo);
  await user.save();
  return Promise.resolve({
    success: true,
    result: lastUpdateTime
  });
};

const createGitHubUser = async (userInfo) => {
  const newGitHubInfo = getGitHubInfo(userInfo);
  newGitHubInfo.lastUpdateTime = new Date();
  const newUser = await GitHubUsers.create(newGitHubInfo);
  return Promise.resolve({
    success: true,
    result: newUser
  });
};

export default {
  updateUser,
  createGitHubUser,
  findOne: findUser,
};
