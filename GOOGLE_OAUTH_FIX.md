# 🔧 Fix Google OAuth "redirect_uri_mismatch" Error

## Current Error
```
Access blocked: This app's request is invalid
Error 400: redirect_uri_mismatch
```

This means the redirect URI in the Google OAuth request doesn't match what's configured in Google Cloud Console.

## 🔥 IMMEDIATE FIX - Step by Step

### Step 1: Configure Google Cloud Console (REQUIRED)

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Select/Create Project**: Choose existing project or create new one
3. **Enable APIs**:
   - Go to "APIs & Services" > "Library" 
   - Search for "Google+ API" and enable it
   - Search for "People API" and enable it
4. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "USD Financial"
   
5. **⭐ CRITICAL: Add Authorized Redirect URIs**:
   ```
   https://auth.alchemy.com/v1/oauth/callback/google
   https://signer.alchemy.com/oauth/callback/google
   http://localhost:9002
   https://usdfinancial.co
   ```

6. **Save and Copy**:
   - Copy the "Client ID"
   - Copy the "Client Secret"

### Step 2: Configure Alchemy Dashboard

1. **Login**: https://dashboard.alchemy.com
2. **Select Your App**: USD Financial project
3. **Account Kit Settings**: Find OAuth/Auth providers section
4. **Enable Google OAuth**:
   - Toggle Google ON
   - Paste **Client ID** from Google Cloud Console
   - Paste **Client Secret** from Google Cloud Console
   - Save changes

### Step 3: Test the Fix

1. **Clear Browser Cache**: Important for OAuth
2. **Go to your app**: Click "Get Started"
3. **Try Google Login**: Should now work without redirect error

## 🔍 Troubleshooting

### If Still Getting redirect_uri_mismatch:

1. **Check Exact Redirect URIs**: Make sure these are added to Google Cloud Console:
   - `https://auth.alchemy.com/v1/oauth/callback/google`
   - `https://signer.alchemy.com/oauth/callback/google`

2. **Domain Verification**: In Google Cloud Console:
   - Go to "OAuth consent screen"
   - Add your domain: `usdfinancial.co`
   - Verify domain ownership

3. **Wait 5-10 minutes**: OAuth changes can take time to propagate

### If Google Cloud Console is New to You:

1. **Create Account**: Sign up at https://cloud.google.com
2. **First Project**: Google will guide you through creating your first project
3. **Billing**: You may need to enable billing (OAuth is free, but requires billing account)

## 🎯 Expected Result

After configuration, users should see:
- Email login option
- "Continue with Google" button  
- Smooth Google OAuth flow without errors

## ⚙️ Current Code Status

The code is already configured correctly for Google OAuth:
- ✅ Alchemy Account Kit integration ready
- ✅ Google OAuth properly configured in code
- ❌ Missing Google Cloud Console + Alchemy Dashboard setup

Once you complete the dashboard setup, Google OAuth will work immediately!