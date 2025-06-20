// API handler for Vercel serverless functions
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import your existing server setup
const authRoutes = require('../server/routes/auth');
const watchlistRoutes = require('../server/routes/watchlist');
const activitiesRoutes = require('../server/routes/activities');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/activities', activitiesRoutes);

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'Nexlist API is running!' });
});

module.exports = app;
