import GitHubUsersInfo from './schema';

const findUser = async login => await GitHubUsersInfo.findOne({ login });

const insert = async options => await GitHubUsersInfo.create(options);

const updateUserOrganizations = async (login, organizations = []) => {
  const user = await findUser(login);
  if (!user) {
    return Promise.resolve({
      success: false
    });
  }
  user.organizations = [...organizations];
  await user.save();
  return Promise.resolve({
    success: true,
    result: user
  });
};

const updateUserContributions = async (login, contributions = []) => {
  const user = await findUser(login);
  if (!user) {
    return Promise.resolve({
      success: false
    });
  }
  user.contributions = [...contributions];
  await user.save();
  return Promise.resolve({
    success: true,
    result: user
  });
};

const updateUserStarred = async (login, fullnames = [], starredFetched = false) => {
  const user = await findUser(login);
  if (!user) {
    return Promise.resolve({
      success: false
    });
  }
  const { starred } = user;
  user.starred = [...new Set([
    ...starred,
    ...fullnames
  ])];
  user.starredFetched = starredFetched;
  await user.save();
  return Promise.resolve({
    success: true,
    result: user
  });
};

export default {
  insert,
  findOne: findUser,
  updateUserStarred,
  updateUserOrganizations,
  updateUserContributions,
};
