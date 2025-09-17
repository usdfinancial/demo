import { userService } from '@/lib/services/userService'

export enum KycTier {
  TIER_0 = 'tier_0', // Wallet-only access
  TIER_1 = 'tier_1', // Low-value activity (≤$1k tx, ≤$3k/month)
  TIER_2 = 'tier_2', // Core services (on/off ramps, swaps, yield)
  TIER_3 = 'tier_3'  // High-value/institutional (>$10k, loans, cards)
}

interface TierLimits {
  maxTransactionAmount: number
  maxMonthlyVolume: number
  maxDailyVolume: number
  allowedFeatures: string[]
  kycRequirements: string[]
}

export class TieredKycManager {
  private static tierLimits: Record<KycTier, TierLimits> = {
    [KycTier.TIER_0]: {
      maxTransactionAmount: 0, // View-only
      maxMonthlyVolume: 0,
      maxDailyVolume: 0,
      allowedFeatures: ['wallet_view', 'balance_check', 'receive_assets', 'portfolio_analytics'],
      kycRequirements: ['email_verification']
    },
    [KycTier.TIER_1]: {
      maxTransactionAmount: 1000,
      maxMonthlyVolume: 3000,
      maxDailyVolume: 1000,
      allowedFeatures: ['basic_transfers', 'small_swaps', 'portfolio_view', 'transaction_history'],
      kycRequirements: ['email_verification', 'phone_verification', 'basic_id_match']
    },
    [KycTier.TIER_2]: {
      maxTransactionAmount: 10000,
      maxMonthlyVolume: 50000,
      maxDailyVolume: 15000,
      allowedFeatures: ['on_off_ramps', 'cross_chain_bridge', 'yield_farming', 'investments', 'advanced_trading'],
      kycRequirements: ['government_id', 'selfie_verification', 'address_verification', 'sanctions_screening']
    },
    [KycTier.TIER_3]: {
      maxTransactionAmount: Infinity,
      maxMonthlyVolume: Infinity,
      maxDailyVolume: 100000,
      allowedFeatures: ['all_features', 'loans', 'cards', 'insurance', 'business_accounts', 'institutional_trading'],
      kycRequirements: ['enhanced_kyc', 'proof_of_funds', 'ubo_verification', 'enhanced_screening']
    }
  }

  /**
   * Determine required KYC tier based on intended activity
   */
  static async assessRequiredTier(
    userId: string,
    intendedFeature: string,
    transactionAmount?: number
  ): Promise<KycTier> {
    try {
      // Check current user tier
      const user = await userService.getUserProfile(userId)
      const currentTier = user?.metadata?.kycTier || KycTier.TIER_0

      // Determine minimum tier for intended activity
      let requiredTier = KycTier.TIER_0

      // Feature-based tier requirements
      if (['loans', 'cards', 'insurance', 'business_accounts', 'institutional_trading'].includes(intendedFeature)) {
        requiredTier = KycTier.TIER_3
      } else if (['on_off_ramps', 'cross_chain_bridge', 'yield_farming', 'investments', 'advanced_trading'].includes(intendedFeature)) {
        requiredTier = KycTier.TIER_2
      } else if (['basic_transfers', 'small_swaps', 'transaction_history'].includes(intendedFeature)) {
        requiredTier = KycTier.TIER_1
      }

      // Amount-based tier requirements
      if (transactionAmount) {
        if (transactionAmount > 10000) {
          requiredTier = KycTier.TIER_3
        } else if (transactionAmount > 1000) {
          requiredTier = Math.max(requiredTier as any, KycTier.TIER_2 as any) as KycTier
        } else if (transactionAmount > 0) {
          requiredTier = Math.max(requiredTier as any, KycTier.TIER_1 as any) as KycTier
        }
      }

      return requiredTier
    } catch (error) {
      console.error('❌ Tier assessment error:', error)
      return KycTier.TIER_3 // Default to highest tier for safety
    }
  }

