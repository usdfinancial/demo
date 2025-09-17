'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { KycTier, TieredKycService } from '@/lib/services/tieredKycService'

interface KycGuidanceState {
  showPrompt: boolean
  requiredTier: KycTier | null
  currentTier: KycTier
  action: string
  amount?: number
}

export const useKycGuidance = () => {
  const { user } = useAuth()
  const [guidanceState, setGuidanceState] = useState<KycGuidanceState>({
    showPrompt: false,
    requiredTier: null,
    currentTier: KycTier.TIER_0,
    action: '',
    amount: undefined
  })

  // Check if user can perform an action, show guidance if not
  const checkActionPermission = useCallback(async (
    action: string, 
    amount?: number
  ): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const currentTier = await TieredKycService.getUserTier(user.id)
      const permission = await TieredKycService.canPerformAction(user.id, action, amount)

      if (!permission.allowed && permission.suggestedTier) {
        setGuidanceState({
          showPrompt: true,
          requiredTier: permission.suggestedTier,
          currentTier,
          action,
          amount
        })
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking action permission:', error)
      return false
    }
  }, [user?.id])

  // Close the guidance prompt
  const closeGuidance = useCallback(() => {
    setGuidanceState(prev => ({ ...prev, showPrompt: false }))
  }, [])

  // Start verification process
  const startVerification = useCallback((tier: KycTier) => {
    // Navigate to KYC page with tier context
    window.location.href = `/kyc?tier=${tier}&action=${guidanceState.action}${guidanceState.amount ? `&amount=${guidanceState.amount}` : ''}`
  }, [guidanceState])

  return {
    guidanceState,
    checkActionPermission,
    closeGuidance,
    startVerification
  }
}
