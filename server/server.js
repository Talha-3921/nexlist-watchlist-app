const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'https://nexlist-watchlist-app.vercel.app',
      'https://nexlist-watchlist-eb1lhuscd-muhammad-talhas-projects-3342e072.vercel.app',
      'https://nexlist-watchlist-2uycsi9gf-muhammad-talhas-projects-3342e072.vercel.app'
    ];
    
    // Allow any Vercel deployment URL for this project
    const isVercelDeployment = origin.includes('nexlist-watchlist') && origin.includes('vercel.app');
    
    if (allowedOrigins.includes(origin) || isVercelDeployment) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/activities', require('./routes/activities'));

// Handle preflight requests for all API routes
app.options('/api/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-auth-token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Watchlist API Server is running!' });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use MONGODB_URI (for Vercel) or MONGO_URI (for local development)
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// For Vercel deployment
if (process.env.NODE_ENV === 'production') {
  // Connect to database and export app for serverless
  connectDB();
  module.exports = app;
} else {
  // For local development
  startServer();
}
