const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');

// @route   POST /api/activities
// @desc    Log a new activity
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { type, title, details } = req.body;
    
    if (!type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Type and title are required'
      });
    }
    
    // Create new activity
    const activity = new Activity({
      userId: req.user.id,
      type,
      title,
      details: details || {}
    });
    
    await activity.save();
    
    // Clean up old activities (keep only last 100 per user)
    await Activity.cleanupOldActivities(req.user.id);
    
    res.json({
      success: true,
      activity: {
        _id: activity._id,
        userId: activity.userId,
        type: activity.type,
        title: activity.title,
        details: activity.details,
        timestamp: activity.timestamp
      },
      message: 'Activity logged successfully'
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while logging activity'
    });
  }
});

// @route   GET /api/activities
// @desc    Get user's activities
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const activities = await Activity.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    res.json({
      success: true,
      activities,
      count: activities.length
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activities'
    });
  }
});

// @route   DELETE /api/activities
// @desc    Clear all user activities
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    await Activity.deleteMany({ userId: req.user.id });
    
    res.json({
      success: true,
      message: 'All activities cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing activities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing activities'
    });
  }
});

// @route   GET /api/activities/stats
// @desc    Get activity statistics for user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Activity.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const totalActivities = await Activity.countDocuments({ userId: req.user.id });
    
    res.json({
      success: true,
      stats: {
        total: totalActivities,
        byType: stats
      }
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity stats'
    });
  }
});

module.exports = router;
