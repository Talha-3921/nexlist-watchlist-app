// Activity logging service
class ActivityService {
  constructor() {
    this.activities = this.loadActivities();
  }

  // Load activities from localStorage
  loadActivities() {
    try {
      const stored = localStorage.getItem('userActivities');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading activities:', error);
      return [];
    }
  }

  // Save activities to localStorage
  saveActivities() {
    try {
      localStorage.setItem('userActivities', JSON.stringify(this.activities));
    } catch (error) {
      console.error('Error saving activities:', error);
    }
  }

  // Add new activity
  logActivity(type, title, details = {}) {
    const activity = {
      id: Date.now() + Math.random(),
      type,
      title,
      details,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    this.activities.unshift(activity); // Add to beginning
    
    // Keep only last 100 activities to prevent storage bloat
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100);
    }

    this.saveActivities();
    return activity;
  }

  // Get all activities
  getAllActivities() {
    return this.activities;
  }

  // Get recent activities (last n activities)
  getRecentActivities(limit = 10) {
    return this.activities.slice(0, limit);
  }

  // Get activities by type
  getActivitiesByType(type) {
    return this.activities.filter(activity => activity.type === type);
  }

  // Clear all activities
  clearActivities() {
    this.activities = [];
    this.saveActivities();
  }

  // Activity type constants
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

  // Helper methods for common activities
  logWatchlistAdd(mediaTitle, mediaType) {
    return this.logActivity(
      ActivityService.TYPES.Watchlist_ADD,
      `Added "${mediaTitle}" to Watchlist`,
      { mediaTitle, mediaType }
    );
  }

  logWatchlistRemove(mediaTitle, mediaType) {
    return this.logActivity(
      ActivityService.TYPES.Watchlist_REMOVE,
      `Removed "${mediaTitle}" from Watchlist`,
      { mediaTitle, mediaType }
    );
  }

  logFolderCreate(folderName) {
    return this.logActivity(
      ActivityService.TYPES.FOLDER_CREATE,
      `Created folder "${folderName}"`,
      { folderName }
    );
  }

  logFolderDelete(folderName) {
    return this.logActivity(
      ActivityService.TYPES.FOLDER_DELETE,
      `Deleted folder "${folderName}"`,
      { folderName }
    );
  }

  logFolderRename(oldName, newName) {
    return this.logActivity(
      ActivityService.TYPES.FOLDER_RENAME,
      `Renamed folder "${oldName}" to "${newName}"`,
      { oldName, newName }
    );
  }

  logFolderShare(folderName, shareId) {
    return this.logActivity(
      ActivityService.TYPES.FOLDER_SHARE,
      `Shared folder "${folderName}"`,
      { folderName, shareId }
    );
  }

  logProfileUpdate(changes) {
    return this.logActivity(
      ActivityService.TYPES.PROFILE_UPDATE,
      `Updated profile information`,
      { changes }
    );
  }

  logPasswordChange() {
    return this.logActivity(
      ActivityService.TYPES.PASSWORD_CHANGE,
      `Changed account password`,
      {}
    );
  }

  logLogin() {
    return this.logActivity(
      ActivityService.TYPES.LOGIN,
      `Logged in`,
      {}
    );
  }

  logLogout() {
    return this.logActivity(
      ActivityService.TYPES.LOGOUT,
      `Logged out`,
      {}
    );
  }

  logMediaRate(mediaTitle, rating) {
    return this.logActivity(
      ActivityService.TYPES.MEDIA_RATE,
      `Rated "${mediaTitle}" ${rating}/10`,
      { mediaTitle, rating }
    );
  }

  logMediaStatusChange(mediaTitle, oldStatus, newStatus) {
    return this.logActivity(
      ActivityService.TYPES.MEDIA_STATUS_CHANGE,
      `Changed "${mediaTitle}" status from ${oldStatus} to ${newStatus}`,
      { mediaTitle, oldStatus, newStatus }
    );
  }
}

// Create singleton instance
const activityService = new ActivityService();

export default activityService;
