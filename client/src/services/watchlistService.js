// Watchlist service for managing user's Watchlist with MongoDB Atlas
import { apiRequest } from './api';
import { getCurrentUser } from './authService';

// Utility function to clean and prepare item data for server
const prepareItemForServer = (item) => {
  // Map client types to server expected types
  const typeMap = {
    'Movie': 'Movies',
    'TV Show': 'TV Shows',
    'Web Series': 'Web Series',
    'Anime': 'Anime',
    'Game': 'Games'
  };

  // Create a clean copy of the item
  const cleanItem = {
    title: item.title || '',
    type: typeMap[item.type] || item.type || '',
    // Don't send external API status - let server default to "Plan to Watch"
    // status: item.status || 'Plan to Watch',
    rating: item.rating || 0,
    poster: item.poster || item.image || '',
    releaseDate: item.releaseDate || '',
    genre: Array.isArray(item.genre) ? item.genre : [],
    description: item.description || '',
    notes: item.notes || '',
    folders: Array.isArray(item.folders) ? item.folders : [],
    progress: item.progress || { current: 0, total: 0 }
  };

  // Remove any undefined or null values
  Object.keys(cleanItem).forEach(key => {
    if (cleanItem[key] === undefined || cleanItem[key] === null) {
      delete cleanItem[key];
    }
  });

  return cleanItem;
};

// Get current Watchlist from cloud
export const getWatchlist = async () => {
  try {
    // Get the token
    const token = localStorage.getItem('Watchlist-auth-token');
    if (!token) {
      console.error('No authentication token found');
      return [];
    }
      const response = await apiRequest('/watchlist');
    
    // Add more detailed logging
    console.log('Raw response from /watchlist:', response);
    
    if (response.success && response.watchlist) {
      const items = response.watchlist.items || [];
      console.log('Fetched Watchlist items:', items); // Debug log
      return items;
    }
    
    // Log why we're failing
    console.error('API request to /watchlist failed with response:', response);
    throw new Error(response.message || 'Failed to fetch Watchlist: Unexpected response structure');
  } catch (error) {
    console.error('Error fetching Watchlist:', error);
    throw error;
  }
};

// Get custom folders from cloud
export const getCustomFolders = async () => {
  try {
    // Get the token
    const token = localStorage.getItem('Watchlist-auth-token');
    if (!token) {
      console.error('No authentication token found for custom folders');
      return [];
    }
      const response = await apiRequest('/watchlist');
    
    // Add more detailed logging
    console.log('Raw response for custom folders:', response);
    
    if (response.success && response.watchlist) {
      return response.watchlist.customFolders || [];
    }
    
    // Log why we're failing
    console.error('API request for custom folders failed with response:', response);
    throw new Error(response.message || 'Failed to fetch custom folders: Unexpected response structure');
  } catch (error) {
    console.error('Error fetching custom folders:', error);
    throw error;
  }
};

// Add item to Watchlist
export const addToWatchlist = async (item) => {
  try {
    // Prepare and clean the item data
    const cleanItem = prepareItemForServer(item);
    
    console.log('Adding to Watchlist:', cleanItem); // Debug log
    
    const response = await apiRequest('/watchlist/items', {
      method: 'POST',
      body: JSON.stringify(cleanItem)
    });

    if (response.success) {
      return {
        success: true,
        message: response.message,
        item: response.item
      };
    }

    return {
      success: false,
      message: response.message
    };
    
  } catch (error) {
    console.error('Error adding to Watchlist:', error);
    return {
      success: false,
      message: error.message || 'Failed to add item to Watchlist'
    };
  }
};

// Remove item from Watchlist
export const removeFromWatchlist = async (itemId) => {
  try {    console.log('Removing item from Watchlist with ID:', itemId);
    
    const response = await apiRequest(`/watchlist/items/${itemId}`, {
      method: 'DELETE'
    });

    console.log('Remove from Watchlist response:', response);

    if (response.success) {
      return {
        success: true,
        message: response.message
      };
    }

    return {
      success: false,
      message: response.message
    };
    
  } catch (error) {
    console.error('Error removing from Watchlist:', error);
    return {
      success: false,
      message: error.message || 'Failed to remove item from Watchlist'
    };
  }
};

