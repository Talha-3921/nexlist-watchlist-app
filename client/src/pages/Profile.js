import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { getWatchlist } from '../services/watchlistService';
import { updateProfile } from '../services/authService';
import activityService from '../services/cloudActivityService';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import BarChartIcon from '@mui/icons-material/BarChart';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import PieChartIcon from '@mui/icons-material/PieChart';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// Function to calculate user stats from Watchlist
const calculateUserStats = async (Watchlist) => {
  if (!Array.isArray(Watchlist) || Watchlist.length === 0) {
    return {
      totalWatched: 0,
      byType: {},
      byStatus: {},
      byGenre: {},
      recentActivity: []
    };
  }

  const totalWatched = Watchlist.length;
  
  const byType = {};
  const byStatus = {};
  const byGenre = {};
  
  Watchlist.forEach(item => {
    // Count by type
    if (item.type) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }
    
    // Count by status
    if (item.status) {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    }
    
    // Count by genre (handle both string and array formats)
    if (item.genre) {
      let genres = [];
      
      if (Array.isArray(item.genre)) {
        // If genre is already an array
        genres = item.genre;
      } else if (typeof item.genre === 'string') {
        // If genre is a string with comma-separated values
        genres = item.genre.split(',').map(g => g.trim());
      }
      
      genres.forEach(genre => {
        if (genre && genre.trim()) { // Only count non-empty genres
          byGenre[genre.trim()] = (byGenre[genre.trim()] || 0) + 1;
        }
      });
    }  });
    // Get recent activity from activity service instead of just Watchlist additions
  const recentActivity = await activityService.getRecentActivities(10);
  
  return {
    totalWatched,
    byType,
    byStatus,
    byGenre,
    recentActivity
  };
};

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, isAuthenticated, isLoading, logout, changePassword, updateUser } = useAuth();
  
  // State declarations
  const [user, setUser] = useState({
    name: '',
    email: '',
    bio: '',
    avatar: null,
    username: '',
    joinDate: new Date().toISOString().split('T')[0]
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({...user});
  const [activeTab, setActiveTab] = useState('profile');
  const [stats, setStats] = useState({
    totalWatched: 0,
    byType: {},
    byStatus: {},
    byGenre: {},
    recentActivity: []
  });
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  // Update user state when authUser changes
  useEffect(() => {
    if (authUser) {
      const updatedUser = {
        name: authUser.name || '',
        email: authUser.email || '',
        bio: authUser.bio || '',
        avatar: authUser.avatar || null,
        username: authUser.username || authUser.email?.split('@')[0] || '',
        joinDate: authUser.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
      };
      setUser(updatedUser);
      setEditedUser(updatedUser);
    }
  }, [authUser]);// Load user-specific stats
  useEffect(() => {
    if (authUser) {
      const loadUserStats = async () => {
        try {
          const userWatchlist = await getWatchlist();
          const userStats = await calculateUserStats(userWatchlist);
          setStats(userStats);
        } catch (error) {
          console.error('Error loading user stats:', error);
          const fallbackStats = await calculateUserStats([]);
          setStats(fallbackStats);
        }
      };

      loadUserStats();
    }
  }, [authUser]);
  // Check if user is logged in (handled by useAuth hook above)
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditedUser({...user});
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };  const handleSave = async () => {
    // Validate the form
    if (!editedUser.name.trim() || !editedUser.email.trim() || !editedUser.username.trim()) {
      toast.error('All fields are required');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedUser.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      // Check what changed and log specific activities
      const changes = [];
      if (user.name !== editedUser.name) {
        changes.push('name');
        await activityService.logProfileFieldUpdate('name', editedUser.name);
      }
      if (user.email !== editedUser.email) {
        changes.push('email');
        await activityService.logProfileFieldUpdate('email', editedUser.email);
      }
      if (user.username !== editedUser.username) {
        changes.push('username');
        await activityService.logProfileFieldUpdate('username', editedUser.username);
      }
      if (user.bio !== editedUser.bio) {
        changes.push('bio');
        await activityService.logProfileFieldUpdate('bio', editedUser.bio);
      }
      if (user.avatar !== editedUser.avatar) {
        changes.push('avatar');
        await activityService.logAvatarUpdate();
      }
      
      // Call the API to update the profile in the database
      const result = await updateProfile({
        name: editedUser.name,
        email: editedUser.email,
        username: editedUser.username,
        bio: editedUser.bio,
        avatar: editedUser.avatar
      });
        if (result.success) {
        // Update local state with the response from the server
        setUser(result.user);
        // Also update the auth context
        updateUser(result.user);
        setIsEditing(false);
        
        // Log general profile update activity
        if (changes.length > 0) {
          await activityService.logProfileUpdate(changes);
        }
        
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('An error occurred while updating profile');
    }
  };
    const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser({...editedUser, [name]: value});
  };

  // Password change handlers
  const handleChangePassword = () => {
    setIsChangingPassword(true);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({...passwordData, [name]: value});
  };
  const handlePasswordSave = async () => {
    // Validate password fields
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    // Check if new password meets requirements
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    // Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }    try {
      // Call the actual changePassword function
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      if (result.success) {
        // Log password change activity
        activityService.logPasswordChange();
        
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success(result.message || 'Password changed successfully');
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('An error occurred while changing password');
    }
  };

  const handlePasswordCancel = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.info('Logged out successfully');
      navigate('/login');
    }
  };return (
    <div className="profile-container">
      {isLoading ? (
        <div className="loading-container" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto' }}>Loading...</div>
        </div>
      ) : (
      <div className="profile-content">
        {/* Profile Header */}
        <div className="profile-header">
          <img 
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random&color=fff&size=128`} 
            alt="User Avatar" 
            className="user-avatar" 
          />
          <h2>{user.name || 'User'}</h2>
          <p>@{user.username || 'username'}</p>
        </div>{/* Navigation Tabs */}
        <div className="section-header">
          <div className="profile-nav">
            <button 
              className={`profile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <EditIcon /> Profile Settings
            </button>
            <button 
              className={`profile-nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChartIcon /> Media Stats
            </button>
            <button 
              className={`profile-nav-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <EqualizerIcon /> Recent Activity
            </button>
          </div>
        </div>
        
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="section-header">
              <h1>Profile Settings</h1>
              {!isEditing ? (
                <button className="edit-btn" onClick={handleEdit}>
                  <EditIcon /> Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="cancel-btn" onClick={handleCancel}>
                    <CancelIcon /> Cancel
                  </button>
                  <button className="save-btn" onClick={handleSave}>
                    <SaveIcon /> Save Changes
                  </button>
                </div>
              )}
            </div>
              <div className="profile-form">
              <div className="form-fields-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="name"
                      value={editedUser.name}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p>{user.name}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  {isEditing ? (
                    <input 
                      type="email" 
                      name="email"
                      value={editedUser.email}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p>{user.email}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Username</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="username"
                      value={editedUser.username}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p>@{user.username}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Member Since</label>
                  <p>{new Date(user.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                {isEditing && (                  <div className="form-group">
                    <label>Avatar URL</label>
                    <input 
                      type="text" 
                      name="avatar"
                      value={editedUser.avatar || ''}
                      onChange={handleInputChange}
                      placeholder="Enter a URL for your profile picture"
                    />
                    <p className="field-hint">Enter a URL for your profile picture</p>
                  </div>
                )}
                  {isEditing && (
                  <div className="form-group">
                    <label>Password</label>
                    <button className="change-password-btn" onClick={handleChangePassword}>
                      <LockIcon /> Change Password
                    </button>
                  </div>
                )}
              </div>
            </div>          </div>
        )}

        {/* Password Change Modal */}
        {isChangingPassword && (
          <div className="password-modal-overlay">
            <div className="password-modal">
              <div className="modal-header">
                <h2><LockIcon /> Change Password</h2>
                <button className="modal-close-btn" onClick={handlePasswordCancel}>
                  <CancelIcon />
                </button>
              </div>
              
              <div className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>
                  <p className="field-hint">Password must be at least 6 characters long</p>
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </button>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="cancel-btn" onClick={handlePasswordCancel}>
                    <CancelIcon /> Cancel
                  </button>
                  <button className="save-btn" onClick={handlePasswordSave}>
                    <SaveIcon /> Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="stats-section">
            <div className="section-header">
              <h1>Media Statistics</h1>
            </div>
              <div className="stats-summary">
              <div className="stat-card">
                <div className="stat-value">{stats.totalWatched}</div>
                <div className="stat-label">Total Media Tracked</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.byStatus?.Completed || 0}</div>
                <div className="stat-label">Completed</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.byStatus?.Watching || 0}</div>
                <div className="stat-label">Currently Watching</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{stats.byStatus?.['Plan to Watch'] || 0}</div>
                <div className="stat-label">Plan to Watch</div>
              </div>
            </div>
            
            <div className="stats-charts">
              <div className="stats-chart-container">
                <h2>
                  <PieChartIcon /> By Media Type
                </h2>                <div className="stats-breakdown">
                  {Object.entries(stats.byType || {}).map(([type, count]) => (
                    <div key={type} className="breakdown-item">
                      <div className="breakdown-label">{type}</div>
                      <div className="breakdown-bar-container">
                        <div 
                          className="breakdown-bar"
                          style={{ 
                            width: `${stats.totalWatched > 0 ? (count / stats.totalWatched) * 100 : 0}%`,
                            backgroundColor: type === 'Movie' ? '#e50914' : 
                                           type === 'Web Series' ? '#0077b6' : 
                                           type === 'Anime' ? '#ffb703' : 
                                           '#4caf50'
                          }}
                        ></div>
                      </div>
                      <div className="breakdown-value">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="stats-chart-container">
                <h2>
                  <EqualizerIcon /> Top Genres
                </h2>                <div className="stats-breakdown">
                  {Object.entries(stats.byGenre || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([genre, count]) => {
                      const maxGenreCount = Math.max(...Object.values(stats.byGenre || {}));
                      return (
                        <div key={genre} className="breakdown-item">
                          <div className="breakdown-label">{genre}</div>
                          <div className="breakdown-bar-container">
                            <div 
                              className="breakdown-bar"
                              style={{ 
                                width: `${maxGenreCount > 0 ? (count / maxGenreCount) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                          <div className="breakdown-value">{count}</div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="activity-section">
            <div className="section-header">
              <h1>Recent Activity</h1>
            </div>              <div className="activity-list">
              {(stats.recentActivity || []).length > 0 ? (
                stats.recentActivity.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      <div className={`icon-circle ${activity.type}`}></div>
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.title}</div>
                      <div className="activity-date">{activity.date}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-activity">
                  <p>No recent activity. Start adding items to your Watchlist!</p>
                </div>
              )}
            </div>          </div>
        )}
      </div>
      )}    </div>
  );
}
