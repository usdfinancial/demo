import { userService } from './userService'

export enum KycTier {
  TIER_0 = 'tier_0',
  TIER_1 = 'tier_1', 
  TIER_2 = 'tier_2',
  TIER_3 = 'tier_3'
}

export interface TierLimits {
  maxTransactionAmount: number
  maxMonthlyVolume: number
  allowedFeatures: string[]
}

export interface TierUpgradeResult {
  success: boolean
  newTier?: KycTier
  reason?: string
}

export class TieredKycService {
  private static readonly TIER_LIMITS: Record<KycTier, TierLimits> = {
    [KycTier.TIER_0]: {
      maxTransactionAmount: 0,
      maxMonthlyVolume: 0,
      allowedFeatures: ['wallet']
    },
    [KycTier.TIER_1]: {
      maxTransactionAmount: 1000,
      maxMonthlyVolume: 3000,
      allowedFeatures: ['wallet', 'transfer', 'swap']
    },
    [KycTier.TIER_2]: {
      maxTransactionAmount: 10000,
      maxMonthlyVolume: 50000,
      allowedFeatures: ['wallet', 'transfer', 'swap', 'deposit', 'withdraw', 'bridge', 'defi']
    },
    [KycTier.TIER_3]: {
      maxTransactionAmount: Infinity,
      maxMonthlyVolume: Infinity,
      allowedFeatures: ['wallet', 'transfer', 'swap', 'deposit', 'withdraw', 'bridge', 'defi', 'card', 'loan']
    }
  }

  static getTierLimits(tier: KycTier): TierLimits {
    return this.TIER_LIMITS[tier] || this.TIER_LIMITS[KycTier.TIER_0]
  }

  static getAllowedFeatures(tier: KycTier): string[] {
    return this.getTierLimits(tier).allowedFeatures
  }

  static formatTierName(tier: KycTier): string {
    const names = {
      [KycTier.TIER_0]: 'Tier 0',
      [KycTier.TIER_1]: 'Tier 1 - Basic',
      [KycTier.TIER_2]: 'Tier 2 - Full', 
      [KycTier.TIER_3]: 'Tier 3 - Enhanced'
    }
    return names[tier] || 'Unknown'
  }

  static getTierColor(tier: KycTier) {
    const colors = {
      [KycTier.TIER_0]: { bg: 'bg-gray-100', text: 'text-gray-800' },
      [KycTier.TIER_1]: { bg: 'bg-blue-100', text: 'text-blue-800' },
      [KycTier.TIER_2]: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      [KycTier.TIER_3]: { bg: 'bg-purple-100', text: 'text-purple-800' }
    }
    return colors[tier] || colors[KycTier.TIER_0]
  }

  static async getUserTier(userId: string): Promise<KycTier> {
    try {
      const user = await userService.getUserProfile(userId)
      return (user?.metadata?.currentTier as KycTier) || KycTier.TIER_0
    } catch (error) {
      console.error('Error fetching user tier:', error)
      return KycTier.TIER_0
    }
  }

  static async upgradeTier(userId: string, targetTier: KycTier, reason?: string): Promise<TierUpgradeResult> {
    try {
      const user = await userService.getUserProfile(userId)
      if (!user) {
        return { success: false, reason: 'User not found' }
      }

      const currentTier = (user.metadata?.currentTier as KycTier) || KycTier.TIER_0
      
      // Validate upgrade path
      if (!this.canUpgradeToTier(currentTier, targetTier)) {
        return { success: false, reason: 'Invalid tier upgrade path' }
      }

      // Update user metadata
      await userService.updateUserProfile(userId, {
        metadata: {
          ...user.metadata,
          currentTier: targetTier,
          tierUpgradedAt: new Date().toISOString(),
          tierUpgradeReason: reason || 'KYC verification completed'
        }
      })

      return { success: true, newTier: targetTier }
    } catch (error) {
      console.error('Error upgrading tier:', error)
      return { success: false, reason: 'Failed to upgrade tier' }
    }
  }

  static canUpgradeToTier(currentTier: KycTier, targetTier: KycTier): boolean {
    const tierOrder = [KycTier.TIER_0, KycTier.TIER_1, KycTier.TIER_2, KycTier.TIER_3]
    const currentIndex = tierOrder.indexOf(currentTier)
    const targetIndex = tierOrder.indexOf(targetTier)
    
    return targetIndex > currentIndex
  }

