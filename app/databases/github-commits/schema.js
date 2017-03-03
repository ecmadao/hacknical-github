import mongoose from '../mongoose/index';

const Schema = mongoose.Schema;

const GithubCommitsSchema = new Schema({
  login: String,
  reposId: String,
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

export default mongoose.model('GithubCommits', GithubCommitsSchema);
