import { apiRequest } from './api';

// Cloud-based Activity logging service
// 
// Activity Types Supported:
// - Login/Logout activities
// - Watchlist add/remove/update activities  
// - Custom folder creation/deletion activities
// - Folder item add/remove/move activities
// - Profile updates (name, email, username, bio, avatar)
// - Password changes
// - Media rating and status changes
//
class CloudActivityService {  
  constructor() {
    this.baseURL = '/activities';
    this.localCache = [];
    this.currentUser = null;
    
    // Copy static TYPES to instance for easier access
    this.TYPES = CloudActivityService.TYPES;
  }

  // Set current user and load their cache
  setCurrentUser(user) {
    this.currentUser = user;
    this.localCache = this.loadLocalCache();
  }

  // Get cache key for current user
  getCacheKey() {
    return this.currentUser 
      ? `userActivitiesCache_${this.currentUser.id || this.currentUser._id}`
      : 'userActivitiesCache';
  }

  // Helper method to make API calls
  async makeRequest(method, endpoint, data = null) {
    const options = {
      method: method,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    return await apiRequest(endpoint, options);
  }

  // API helper methods
  async post(endpoint, data) {
    return await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async get(endpoint) {
    return await apiRequest(endpoint, {
      method: 'GET'
    });
  }

  async delete(endpoint) {
    return await apiRequest(endpoint, {
      method: 'DELETE'
    });
  }
  // Load local cache from localStorage (fallback for offline mode)
  loadLocalCache() {
    try {
      const cacheKey = this.getCacheKey();
      const stored = localStorage.getItem(cacheKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading activity cache:', error);
      return [];
    }
  }

  // Save to local cache
  saveToLocalCache(activities) {
    try {
      const cacheKey = this.getCacheKey();
      localStorage.setItem(cacheKey, JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving activity cache:', error);
    }
  }

  // Log activity to cloud
  async logActivity(type, title, details = {}) {
    const activity = {
      type,
      title,
      details,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'      })
    };

    try {
      // Try to log to cloud first
      console.log('🔵 Making API call to log activity:', { type, title, details });
      const response = await this.makeRequest('POST', this.baseURL, activity);
      console.log('🟢 API Response:', response);
      
      if (response.success) {
        // Update local cache with the activity from server
        const serverActivity = {
          ...response.activity,
          id: response.activity._id, // Use MongoDB _id as id
          date: new Date(response.activity.timestamp).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
        
        this.localCache.unshift(serverActivity);
        
        // Keep only last 50 in cache
        if (this.localCache.length > 50) {
          this.localCache = this.localCache.slice(0, 50);
        }
        
        this.saveToLocalCache(this.localCache);
        console.log('🟢 Activity logged to cloud successfully');
        return serverActivity;
      }
    } catch (error) {
      console.error('Failed to log activity to cloud:', error);
      
      // Fallback: save to local cache if cloud fails
      const localActivity = {
        id: Date.now() + Math.random(),
        ...activity,
        synced: false // Mark as not synced
      };
      
      this.localCache.unshift(localActivity);
      if (this.localCache.length > 50) {
        this.localCache = this.localCache.slice(0, 50);
      }
      
      this.saveToLocalCache(this.localCache);
      return localActivity;
    }
  }  // Get all activities (try cloud first, fallback to cache)
  async getAllActivities(limit = 20) {
    try {
      console.log('🔵 Fetching activities from cloud, limit:', limit);
      const response = await this.makeRequest('GET', `${this.baseURL}?limit=${limit}`);
      console.log('🟢 Activities response:', response);
      
      if (response.success) {
        const activities = response.activities.map(activity => ({
          ...activity,
          id: activity._id, // Use MongoDB _id as id
          date: new Date(activity.timestamp).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }));
        
        // Update local cache
        this.localCache = activities;
        this.saveToLocalCache(this.localCache);
          console.log('🟢 Activities fetched and cached:', activities.length);
        return activities;
      }
    } catch (error) {
      console.error('🔴 Failed to fetch activities from cloud:', error);
    }
    
    // Fallback to local cache
    console.log('🟡 Using local cache fallback, activities:', this.localCache.length);
    return this.localCache.slice(0, limit);
  }

  // Get recent activities
  async getRecentActivities(limit = 10) {
    const activities = await this.getAllActivities(limit);
    return activities.slice(0, limit);
  }
  // Get activities by type
  async getActivitiesByType(type) {
    const activities = await this.getAllActivities(100);
    return activities.filter(activity => activity.type === type);
  }

  // Clear all activities
  async clearActivities() {
    try {
      const response = await this.makeRequest('DELETE', this.baseURL);
      
      if (response.success) {
        this.localCache = [];
        this.saveToLocalCache(this.localCache);
        return true;
      }
    } catch (error) {
      console.error('Failed to clear activities from cloud:', error);
    }
    
    // Clear local cache anyway
    this.localCache = [];
    this.saveToLocalCache(this.localCache);
    return false;
  }

  // Sync unsynced local activities to cloud (for offline support)
  async syncLocalActivities() {
    const unsyncedActivities = this.localCache.filter(activity => !activity.synced);
    
    for (const activity of unsyncedActivities) {
      try {
        await this.logActivity(activity.type, activity.title, activity.details);
      } catch (error) {
        console.error('Failed to sync activity:', error);
      }
    }
  }
  // Initialize activities for logged-in user
  async initializeActivities(user = null) {
    try {
      if (user) {
        this.setCurrentUser(user);
      }
      
      console.log('🔵 Initializing activities for user...');
      const activities = await this.getAllActivities(50);
      console.log('🟢 Activities initialized:', activities.length);
      return activities;
    } catch (error) {
      console.error('🔴 Failed to initialize activities:', error);
      return this.localCache;
    }
  }

  // Clear user-specific cache
  clearUserCache() {
    if (this.currentUser) {
      const cacheKey = this.getCacheKey();
      localStorage.removeItem(cacheKey);
      this.localCache = [];
      this.currentUser = null;
    }
  }

  // Activity type constants (same as before)
  static TYPES = {
    // Watchlist actions
    Watchlist_ADD: 'Watchlist_add',
    Watchlist_REMOVE: 'Watchlist_remove',
    Watchlist_UPDATE: 'Watchlist_update',
    
    // Folder actions
    FOLDER_CREATE: 'folder_create',
    FOLDER_DELETE: 'folder_delete',
    FOLDER_RENAME: 'folder_rename',
    FOLDER_SHARE: 'folder_share',
    FOLDER_UNSHARE: 'folder_unshare',
    
    // Profile actions
    PROFILE_UPDATE: 'profile_update',
    PASSWORD_CHANGE: 'password_change',
    
    // Authentication actions
    LOGIN: 'login',
    LOGOUT: 'logout',
    
    // Media actions
    MEDIA_RATE: 'media_rate',
    MEDIA_STATUS_CHANGE: 'media_status_change',
    
    // System actions
    ACCOUNT_CREATE: 'account_create',
    SETTINGS_UPDATE: 'settings_update'
  };

  // Helper methods for common activities (same as before)
  async logWatchlistAdd(mediaTitle, mediaType) {
    return await this.logActivity(
      CloudActivityService.TYPES.Watchlist_ADD,
      `Added "${mediaTitle}" to Watchlist`,
      { mediaTitle, mediaType }
    );
  }

  async logWatchlistRemove(mediaTitle, mediaType) {
    return await this.logActivity(
      CloudActivityService.TYPES.Watchlist_REMOVE,
      `Removed "${mediaTitle}" from Watchlist`,
      { mediaTitle, mediaType }
    );
  }

  async logFolderCreate(folderName) {
    return await this.logActivity(
      CloudActivityService.TYPES.FOLDER_CREATE,
      `Created folder "${folderName}"`,
      { folderName }
    );
  }

  async logFolderDelete(folderName) {
    return await this.logActivity(
      CloudActivityService.TYPES.FOLDER_DELETE,
      `Deleted folder "${folderName}"`,
      { folderName }
    );
  }

  async logFolderRename(oldName, newName) {
    return await this.logActivity(
      CloudActivityService.TYPES.FOLDER_RENAME,
      `Renamed folder "${oldName}" to "${newName}"`,
      { oldName, newName }
    );
  }

  async logFolderShare(folderName, shareId) {
    return await this.logActivity(
      CloudActivityService.TYPES.FOLDER_SHARE,
      `Shared folder "${folderName}"`,
      { folderName, shareId }
    );
  }

  async logProfileUpdate(changes) {
    return await this.logActivity(
      CloudActivityService.TYPES.PROFILE_UPDATE,
      `Updated profile information`,
      { changes }
    );
  }

  async logPasswordChange() {
    return await this.logActivity(
      CloudActivityService.TYPES.PASSWORD_CHANGE,
      `Changed account password`,
      {}
    );
  }

  async logLogin() {
    return await this.logActivity(
      CloudActivityService.TYPES.LOGIN,
      `Logged in`,
      {}
    );
  }

  async logLogout() {
    return await this.logActivity(
      CloudActivityService.TYPES.LOGOUT,
      `Logged out`,
      {}
    );
  }

  async logMediaRate(mediaTitle, rating) {
    return await this.logActivity(
      CloudActivityService.TYPES.MEDIA_RATE,
      `Rated "${mediaTitle}" ${rating}/10`,
      { mediaTitle, rating }
    );
  }

  async logMediaStatusChange(mediaTitle, oldStatus, newStatus) {
    return await this.logActivity(
      CloudActivityService.TYPES.MEDIA_STATUS_CHANGE,
      `Changed "${mediaTitle}" status from ${oldStatus} to ${newStatus}`,
      { mediaTitle, oldStatus, newStatus }
    );
  }

  // Additional helper methods for specific profile updates
  async logAvatarUpdate() {
    return await this.logActivity(
      CloudActivityService.TYPES.PROFILE_UPDATE,
      `Updated profile avatar`,
      { changeType: 'avatar' }
    );
  }

  async logProfileFieldUpdate(fieldName, newValue) {
    const fieldDisplayNames = {
      name: 'display name',
      username: 'username',
      email: 'email address',
      bio: 'bio'
    };

    const displayName = fieldDisplayNames[fieldName] || fieldName;
    
    return await this.logActivity(
      CloudActivityService.TYPES.PROFILE_UPDATE,
      `Updated ${displayName}`,
      { changeType: fieldName, fieldName: displayName }
    );
  }

  // Enhanced folder activity logging
  async logFolderItemAdd(itemTitle, folderName) {
    return await this.logActivity(
      CloudActivityService.TYPES.Watchlist_UPDATE,
      `Added "${itemTitle}" to "${folderName}" folder`,
      { itemTitle, folderName, action: 'add_to_folder' }
    );
  }

  async logFolderItemRemove(itemTitle, folderName) {
    return await this.logActivity(
      CloudActivityService.TYPES.Watchlist_UPDATE,
      `Removed "${itemTitle}" from "${folderName}" folder`,
      { itemTitle, folderName, action: 'remove_from_folder' }
    );
  }

  async logFolderItemMove(itemTitle, fromFolder, toFolder) {
    return await this.logActivity(
      CloudActivityService.TYPES.Watchlist_UPDATE,
      `Moved "${itemTitle}" from "${fromFolder}" to "${toFolder}" folder`,
      { itemTitle, fromFolder, toFolder, action: 'move_between_folders' }
    );
  }
}

// Create singleton instance
const cloudActivityService = new CloudActivityService();

// Ensure TYPES is properly set on the instance
cloudActivityService.TYPES = CloudActivityService.TYPES;

export default cloudActivityService;
export { CloudActivityService };