  static async canPerformAction(userId: string, action: string, amount?: number): Promise<{
    allowed: boolean
    reason?: string
    suggestedTier?: KycTier
  }> {
    try {
      const currentTier = await this.getUserTier(userId)
      const limits = this.getTierLimits(currentTier)
      
      // Check feature access
      if (!limits.allowedFeatures.includes(action)) {
        const suggestedTier = this.getMinimumTierForAction(action)
        return {
          allowed: false,
          reason: `Action '${action}' requires ${this.formatTierName(suggestedTier)} verification`,
          suggestedTier
        }
      }

      // Check amount limits
      if (amount && amount > limits.maxTransactionAmount) {
        const suggestedTier = this.getMinimumTierForAmount(amount)
        return {
          allowed: false,
          reason: `Amount $${amount} exceeds limit of $${limits.maxTransactionAmount}`,
          suggestedTier
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking action permission:', error)
      return { allowed: false, reason: 'Failed to check permissions' }
    }
  }

  static getMinimumTierForAction(action: string): KycTier {
    if (action === 'card' || action === 'loan') return KycTier.TIER_3
    if (action === 'defi' || action === 'bridge' || action === 'deposit' || action === 'withdraw') return KycTier.TIER_2
    if (action === 'transfer' || action === 'swap') return KycTier.TIER_1
    return KycTier.TIER_1
  }

  static getMinimumTierForAmount(amount: number): KycTier {
    if (amount > 10000) return KycTier.TIER_3
    if (amount > 1000) return KycTier.TIER_2
    if (amount > 0) return KycTier.TIER_1
    return KycTier.TIER_0
  }

  static async calculateMonthlyVolume(userId: string): Promise<number> {
    try {
      // Import transaction service for volume calculations
      const { query } = await import('@/lib/database/index')

      // Calculate monthly volume from transactions in the last 30 days
      const monthlyVolumeQuery = `
        SELECT
          COALESCE(SUM(amount::numeric), 0) as monthly_volume
        FROM transactions
        WHERE user_id = $1
          AND status = 'completed'
          AND created_at >= NOW() - INTERVAL '30 days'
          AND transaction_type IN ('deposit', 'withdrawal', 'transfer', 'spend', 'investment')
      `

      const result = await query(monthlyVolumeQuery, [userId])
      const monthlyVolume = parseFloat(result.rows[0]?.monthly_volume || '0')

      console.log(`📊 Monthly volume calculated for user ${userId}:`, {
        volume: monthlyVolume,
        period: 'last 30 days'
      })

      return monthlyVolume
    } catch (error) {
      console.error('Error calculating monthly volume:', error)
      return 0 // Return 0 on error to avoid blocking KYC checks
    }
  }

  static getTierRequirements(tier: KycTier): string[] {
    const requirements = {
      [KycTier.TIER_0]: ['Email verification'],
      [KycTier.TIER_1]: ['Phone verification', 'Basic identity information', 'Email confirmation'],
      [KycTier.TIER_2]: ['Government-issued ID', 'Selfie verification', 'Address verification', 'Sanctions screening'],
      [KycTier.TIER_3]: ['Enhanced documentation', 'Proof of funds verification', 'Source of wealth documentation', 'Enhanced sanctions screening']
    }
    return requirements[tier] || []
  }

  static getTierBenefits(tier: KycTier): string[] {
    const benefits = {
      [KycTier.TIER_0]: ['Secure wallet creation', 'Basic account access'],
      [KycTier.TIER_1]: ['Send up to $1,000 per transaction', 'Monthly volume up to $3,000', 'Basic swaps and transfers'],
      [KycTier.TIER_2]: ['Transactions up to $10,000', 'Monthly volume up to $50,000', 'Fiat on/off ramps', 'Cross-chain bridging', 'DeFi yield farming'],
      [KycTier.TIER_3]: ['Unlimited transaction amounts', 'Stablecoin debit cards', 'Crypto-collateralized loans', 'DeFi insurance products', 'Business account features']
    }
    return benefits[tier] || []
  }
}

export const tieredKycService = new TieredKycService()
