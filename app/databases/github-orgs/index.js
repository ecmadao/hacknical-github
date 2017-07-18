
import GitHubOrgs from './schema';

/**
 * private
 */
const getOrgInfo = orgInfo => ({
  login: orgInfo.login,
  name: orgInfo.name,
  avatar_url: orgInfo.avatar_url,
  company: orgInfo.company,
  blog: orgInfo.blog,
  location: orgInfo.location,
  email: orgInfo.email,
  description: orgInfo.description,
  created_at: orgInfo.created_at,
  updated_at: orgInfo.updated_at,
  public_repos: orgInfo.public_repos,
  public_gists: orgInfo.public_gists,
  followers: orgInfo.followers,
  following: orgInfo.following,
  html_url: orgInfo.html_url,
  type: orgInfo.type,
  repos: orgInfo.repos || []
});

const getReposInfo = repos => ({
  full_name: repos.full_name,
  name: repos.name,
  html_url: repos.html_url,
  description: repos.description,
  fork: repos.fork,
  created_at: repos.created_at,
  updated_at: repos.updated_at,
  pushed_at: repos.pushed_at,
  homepage: repos.homepage,
  size: repos.size,
  stargazers_count: repos.stargazers_count,
  watchers_count: repos.watchers_count,
  language: repos.language,
  languages: repos.languages,
  contributors: repos.contributors,
  forks_count: repos.forks_count,
  forks: repos.forks,
  watchers: repos.watchers
});

const updateOrgReposInfo = (newRepos, oldRepos = []) => {
  const results = [];
  newRepos.forEach((repository) => {
    const { full_name, contributors } = repository;
    const oldRepository = oldRepos.find(item => item.full_name === full_name);
    if (
      (!contributors || !contributors.length)
      && oldRepository.contributors
      && oldRepository.contributors.length
    ) {
      results.push(getReposInfo(Object.assign({}, repository, {
        contributors: oldRepository.contributors
      })));
    } else {
      results.push(getReposInfo(repository));
    }
  });
  return results;
};

/* === API === */

const findOrgByLogin = async login => await GitHubOrgs.findOne({ login });

const findOrgsByLogin = async logins => await GitHubOrgs.find({
  login: {
    $in: logins
  }
});

const updateOrgRepos = async (login, repos) => {
  const findOrg = await findOrgByLogin(login);
  if (!findOrg) {
    return Promise.resolve({
      success: false
    });
  }
  const oldRepos = findOrg.repos;
  findOrg.repos = updateOrgReposInfo(repos, oldRepos);
  await findOrg.save();
  return Promise.resolve({
    success: true,
    result: findOrg
  });
};

const updateOrg = async (orgInfo) => {
  const newOrgInfo = getOrgInfo(orgInfo);
  const { login, repos } = newOrgInfo;
  const findOrg = await findOrgByLogin(login);

  const oldRepos = findOrg ? findOrg.repos : [];
  newOrgInfo.repos = updateOrgReposInfo(repos, oldRepos);

  if (findOrg) {
    Object.assign(findOrg, newOrgInfo);
    await findOrg.save();
    return Promise.resolve({
      success: true,
      result: findOrg
    });
  }
  const newOrg = await GitHubOrgs.create(newOrgInfo);
  return Promise.resolve({
    success: true,
    result: newOrg,
  });
};

export default {
  find: findOrgByLogin,
  findMany: findOrgsByLogin,
  update: updateOrg,
  updateRepos: updateOrgRepos,
};
