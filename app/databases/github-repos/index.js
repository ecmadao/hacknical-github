import GitHubRepos from './schema';
import logger from '../../utils/log';
import { isEmptyObject } from '../../utils/helpers';

const getReposData = (repository, login) => {
  const {
    id,
    full_name,
    name,
    html_url,
    description,
    fork,
    created_at,
    updated_at,
    pushed_at,
    homepage,
    size,
    stargazers_count,
    watchers_count,
    language,
    forks_count,
    forks,
    watchers,
    subscribers_count,
    owner = {},
    topics = null,
    languages = {},
  } = repository;

  const data = {
    login,
    reposId: id,
    full_name,
    name,
    html_url,
    description,
    fork,
    created_at,
    updated_at,
    pushed_at,
    homepage,
    size,
    stargazers_count,
    watchers_count,
    language,
    forks_count,
    forks,
    watchers,
    subscribers_count,
    languages,
    owner: {},
    topics
  };

  if (!isEmptyObject(owner)) {
    data.owner = {
      login: owner.login,
      avatar_url: owner.avatar_url,
      html_url: owner.html_url
    };
  }
  if (topics) {
    data.topics = topics;
  }
  return data;
};

const findRepository = async (login, reposId) =>
  await GitHubRepos.findOne({
    login,
    reposId
  });

// const findRepos = async login => await GitHubRepos.find({ login });

const clearRepos = async login => await GitHubRepos.remove({ login });

const removeRepos = async (login, reposId = null) => {
  if (reposId === null) {
    await clearRepos(login);
  } else {
    await GitHubRepos.remove({
      login,
      reposId
    });
  }
};

const createRepos = async (login, repository) => {
  const data = getReposData(repository, login);
  return await GitHubRepos.create({
    ...data
  });
};

const setRepository = async (login, repository) => {
  const findResult = await findRepository(login, repository.id);
  if (findResult) {
    const data = getReposData(repository, login);
    Object.assign(findResult, data);
    return await findResult.save();
  }
  return await createRepos(login, repository);
};

const setRepos = async (login, repos) => {
  const setResults = [];
  await removeRepos(login);
  for (let i = 0; i < repos.length; i += 1) {
    const repository = repos[i];
    try {
      const result = await setRepository(login, repository);
      setResults.push(result);
    } catch (e) {
      logger.error(e);
    }
  }
  return setResults;
};

const getRepos = async login => await GitHubRepos.find({ login });

const getRepository = async fullname =>
  await GitHubRepos.findOne({
    full_name: fullname
  });

const resetRepos = async (login, repos) => {
  const setResults = [];
  await removeRepos(login);
  for (let i = 0; i < repos.length; i += 1) {
    const repository = repos[i];
    const result = await createRepos(login, repository);
    setResults.push(result);
  }
  return setResults;
};

export default {
  removeRepos,
  getRepository,
  setRepository,
  setRepos,
  getRepos,
  resetRepos
};
