// Cloud-based Authentication Service for Watchlist
// Manages user authentication with cloud backend (MongoDB Atlas)
import { apiRequest, getAuthToken, setAuthToken } from './api';

const AUTH_TOKEN_KEY = 'Watchlist-auth-token';
const CURRENT_USER_KEY = 'Watchlist-current-user';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} Registration result
 */
export const register = async (userData) => {
  try {
    const { name, email, password } = userData;
    
    // Validate input
    if (!name || !email || !password) {
      return {
        success: false,
        message: 'Please fill in all required fields'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long'
      };
    }

    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        password 
      })
    });

    if (response.success) {
      // Store authentication data
      setAuthToken(response.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
      
      return {
        success: true,
        message: response.message || 'Registration successful',
        user: response.user,
        token: response.token
      };
    }

    return {
      success: false,
      message: response.message || 'Registration failed'
    };
    
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.message || 'Registration failed. Please check your connection and try again.'
    };
  }
};

/**
 * Login user with credentials
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} Login result
 */
export const login = async (credentials) => {
  try {
    const { email, password } = credentials;
    
    // Validate input
    if (!email || !password) {
      return {
        success: false,
        message: 'Please enter both email and password'
      };
    }
    
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email: email.toLowerCase().trim(), 
        password 
      })
    });

    if (response.success) {
      // Store authentication data
      setAuthToken(response.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
      
      return {
        success: true,
        message: response.message || 'Login successful',
        user: response.user,
        token: response.token
      };
    }

    return {
      success: false,
      message: response.message || 'Invalid email or password'
    };
    
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.message || 'Login failed. Please check your connection and try again.'
    };
  }
};

/**
 * Logout current user
 * @returns {Object} Logout result
 */
export const logout = async () => {
  try {
    // Optional: Call server to invalidate token
    try {
      await apiRequest('/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      // Continue with local logout even if server call fails
      console.warn('Server logout failed, continuing with local logout:', error);
    }

    // Clear local authentication data
    setAuthToken(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Logout error:', error);
    
    // Force clear auth data even on error
    setAuthToken(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    
    return {
      success: false,
      message: 'Logout completed but with warnings'
    };
  }
};

/**
 * Get current user information from server
 * @returns {Promise<Object>} Current user data
 */
export const getCurrentUser = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found'
      };
    }

    const response = await apiRequest('/auth/me');

    if (response.success) {
      // Update stored user data
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
      
      return {
        success: true,
        user: response.user
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to get user information'
    };
    
  } catch (error) {
    console.error('Get current user error:', error);
    
    // If token is invalid, clear auth data
    if (error.message && error.message.includes('token')) {
      await logout();
    }
    
    return {
      success: false,
      message: 'Failed to authenticate. Please login again.'
    };
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Update result
 */
export const updateProfile = async (profileData) => {
  try {
    if (!profileData || Object.keys(profileData).length === 0) {
      return {
        success: false,
        message: 'No profile data provided'
      };
    }

    const response = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });

    if (response.success) {
      // Update stored user data
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
      
      return {
        success: true,
        message: response.message || 'Profile updated successfully',
        user: response.user
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to update profile'
    };
    
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: error.message || 'Profile update failed. Please try again.'
    };
  }
};

/**
 * Change user password
 * @param {Object} passwordData - Password change data
 * @param {string} passwordData.currentPassword - Current password
 * @param {string} passwordData.newPassword - New password
 * @returns {Promise<Object>} Password change result
 */
export const changePassword = async (passwordData) => {
  try {
    const { currentPassword, newPassword } = passwordData;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return {
        success: false,
        message: 'Please provide both current and new passwords'
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        message: 'New password must be at least 6 characters long'
      };
    }

    if (currentPassword === newPassword) {
      return {
        success: false,
        message: 'New password must be different from current password'
      };
    }
    
    const response = await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    return {
      success: response.success,
      message: response.message || (response.success ? 'Password changed successfully' : 'Failed to change password')
    };
    
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: error.message || 'Password change failed. Please try again.'
    };
  }
};

/**
 * Delete user account
 * @returns {Promise<Object>} Account deletion result
 */
