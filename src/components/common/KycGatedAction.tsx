'use client'

import React, { useState } from 'react'
import { useKycGuidance } from '@/hooks/useKycGuidance'
import KycPromptModal from '@/components/kyc/KycPromptModal'

interface KycGatedActionProps {
  action: string
  amount?: number
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

const KycGatedAction: React.FC<KycGatedActionProps> = ({
  action,
  amount,
  children,
  fallback,
  className = ''
}) => {
  const { guidanceState, checkActionPermission, closeGuidance, startVerification } = useKycGuidance()
  const [isChecking, setIsChecking] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsChecking(true)

    const canProceed = await checkActionPermission(action, amount)
    
    if (canProceed) {
      // Action is allowed, proceed normally
      const originalOnClick = (children as any)?.props?.onClick
      if (originalOnClick) {
        originalOnClick(e)
      }
    }
    // If not allowed, the guidance modal will show automatically
    
    setIsChecking(false)
  }

  return (
    <>
      <div className={className} onClick={handleClick}>
        {isChecking ? (
          fallback || (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-sm text-gray-600">Checking...</span>
            </div>
          )
        ) : (
          children
        )}
      </div>

      <KycPromptModal
        isOpen={guidanceState.showPrompt}
        onClose={closeGuidance}
        requiredTier={guidanceState.requiredTier!}
        currentTier={guidanceState.currentTier}
        action={guidanceState.action}
        amount={guidanceState.amount}
        onStartVerification={startVerification}
      />
    </>
  )
}

export default KycGatedAction
