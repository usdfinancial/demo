# Manual Tiered KYC Implementation Steps

Due to permission restrictions, please apply these changes manually to complete the tiered KYC system:

## 1. Update Main KYC Page (`src/app/kyc/page.tsx`)

Replace the entire file content with:

```typescript
'use client'

import React from 'react';
import SimpleTieredKyc from '@/components/kyc/SimpleTieredKyc';

const KycPage = () => {
  return <SimpleTieredKyc />;
};

export default KycPage;
```

## 2. Create Tier Management API

Create directory: `src/app/api/user/tier/`

Create file: `src/app/api/user/tier/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/middleware/errorHandler'
import { authenticateApiRequest, requireResourceAccess } from '@/lib/middleware/auth'
import { applyRateLimit, apiRateLimiter } from '@/lib/middleware/rateLimiting'
import { validateRequest } from '@/lib/validation/middleware'
import { userService } from '@/lib/services/userService'
import { KycTier, TieredKycService } from '@/lib/services/tieredKycService'

const TierQuerySchema = z.object({
  userId: z.string().uuid().optional()
})

const TierUpdateSchema = z.object({
  targetTier: z.nativeEnum(KycTier),
  reason: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

const ActionValidationSchema = z.object({
  action: z.string(),
  amount: z.number().optional()
})

// GET /api/user/tier - Get current tier info
export const GET = withErrorHandler(async (request: NextRequest, requestId: string) => {
  await applyRateLimit(request, apiRateLimiter)
  
  const authenticatedUser = await authenticateApiRequest(request)
  
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') || authenticatedUser.id
  
  if (!userId) {
    throw new Error('User ID is required')
  }
  
  requireResourceAccess(userId)(authenticatedUser)
  
  try {
    const user = await userService.getUserProfile(userId)
    
    if (!user) {
      throw new Error('User not found')
    }
    
    const currentTier = await TieredKycService.getUserTier(userId)
    const kycStatus = user.kyc_status || 'unverified'
    const tierLimits = TieredKycService.getTierLimits(currentTier)
    const monthlyVolumeUsed = await TieredKycService.calculateMonthlyVolume(userId)
    
    return NextResponse.json({
      success: true,
      data: {
        currentTier,
        kycStatus,
        tierLimits: {
          maxTransactionAmount: tierLimits.maxTransactionAmount,
          maxMonthlyVolume: tierLimits.maxMonthlyVolume,
          monthlyVolumeUsed,
          monthlyVolumeRemaining: tierLimits.maxMonthlyVolume === Infinity 
            ? Infinity 
            : Math.max(0, tierLimits.maxMonthlyVolume - monthlyVolumeUsed)
        },
        allowedFeatures: tierLimits.allowedFeatures,
        tierDisplay: {
          name: TieredKycService.formatTierName(currentTier),
          color: TieredKycService.getTierColor(currentTier)
        },
        requirements: TieredKycService.getTierRequirements(currentTier),
        benefits: TieredKycService.getTierBenefits(currentTier)
      },
      timestamp: new Date().toISOString(),
      requestId
    })
  } catch (error) {
    console.error('Error fetching tier info:', error)
    throw new Error('Failed to fetch tier information')
  }
})

// POST /api/user/tier - Update user tier
export const POST = withErrorHandler(async (request: NextRequest, requestId: string) => {
  await applyRateLimit(request, apiRateLimiter)
  
  const authenticatedUser = await authenticateApiRequest(request)
  
  const { body: validatedBody } = await validateRequest(request, {
    body: TierUpdateSchema
  })
  
  const userId = authenticatedUser.id
  
  try {
    const currentTier = await TieredKycService.getUserTier(userId)
    const upgradeResult = await TieredKycService.upgradeTier(
      userId, 
      validatedBody.targetTier, 
      validatedBody.reason
    )
    
    if (!upgradeResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Tier upgrade failed',
        reason: upgradeResult.reason
      }, { status: 400 })
    }
    
    const tierLimits = TieredKycService.getTierLimits(validatedBody.targetTier)
    
    return NextResponse.json({
      success: true,
      data: {
        previousTier: currentTier,
        newTier: validatedBody.targetTier,
        tierLimits,
        allowedFeatures: tierLimits.allowedFeatures,
        upgradedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      requestId
    })
  } catch (error) {
    console.error('Error updating tier:', error)
    throw new Error('Failed to update tier')
  }
})

// PUT /api/user/tier - Validate action against tier limits
export const PUT = withErrorHandler(async (request: NextRequest, requestId: string) => {
  await applyRateLimit(request, apiRateLimiter)
  
  const authenticatedUser = await authenticateApiRequest(request)
  
  const { body: validatedBody } = await validateRequest(request, {
    body: ActionValidationSchema
  })
  
  const userId = authenticatedUser.id
  
  try {
    const actionResult = await TieredKycService.canPerformAction(
      userId,
      validatedBody.action,
      validatedBody.amount
    )
    
    return NextResponse.json({
      success: true,
      data: {
        allowed: actionResult.allowed,
        reason: actionResult.reason,
        suggestedTier: actionResult.suggestedTier,
        currentTier: await TieredKycService.getUserTier(userId)
      },
      timestamp: new Date().toISOString(),
      requestId
    })
  } catch (error) {
    console.error('Error validating action:', error)
    throw new Error('Failed to validate action')
  }
})
```

