// Base configuration for API calls
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('API_BASE_URL:', API_BASE_URL); // Debug log

// Get auth token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('Watchlist-auth-token');
  console.log('Retrieved auth token:', token ? 'Present (not showing for security)' : 'Missing');
  return token;
};

// Set auth token in localStorage
const setAuthToken = (token) => {
  if (token) {
    console.log('Setting auth token in localStorage');
    localStorage.setItem('Watchlist-auth-token', token);
  } else {
    console.log('Removing auth token from localStorage');
    localStorage.removeItem('Watchlist-auth-token');
  }
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'x-auth-token': token }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

export { API_BASE_URL, getAuthToken, setAuthToken, apiRequest };
