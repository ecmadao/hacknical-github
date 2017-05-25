import GitHubRepos from './schema';

const findRepository = async (login, reposId) => await GitHubRepos.findOne({
  login,
  reposId
});

// const findRepos = async login => await GitHubRepos.find({ login });

const clearRepos = async login => await GitHubRepos.remove({ login });

const removeRepos = async (login, reposId = null) => {
  if (reposId === null) {
    return await clearRepos(login);
  }
  return await GitHubRepos.remove({
    login,
    reposId
  });
};

const createRepos = async (login, repository) => {
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
    languages,
    forks_count,
    forks,
    watchers,
    subscribers_count,
    owner,
    topics = null
  } = repository;
  return await GitHubRepos.create({
    reposId: id,
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
    languages: languages || {},
    forks_count,
    forks,
    watchers,
    subscribers_count,
    topics,
    owner: {
      login: owner.login,
      avatar_url: owner.avatar_url,
      html_url: owner.html_url
    }
  });
};

const setRepository = async (login, repository) => {
  const findResult = await findRepository(login, repository.id);
  if (findResult) {
    return findResult;
  }
  return await createRepos(login, repository);
};

const setRepos = async (login, repos) => {
  const setResults = [];
  await removeRepos(login);
  for (let i = 0; i < repos.length; i += 1) {
    const repository = repos[i];
    const result = await setRepository(login, repository);
    setResults.push(result);
  }
  return setResults;
};

const getRepos = async login => await GitHubRepos.find({
  login
});

const getRepository = async fullname => await GitHubRepos.findOne({
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
