
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
    starredRepositories,
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
    starred: starredRepositories.totalCount,
  };
};


export default {
  user: convertUser,
};
