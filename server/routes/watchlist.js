const express = require('express');
const { body, validationResult } = require('express-validator');
const Watchlist = require('../models/Watchlist');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Utility function to get default status based on media type
const getDefaultStatus = (mediaType) => {
  switch (mediaType) {
    case 'Games':
      return 'Plan to Play';
    default:
      return 'Plan to Watch';
  }
};

// Utility function to map external API status to Watchlist status
const mapToWatchlistStatus = (externalStatus, mediaType) => {
  if (!externalStatus) return getDefaultStatus(mediaType);
  
  const status = externalStatus.toLowerCase();
  const defaultStatus = getDefaultStatus(mediaType);
  
  // Map common status values to Watchlist-friendly ones
  const statusMap = {
    // Anime statuses from Jikan API
    'finished airing': 'Completed',
    'currently airing': 'Watching',
    'not yet aired': defaultStatus,
    'airing': 'Watching',
    'ongoing': 'Watching',
    
    // Movie/TV statuses from TMDB
    'released': 'Completed',
    'ended': 'Completed',
    'returning series': 'Watching',
    'in production': defaultStatus,
    'post production': defaultStatus,
    'upcoming': defaultStatus,
    'canceled': 'Dropped',
    'cancelled': 'Dropped',
    
    // Game statuses
    'released': defaultStatus,
    
    // Keep existing Watchlist statuses as is
    'plan to watch': 'Plan to Watch',
    'plan to play': 'Plan to Play',
    'watching': 'Watching',
    'playing': 'Playing',
    'on hold': 'On Hold',
    'completed': 'Completed',
    'dropped': 'Dropped'
  };
  
  return statusMap[status] || defaultStatus;
};

// Utility function to parse progress string to object
const parseProgress = (progressValue) => {
  if (!progressValue) return { current: 0, total: 0 };
  
  // If it's already an object, return as is
  if (typeof progressValue === 'object' && progressValue.current !== undefined && progressValue.total !== undefined) {
    return progressValue;
  }
  
  // If it's a string like "15/26" or "Completed"
  if (typeof progressValue === 'string') {
    if (progressValue.toLowerCase() === 'completed') {
      return { current: 1, total: 1 };
    }
    
    // Try to parse "15/26" format
    const match = progressValue.match(/(\d+)\/(\d+)/);
    if (match) {
      return {
        current: parseInt(match[1], 10),
        total: parseInt(match[2], 10)
      };
    }
  }
  
  // Default fallback
  return { current: 0, total: 0 };
};

// @route   GET /api/watchlist
// @desc    Get user's Watchlist
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ userId: req.user.id });
    
    if (!watchlist) {
      // Create new Watchlist if doesn't exist
      watchlist = new Watchlist({
        userId: req.user.id,
        items: [],
        customFolders: []
      });      await watchlist.save();
    }    
    
    res.json({
      success: true,
      watchlist: watchlist
    });

  } catch (error) {
    console.error('Get Watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching Watchlist'
    });
  }
});

// @route   POST /api/Watchlist/items
// @desc    Add item to Watchlist
// @access  Private
router.post('/items', auth, [
  body('title', 'Title is required').not().isEmpty(),
  body('type', 'Type is required').isIn(['Movies', 'TV Shows', 'Web Series', 'Anime', 'Games'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }    let watchlist = await Watchlist.findOne({ userId: req.user.id });
    
    if (!watchlist) {
      watchlist = new Watchlist({
        userId: req.user.id,
        items: [],
        customFolders: []
      });
    }

    // Check if item already exists
    const existingItem = watchlist.items.find(item => 
      item.title === req.body.title && item.type === req.body.type
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Item already exists in Watchlist'
      });
    }    // Add new item - use appropriate default status based on media type
    const userStatus = req.body.status;
    let finalStatus = getDefaultStatus(req.body.type);
    
    // Only apply status mapping if user explicitly provided a Watchlist status
    const validWatchlistStatuses = ['Plan to Watch', 'Plan to Play', 'Watching', 'Playing', 'On Hold', 'Completed', 'Dropped'];
    if (userStatus && validWatchlistStatuses.includes(userStatus)) {
      finalStatus = userStatus;
    }
    
    console.log(`Adding ${req.body.type} with status: ${finalStatus} (user provided: ${userStatus})`);
    
    const parsedProgress = parseProgress(req.body.progress);
    
    const newItem = {
      title: req.body.title,
      type: req.body.type,
      status: finalStatus,
      rating: req.body.rating || 0,
      progress: parsedProgress,
      poster: req.body.poster || '',
      releaseDate: req.body.releaseDate || '',
      genre: req.body.genre || [],
      description: req.body.description || '',
      notes: req.body.notes || '',
      folders: req.body.folders || []
    };    watchlist.items.push(newItem);
    await watchlist.save();

    res.json({
      success: true,
      message: 'Item added to Watchlist successfully',
      item: newItem
    });

  } catch (error) {
    console.error('Add to Watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding to Watchlist'
    });
  }
});

