
const convertUser = (v4UserInfo) => {
  const {
    id,
    bio,
    name,
    login,
    email,
    gists,
    location,
    company,
    createdAt,
    updatedAt,
    avatarUrl,
    followers,
    following,
    websiteUrl,
    repositories,
  } = v4UserInfo;

  return {
    id,
    bio,
    name,
    login,
    email,
    location,
    company,
    blog: websiteUrl,
    created_at: createdAt,
    updated_at: updatedAt,
    avatar_url: avatarUrl,
    followers: followers.totalCount,
    following: following.totalCount,
    public_repos: repositories.totalCount,
    public_gists: gists.totalCount,
  };
};

const convertRepository = (v4Repository) => {
  const {
    url,
    name,
    isFork,
    owner,
    forks,
    watchers,
    diskUsage,
    languages,
    stargazers,
    pushedAt,
    updatedAt,
    createdAt,
    databaseId,
    homepageUrl,
    description,
    nameWithOwner,
    repositoryTopics,
    primaryLanguage = {},
  } = v4Repository;

  const languagesPercentage = {};
  const totalSize = languages.edges.reduce((current, next, index) => {
    if (index === 0) return current.size;
    return current + next.size;
  }, 0);
  languages.edges.forEach((language) => {
    const { size, node } = language;
    languagesPercentage[node.name] = size / totalSize;
  });

  return {
    name,
    description,
    full_name: nameWithOwner,
    reposId: databaseId,
    html_url: url,
    fork: isFork,
    created_at: createdAt,
    updated_at: updatedAt,
    pushed_at: pushedAt,
    homepage: homepageUrl,
    size: diskUsage,
    stargazers_count: stargazers.totalCount,
    watchers_count: watchers.totalCount,
    language: (primaryLanguage && primaryLanguage.name) || '',
    forks_count: forks.totalCount,
    forks: forks.totalCount,
    watchers: watchers.totalCount,
    subscribers_count: watchers.totalCount,
    owner: {
      login: owner.login,
      avatar_url: owner.avatarUrl,
      html_url: owner.url,
    },
    languages: languagesPercentage,
    topics: repositoryTopics.edges.map(edge => edge.node.topic.name),
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
    login,
    name,
    avatar_url: avatarUrl,
    html_url: url,
    email: organizationBillingEmail,
  };
};

export default {
  user: convertUser,
  repository: convertRepository,
  organization: convertOrganization
};
