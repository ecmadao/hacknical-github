import mongoose from '../mongoose/index';

const Schema = mongoose.Schema;

const GitHubReposReadmeSchema = new Schema({
  login: String,
  full_name: String,
  readme: String,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('GitHubReposReadme', GitHubReposReadmeSchema);