// Update Watchlist item
export const updateWatchlistItem = async (itemId, updateData) => {
  try {
    // Normalize progress data if needed
    if (updateData.progress) {
      if (updateData.progress === 'Completed') {
        // Keep as is
      } else if (typeof updateData.progress === 'string' && updateData.progress.includes('/')) {
        // Parse the string format (e.g., "5/10") into an object
        const [current, total] = updateData.progress.split('/').map(val => parseInt(val.trim()) || 0);
        updateData.progress = { current, total };
      } else if (typeof updateData.progress === 'string') {
        // If it's a custom string, leave as is
      }
    }
    
    console.log('🔵 updateWatchlistItem called:', { itemId, updateData });
    const response = await apiRequest(`/watchlist/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });console.log('🔵 updateWatchlistItem response:', response);
    console.log('🔵 Response success status:', response?.success);
    console.log('🔵 Response success type:', typeof response?.success);

    if (response.success) {
      console.log('🟢 Returning success from updateWatchlistItem');
      return {
        success: true,
        message: response.message,
        item: response.item
      };
    }

    console.log('🔴 Returning failure from updateWatchlistItem');
    return {
      success: false,
      message: response.message
    };
    
  } catch (error) {
    console.error('Error updating Watchlist item:', error);
    return {
      success: false,
      message: error.message || 'Failed to update item'
    };
  }
};

// Create custom folder
export const createCustomFolder = async (folderData) => {
  try {
    const response = await apiRequest('/watchlist/folders', {
      method: 'POST',
      body: JSON.stringify(folderData)
    });

    if (response.success) {
      return {
        success: true,
        message: response.message,
        folder: response.folder
      };
    }

    return {
      success: false,
      message: response.message
    };
    
  } catch (error) {
    console.error('Error creating custom folder:', error);
    return {
      success: false,
      message: error.message || 'Failed to create folder'
    };
  }
};

// Update custom folder
export const updateCustomFolder = async (folderId, updateData) => {  try {
    const response = await apiRequest(`/watchlist/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    if (response.success) {
      return {
        success: true,
        message: response.message,
        folder: response.folder
      };
    }

    return {
      success: false,
      message: response.message
    };
    
  } catch (error) {
    console.error('Error updating custom folder:', error);
    return {
      success: false,
      message: error.message || 'Failed to update folder'
    };
  }
};

// Delete custom folder
export const deleteCustomFolder = async (folderId) => {  try {
    const response = await apiRequest(`/watchlist/folders/${folderId}`, {
      method: 'DELETE'
    });

    if (response.success) {
      return {
        success: true,
        message: response.message
      };
    }

    return {
      success: false,
      message: response.message
    };
    
  } catch (error) {
    console.error('Error deleting custom folder:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete folder'
    };
  }
};

// Share folder (generate share URL)
export const shareFolder = async (folderIdOrName) => {
  try {
    // Check if this is a default folder (Movies, Anime, etc.) or custom folder ID
    const defaultFolders = ['Movies', 'TV Shows', 'Web Series', 'Anime', 'Games'];
      if (defaultFolders.includes(folderIdOrName)) {
      // For default folders, we need to include the current user in the URL
      try {
        const userResult = await getCurrentUser();
        if (!userResult.success || !userResult.user || !userResult.user._id) {
          return {
            success: false,
            message: 'Unable to get user information for sharing. Please make sure you are logged in.'
          };
        }

        const shareUrl = `${window.location.origin}/shared/${encodeURIComponent(folderIdOrName)}/${userResult.user._id}`;
        
        // For default folders, we don't need to update any custom folder record
        // Just return the share URL
        return {
          success: true,
          shareUrl: shareUrl,
          message: 'Folder shared successfully'
        };
      } catch (error) {
        console.error('Error getting current user for sharing:', error);
        return {
          success: false,
          message: 'Failed to get user information for sharing'
        };
      }    } else {
      // For custom folders, first get the folder ID by name, then share it
      try {
        // Get all custom folders to find the one with matching name
        const customFolders = await getCustomFolders();
        const folder = customFolders.find(f => f.name === folderIdOrName);
        
        if (!folder) {
          return {
            success: false,
            message: 'Custom folder not found'
          };
        }        // Use the folder ID to share
        const response = await apiRequest(`/watchlist/folders/${folder._id}/share`, {
          method: 'POST'
        });

        if (response.success) {
          return {
            success: true,
            shareUrl: response.shareUrl,
            message: response.message || 'Custom folder shared successfully'
          };
        }

        return {
          success: false,
          message: response.message || 'Failed to share custom folder'
        };
      } catch (error) {
        console.error('Error sharing custom folder:', error);
        return {
          success: false,
          message: 'Failed to share custom folder'
        };
      }
    }
    
  } catch (error) {
    console.error('Error sharing folder:', error);
    return {
      success: false,
      message: error.message || 'Failed to share folder'
    };
  }
};

// Get share URL for folder
export const getShareUrl = (folderId) => {
  return `${window.location.origin}/shared/${folderId}`;
};

// Get folder by name
export const getFolderByName = async (folderName) => {
  try {
    const response = await apiRequest('/watchlist');
      if (response.success && response.watchlist) {
      const watchlist = response.watchlist;
      const folder = watchlist.customFolders?.find(f => f.name === folderName);
      
      if (folder) {
        return {
          success: true,
          folder
        };
      }
      
      return {
        success: false,
        message: 'Folder not found'
      };
    }
    
    return {
      success: false,
      message: response.message || 'Failed to get folder information'
    };
    
  } catch (error) {
    console.error('Error getting folder by name:', error);
    return {
      success: false,
      message: error.message || 'Failed to get folder information'
    };
  }
};

// Get shared folder (public access)
export const getSharedFolder = async (folderId, userId = null) => {
  try {    const url = userId 
      ? `/watchlist/shared/${encodeURIComponent(folderId)}/${userId}`
      : `/watchlist/shared/${encodeURIComponent(folderId)}`;
      
    const response = await apiRequest(url);
    
    if (response.success) {
      return {
        success: true,
        folder: response.folder,
        items: response.items,
        user: response.user,
        sharedDate: response.sharedDate
      };
    }

    return {
      success: false,
      message: response.message
    };
    
  } catch (error) {
    console.error('Error fetching shared folder:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch shared folder'
    };
  }
};

// Search items in Watchlist
export const searchWatchlist = async (query) => {
  try {
    const items = await getWatchlist();
    
    if (!query) return items;
    
    const searchTerm = query.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.type.toLowerCase().includes(searchTerm) ||
      item.genre.some(g => g.toLowerCase().includes(searchTerm)) ||
      item.notes.toLowerCase().includes(searchTerm)
    );
    
  } catch (error) {
    console.error('Error searching Watchlist:', error);
    throw error;
  }
};

