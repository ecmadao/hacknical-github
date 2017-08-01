import GitHubCommits from './schema';

const clearUserCommits = async options =>
  await GitHubCommits.remove(options);

const getRepositoryCommits = async (login, name) => {
  const findResult = await GitHubCommits.findOne({
    name,
    login,
  });
  return Promise.resolve({
    success: true,
    result: findResult
  });
};

const setRepositoryCommits = async (login, data) => {
  if (!data.name) return;
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
};

const setCommits = async (login, datas) => {
  await Promise.all(datas.map(async (data) => {
    await setRepositoryCommits(login, data);
  }));
  return Promise.resolve({
    success: true
  });
};

const getCommits = async (login) => {
  const findResults = await GitHubCommits.find({ login });
  return findResults;
};

export default {
  setCommits,
  getCommits,
  getRepositoryCommits,
  setRepositoryCommits
};
