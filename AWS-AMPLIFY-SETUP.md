# 🚀 AWS Amplify Migration Guide for USD Financial

This guide walks you through migrating the USD Financial application from Netlify to AWS Amplify.

## ✅ Migration Completed

The following migration steps have been completed:

### 🗂️ Configuration Files
- ✅ **Created `amplify.yml`** - Build specification for AWS Amplify
- ✅ **Removed `netlify.toml`** - Netlify configuration file
- ✅ **Updated `package.json`** - Added AWS Amplify dependencies
- ✅ **Updated `next.config.js`** - Changed comments from Netlify to Amplify

### 🔧 Serverless Functions Migration
- ✅ **Removed `netlify/functions/` directory**
- ✅ **Created `amplify/backend/function/api/` structure**
- ✅ **Migrated all API endpoints**:
  - `signin.js` - User authentication
  - `signup.js` - User registration
  - `1inch-quote.js` - DeFi trading quotes
  - `1inch-swap.js` - DeFi token swaps
  - `test-1inch.js` - API health checks
  - `test-db.js` - Database connectivity
  - `web3auth-user.js` - Web3 authentication

### 📱 Frontend API Updates
- ✅ **Updated API endpoints** from `/.netlify/functions/` to `/api/`
- ✅ **Updated 1inch adapter** (`src/lib/blockchain/1inch/adapter.ts`)
- ✅ **Updated debug component** (`src/components/debug/1InchDebug.tsx`)
- ✅ **Created API configuration** (`src/lib/config/api.ts`)

### 📚 Documentation Updates
- ✅ **Updated deployment guide** (`DEPLOYMENT.md`)
- ✅ **Updated database setup** (`database/SETUP.md`)
- ✅ **Removed Netlify documentation** (`NETLIFY-FIXES.md`)

## 🚀 Quick Start with AWS Amplify

### 1. Prerequisites

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure AWS credentials
aws configure
amplify configure
```

### 2. Initialize Amplify Project

```bash
# Initialize Amplify in your project
amplify init

# Follow the prompts:
# - Enter a name for the project: usd-financial
# - Enter a name for the environment: prod
# - Choose your default editor: Visual Studio Code
# - Choose the type of app: javascript
# - Framework: react
# - Source Directory Path: src
# - Distribution Directory Path: out
# - Build Command: npm run build
# - Start Command: npm start
```

### 3. Add API Functions

```bash
# Add API category
amplify add api

# Choose REST API
# Provide a friendly name: usd-financial-api
# Provide a path: /api
# Create a new Lambda function: Yes
# Provide a friendly name: api
# Choose runtime: NodeJS
# Choose template: Serverless ExpressJS function
```

### 4. Deploy to AWS

```bash
# Deploy backend and frontend
amplify publish

# Your app will be available at:
# https://branch-name.d1234567890.amplifyapp.com
```

## 🔧 Environment Variables

Set these environment variables in the AWS Amplify Console:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NPM_FLAGS=--legacy-peer-deps --force
NODE_PATH=src

# Database (if using RDS)
DATABASE_URL=your-rds-connection-string
DIRECT_URL=your-rds-direct-connection-string

# API Keys
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://your-app.amplifyapp.com
```

## 🏗️ Architecture Overview

```
AWS Amplify App
├── Frontend (Next.js Static Export)
│   ├── React Components
│   ├── Static Assets
│   └── Client-side routing
│
├── API Gateway + Lambda Functions
│   ├── /api/signin
│   ├── /api/signup
│   ├── /api/1inch-quote
│   ├── /api/1inch-swap
│   ├── /api/test-1inch
│   ├── /api/test-db
│   └── /api/web3auth-user
│
└── Optional AWS Services
    ├── RDS (PostgreSQL Database)
    ├── S3 (File Storage)
    └── CloudFront (CDN)
```

## 🔐 Security Features

- ✅ **CORS Headers** - Properly configured in API functions
- ✅ **Input Validation** - All API endpoints validate input
- ✅ **Error Handling** - Comprehensive error responses
- ✅ **Rate Limiting** - Built into AWS API Gateway
- ✅ **SSL/TLS** - Automatic HTTPS with AWS Amplify

## 🚦 Testing the Migration

1. **Test API endpoints**:
   ```bash
   # Test locally
   npm run dev
   
   # Navigate to debug panel
   # http://localhost:9002/test/integration
   ```

2. **Test 1inch integration**:
   ```bash
   # Check API connectivity
   curl https://your-app.amplifyapp.com/api/test-1inch
   
   # Test quote API
   curl "https://your-app.amplifyapp.com/api/1inch-quote?chainId=1&fromTokenAddress=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&toTokenAddress=0xdAC17F958D2ee523a2206206994597C13D831ec7&amount=1000000"
   ```

3. **Test database connectivity**:
   ```bash
   curl https://your-app.amplifyapp.com/api/test-db
   ```

## 📊 Performance Benefits

| Feature | Netlify | AWS Amplify |
|---------|---------|-------------|
| Global CDN | ✅ | ✅ Enhanced |
| Serverless Functions | 125k/month | 1M/month free |
| Build Minutes | 300/month | 1000/month free |
| Bandwidth | 100GB/month | 15GB/month free |
| Custom Domains | ✅ | ✅ + SSL |
| Environment Variables | ✅ | ✅ Enhanced |
| Git Integration | ✅ | ✅ Enhanced |

## 🔄 Rollback Plan

If you need to rollback to Netlify:

1. Restore `netlify.toml` from git history
2. Restore `netlify/functions/` directory
3. Update API endpoints back to `/.netlify/functions/`
4. Remove AWS Amplify configuration
5. Redeploy to Netlify

## 📞 Support

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS Support](https://aws.amazon.com/support/)
- [Amplify GitHub](https://github.com/aws-amplify)

---

**Migration completed successfully! 🎉**

Your USD Financial application is now ready for deployment on AWS Amplify with enhanced scalability, security, and performance.