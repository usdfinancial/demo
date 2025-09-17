# OAuth Error Fix - Setup Guide

## Issue: OauthFailedError: UNKNOWN Version: 4.55.0

This error typically occurs due to missing or incorrect Alchemy Account Kit configuration.

## Quick Fix Steps

### 1. Set up Environment Variables

Create `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.local.example .env.local
```

### 2. Configure Alchemy API Key

Get your API key from [Alchemy Dashboard](https://dashboard.alchemy.com/apps) and update `.env.local`:

```env
# Your actual Alchemy API key (required for OAuth)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_actual_api_key_here

# Optional: Alchemy Policy ID for custom gas policies
NEXT_PUBLIC_ALCHEMY_POLICY_ID=your_policy_id_here
```

### 3. Configure OAuth in Alchemy Dashboard

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com/apps)
2. Select your app
3. Navigate to "Account Kit" settings
4. Enable OAuth providers:
   - ✅ Enable Google OAuth
   - ✅ Configure authorized domains (add your domain)
   - ✅ Set up redirect URIs

### 4. Verify OAuth Domain Configuration

Make sure your domain is whitelisted in Alchemy's OAuth settings:
- For development: `http://localhost:9002`
- For production: `https://your-domain.com`

## Code Changes Made

The following fixes have been applied to resolve the OAuth error:

1. **Enhanced authentication method detection** with better error handling
2. **Improved OAuth configuration** for Account Kit v4.55.0 compatibility
3. **Better error messaging** when API key is missing
4. **Fallback authentication flows** to prevent complete failure

## Testing the Fix

After setting up the environment variables:

```bash
# Restart the development server
npm run dev
```

Then test OAuth authentication:
1. Try email authentication - should work
2. Try Google OAuth - should work without the UNKNOWN error
3. Check browser console for improved error messages

## Troubleshooting

If you still see OAuth errors:

1. **Check API Key**: Ensure it's valid and has Account Kit permissions
2. **Domain Whitelist**: Verify your domain is authorized in Alchemy dashboard
3. **Clear Cache**: Clear browser cache and restart dev server
4. **Check Console**: Look for improved error messages with specific guidance

## Additional Notes

- The error was caused by missing API key configuration
- Google OAuth requires proper domain authorization in Alchemy dashboard
- The enhanced code now provides better error handling and fallbacks