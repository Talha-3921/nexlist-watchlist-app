const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/activities', require('./routes/activities'));

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
