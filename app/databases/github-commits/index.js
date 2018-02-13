import GitHubCommits from './schema';

const clearUserCommits = async options =>
  await GitHubCommits.remove(options);

const getRepositoryCommits = async (login, name) => {
  const findResult = await GitHubCommits.findOne({
    name,
    login,
  });
  return {
    success: true,
    result: findResult
  };
};

const getCommits = async (login) => {
  const findResults = await GitHubCommits.find({ login });
  return findResults;
};

export default {
  getCommits,
  getRepositoryCommits,
};