## 3. Update KYC API (`src/app/api/user/kyc/route.ts`)

Add these imports at the top:
```typescript
import { KycTier, TieredKycService } from '@/lib/services/tieredKycService'
```

Update the KYCUpdateSchema to include tier fields:
```typescript
const KYCUpdateSchema = z.object({
  inquiryId: z.string().min(1, 'Inquiry ID is required'),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']).optional(),
  tier: z.nativeEnum(KycTier).optional(),
  targetTier: z.nativeEnum(KycTier).optional(),
  metadata: z.record(z.any()).optional()
})
```

In the POST handler, after successful KYC update, add tier upgrade logic:
```typescript
// Add after line where KYC status is updated successfully
if (data.success && validatedBody.tier) {
  // Update user tier on successful KYC
  const tierUpgradeResult = await TieredKycService.upgradeTier(
    userId, 
    validatedBody.tier, 
    'KYC verification completed'
  )
  
  if (tierUpgradeResult.success) {
    console.log(`User ${userId} upgraded to ${validatedBody.tier}`)
  }
}
```

## 4. Update User Service (`src/lib/services/userService.ts`)

Add these methods to the userService class:
```typescript
async updateUserTier(userId: string, tier: string) {
  return this.updateUserProfile(userId, {
    metadata: {
      currentTier: tier,
      tierUpdatedAt: new Date().toISOString()
    }
  })
},

async getUserTier(userId: string) {
  const user = await this.getUserProfile(userId)
  return user?.metadata?.currentTier || 'tier_0'
},

async getUserTierInfo(userId: string) {
  const user = await this.getUserProfile(userId)
  const currentTier = user?.metadata?.currentTier || 'tier_0'
  
  return {
    currentTier,
    tierUpdatedAt: user?.metadata?.tierUpdatedAt,
    kycStatus: user?.kyc_status || 'unverified'
  }
}
```

## 5. Add Environment Variables

Add to your `.env.local` file:
```bash
# Tiered KYC Configuration
NEXT_PUBLIC_PERSONA_TIER1_TEMPLATE_ID=itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8
NEXT_PUBLIC_PERSONA_TIER2_TEMPLATE_ID=itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8
NEXT_PUBLIC_PERSONA_TIER3_TEMPLATE_ID=itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8
NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID=env_ueeK7hhHJWCQ4X491rPxwy3jMVGM
```

## 6. Deploy and Test

After making these changes:

1. Commit and push to your repository
2. Wait for deployment to complete
3. Visit https://usdfinancial.netlify.app/kyc
4. You should see the new tiered KYC interface with three verification tiers

## Expected Results

- **Tier Selection UI**: Three cards showing Tier 1, 2, and 3 with requirements and benefits
- **Persona Integration**: Each tier opens appropriate Persona verification flow
- **Real-time Status**: Current tier and limits displayed
- **Progressive Upgrades**: Clear upgrade paths and notifications
- **Mobile Optimized**: Responsive design for all devices

## Files Already Created

✅ `src/components/kyc/SimpleTieredKyc.tsx` - Main tiered KYC component
✅ `src/lib/services/tieredKycService.ts` - Tier management service
✅ Implementation guides and documentation

The SimpleTieredKyc component is fully functional and ready to use once you update the main KYC page to import it.
