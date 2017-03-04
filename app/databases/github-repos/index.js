import GitHubRepos from './schema';

const findRepository = async (login, reposId) => {
  return await GitHubRepos.findOne({
    login,
    reposId
  });
};

const findRepos = async (login) => {
  return await GitHubRepos.find({ login });
};

const clearRepos = async (login) => {
  return await GitHubRepos.remove({
    login
  });
};

const removeRepos = async (login, reposId = null) => {
  if (reposId === null) {
    return await clearRepos(login);
  }
  return await GitHubRepos.remove({
    login,
    reposId
  });
};

const setRepository = async (login, repository) => {
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
  	subscribers_count
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
  	subscribers_count
  });
};

const setRepos = async (login, repos) => {
  const setResults = [];
  await removeRepos(login);
  for(let i = 0; i < repos.length; i++) {
    const repository = repos[i];
    const findResult = await findRepository(login, repository.id);
    if (!findResult) {
      const result = await setRepository(login, repository);
      setResults.push(result);
    } else {
      setResults.push(findResult);
    }
  }
  return setResults;
};

const getRepos = async (login) => {
  return await GitHubRepos.find({
    login
  });
};

const resetRepos = async (login, repos) => {
  const setResults = [];
  await removeRepos(login);
  for(let i = 0; i < repos.length; i++) {
    const repository = repos[i];
    const result = await setRepository(login, repository);
    setResults.push(result);
  }
  return setResults;
};

export default {
  removeRepos,
  setRepository,
  setRepos,
  getRepos,
  resetRepos
}
