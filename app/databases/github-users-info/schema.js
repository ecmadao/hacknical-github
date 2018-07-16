import mongoose from '../mongoose/index';

const Schema = mongoose.Schema;

const GitHubUsersInfoSchema = new Schema({
  login: String,
  organizations: [{
    login: String,
    avatar_url: String,
    description: String
  }],
  contributions: {
    type: Array,
    default: [],
  },
  starred: {
    type: Array,
    default: [],
  },
  starredFetched: {
    type: Boolean,
    default: false,
  },
  hotmap: {
    datas: {
      type: Array,
      default: [],
    },
    allFetched: {
      type: Boolean,
      default: false,
    },
    start: String,
    end: String,
    updateTime: Date,
  },
  languages: Object
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

GitHubUsersInfoSchema.index({
  login: 1
});

export default mongoose.model('GitHubUsersInfo', GitHubUsersInfoSchema);
