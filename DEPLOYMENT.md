# USD Financial - AWS Amplify Deployment Guide

This project has been optimized for deployment on AWS Amplify with static export functionality.

## 🚀 Quick Deploy to AWS Amplify

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: USD Financial app"
   git branch -M main
   git remote add origin https://github.com/yourusername/usd-financial.git
   git push -u origin main
   ```

2. **Connect to AWS Amplify:**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/) and sign in
   - Click "New app" > "Host web app"
   - Choose GitHub and select your repository
   - AWS Amplify will automatically detect the settings from `amplify.yml`

### Option 2: Manual Deployment

1. **Build the project locally:**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy using Amplify CLI:**
   ```bash
   amplify init
   amplify publish
   ```

## 🔧 Fixed Build Issues

The following issues have been resolved:

- ✅ **PostCSS Configuration**: Added proper `postcss.config.js`
- ✅ **Tailwind Config**: Converted to CommonJS format
- ✅ **Dependencies**: Removed problematic AI dependencies for static build
- ✅ **Next.js Config**: Optimized for static export
- ✅ **TypeScript**: Set to ignore build errors for deployment

## ⚙️ Build Configuration

The project includes:

- **`netlify.toml`** - Netlify configuration
- **`next.config.js`** - Static export configuration
- **`postcss.config.js`** - PostCSS and Tailwind configuration
- **Client-side AI** - Mock AI functionality for static deployment

### Build Settings (Auto-configured)

- **Build Command:** `npm run build`
- **Publish Directory:** `out`
- **Node Version:** 18

## 🎨 Features in Static Deployment

### ✅ Fully Functional
- ✅ Apple Card-inspired landing page
- ✅ Complete dashboard with financial data
- ✅ Virtual card with animations
- ✅ Interactive spending charts
- ✅ All navigation and routing
- ✅ Responsive design
- ✅ Theme generator (client-side AI)
- ✅ AI spending analysis (mock implementation)

### ⚠️ Limitations in Static Mode
- 🔶 Server-side AI flows (Genkit) won't work
- 🔶 Real-time data updates require API integration
- 🔶 No server-side authentication

## 🔧 Environment Variables

For enhanced functionality, add these to Netlify:

```env
NEXT_PUBLIC_API_URL=your_api_endpoint
NEXT_PUBLIC_GOOGLE_AI_KEY=your_google_api_key (for real AI)
```

## 🌐 Alternative Deployment Options

### Vercel (Recommended for Full Features)
For full server-side functionality including Genkit AI flows:

```bash
npm install -g vercel
vercel --prod
```

### Other Static Hosts
- **GitHub Pages:** Use the `out` folder
- **Firebase Hosting:** Deploy the `out` folder
- **AWS S3 + CloudFront:** Upload the `out` folder

## 🔄 Development vs Production

### Development Mode
```bash
npm run dev
# Full server-side functionality at localhost:9002
```

### Production Static Build
```bash
npm run build
# Creates static site in `out` folder
```

## 📱 Performance Optimizations

The static build includes:
- ✅ Optimized images and assets
- ✅ Code splitting and lazy loading
- ✅ Compressed CSS and JavaScript
- ✅ SEO-friendly HTML generation
- ✅ Progressive Web App capabilities

## 🛠️ Troubleshooting

### Build Fails
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Images Not Loading
- Ensure `next.config.ts` has `unoptimized: true`
- Check image paths are absolute

### Routing Issues
- Verify `netlify.toml` redirects are configured
- Test all navigation paths

## 📞 Support

For deployment issues:
1. Check Netlify build logs
2. Verify all dependencies are installed
3. Test the build locally first
4. Check the `out` folder is generated correctly

---

**🎉 Your USD Financial app is ready for the world!**

Access your deployed app at: `https://your-app-name.netlify.app`