# Netlify Deployment & Environment Setup Guide

## Current Issue: 500 Error in Production

The waitlist form is working locally but failing in production with a 500 error. This is due to missing environment variables in Netlify.

## 🚨 **IMMEDIATE FIX NEEDED**

### Step 1: Set Environment Variables in Netlify

1. Go to your **Netlify Dashboard**
2. Navigate to your site: `usdfinancial.netlify.app`
3. Go to **Site settings** → **Environment variables**
4. Add the following environment variable:

```
Key: DATABASE_URL
Value: postgresql://usdfinancial:USDfinancial!@usd-financial-db.c9wk8kma0ino.us-west-2.rds.amazonaws.com:5432/usdfinancial
```

### Step 2: Trigger a New Deployment

After adding the environment variable:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Or push any change to trigger auto-deployment

### Step 3: Test the Fix

Once deployed, the waitlist form should work correctly.

## 📋 **Environment Variables Required**

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `postgresql://usdfinancial:USDfinancial!@usd-financial-db.c9wk8kma0ino.us-west-2.rds.amazonaws.com:5432/usdfinancial` | Database connection string |
| `NODE_ENV` | `production` | (Optional - Netlify sets this automatically) |

## 🔧 **Enhanced Error Handling**

The Netlify function has been updated with:
- ✅ Better error logging and debugging
- ✅ Environment variable validation
- ✅ Database connection error handling
- ✅ Improved SSL configuration for AWS RDS
- ✅ Production-specific timeouts and pool settings

## 🧪 **How to Verify the Fix**

### 1. Check Netlify Function Logs
1. Go to **Functions** tab in Netlify dashboard
2. Click on `submitWaitlist` function
3. View the logs to see detailed error information

### 2. Test the Waitlist Form
1. Visit `https://usdfinancial.netlify.app`
2. Try to submit the waitlist form
3. Check browser Network tab for response details

### 3. Expected Success Response
```json
{
  "success": true,
  "message": "Successfully joined the waitlist!",
  "data": {
    "id": 123,
    "name": "User Name",
    "email": "user@example.com",
    "joined_at": "2025-09-12T20:15:30.000Z"
  }
}
```

## 🐛 **Troubleshooting**

### If Still Getting 500 Error:

1. **Check Netlify Function Logs**:
   - Look for specific error messages
   - Common issues: `DATABASE_URL missing`, `Connection refused`, `SSL error`

2. **Database Connection Issues**:
   - Verify AWS RDS is running and accessible
   - Check security group allows Netlify IPs
   - Confirm database credentials are correct

3. **SSL Configuration**:
   - AWS RDS requires SSL in production
   - Function automatically detects and configures SSL

### Common Error Messages:

| Error | Cause | Solution |
|-------|-------|----------|
| `DB_URL_MISSING` | DATABASE_URL not set in Netlify | Add environment variable |
| `DB_CONN_ERROR` | Cannot connect to database | Check RDS settings and security groups |
| `23505` | Duplicate email | User already on waitlist (expected behavior) |

## 📊 **Current Function Features**

✅ **Validation**:
- Required fields (name, email)
- Email format validation
- Name length validation (min 2 chars)

✅ **Security**:
- SQL injection prevention
- Input sanitization
- CORS headers
- Method validation

✅ **Database**:
- Connection pooling
- SSL support for production
- Automatic retries
- Proper error handling

✅ **User Experience**:
- Duplicate email detection
- Clear error messages
- Success confirmation

## 🚀 **Post-Deployment Checklist**

- [ ] Environment variable `DATABASE_URL` set in Netlify
- [ ] New deployment triggered after adding env var
- [ ] Function logs show successful database connection
- [ ] Waitlist form works without 500 errors
- [ ] Email validation working correctly
- [ ] Duplicate email handling working
- [ ] Success message displays properly

## 📞 **Need Help?**

If issues persist after following these steps:
1. Check the Netlify function logs for specific error messages
2. Verify the database is accessible from Netlify's infrastructure
3. Test the function locally with the same DATABASE_URL

The issue should resolve immediately once the `DATABASE_URL` environment variable is properly configured in Netlify.