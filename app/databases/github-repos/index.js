import GitHubRepos from './schema';
import logger from '../../utils/logger';
import { isEmptyObject } from '../../utils/helpers';

const getRepositoryData = (repository, login) => {
  const {
    name,
    fork,
    forks,
    html_url,
    homepage,
    language,
    watchers,
    full_name,
    pushed_at,
    created_at,
    updated_at,
    forks_count,
    description,
    watchers_count,
    stargazers_count,
    subscribers_count,
    owner = {},
    topics = [],
    languages = {},
    contributors = [],
  } = repository;

  const data = {
    name,
    fork,
    login,
    forks,
    topics,
    html_url,
    homepage,
    language,
    watchers,
    languages,
    full_name,
    pushed_at,
    created_at,
    updated_at,
    contributors,
    forks_count,
    description,
    watchers_count,
    stargazers_count,
    subscribers_count,
    owner: {},
  };

  if (!isEmptyObject(owner)) {
    data.owner = {
      login: owner.login,
      avatar_url: owner.avatar_url,
      html_url: owner.html_url
    };
    data.login = owner.login;
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

const findRepository = async full_name =>
  await GitHubRepos.findOne({ full_name });

const clearRepositories = async login =>
  await GitHubRepos.remove({ login });

const removeRepositories = async (login, name = null) => {
  if (name === null) {
    await clearRepositories(login);
  } else {
    await GitHubRepos.remove({
      name,
      login,
    });
  }
};

const createRepository = async repository =>
  await GitHubRepos.create({
    ...repository
  });

const setRepository = async (login, repository) => {
  const findResult = await findRepository(repository.full_name);
  const newRepository = getRepositoryData(repository, login);
  if (findResult) {
    updateRepositoryInfo({
      newRepository,
      oldRepository: findResult
    });
    return await findResult.save();
  }
  return await createRepository(newRepository);
};

const setRepositories = async (login, repos) => {
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

const getRepositories = async login =>
  await GitHubRepos.find({ login });

const getRepository = async fullname =>
  await GitHubRepos.findOne({
    full_name: fullname
  });

export default {
  getRepository,
  setRepository,
  setRepositories,
  getRepositories,
  removeRepositories,
};
