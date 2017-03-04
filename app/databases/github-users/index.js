import GitHubUsers from './schema';

/**
 * private
 */
const getGitHubInfo = (userInfo) => {
  const {
    id,
    login,
    name,
    avatar_url,
    company,
    blog,
    location,
    email,
    bio,
    created_at,
    updated_at,
    public_repos,
    public_gists,
    followers,
    following
  } = userInfo;
  const newGitHubInfo = {
    id,
    login,
    name,
    avatar_url,
    company,
    blog,
    location,
    email,
    bio,
    created_at,
    updated_at,
    public_repos,
    public_gists,
    followers,
    following
  };
  return newGitHubInfo;
};

const findUser = async (login) => {
  return await GitHubUsers.findOne({ login });
};

const findUserByGitHubId = async (id) => {
  return await GitHubUsers.findOne({ id });
};


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

const updateUserOrgs = async (login, orgs = []) => {
  const user = await findUser(login);
  if (!user) {
    return Promise.resolve({
      success: false
    });
  }
  user.orgs = [...orgs];
  await user.save();
  return Promise.resolve({
    success: true,
    result: user
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
  findUser,
  findUserByGitHubId,
  updateUser,
  updateUserOrgs,
  createGitHubUser
}
