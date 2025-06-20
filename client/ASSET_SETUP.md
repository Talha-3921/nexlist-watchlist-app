# Asset Setup Instructions

## Adding Your Images

To complete the home page setup, please add your images to the following location:

### 1. Logo

- **File name:** `NEXELIST LOGO.png`
- **Location:** `src/assets/images/NEXELIST LOGO.png`
- **Recommended size:** 200px width (height will auto-adjust)

### 2. Background Image

- **File name:** `Home BG.jpg`
- **Location:** `src/assets/images/Home BG.jpg`
- **Recommended size:** At least 1920x1080px for best quality

## After Adding Images

Once you've added both images to the `src/assets/images/` folder:

1. Open `src/pages/Home.js`
2. Uncomment the logo import line at the top:
   ```javascript
   import logo from "../assets/images/NEXELIST LOGO.png";
   ```
3. Uncomment the logo image element and comment out the placeholder:
   ```javascript
   <img src={logo} alt="Nexelist Logo" className="logo" />
   ```
4. Remove or comment out the placeholder logo div

## Current Features

✅ Netflix-style landing page layout
✅ Responsive design for mobile and desktop
✅ Floating particle animation
✅ Email signup form
✅ Custom styling with your brand colors
✅ Background image with overlay effect
✅ Smooth animations and hover effects

## File Structure

```
src/
├── assets/
│   └── images/
│       ├── NEXELIST LOGO.png (add this)
│       └── Home BG.jpg (add this)
├── pages/
│   ├── Home.js
│   └── Home.css
└── App.js
```