// Check if item is in Watchlist
export const isInWatchlist = async (item) => {
  try {
    const WatchlistItems = await getWatchlist();
    
    console.log('Checking if item is in Watchlist:', {
      title: item.title,
      type: item.type,
      WatchlistCount: WatchlistItems.length
    });
    
    // Map client type to server type for comparison
    const typeMap = {
      'Movie': 'Movies',
      'TV Show': 'TV Shows',
      'Web Series': 'Web Series',
      'Anime': 'Anime',
      'Game': 'Games'
    };
    
    const mappedType = typeMap[item.type] || item.type;
    
    console.log('Mapped type for comparison:', mappedType);
    console.log('Watchlist items:', WatchlistItems.map(wi => ({ title: wi.title, type: wi.type })));
    
    // Check if the item exists in the Watchlist based on title and type
    const found = WatchlistItems.some(WatchlistItem => 
      WatchlistItem.title === item.title && 
      WatchlistItem.type === mappedType
    );
    
    console.log('Item found in Watchlist:', found);
    return found;
    
  } catch (error) {
    console.error('Error checking if item is in Watchlist:', error);
    return false;
  }
};

// Get shared Watchlist (alias for getSharedFolder for backward compatibility)
export const getSharedWatchlist = async (shareId, userId = null) => {
  try {
    const result = await getSharedFolder(shareId, userId);
    
    if (result.success) {
      return {
        success: true,
        data: {
          folder: result.folder,
          items: result.items,
          user: result.user,
          sharedDate: result.sharedDate
        },
        message: 'Shared Watchlist loaded successfully'
      };
    }

    return {
      success: false,
      message: result.message || 'Failed to load shared Watchlist'
    };
    
  } catch (error) {
    console.error('Error fetching shared Watchlist:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch shared Watchlist'
    };
  }
};

// Get Watchlist statistics
export const getWatchlistStats = async () => {
  try {
    const items = await getWatchlist();
    
    const stats = {
      total: items.length,
      byStatus: {},
      byType: {},
      averageRating: 0,
      totalWatchTime: 0
    };

    items.forEach(item => {
      // Count by status
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
      
      // Count by type
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
        // Calculate average rating (only for rated items)
      if (item.rating > 0) {
        stats.averageRating += item.rating;
      }
    });

    // Calculate final average rating
    const ratedItems = items.filter(item => item.rating > 0);
    stats.averageRating = ratedItems.length > 0 
      ? (stats.averageRating / ratedItems.length).toFixed(1)
      : 0;

    return stats;
    
  } catch (error) {
    console.error('Error getting Watchlist stats:', error);
    throw error;
  }
};

const WatchlistService = {
  getWatchlist,
  getCustomFolders,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
  createCustomFolder,
  updateCustomFolder,
  deleteCustomFolder,
  shareFolder,
  getShareUrl,
  getFolderByName,
  getSharedFolder,
  getSharedWatchlist,
  isInWatchlist,
  searchWatchlist,
  getWatchlistStats
};

export default WatchlistService;
