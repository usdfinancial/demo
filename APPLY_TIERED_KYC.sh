#!/bin/bash

# Tiered KYC Implementation Script
# This script applies all the tiered KYC changes to the codebase

echo "🚀 Applying Tiered KYC Implementation..."

# 1. Update main KYC page
echo "📝 Updating main KYC page..."
cat > src/app/kyc/page.tsx << 'EOF'
'use client'

import React from 'react';
import SimpleTieredKyc from '@/components/kyc/SimpleTieredKyc';

const KycPage = () => {
  return <SimpleTieredKyc />;
};

export default KycPage;
EOF

# 2. Create tier management API directory
echo "📁 Creating tier API directory..."
mkdir -p src/app/api/user/tier

# 3. Create tier management API
echo "🔧 Creating tier management API..."
cat > src/app/api/user/tier/route.ts << 'EOF'
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
        }
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
EOF

# 4. Update environment variables
echo "🔐 Adding environment variables..."
cat >> .env.local << 'EOF'

# Tiered KYC Configuration
NEXT_PUBLIC_PERSONA_TIER1_TEMPLATE_ID=itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8
NEXT_PUBLIC_PERSONA_TIER2_TEMPLATE_ID=itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8
NEXT_PUBLIC_PERSONA_TIER3_TEMPLATE_ID=itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8
NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID=env_ueeK7hhHJWCQ4X491rPxwy3jMVGM
EOF

# 5. Update KYC API to support tiers
echo "🔄 Updating KYC API for tier support..."
# Create backup
cp src/app/api/user/kyc/route.ts src/app/api/user/kyc/route.ts.backup

# Add tier imports and update schema (this would need manual editing)
echo "⚠️  Manual update needed for src/app/api/user/kyc/route.ts:"
echo "   - Add: import { KycTier, TieredKycService } from '@/lib/services/tieredKycService'"
echo "   - Update KYCUpdateSchema to include tier fields"
echo "   - Add tier upgrade logic in POST handler"

# 6. Update user service
echo "👤 Updating user service..."
echo "⚠️  Manual update needed for src/lib/services/userService.ts:"
echo "   - Add tier management methods"
echo "   - Import TieredKycService"

echo ""
echo "✅ Tiered KYC implementation files created!"
echo ""
echo "📋 Manual steps required:"
echo "1. Update src/app/api/user/kyc/route.ts with tier support"
echo "2. Update src/lib/services/userService.ts with tier methods"
echo "3. Commit and push changes"
echo "4. Test at https://usdfinancial.netlify.app/kyc"
echo ""
echo "🎯 Expected result: Three-tier verification UI with Persona integration"
EOF

chmod +x APPLY_TIERED_KYC.sh
