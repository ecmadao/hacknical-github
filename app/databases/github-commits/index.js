import GitHubCommits from './schema';

const clearUserCommits = async options =>
  await GitHubCommits.remove(options);

const setCommits = async (login, datas) => {
  for (let i = 0; i < datas.length; i += 1) {
    const data = datas[i];
    if (!data.name) continue;
    const {
      name,
      commits,
      pushed_at,
      created_at,
      totalCommits,
    } = data;
    await clearUserCommits({
      name,
      login,
    });
    await GitHubCommits.create({
      name,
      login,
      commits,
      pushed_at,
      created_at,
      totalCommits,
    });
  }
  return Promise.resolve({
    success: true
  });
};

const getCommits = async (login) => {
  const findResults = await GitHubCommits.find({ login });
  return findResults;
};

const getReposCommits = async (login, name) => {
  const findResult = await GitHubCommits.findOne({
    name,
    login,
  });
  return Promise.resolve({
    success: true,
    result: findResult
  });
};

export default {
  setCommits,
  getCommits,
  getReposCommits
};
