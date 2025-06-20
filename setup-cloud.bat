@echo off
echo ===================================
echo Watchlist Cloud Storage Setup
echo ===================================
echo.

echo Step 1: Setting up MongoDB Atlas
echo --------------------------------
echo 1. Go to https://cloud.mongodb.com/
echo 2. Create a new project (if needed)
echo 3. Create a free M0 cluster
echo 4. Create a database user
echo 5. Add your IP to network access
echo 6. Get your connection string
echo.

echo Step 2: Configure Environment Variables
echo ---------------------------------------
echo Edit server\.env file:
echo - Replace MONGO_URI with your connection string
echo - Replace JWT_SECRET with a strong secret key
echo.

echo Step 3: Start the application
echo -----------------------------
echo Open two terminals:
echo.
echo Terminal 1 (Backend):
echo cd server
echo npm run dev
echo.
echo Terminal 2 (Frontend):
echo cd client  
echo npm start
echo.

echo ===================================
echo For detailed instructions, see:
echo CLOUD_MIGRATION_GUIDE.md
echo ===================================
pause
