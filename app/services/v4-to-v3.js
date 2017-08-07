
const convertUser = (v4UserInfo) => {
  const {
    bio,
    name,
    login,
    email,
    gists,
    company,
    location,
    createdAt,
    updatedAt,
    avatarUrl,
    followers,
    following,
    websiteUrl,
    repositories,
  } = v4UserInfo;

  return {
    bio,
    name,
    login,
    email,
    company,
    location,
    blog: websiteUrl,
    created_at: createdAt,
    updated_at: updatedAt,
    avatar_url: avatarUrl,
    public_gists: gists.totalCount,
    followers: followers.totalCount,
    following: following.totalCount,
    public_repos: repositories.totalCount,
  };
};

const convertRepository = (v4Repository) => {
  const {
    url,
    name,
    owner,
    forks,
    isFork,
    watchers,
    pushedAt,
    updatedAt,
    createdAt,
    languages,
    stargazers,
    homepageUrl,
    description,
    nameWithOwner,
    repositoryTopics,
    primaryLanguage = {},
  } = v4Repository;

  const languagesPercentage = {};
  const totalSize = languages.edges.reduce((prev, current, index) => {
    if (index === 0) return current.size;
    return prev + current.size;
  }, 0);
  languages.edges.forEach((language) => {
    const { size, node } = language;
    languagesPercentage[node.name] = size / totalSize;
  });

  return {
    name,
    description,
    fork: isFork,
    html_url: url,
    pushed_at: pushedAt,
    created_at: createdAt,
    updated_at: updatedAt,
    homepage: homepageUrl,
    forks: forks.totalCount,
    full_name: nameWithOwner,
    forks_count: forks.totalCount,
    watchers: watchers.totalCount,
    languages: languagesPercentage,
    watchers_count: watchers.totalCount,
    subscribers_count: watchers.totalCount,
    stargazers_count: stargazers.totalCount,
    language: (primaryLanguage && primaryLanguage.name) || '',
    topics: repositoryTopics.edges.map(edge => edge.node.topic.name),
    owner: {
      login: owner.login,
      html_url: owner.url,
      avatar_url: owner.avatarUrl,
    },
  };
};

const convertOrganization = (v4Organization) => {
  const {
    url,
    name,
    login,
    avatarUrl,
    organizationBillingEmail,
  } = v4Organization;

  return {
    url,
    name,
    login,
    html_url: url,
    avatar_url: avatarUrl,
    email: organizationBillingEmail,
  };
};

export default {
  user: convertUser,
  repository: convertRepository,
  organization: convertOrganization
};