// @route   PUT /api/Watchlist/items/:itemId
// @desc    Update Watchlist item
// @access  Private
router.put('/items/:itemId', auth, async (req, res) => {
  try {
    console.log('🔵 PUT /items/:itemId called:', { itemId: req.params.itemId, body: req.body });
    
    const watchlist = await Watchlist.findOne({ userId: req.user.id });
    
    if (!watchlist) {
      console.log('🔴 Watchlist not found for user:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    const item = watchlist.items.id(req.params.itemId);
    if (!item) {
      console.log('🔴 Item not found:', req.params.itemId);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    console.log('🔵 Found item:', { title: item.title, currentFolders: item.folders });

    // Update item fields with status and progress mapping
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        if (key === 'status') {
          item[key] = mapToWatchlistStatus(req.body[key], item.type);
        } else if (key === 'progress') {
          item[key] = parseProgress(req.body[key]);
        } else {
          item[key] = req.body[key];
        }
      }
    });

    item.lastUpdated = new Date();
    
    console.log('🔵 Updated item before save:', { title: item.title, folders: item.folders });
    
    await watchlist.save();
    
    console.log('🟢 Item updated successfully');

    res.json({
      success: true,
      message: 'Item updated successfully',
      item
    });

  } catch (error) {
    console.error('🔴 Update Watchlist item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating item'
    });
  }
});

// @route   DELETE /api/Watchlist/items/:itemId
// @desc    Remove item from Watchlist
// @access  Private
router.delete('/items/:itemId', auth, async (req, res) => {
  try {
    console.log('DELETE request for item ID:', req.params.itemId);    
    const watchlist = await Watchlist.findOne({ userId: req.user.id });
    
    if (!watchlist) {
      console.log('Watchlist not found for user:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    console.log('Watchlist found with items:', watchlist.items.length);
    console.log('Item IDs in Watchlist:', watchlist.items.map(item => item._id.toString()));

    const item = watchlist.items.id(req.params.itemId);
    if (!item) {
      console.log('Item not found with ID:', req.params.itemId);
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    console.log('Item found, removing:', item.title);
    watchlist.items.pull(req.params.itemId);
    await watchlist.save();

    res.json({
      success: true,
      message: 'Item removed from Watchlist successfully'
    });

  } catch (error) {
    console.error('Remove from Watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing item'
    });
  }
});

// @route   POST /api/Watchlist/folders
// @desc    Create custom folder
// @access  Private
router.post('/folders', auth, [
  body('name', 'Folder name is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }    let watchlist = await Watchlist.findOne({ userId: req.user.id });
    
    if (!watchlist) {
      watchlist = new Watchlist({
        userId: req.user.id,
        items: [],
        customFolders: []
      });
    }

    // Check if folder already exists
    const existingFolder = watchlist.customFolders.find(folder => 
      folder.name === req.body.name
    );

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: 'Folder with this name already exists'
      });
    }

    const newFolder = {
      name: req.body.name,
      isShared: req.body.isShared || false,
      shareUrl: req.body.shareUrl || ''
    };    watchlist.customFolders.push(newFolder);
    await watchlist.save();

    res.json({
      success: true,
      message: 'Folder created successfully',
      folder: newFolder
    });

  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating folder'
    });
  }
});

// @route   PUT /api/Watchlist/folders/:folderId
// @desc    Update custom folder
// @access  Private
router.put('/folders/:folderId', auth, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({ userId: req.user.id });
    
    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    const folder = watchlist.customFolders.id(req.params.folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Update folder fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        folder[key] = req.body[key];
      }
    });

    await watchlist.save();

    res.json({
      success: true,
      message: 'Folder updated successfully',
      folder
    });

  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating folder'
    });
  }
});

