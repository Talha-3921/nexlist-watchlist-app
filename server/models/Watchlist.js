const mongoose = require('mongoose');

const WatchlistItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Movies', 'TV Shows', 'Web Series', 'Anime', 'Games']
  },  status: {
    type: String,
    enum: [
      'Plan to Watch', 
      'Plan to Play',
      'Watching', 
      'Playing',
      'On Hold', 
      'Completed', 
      'Dropped',
      // Additional status values from external APIs
      'Airing',
      'Finished Airing',
      'Not yet aired',
      'Currently Airing',
      'Ongoing',
      'Released',
      'Upcoming',
      'In Production',
      'Post Production',
      'Canceled',
      'Ended' 
    ],
    default: 'Plan to Watch'
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  poster: {
    type: String,
    default: ''
  },
  releaseDate: {
    type: String,
    default: ''
  },
  genre: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  folders: {
    type: [String],
    default: []
  },
  addedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const customFolderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  isShared: {
    type: Boolean,
    default: false
  },
  shareUrl: {
    type: String,
    default: ''
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
});

const WatchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [WatchlistItemSchema],
  customFolders: [customFolderSchema]
}, {
  timestamps: true
});

// Update lastUpdated when items are modified
WatchlistSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.items.forEach(item => {
      if (item.isModified()) {
        item.lastUpdated = new Date();
      }
    });
  }
  next();
});

module.exports = mongoose.model('Watchlist', WatchlistSchema);
