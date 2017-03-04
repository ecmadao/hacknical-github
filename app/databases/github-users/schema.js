import mongoose from '../mongoose/index';

const Schema = mongoose.Schema;

const GitHubUsersSchema = new Schema({
  id: String,
  name: String,
  login: String,
  avatar_url: String,
  company: String,
  blog: String,
  location: String,
  email: String,
  bio: String,
  created_at: String,
  updated_at: String,
  public_repos: String,
  public_gists: String,
  followers: String,
  following: String,
  html_url: String,
  lastUpdateTime: Date,
  orgs: [{
    login: String,
    avatar_url: String,
    description: String
  }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('GithubUsers', GitHubUsersSchema);
