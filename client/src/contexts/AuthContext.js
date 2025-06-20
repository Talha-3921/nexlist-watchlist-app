import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services';
import cloudActivityService from '../services/cloudActivityService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = authService.isAuthenticated();
      
      if (authStatus) {        // First, try to get fresh user data from server
        try {
          const result = await authService.getCurrentUser();
          if (result.success) {
            setUser(result.user);
            setIsAuthenticated(true);
              // Initialize activities for the logged-in user
            cloudActivityService.initializeActivities(result.user).catch(error => {
              console.warn('Failed to initialize activities:', error);
            });
          } else {            // If API call fails, try to get stored user data as fallback
            const storedUser = authService.getStoredUser();
            if (storedUser) {
              setUser(storedUser);
              setIsAuthenticated(true);
              
              // Initialize activities for the stored user
              cloudActivityService.initializeActivities(storedUser).catch(error => {
                console.warn('Failed to initialize activities:', error);
              });
            } else {
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } catch (error) {
          console.error('Error getting current user:', error);          // Fallback to stored user data
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
            
            // Initialize activities for the stored user
            cloudActivityService.initializeActivities(storedUser).catch(error => {
              console.warn('Failed to initialize activities:', error);
            });
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();// Listen for storage changes (when user logs in/out from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'Watchlist-auth-token' || e.key === 'Watchlist-current-user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);  const login = async (credentials) => {
    try {
      const result = await authService.login(credentials);
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
          // Initialize activities and log login activity
        cloudActivityService.initializeActivities(result.user).catch(error => {
          console.warn('Failed to initialize activities:', error);
        });
        
        // Log login activity after a short delay to ensure auth state is set
        setTimeout(() => {
          cloudActivityService.logLogin().catch(error => {
            console.warn('Failed to log login activity:', error);
          });
        }, 100);
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  };  const logout = async () => {
    try {
      // Log logout activity before clearing user data
      await cloudActivityService.logLogout().catch(error => {
        console.warn('Failed to log logout activity:', error);
      });
      
      const result = await authService.logout();
      if (result.success) {
        // Clear user-specific activity cache
        cloudActivityService.clearUserCache();
        
        setUser(null);
        setIsAuthenticated(false);
      }
      return result;
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on error
      cloudActivityService.clearUserCache();
      setUser(null);
      setIsAuthenticated(false);
      return { success: true, message: 'Logged out successfully' };
    }
  };  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    // Also update localStorage to persist the changes
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const result = await authService.changePassword({ currentPassword, newPassword });
      return result;
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, message: 'Password change failed' };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
