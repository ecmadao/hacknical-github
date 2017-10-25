import mongoose from '../mongoose/index';

const Schema = mongoose.Schema;

const GitHubReposSchema = new Schema({
  login: String,
  full_name: String,
  name: String,
  html_url: String,
  description: String,
  fork: Boolean,
  created_at: String,
  updated_at: String,
  pushed_at: String,
  homepage: String,
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
  contributors: { type: Array, default: [] }
});

GitHubReposSchema.index({
  full_name: 1,
  name: 1,
  login: 1,
  owner: {
    login: 1
  },
  stargazers_count: 1
});

export default mongoose.model('GithubRepos', GitHubReposSchema);