  /**
   * Check if user can perform an action based on their current tier
   */
  static async canPerformAction(
    userId: string,
    feature: string,
    amount?: number
  ): Promise<{ allowed: boolean; requiredTier?: KycTier; reason?: string; currentTier?: KycTier }> {
    try {
      const user = await userService.getUserProfile(userId)
      const currentTier = user?.metadata?.kycTier || KycTier.TIER_0
      const requiredTier = await this.assessRequiredTier(userId, feature, amount)

      // Check if current tier is sufficient
      const tierHierarchy = [KycTier.TIER_0, KycTier.TIER_1, KycTier.TIER_2, KycTier.TIER_3]
      const currentTierIndex = tierHierarchy.indexOf(currentTier)
      const requiredTierIndex = tierHierarchy.indexOf(requiredTier)

      if (currentTierIndex >= requiredTierIndex) {
        // Check transaction limits
        const limits = this.tierLimits[currentTier]
        
        if (amount && amount > limits.maxTransactionAmount) {
          return {
            allowed: false,
            currentTier,
            requiredTier: KycTier.TIER_3,
            reason: `Transaction amount $${amount.toLocaleString()} exceeds tier limit of $${limits.maxTransactionAmount.toLocaleString()}`
          }
        }

        // Check monthly volume
        const monthlyVolume = await this.getMonthlyVolume(userId)
        if (amount && (monthlyVolume + amount) > limits.maxMonthlyVolume) {
          return {
            allowed: false,
            currentTier,
            requiredTier: this.getNextTier(currentTier),
            reason: `Monthly volume limit of $${limits.maxMonthlyVolume.toLocaleString()} would be exceeded`
          }
        }

        return { allowed: true, currentTier }
      }

      return {
        allowed: false,
        currentTier,
        requiredTier,
        reason: `Feature '${feature}' requires ${requiredTier.replace('_', ' ').toUpperCase()} verification`
      }
    } catch (error) {
      console.error('❌ Action permission check error:', error)
      return { 
        allowed: false, 
        reason: 'Unable to verify permissions. Please try again or contact support.' 
      }
    }
  }

  /**
   * Upgrade user to higher KYC tier
   */
  static async upgradeTier(userId: string, targetTier: KycTier): Promise<void> {
    try {
      const user = await userService.getUserProfile(userId)
      const currentTier = user?.metadata?.kycTier || KycTier.TIER_0

      console.log(`📈 Upgrading user ${userId} from ${currentTier} to ${targetTier}`)

      // Update user tier in database
      await userService.updateUserMetadata(userId, {
        kycTier: targetTier,
        tierUpgradedAt: new Date().toISOString(),
        previousTier: currentTier,
        accountStatus: 'active' // Clear any upgrade requirements
      })

      // Log tier upgrade for compliance
      await userService.logComplianceEvent({
        userId,
        eventType: 'TIER_UPGRADE',
        fromTier: currentTier,
        toTier: targetTier,
        timestamp: new Date().toISOString(),
        source: 'kyc_verification'
      })

      console.log(`✅ Successfully upgraded user ${userId} to ${targetTier}`)

    } catch (error) {
      console.error('❌ Tier upgrade error:', error)
      throw error
    }
  }

