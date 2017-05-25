import GitHubCommits from './schema';

const clearUserCommits = async login => await GitHubCommits.remove({
  login
});

const setCommits = async (login, datas) => {
  await clearUserCommits(login);
  for (let i = 0; i < datas.length; i += 1) {
    const data = datas[i];
    const {
      reposId,
      commits,
      name,
      created_at,
      pushed_at,
      totalCommits
    } = data;
    await GitHubCommits.create({
      name,
      login,
      reposId,
      commits,
      created_at,
      pushed_at,
      totalCommits
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

const getReposCommits = async (login, reposId) => {
  const findResult = await GitHubCommits.findOne({
    login,
    reposId
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
