import mongoose from '../mongoose/index';

const Schema = mongoose.Schema;

const GitHubOrgsSchema = new Schema({
  name: String,
  login: String,
  avatar_url: String,
  company: String,
  blog: String,
  location: String,
  email: String,
  description: String,
  created_at: String,
  updated_at: String,
  type: String,
  public_repos: String,
  html_url: String,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

GitHubOrgsSchema.index({
  name: 1,
  login: 1,
  company: 1,
});

export default mongoose.model('GithubOrgs', GitHubOrgsSchema);
