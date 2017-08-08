
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
  html_url: orgInfo.html_url,
  type: orgInfo.type || 'Organization',
});

/* === API === */

const findOrgByLogin = async login => await GitHubOrgs.findOne({ login });

const findOrgsByLogin = async logins => await GitHubOrgs.find({
  login: {
    $in: logins
  }
});

const updateOrg = async (orgInfo) => {
  const newOrgInfo = getOrgInfo(orgInfo);
  const { login } = newOrgInfo;
  const findOrg = await findOrgByLogin(login);

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
};
