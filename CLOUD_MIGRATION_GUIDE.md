# Watchlist - MongoDB Atlas Cloud Storage Migration Guide

## Overview

This guide will help you migrate your Watchlist application from localStorage to MongoDB Atlas cloud storage.

## Prerequisites

- MongoDB Atlas account (free tier available)
- Node.js installed on your computer
- Basic understanding of terminal/command prompt

## Step-by-Step Setup Instructions

### 1. MongoDB Atlas Setup

#### Create Your Database:

1. **Login to MongoDB Atlas** (https://cloud.mongodb.com/)
2. **Create a New Project** (if you don't have one)
3. **Create a Database Cluster**:
   - Click "Build a Database"
   - Choose "M0 Sandbox" (FREE tier)
   - Select your preferred region
   - Click "Create Cluster"

#### Configure Database Access:

1. **Create Database User**:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username and password (remember these!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

#### Configure Network Access:

1. **Add IP Address**:
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP addresses
   - Click "Confirm"

#### Get Connection String:

1. **Get MongoDB URI**:
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)

### 2. Backend Server Setup

#### Install Dependencies:

Open terminal in the server folder and run:

```bash
cd server
npm install
```

#### Environment Configuration:

1. **Create .env file** in the server folder:

```bash
# Copy .env.example to .env
copy .env.example .env
```

2. **Edit .env file** with your MongoDB credentials:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/Watchlist?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Important**: Replace:

- `your-username` with your MongoDB Atlas username
- `your-password` with your MongoDB Atlas password
- `cluster0.xxxxx.mongodb.net` with your actual cluster URL
- `your-super-secret-jwt-key` with a strong secret key

#### Start the Server:

```bash
npm run dev
```

The server should start on http://localhost:5000

### 3. Frontend Configuration

#### Install Additional Dependencies:

In the client folder, you might need to add environment variable support:

```bash
cd client
npm install
```

#### Environment Configuration:

1. **Create .env file** in the client folder:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Migration Process

#### Option A: Automatic Migration (Recommended for Beginners)

1. **Backup Current Data**:

   - Open your browser's Developer Tools (F12)
   - Go to Application/Storage tab
   - Click on "Local Storage"
   - Copy all your Watchlist data as backup

2. **Switch to Cloud Services**:

   - Replace the import in your components from:

   ```javascript
   // Old
   import { authService } from "../services/authService";
   import { getWatchlist, addToWatchlist } from "../services/WatchlistService";

   // New
   import { authService } from "../services/authService-cloud";
   import {
     getWatchlist,
     addToWatchlist,
   } from "../services/WatchlistService-cloud";
   ```

3. **Update Your Components**:
   The cloud services work the same way but return promises, so make sure your components handle async operations properly.

#### Option B: Manual Migration

If you want to keep your existing data, create a migration script to transfer localStorage data to the cloud database.

### 5. Testing the Setup

1. **Start both servers**:

   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm start
   ```

2. **Test Registration**:

   - Try creating a new account
   - Check if data appears in MongoDB Atlas

3. **Test Watchlist**:
   - Add items to Watchlist
   - Verify they persist after page refresh

### 6. Deployment Considerations

#### For Production:

1. **Environment Variables**:

   - Use production MongoDB cluster
   - Use strong JWT secret
   - Set NODE_ENV=production

2. **Security**:

   - Restrict IP access in MongoDB Atlas
   - Use environment variables for all secrets
   - Enable CORS only for your domain

3. **Backend Hosting** (Choose one):

   - Heroku
   - Railway
   - DigitalOcean
   - AWS/Azure/GCP

4. **Frontend Hosting** (Choose one):
   - Vercel
   - Netlify
   - Firebase Hosting

## File Structure After Migration

```
Watchlist/
├── client/
│   ├── src/
│   │   ├── services/
│   │   │   ├── api.js                    # New: API configuration
│   │   │   ├── authService.js            # Old: localStorage version
│   │   │   ├── authService-cloud.js      # New: Cloud version
│   │   │   ├── WatchlistService.js       # Old: localStorage version
│   │   │   └── WatchlistService-cloud.js # New: Cloud version
│   │   └── ...
│   └── ...
└── server/
    ├── models/
    │   ├── User.js                       # User schema
    │   └── Watchlist.js                  # Watchlist schema
    ├── routes/
    │   ├── auth.js                       # Authentication routes
    │   └── Watchlist.js                  # Watchlist routes
    ├── middleware/
    │   └── auth.js                       # JWT authentication middleware
    ├── .env                              # Environment variables
    ├── .env.example                      # Environment template
    ├── package.json                      # Dependencies
    └── server.js                         # Main server file
```

## Benefits of Cloud Storage

✅ **Data Persistence**: Your data is safe even if you clear browser data
✅ **Multi-Device Access**: Access your Watchlist from any device
✅ **Real-time Sync**: Changes sync instantly across devices
✅ **Backup & Recovery**: Automatic backups in the cloud
✅ **Scalability**: Handles unlimited users and data
✅ **Security**: Professional-grade security with MongoDB Atlas

## Troubleshooting

### Common Issues:

1. **Connection Error**:

   - Check your MongoDB URI
   - Verify IP whitelist in MongoDB Atlas
   - Ensure username/password are correct

2. **CORS Error**:

   - Make sure backend server is running
   - Check API_URL in frontend .env

3. **Authentication Error**:

   - Check JWT_SECRET in backend .env
   - Clear browser localStorage if migrating

4. **Data Not Saving**:
   - Check MongoDB Atlas cluster status
   - Verify database permissions
   - Check browser console for errors

### Getting Help:

- Check MongoDB Atlas logs
- Use browser Developer Tools Console
- Check server terminal for error messages

## Next Steps

Once everything is working:

1. Test all features thoroughly
2. Deploy to production
3. Set up monitoring
4. Consider adding features like:
   - Real-time collaboration
   - Advanced search
   - Data analytics
   - Mobile app

## Cost Information

- **MongoDB Atlas**: Free tier (M0) includes 512MB storage
- **Backend Hosting**: Many providers offer free tiers
- **Frontend Hosting**: Most static site hosts are free

The free tiers should be sufficient for personal use and small applications.
