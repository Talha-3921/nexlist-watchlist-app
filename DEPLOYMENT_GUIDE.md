# Step-by-Step Deployment Guide

## 🚀 YOUR CODE IS NOW ON GITHUB!
Repository: https://github.com/Talha-3921/nexlist-watchlist-app

---

## VERCEL DEPLOYMENT (Full Stack)

### Step 1: Deploy to Vercel
1. Go to https://vercel.com
2. Sign in with your GitHub account
3. Click "New Project"
4. Import your repository: `nexlist-watchlist-app`
5. Configure the deployment:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: client/build
   - Install Command: npm run install-all

### Step 2: Environment Variables on Vercel
Add these in the Vercel dashboard:
- MONGODB_URI: (your MongoDB connection string)
- JWT_SECRET: your-secret-key-here
- NODE_ENV: production

### Step 3: Custom Domain (Optional)
- Add your custom domain in Vercel dashboard
- Update DNS settings as instructed

---

## NETLIFY DEPLOYMENT (Frontend Only)

### Step 1: Deploy to Netlify
1. Go to https://netlify.com
2. Sign in with your GitHub account
3. Click "New site from Git"
4. Choose GitHub and select your repository
5. Configure:
   - Branch: main
   - Build command: cd client && npm run build
   - Publish directory: client/build

### Step 2: Environment Variables on Netlify
- REACT_APP_API_URL: https://your-vercel-backend-url.vercel.app/api

### Step 3: Custom Domain (Optional)
- Add custom domain in Netlify dashboard
- Update DNS settings as instructed

---

## 📱 WHAT HAPPENS NEXT:

1. **Vercel** will automatically deploy your full-stack app
2. **Netlify** will deploy your frontend
3. Both will auto-deploy when you push to GitHub
4. You'll get live URLs for both deployments

## 🔗 EXPECTED RESULTS:
- Vercel URL: https://nexlist-watchlist-app.vercel.app
- Netlify URL: https://amazing-site-name.netlify.app

## 📞 NEED HELP?
If you encounter any issues, the deployment logs will show what's wrong.
Common issues: Missing environment variables, build failures, or API connection problems.
