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
    start: String,
    end: String,
    total: Number,
    updateTime: Date,
    levelRanges: Array,
    streak: {
      longest: {
        count: Number,
        start: String,
        end: String,
      },
      current: {
        count: Number,
        start: String,
        end: String,
      }
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

GitHubUsersInfoSchema.index({
  login: 1
});

export default mongoose.model('GitHubUsersInfo', GitHubUsersInfoSchema);