  /**
   * Enhanced deposit monitoring with tier-based limits
   */
  static async monitorTieredDeposit(
    userId: string,
    amount: number,
    stablecoin: string,
    chainId: string,
    txHash: string,
    walletAddress: string
  ): Promise<void> {
    try {
      const user = await userService.getUserProfile(userId)
      const currentTier = user?.metadata?.kycTier || KycTier.TIER_0
      const limits = this.tierLimits[currentTier]

      console.log(`🔍 Tiered deposit monitoring:`, {
        userId,
        amount,
        currentTier,
        maxTransaction: limits.maxTransactionAmount,
        maxMonthly: limits.maxMonthlyVolume
      })

      // Check if deposit exceeds tier limits
      if (amount > limits.maxTransactionAmount) {
        const requiredTier = await this.assessRequiredTier(userId, 'large_deposit', amount)
        
        await this.handleTierUpgradeRequired(userId, amount, currentTier, requiredTier)
      }

      // Check monthly volume limits
      const monthlyVolume = await this.getMonthlyVolume(userId)
      if ((monthlyVolume + amount) > limits.maxMonthlyVolume) {
        const nextTier = this.getNextTier(currentTier)
        await this.handleTierUpgradeRequired(userId, amount, currentTier, nextTier)
      }

      // Log deposit for compliance tracking
      await userService.logComplianceEvent({
        userId,
        eventType: 'DEPOSIT_MONITORED',
        amount,
        stablecoin,
        chainId,
        txHash,
        walletAddress,
        currentTier,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('❌ Tiered deposit monitoring error:', error)
    }
  }

  /**
   * Handle tier upgrade requirements
   */
  private static async handleTierUpgradeRequired(
    userId: string,
    amount: number,
    currentTier: KycTier,
    requiredTier: KycTier
  ): Promise<void> {
    try {
      // Notify user of tier upgrade requirement
      await userService.sendNotification(userId, {
        type: 'TIER_UPGRADE_REQUIRED',
        title: '🔐 Account Verification Required',
        message: `Your recent activity requires ${requiredTier.replace('_', ' ').toUpperCase()} verification. Complete verification to continue with full access.`,
        actionUrl: `/kyc?tier=${requiredTier}&amount=${amount}`,
        priority: 'high',
        category: 'compliance'
      })

      // Limit account until upgrade is complete
      await userService.updateUserMetadata(userId, {
        accountStatus: 'tier_upgrade_required',
        requiredTier,
        upgradeReason: 'TRANSACTION_LIMIT_EXCEEDED',
        upgradeDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        restrictedAt: new Date().toISOString()
      })

      console.log(`⚠️ User ${userId} requires upgrade from ${currentTier} to ${requiredTier}`)

    } catch (error) {
      console.error('❌ Tier upgrade handling error:', error)
    }
  }

  /**
   * Get user's monthly transaction volume
   */
  private static async getMonthlyVolume(userId: string): Promise<number> {
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const transactions = await userService.getUserTransactions(userId, {
        startDate: startOfMonth,
        endDate: new Date(),
        includeIncoming: false // Only count outgoing transactions for limits
      })

      return transactions.reduce((total, tx) => {
        const amount = parseFloat(tx.amount) || 0
        return total + Math.abs(amount) // Use absolute value for volume calculation
      }, 0)
    } catch (error) {
      console.error('❌ Monthly volume calculation error:', error)
      return 0
    }
  }

  /**
   * Get next tier in hierarchy
   */
  private static getNextTier(currentTier: KycTier): KycTier {
    const tierOrder = [KycTier.TIER_0, KycTier.TIER_1, KycTier.TIER_2, KycTier.TIER_3]
    const currentIndex = tierOrder.indexOf(currentTier)
    return tierOrder[Math.min(currentIndex + 1, tierOrder.length - 1)]
  }

  /**
   * Get tier requirements for UI display
   */
  static getTierRequirements(tier: KycTier): TierLimits {
    return { ...this.tierLimits[tier] } // Return a copy to prevent mutations
  }

  /**
   * Get all tier information for comparison UI
   */
  static getAllTierRequirements(): Record<KycTier, TierLimits> {
    return Object.keys(this.tierLimits).reduce((acc, tier) => {
      acc[tier as KycTier] = { ...this.tierLimits[tier as KycTier] }
      return acc
    }, {} as Record<KycTier, TierLimits>)
  }

  /**
   * Format tier for display
   */
  static formatTierName(tier: KycTier): string {
    const tierNames = {
      [KycTier.TIER_0]: 'Wallet Only',
      [KycTier.TIER_1]: 'Basic Verified',
      [KycTier.TIER_2]: 'Fully Verified',
      [KycTier.TIER_3]: 'Enhanced Verified'
    }
    return tierNames[tier] || tier
  }

  /**
   * Get tier color for UI consistency
   */
  static getTierColor(tier: KycTier): { bg: string; text: string; border: string } {
    const colors = {
      [KycTier.TIER_0]: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
      [KycTier.TIER_1]: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
      [KycTier.TIER_2]: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
      [KycTier.TIER_3]: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' }
    }
    return colors[tier] || colors[KycTier.TIER_0]
  }
}
