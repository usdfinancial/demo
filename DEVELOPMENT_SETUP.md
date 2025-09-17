# USD Financial - Development Setup Guide

## Waitlist Functionality Development Issue & Solution

### The Problem
When running `npm run dev`, the waitlist form shows "Something went wrong. Please try again later." because:

1. The current `dev` script runs Next.js directly (`next dev -p 9002`)
2. This doesn't serve Netlify functions (like `/netlify/functions/submitWaitlist`)
3. The frontend tries to call the Netlify function but it's not available

### The Solution

We've implemented **two solutions** to ensure the waitlist works in both development and production:

#### Solution 1: Automatic Fallback (Recommended)
The `WaitlistModal.tsx` now automatically tries both endpoints:
1. **First**: Netlify function (`/.netlify/functions/submitWaitlist`)
2. **Fallback**: Next.js API route (`/api/waitlist`)

This ensures the waitlist works regardless of the development environment.

#### Solution 2: Proper Netlify Development Environment

For the full production-like experience, install Netlify CLI:

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Run development with Netlify functions support
netlify dev
```

This will:
- Start the Next.js dev server
- Serve Netlify functions at `/.netlify/functions/`
- Provide the exact same environment as production

### Current Status ✅

The waitlist functionality is **fully working** with both approaches:

1. **✅ Database**: Waitlist table created and tested
2. **✅ Netlify Function**: `submitWaitlist.js` working correctly  
3. **✅ Next.js API Route**: `/api/waitlist` fallback created
4. **✅ Frontend**: Automatic fallback implemented
5. **✅ Validation**: All form validation working
6. **✅ Error Handling**: Proper error messages and status codes

### Testing Results

All tests pass:
- ✅ Valid form submission
- ✅ Duplicate email handling
- ✅ Email case insensitivity
- ✅ Form validation (name, email format, length)
- ✅ HTTP method validation
- ✅ JSON parsing
- ✅ Database constraints
- ✅ Error handling

### Usage

The waitlist form should now work correctly in all environments:
- **Development** (`npm run dev`): Uses Next.js API route fallback
- **Netlify Dev** (`netlify dev`): Uses Netlify functions
- **Production** (Netlify): Uses Netlify functions

### Files Modified/Created

1. **`/netlify/functions/submitWaitlist.js`** - Main Netlify function
2. **`/src/pages/api/waitlist.js`** - Next.js API route fallback
3. **`/src/components/WaitlistModal.tsx`** - Updated with automatic fallback
4. **`/database/migrations/010_waitlist_table.sql`** - Database schema
5. **`/scripts/deploy-waitlist-table.js`** - Database deployment script
6. **`/scripts/test-waitlist.js`** - Database testing script
7. **`/scripts/test-waitlist-api.js`** - API testing script

### Development Commands

```bash
# Standard development (uses Next.js API fallback)
npm run dev

# Full Netlify development environment (requires netlify-cli)
netlify dev

# Test waitlist database
node scripts/test-waitlist.js

# Test waitlist API
node scripts/test-waitlist-api.js

# Deploy waitlist table (if needed)
node scripts/deploy-waitlist-table.js
```

### Troubleshooting

If you still see "Something went wrong":

1. **Check database connection**: Ensure `DATABASE_URL` is set in `.env.local`
2. **Check console**: Browser console will show which endpoint is being used
3. **Test database**: Run `node scripts/test-waitlist.js`
4. **Test API**: Run `node scripts/test-waitlist-api.js`

The waitlist system is now robust and will work in any environment!