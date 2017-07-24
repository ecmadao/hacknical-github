
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
      html_url: owner.url,
      avatar_url: owner.avatarUrl,
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
