import mongoose from '../mongoose/index';

const Schema = mongoose.Schema;

const GitHubReposReadmeSchema = new Schema({
  login: String,
  full_name: String,
  readme: String,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

GitHubReposReadmeSchema.index({
  login: 1,
  full_name: 1
});

export default mongoose.model('GitHubReposReadme', GitHubReposReadmeSchema);
