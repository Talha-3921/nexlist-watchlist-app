# Complete Backend Development & Deployment Guide for Beginners

## 📚 Table of Contents

1. [What is a Backend?](#what-is-a-backend)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [Step-by-Step Backend Development](#step-by-step-backend-development)
5. [Environment Variables](#environment-variables)
6. [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
7. [Local Development](#local-development)
8. [Deployment to Vercel](#deployment-to-vercel)
9. [CORS Configuration](#cors-configuration)
10. [Single Page Application (SPA) Routing](#single-page-application-spa-routing)
11. [Testing Your API](#testing-your-api)
12. [Common Issues & Solutions](#common-issues--solutions)

---

## 🤔 What is a Backend?

The **backend** is the "behind-the-scenes" part of your web application that:

- Handles data storage and retrieval
- Manages user authentication (login/signup)
- Processes business logic
- Provides APIs (endpoints) for the frontend to communicate with
- Manages database operations

Think of it like a restaurant kitchen - customers (frontend) don't see it, but it's where all the food (data) is prepared and served.

---

## 🛠️ Technologies Used

### Core Technologies:

- **Node.js**: JavaScript runtime that lets you run JavaScript on the server
- **Express.js**: Web framework for Node.js that makes building APIs easy
- **MongoDB**: NoSQL database for storing data
- **Mongoose**: Library that helps connect Node.js to MongoDB

### Additional Tools:

- **JWT (JSON Web Tokens)**: For user authentication
- **bcryptjs**: For password encryption
- **cors**: For handling Cross-Origin Resource Sharing
- **dotenv**: For managing environment variables

---

## 📁 Project Structure

```
server/
├── package.json          # Project dependencies and scripts
├── server.js             # Main server file (entry point)
├── vercel.json           # Vercel deployment configuration
├── models/               # Database schemas
│   ├── User.js          # User data structure
│   ├── Watchlist.js     # Watchlist data structure
│   └── Activity.js      # Activity data structure
├── routes/              # API endpoints
│   ├── auth.js          # Authentication routes (login/signup)
│   ├── watchlist.js     # Watchlist CRUD operations
│   └── activities.js    # Activity tracking routes
└── middleware/          # Custom middleware functions
    └── auth.js          # Authentication middleware
```

---

## 🔨 Step-by-Step Backend Development

### Step 1: Initialize the Project

```bash
# Create server directory
mkdir server
cd server

# Initialize Node.js project
npm init -y
```

### Step 2: Install Dependencies

```bash
# Core dependencies
npm install express mongoose cors dotenv bcryptjs jsonwebtoken

# Development dependencies (optional)
npm install --save-dev nodemon
```

**What each dependency does:**

- `express`: Web framework for creating APIs
- `mongoose`: MongoDB object modeling tool
- `cors`: Enables cross-origin requests
- `dotenv`: Loads environment variables from .env file
- `bcryptjs`: Hashes passwords for security
- `jsonwebtoken`: Creates and verifies JWT tokens
- `nodemon`: Automatically restarts server on file changes (dev only)

### Step 3: Create package.json Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Step 4: Create the Main Server File (server.js)

```javascript
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Create Express application
const app = express();

// Middleware (functions that run before your routes)
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000", // Local development
        "http://localhost:3001", // Alternative local port
        "https://your-app.vercel.app", // Production domain
      ];

      // Dynamic CORS for Vercel deployments
      const isVercelDeployment =
        origin &&
        origin.includes("nexlist-watchlist") &&
        origin.includes("vercel.app");

      if (allowedOrigins.includes(origin) || isVercelDeployment) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  })
);

// Parse JSON requests
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/watchlist", require("./routes/watchlist"));
app.use("/api/activities", require("./routes/activities"));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "API Server is running!" });
});

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Server startup
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === "production") {
  // For Vercel deployment
  connectDB();
  module.exports = app;
} else {
  // For local development
  const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  };
  startServer();
}
```

### Step 5: Create Database Models

**models/User.js** - User data structure:

```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
```

**models/Watchlist.js** - Watchlist data structure:

```javascript
const mongoose = require("mongoose");

const WatchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        tmdbId: Number,
        title: String,
        type: String, // 'movie', 'tv', 'anime', 'game'
        poster: String,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Watchlist", WatchlistSchema);
```

### Step 6: Create Authentication Middleware

**middleware/auth.js**:

```javascript
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("x-auth-token");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = auth;
```

### Step 7: Create API Routes

**routes/auth.js** - Authentication endpoints:

```javascript
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Register user
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    user = new User({ username, email, password });
    await user.save();

    // Create JWT token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ token, user: { id: user.id, username, email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: { id: user.id, username: user.username, email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
```

---

## 🔐 Environment Variables

Create a `.env` file in your server directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/watchlist

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Environment
NODE_ENV=development
PORT=5000
```

**Important Notes:**

- Never commit `.env` files to Git
- Use strong, random JWT secrets in production
- The MongoDB URI comes from MongoDB Atlas

---

## 🗄️ Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (choose free tier)

### Step 2: Configure Database Access

1. Go to "Database Access" in the sidebar
2. Click "Add New Database User"
3. Create a username and password
4. Set permissions to "Read and write to any database"

### Step 3: Configure Network Access

1. Go to "Network Access" in the sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0)
4. This allows connections from any IP (needed for deployment)

### Step 4: Get Connection String

1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<username>`, `<password>`, and `<database>` with your values

Example:

```
mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/watchlist
```

---

## 💻 Local Development

### Step 1: Install Dependencies

```bash
cd server
npm install
```

### Step 2: Create Environment File

Create `.env` with your MongoDB URI and JWT secret

### Step 3: Start Development Server

```bash
npm run dev
```

### Step 4: Test Your API

Open `http://localhost:5000` in your browser
You should see: `{"message":"API Server is running!"}`

---

## 🚀 Deployment to Vercel

### Step 1: Prepare for Deployment

Create `vercel.json` in your server directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

### Step 2: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial backend setup"

# Add remote repository
git remote add origin https://github.com/yourusername/your-repo.git

# Push to GitHub
git push -u origin main
```

### Step 3: Deploy on Vercel

1. **Go to [Vercel](https://vercel.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure the project:**
   - Framework Preset: "Other"
   - Root Directory: `server`
   - Build Command: Leave empty
   - Output Directory: Leave empty
   - Install Command: `npm install`

### Step 4: Add Environment Variables

1. In Vercel dashboard, go to your project
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add each variable:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `NODE_ENV`: `production`

### Step 5: Deploy

1. Click "Deploy" button
2. Wait for deployment to complete
3. Your API will be available at: `https://your-project.vercel.app`

---

## 🌐 CORS Configuration (Critical for Frontend-Backend Communication)

### What is CORS?

CORS (Cross-Origin Resource Sharing) is a security feature that blocks web pages from making requests to a different domain than the one serving the page.

### Why Do We Need It?

- Your frontend runs on one domain (e.g., `https://myapp.vercel.app`)
- Your backend runs on another domain (e.g., `https://myapi.vercel.app`)
- Without CORS, the browser blocks these requests

### Our CORS Solution:

```javascript
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "https://your-production-domain.vercel.app",
      ];

      // Dynamic checking for Vercel deployments
      const isVercelDeployment =
        origin &&
        origin.includes("your-project-name") &&
        origin.includes("vercel.app");

      if (allowedOrigins.includes(origin) || isVercelDeployment) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  })
);
```

---

## 📱 Single Page Application (SPA) Routing

### What is SPA Routing?

When you build a React app, it's a **Single Page Application (SPA)**. This means:

- Only one HTML file (`index.html`) is served
- JavaScript handles all the routing client-side
- URLs like `/shared/Games/123` don't correspond to actual files on the server

### The Problem

When someone visits `https://your-app.vercel.app/shared/Games/123` directly:

1. The browser asks the server for the file at `/shared/Games/123`
2. No such file exists on the server
3. Server returns 404 error
4. User sees "Page Not Found" instead of your React app

### The Solution: Configure Server Redirects

**For Vercel deployment**, create proper `vercel.json` configuration:

```json
{
  "buildCommand": "cd client && npm run build",
  "outputDirectory": "client/build",
  "framework": null,
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/favicon.ico",
      "dest": "/favicon.ico"
    },
    {
      "src": "/manifest.json",
      "dest": "/manifest.json"
    },
    {
      "src": "/logo(.*).png",
      "dest": "/logo$1.png"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**For Netlify deployment**, create `_redirects` file in `public/` directory:

```
# Handle static assets first
/static/*  /static/:splat  200
/favicon.ico  /favicon.ico  200
/manifest.json  /manifest.json  200
/logo*.png  /logo*.png  200
/robots.txt  /robots.txt  200

# Catch-all for React Router
/*    /index.html   200
```

### Common SPA Routing Issues & Solutions

#### 1. JavaScript Files Return HTML (`Unexpected token '<'`)

**Problem:** Static files (JS/CSS) are being redirected to `index.html`
**Solution:**

- Ensure static file routes come BEFORE the catch-all route
- Use specific patterns for static assets

#### 2. 404 on Direct URL Access

**Problem:** Visiting URLs directly shows 404
**Solution:**

- Add catch-all redirect to `index.html`
- Configure server to serve `index.html` for all routes

#### 3. Assets Not Loading

**Problem:** CSS/JS files not loading properly
**Solution:**

- Check if asset paths are correct in `index.html`
- Ensure static file serving is configured properly

#### 4. React Router Not Working

**Problem:** Client-side navigation doesn't work
**Solution:**

- Use `BrowserRouter` instead of `HashRouter`
- Ensure routes are properly defined in React app

### Example React Router Setup:

```javascript
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/shared/:folderType/:shareId/:userId?"
          element={<SharedWatchlist />}
        />
        {/* Add other routes */}
      </Routes>
    </Router>
  );
}
```

### Testing SPA Routing:

1. **Test direct URL access:**

   - Visit `https://your-app.vercel.app/shared/Games/123` directly
   - Should load your React app, not show 404

2. **Test static assets:**

   - Check browser Network tab
   - JS/CSS files should load properly (not return HTML)

3. **Test client-side navigation:**
   - Navigate using React Router links
   - Browser back/forward buttons should work

---

## 🧪 Testing Your API

### Using Browser (GET requests only):

```
https://your-api.vercel.app/
https://your-api.vercel.app/api/auth/me
```

### Using Postman or Thunder Client:

**Register User (POST):**

```
URL: https://your-api.vercel.app/api/auth/register
Method: POST
Headers: Content-Type: application/json
Body: {
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**Login User (POST):**

```
URL: https://your-api.vercel.app/api/auth/login
Method: POST
Headers: Content-Type: application/json
Body: {
  "email": "test@example.com",
  "password": "password123"
}
```

### Using curl (Command Line):

```bash
# Test the root endpoint
curl https://your-api.vercel.app/

# Test registration
curl -X POST https://your-api.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

---

## 🐛 Common Issues & Solutions

### 1. "Cannot GET /" Error

**Problem:** Server not starting properly
**Solution:**

- Check if all dependencies are installed
- Verify environment variables are set
- Check server.js for syntax errors

### 2. Database Connection Failed

**Problem:** Cannot connect to MongoDB
**Solution:**

- Verify MongoDB URI is correct
- Check if IP address is whitelisted in MongoDB Atlas
- Ensure database user has proper permissions

### 3. CORS Errors

**Problem:** Frontend cannot make requests to backend
**Solution:**

- Add frontend domain to CORS allowed origins
- Check if credentials are properly configured
- Verify OPTIONS requests are handled

### 4. 401 Unauthorized Errors

**Problem:** Authentication not working
**Solution:**

- Check if JWT secret is set in environment variables
- Verify token is being sent in headers correctly
- Check token expiration

### 5. Deployment Issues

**Problem:** App not deploying on Vercel
**Solution:**

- Check vercel.json configuration
- Verify all environment variables are set
- Check build logs for specific errors

### 6. Environment Variables Not Working

**Problem:** Process.env variables are undefined
**Solution:**

- Ensure .env file is in correct location
- Check if dotenv.config() is called before using variables
- Verify variable names match exactly

---

## 📝 Development Workflow

### For New Features:

1. **Plan your API endpoints**
2. **Create/update database models**
3. **Write route handlers**
4. **Test locally**
5. **Commit and push to GitHub**
6. **Vercel auto-deploys**

### For Bug Fixes:

1. **Identify the issue**
2. **Check logs** (Vercel dashboard → Functions tab)
3. **Fix locally**
4. **Test thoroughly**
5. **Deploy**

---

## 🔧 Advanced Tips

### 1. Error Handling

Always wrap async functions in try-catch:

```javascript
router.post("/example", async (req, res) => {
  try {
    // Your code here
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
```

### 2. Input Validation

Validate user input:

```javascript
const { username, email, password } = req.body;

if (!username || !email || !password) {
  return res.status(400).json({ message: "All fields required" });
}

if (password.length < 6) {
  return res
    .status(400)
    .json({ message: "Password must be at least 6 characters" });
}
```

### 3. Security Best Practices

- Always hash passwords
- Use HTTPS in production
- Validate and sanitize inputs
- Use environment variables for secrets
- Implement rate limiting for production

### 4. Database Optimization

- Use indexes for frequently queried fields
- Limit query results
- Use lean() for read-only queries

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/) - Learn about JSON Web Tokens
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vercel Documentation](https://vercel.com/docs)

---

## 🎉 Congratulations!

You now have a complete understanding of:

- ✅ Backend development with Node.js and Express
- ✅ Database design and connection with MongoDB
- ✅ User authentication with JWT
- ✅ API development and testing
- ✅ Deployment to Vercel
- ✅ CORS configuration
- ✅ Environment management
- ✅ Troubleshooting common issues

Your backend is now live and ready to serve your frontend application!

---

_This guide covers everything needed to build and deploy a production-ready backend. Keep this as a reference for future projects!_
