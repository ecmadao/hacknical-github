import mongoose from '../mongoose/index';

const Schema = mongoose.Schema;

const GitHubReposSchema = new Schema({
  login: String,
  reposId: String,
  full_name: String,
  name: String,
  html_url: String,
  description: String,
  fork: Boolean,
  created_at: String,
  updated_at: String,
  pushed_at: String,
  homepage: String,
  size: Number,
  stargazers_count: Number,
  watchers_count: Number,
  language: String,
  languages: Object,
  forks_count: Number,
  forks: Number,
  watchers: Number,
  subscribers_count: Number,
  owner: {
    login: String,
    avatar_url: String,
    html_url: String
  },
  topics: Array,
});

export default mongoose.model('GithubRepos', GitHubReposSchema);
