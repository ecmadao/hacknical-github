const convertUserInfo = (v4UserInfo) => {
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

export default {
  user: convertUserInfo
};
