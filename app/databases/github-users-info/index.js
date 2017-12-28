import GitHubUsersInfo from './schema';

const findUserInfo = async (login) => {
  const userInfo = await GitHubUsersInfo.findOne({ login });
  if (!userInfo) {
    return await insert({
      login,
      starred: [],
      organizations: [],
      contributions: [],
      starredFetched: false
    });
  }
  return userInfo;
};

const insert = async options => await GitHubUsersInfo.create(options);

const updateUserOrganizations = async (login, organizations = []) => {
  const user = await findUserInfo(login);
  user.organizations = [...organizations];
  await user.save();
  return {
    success: true,
    result: user
  };
};

const updateUserContributions = async (login, contributions = []) => {
  const user = await findUserInfo(login);
  user.contributions = [...contributions];
  await user.save();
  return {
    success: true,
    result: user
  };
};

const updateUserStarred = async (login, fullnames = [], starredFetched = false) => {
  const user = await findUserInfo(login);
  const { starred } = user;
  user.starred = [...new Set([
    ...starred,
    ...fullnames
  ])];
  user.starredFetched = starredFetched;
  await user.save();
  return {
    success: true,
    result: user
  };
};

const updateUserHotmap = async (login, hotmapData) => {
  const user = await findUserInfo(login);
  if (user.hotmap.datas.length && user.hotmap.allFetched) {
    const { end } = user.hotmap;
    const { datas } = hotmapData;
    let index = datas.findIndex(item => item.date === end);
    if (index !== -1) {
      user.hotmap.datas[user.hotmap.datas.length - 1] = datas[index];
      index += 1;
    } else {
      index = 0;
    }
    user.hotmap.datas.push(...datas.slice(index));
    user.hotmap.end = hotmapData.end;
  } else {
    user.hotmap = hotmapData;
    user.hotmap.allFetched = true;
  }
  user.hotmap.updateTime = new Date();
  await user.save();
  return {
    success: true,
    result: user.hotmap
  };
};

export default {
  insert,
  findOne: findUserInfo,
  updateUserHotmap,
  updateUserStarred,
  updateUserOrganizations,
  updateUserContributions,
};