// @route   DELETE /api/Watchlist/folders/:folderId
// @desc    Delete custom folder
// @access  Private
router.delete('/folders/:folderId', auth, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({ userId: req.user.id });
    
    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    const folder = watchlist.customFolders.id(req.params.folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Remove folder from items that reference it
    watchlist.items.forEach(item => {
      item.folders = item.folders.filter(folderName => folderName !== folder.name);
    });

    watchlist.customFolders.pull(req.params.folderId);
    await watchlist.save();

    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });

  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting folder'
    });
  }
});

// @route   POST /api/Watchlist/folders/:folderId/share
// @desc    Share custom folder (generate share URL)
// @access  Private
router.post('/folders/:folderId/share', auth, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({ userId: req.user.id });
    
    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist not found'
      });
    }

    const folder = watchlist.customFolders.id(req.params.folderId);
    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }    // Generate share URL - should point to client application, not server
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const shareUrl = `${clientUrl}/shared/${encodeURIComponent(folder.name)}/${req.user.id}`;
    
    // Update folder with share information
    folder.isShared = true;
    folder.shareUrl = shareUrl;
    
    await watchlist.save();

    res.json({
      success: true,
      shareUrl: shareUrl,
      message: 'Custom folder shared successfully'
    });

  } catch (error) {
    console.error('Share folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sharing folder'
    });
  }
});

// @route   GET /api/Watchlist/shared/:folderIdOrName/:userId?
// @desc    Get shared folder content (supports both custom folders and default media types)
// @access  Public
router.get('/shared/:folderIdOrName/:userId?', async (req, res) => {
  try {
    const folderIdOrName = decodeURIComponent(req.params.folderIdOrName);
    const userId = req.params.userId;
    const defaultMediaTypes = ['Movies', 'TV Shows', 'Web Series', 'Anime', 'Games'];
    
    console.log('Shared folder request:', { folderIdOrName, userId }); // Debug log
    
    // Check if this is a default media type folder
    if (defaultMediaTypes.includes(folderIdOrName)) {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required for sharing default folders'        });
      }      // For default folders, find the specific user's Watchlist and user info
      const watchlist = await Watchlist.findOne({ userId: userId }).populate('userId', 'name email');
      
      console.log('Watchlist found:', watchlist ? 'Yes' : 'No'); // Debug log
      console.log('User populated:', watchlist?.userId); // Debug log
      
      if (!watchlist) {
        return res.status(404).json({
          success: false,
          message: 'Watchlist not found for this user'
        });
      }
      
      // Get items that match the media type
      const folderItems = watchlist.items.filter(item => 
        item.type === folderIdOrName
      );
      
      res.json({
        success: true,
        folder: {
          name: folderIdOrName,
          isShared: true,
          type: 'default'
        },
        items: folderItems,
        user: {
          name: watchlist.userId?.name || 'Anonymous User',
          email: watchlist.userId?.email
        },
        sharedDate: new Date().toISOString(),
        message: `Shared ${folderIdOrName} folder loaded successfully`
      });        } else {
      // Handle custom folder sharing - find by folder name, not ID
      const watchlist = await Watchlist.findOne({ 
        userId: userId,
        'customFolders.name': folderIdOrName,
        'customFolders.isShared': true 
      }).populate('userId', 'name email');
      
      if (!watchlist) {
        return res.status(404).json({
          success: false,
          message: 'Shared folder not found or no longer shared'
        });
      }
      
      // Find the specific folder by name
      const folder = watchlist.customFolders.find(f => f.name === folderIdOrName);
      if (!folder || !folder.isShared) {
        return res.status(404).json({
          success: false,
          message: 'Shared folder not found or no longer shared'
        });
      }
      
      // Get items that belong to this folder
      const folderItems = watchlist.items.filter(item => 
        item.folders.includes(folder.name)
      );
      
      res.json({
        success: true,
        folder: {
          name: folder.name,
          isShared: folder.isShared,
          createdDate: folder.createdDate,
          type: 'custom'
        },
        items: folderItems,        user: {
          name: watchlist.userId?.name || 'Anonymous User',
          email: watchlist.userId?.email
        },
        sharedDate: folder.createdDate || new Date().toISOString(),
        message: 'Shared folder loaded successfully'
      });
    }
    
  } catch (error) {
    console.error('Get shared folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while loading shared folder'
    });
  }
});

module.exports = router;
