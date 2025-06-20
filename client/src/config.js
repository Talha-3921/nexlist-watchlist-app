// Configuration for different environments
const config = {
  development: {
    API_URL: 'http://localhost:5000/api'
  },
  production: {
    // We'll update this with your deployed backend URL
    API_URL: process.env.REACT_APP_API_URL || 'https://your-backend-url.vercel.app/api'
  }
};

const environment = process.env.NODE_ENV || 'development';

export default config[environment];
