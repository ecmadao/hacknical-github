import GithubCommits from './schema';

const clearUserCommits = async (login) => {
  return await GithubCommits.remove({
    login
  });
};

const setCommits = async (login, datas) => {
  await clearUserCommits(login);
  for(let i = 0; i < datas.length; i++) {
    const data = datas[i];
    const {
      reposId,
      commits,
      name,
      created_at,
      pushed_at,
      totalCommits
    } = data;
    await GithubCommits.create({
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
  const findResults = await GithubCommits.find({ login });
  return findResults;
};

const getReposCommits = async (login, reposId) => {
  const findResult = await GithubCommits.findOne({
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
}
