import GithubUsers from './schema';

/**
 * private
 */
const getGithubInfo = (userInfo) => {
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
  const newGithubInfo = {
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
  return newGithubInfo;
};

const findUser = async (login) => {
  return await GithubUsers.findOne({ login });
};

const findUserByGithubId = async (id) => {
  return await GithubUsers.findOne({ id });
};


const updateUser = async (userInfo) => {
  const newGithubInfo = getGithubInfo(userInfo);
  const lastUpdateTime = new Date();
  newGithubInfo.lastUpdateTime = lastUpdateTime;
  const findUser = await findUser(userInfo.login);
  findUser.githubInfo = newGithubInfo;
  await findUser.save();
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

const createGithubUser = async (userInfo) => {
  const newGithubInfo = getGithubInfo(userInfo);
  newGithubInfo.lastLoginTime = new Date();
  const newUser = await GithubUsers.create(newGithubInfo);
  return Promise.resolve({
    success: true,
    result: newUser
  });
};

// const loginWithGithub = async (userInfo) => {
//   const newGithubInfo = getGithubInfo(userInfo);
//   newGithubInfo.lastLoginTime = new Date();
//
//   const { login } = userInfo;
//   const findUser = await findUser(login);
//
//   if (findUser) {
//     Object.assign(findUser, newGithubInfo);
//     await findUser.save();
//     return Promise.resolve({
//       success: true,
//       result: login
//     });
//   }
//
//   const newUser = await GithubUsers.create(newGithubInfo);
//   return Promise.resolve({
//     success: true,
//     result: login
//   });
// };


export default {
  findUser,
  findUserByGithubId,
  // loginWithGithub,
  updateUser,
  updateUserOrgs,
  createGithubUser
}
