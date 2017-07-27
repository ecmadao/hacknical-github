import mongoose from '../mongoose/index';

const Schema = mongoose.Schema;

const GitHubCommitsSchema = new Schema({
  login: String,
  name: String,
  commits: [{
    days: Array,
    total: Number,
    week: Number
  }],
  totalCommits: Number,
  created_at: String,
  pushed_at: String
});

export default mongoose.model('GithubCommits', GitHubCommitsSchema);
