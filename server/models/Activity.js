const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ userId: 1, type: 1 });

// Automatically remove old activities (keep only last 100 per user)
activitySchema.statics.cleanupOldActivities = async function(userId) {
  const activities = await this.find({ userId })
    .sort({ timestamp: -1 })
    .skip(100);
  
  if (activities.length > 0) {
    const idsToRemove = activities.map(activity => activity._id);
    await this.deleteMany({ _id: { $in: idsToRemove } });
  }
};

module.exports = mongoose.model('Activity', activitySchema);
