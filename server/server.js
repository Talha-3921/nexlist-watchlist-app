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
      'http://localhost:3001',
      'https://nexlist-watchlist-app.vercel.app'
    ];
      // Check if it's a Vercel deployment for your project
    const isVercelDeployment = origin && (
      // Main production domain
      origin === 'https://nexlist-watchlist-app.vercel.app' ||
      // Any preview deployment containing your project name
      (origin.includes('nexlist-watchlist') && origin.includes('vercel.app')) ||
      // Any deployment under your Vercel account (more permissive for development)
      (origin.includes('muhammad-talhas-projects') && origin.includes('vercel.app')) ||
      // Pattern for any vercel deployment with your project pattern
      /https:\/\/nexlist.*\.vercel\.app$/.test(origin)
    );
    
    if (allowedOrigins.includes(origin) || isVercelDeployment) {
      console.log(`CORS: Allowing origin: ${origin}`);
      return callback(null, true);
    }
    
    console.log(`CORS: Blocking origin: ${origin}`);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
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
