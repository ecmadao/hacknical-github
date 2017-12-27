
import GitHubOrgs from './schema';

/**
 * private
 */
const getOrganizationInfo = orgInfo => ({
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

const findByLogin = async login => await GitHubOrgs.findOne({ login });

const findManyByLogin = async logins => await GitHubOrgs.find({
  login: {
    $in: logins
  }
});

const updateOrganization = async (orgInfo) => {
  const newOrganizationInfo = getOrganizationInfo(orgInfo);
  const { login } = newOrganizationInfo;
  const organization = await findByLogin(login);

  if (organization) {
    Object.assign(organization, newOrganizationInfo);
    await organization.save();
    return {
      success: true,
      result: organization
    };
  }
  const newOrganization =
    await GitHubOrgs.create(newOrganizationInfo);
  return {
    success: true,
    result: newOrganization,
  };
};

export default {
  findOne: findByLogin,
  find: findManyByLogin,
  update: updateOrganization,
};