export const deleteAccount = async () => {
  try {
    const response = await apiRequest('/auth/delete-account', {
      method: 'DELETE'
    });

    if (response.success) {
      // Clear auth data on successful deletion
      await logout();
    }

    return {
      success: response.success,
      message: response.message || (response.success ? 'Account deleted successfully' : 'Failed to delete account')
    };
    
  } catch (error) {
    console.error('Delete account error:', error);
    return {
      success: false,
      message: error.message || 'Account deletion failed. Please try again.'
    };
  }
};

/**
 * Request password reset
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Password reset request result
 */
export const requestPasswordReset = async (email) => {
  try {
    if (!email) {
      return {
        success: false,
        message: 'Please provide your email address'
      };
    }

    const response = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase().trim() })
    });

    return {
      success: response.success,
      message: response.message || (response.success ? 'Password reset email sent' : 'Failed to send reset email')
    };
    
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      message: error.message || 'Failed to request password reset. Please try again.'
    };
  }
};

/**
 * Reset password with token
 * @param {Object} resetData - Password reset data
 * @param {string} resetData.token - Reset token from email
 * @param {string} resetData.newPassword - New password
 * @returns {Promise<Object>} Password reset result
 */
export const resetPassword = async (resetData) => {
  try {
    const { token, newPassword } = resetData;
    
    if (!token || !newPassword) {
      return {
        success: false,
        message: 'Please provide reset token and new password'
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long'
      };
    }

    const response = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });

    return {
      success: response.success,
      message: response.message || (response.success ? 'Password reset successfully' : 'Failed to reset password')
    };
    
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: error.message || 'Password reset failed. Please try again.'
    };
  }
};

/**
 * Verify email address
 * @param {string} token - Email verification token
 * @returns {Promise<Object>} Email verification result
 */
export const verifyEmail = async (token) => {
  try {
    if (!token) {
      return {
        success: false,
        message: 'No verification token provided'
      };
    }

    const response = await apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });

    if (response.success && response.user) {
      // Update stored user data if verification includes updated user info
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));
    }

    return {
      success: response.success,
      message: response.message || (response.success ? 'Email verified successfully' : 'Email verification failed'),
      user: response.user
    };
    
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      message: error.message || 'Email verification failed. Please try again.'
    };
  }
};

/**
 * Resend email verification
 * @returns {Promise<Object>} Resend verification result
 */
export const resendEmailVerification = async () => {
  try {
    const response = await apiRequest('/auth/resend-verification', {
      method: 'POST'
    });

    return {
      success: response.success,
      message: response.message || (response.success ? 'Verification email sent' : 'Failed to send verification email')
    };
    
  } catch (error) {
    console.error('Resend verification error:', error);
    return {
      success: false,
      message: error.message || 'Failed to resend verification email. Please try again.'
    };
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  // Check if auth token exists
  const token = getAuthToken();
  console.log('isAuthenticated check - token exists:', !!token);
  return !!token;
};

/**
 * Get stored user data (for immediate use without API call)
 * @returns {Object|null} Stored user data
 */
export const getStoredUser = () => {
  try {
    const userData = localStorage.getItem(CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Get stored user error:', error);
    return null;
  }
};

/**
 * Check if stored auth data is valid
 * @returns {Promise<boolean>} Validation result
 */
export const validateAuth = async () => {
  try {
    if (!isAuthenticated()) {
      return false;
    }

    const result = await getCurrentUser();
    return result.success;
  } catch (error) {
    console.error('Auth validation error:', error);
    return false;
  }
};

/**
 * Refresh authentication token
 * @returns {Promise<Object>} Token refresh result
 */
export const refreshToken = async () => {
  try {
    const response = await apiRequest('/auth/refresh-token', {
      method: 'POST'
    });

    if (response.success) {
      setAuthToken(response.token);
      
      return {
        success: true,
        token: response.token,
        message: 'Token refreshed successfully'
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to refresh token'
    };
    
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // If refresh fails, logout user
    await logout();
    
    return {
      success: false,
      message: 'Session expired. Please login again.'
    };
  }
};

// Export all functions as default object
export default {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
  isAuthenticated,
  getStoredUser,
  validateAuth,
  refreshToken
};
