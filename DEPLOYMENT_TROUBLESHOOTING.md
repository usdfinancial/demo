# Deployment Troubleshooting - Tiered KYC Not Visible

## Issue
Deployed to Netlify but tiered KYC changes are not visible on the live site.

## Root Cause
The critical file updates required for tiered KYC were not applied due to permission restrictions during development. The deployment contains the new components but the main KYC page still uses the old implementation.

## Required Manual Updates

### 1. **CRITICAL: Update Main KYC Page**
File: `src/app/kyc/page.tsx`

**Replace entire file content with:**
```typescript
'use client'

import React from 'react';
import SimpleTieredKyc from '@/components/kyc/SimpleTieredKyc';

const KycPage = () => {
  return <SimpleTieredKyc />;
};

export default KycPage;
```

### 2. **Create Tier Management API**
Create directory: `src/app/api/user/tier/`
Create file: `src/app/api/user/tier/route.ts`

**Copy content from:** `MANUAL_TIERED_KYC_UPDATES.md` (section 2)

### 3. **Add Environment Variables**
In Netlify dashboard → Site settings → Environment variables:

```bash
NEXT_PUBLIC_PERSONA_TIER1_TEMPLATE_ID=itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8
NEXT_PUBLIC_PERSONA_TIER2_TEMPLATE_ID=itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8
NEXT_PUBLIC_PERSONA_TIER3_TEMPLATE_ID=itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8
NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID=env_ueeK7hhHJWCQ4X491rPxwy3jMVGM
```

### 4. **Update KYC API**
File: `src/app/api/user/kyc/route.ts`

Add tier support (see `MANUAL_TIERED_KYC_UPDATES.md` section 3)

## Quick Fix Steps

1. **Update `src/app/kyc/page.tsx`** (most critical)
2. **Add environment variables in Netlify**
3. **Commit and push changes**
4. **Wait for deployment**
5. **Test at https://usdfinancial.netlify.app/kyc**

## Expected Result After Fix
- Three-tier verification interface
- Tier 1, 2, 3 cards with requirements and benefits
- Persona integration for each tier
- Modern gradient UI design

## Files Already Deployed ✅
- `SimpleTieredKyc.tsx` - Main tiered component
- `TieredKycService.ts` - Business logic
- `KycPromptModal.tsx` - User guidance modals
- `KycGatedAction.tsx` - Contextual prompts

## Current Status
The infrastructure is deployed but not connected. The main KYC page needs to import `SimpleTieredKyc` instead of the old implementation.
