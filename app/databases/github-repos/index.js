import GitHubRepos from './schema';
import logger from '../../utils/logger';
import { isEmptyObject } from '../../utils/helpers';

const getReposData = (repository, login) => {
  const {
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
    contributors = [],
  } = repository;

  const data = {
    login,
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
    topics,
    owner: {},
    contributors,
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

const updateRepositoryInfo = ({ newRepository, oldRepository }) => {
  const newContributors = newRepository.contributors || [];
  const oldContributors = oldRepository.contributors || [];

  const contributors = (!newContributors || !newContributors.length)
    ? oldContributors
    : newContributors;

  Object.assign(oldRepository, newRepository, {
    contributors
  });
  oldRepository.markModified('contributors');
};

const findRepository = async (login, name) =>
  await GitHubRepos.findOne({
    login,
    name
  });

// const findRepos = async login => await GitHubRepos.find({ login });

const clearRepos = async login => await GitHubRepos.remove({ login });

const removeRepos = async (login, name = null) => {
  if (name === null) {
    await clearRepos(login);
  } else {
    await GitHubRepos.remove({
      name,
      login,
    });
  }
};

const createRepos = async (login, repository) =>
  await GitHubRepos.create({
    ...repository
  });

const setRepository = async (login, repository) => {
  const findResult = await findRepository(login, repository.name);
  const newRepository = getReposData(repository, login);
  if (findResult) {
    updateRepositoryInfo({
      newRepository,
      oldRepository: findResult
    });
    return await findResult.save();
  }
  return await createRepos(login, newRepository);
};

const setRepos = async (login, repos) => {
  const setResults = [];

  await Promise.all(repos.map(async (repository) => {
    try {
      const result = await setRepository(login, repository);
      setResults.push(result);
    } catch (e) {
      logger.error(e);
    }
  }));
  return setResults;
};

const getRepos = async login => await GitHubRepos.find({ login });

const getRepository = async fullname =>
  await GitHubRepos.findOne({
    full_name: fullname
  });

export default {
  removeRepos,
  getRepository,
  setRepository,
  setRepos,
  getRepos,
};
