'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { KycTier, TieredKycService } from '@/lib/services/tieredKycService'

interface OnboardingStep {
  id: string
  title: string
  description: string
  tier: KycTier
  completed: boolean
  current: boolean
}

const KycOnboardingFlow: React.FC = () => {
  const { user } = useAuth()
  const [currentTier, setCurrentTier] = useState<KycTier>(KycTier.TIER_0)
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [showWelcome, setShowWelcome] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadUserTier()
    }
  }, [user?.id])

  const loadUserTier = async () => {
    if (!user?.id) return
    
    try {
      const tier = await TieredKycService.getUserTier(user.id)
      setCurrentTier(tier)
      
      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'welcome',
          title: 'Welcome to USD Financial',
          description: 'Your secure stablecoin financial platform',
          tier: KycTier.TIER_0,
          completed: true,
          current: false
        },
        {
          id: 'tier1',
          title: 'Basic Verification',
          description: 'Unlock transfers up to $1,000',
          tier: KycTier.TIER_1,
          completed: tier !== KycTier.TIER_0,
          current: tier === KycTier.TIER_0
        },
        {
          id: 'tier2',
          title: 'Full Verification',
          description: 'Access DeFi features and $10,000 limits',
          tier: KycTier.TIER_2,
          completed: tier === KycTier.TIER_2 || tier === KycTier.TIER_3,
          current: tier === KycTier.TIER_1
        },
        {
          id: 'tier3',
          title: 'Enhanced Verification',
          description: 'Unlimited access + cards and loans',
          tier: KycTier.TIER_3,
          completed: tier === KycTier.TIER_3,
          current: tier === KycTier.TIER_2
        }
      ]
      
      setSteps(onboardingSteps)
    } catch (error) {
      console.error('Error loading user tier:', error)
    }
  }

  const handleStartVerification = (tier: KycTier) => {
    window.location.href = `/kyc?tier=${tier}&onboarding=true`
  }

  const handleSkipForNow = () => {
    setShowWelcome(false)
    // Store in localStorage to not show again for a while
    localStorage.setItem('kyc_onboarding_skipped', Date.now().toString())
  }

  // Don't show if user recently skipped
  useEffect(() => {
    const skipped = localStorage.getItem('kyc_onboarding_skipped')
    if (skipped) {
      const skippedTime = parseInt(skipped)
      const daysSinceSkipped = (Date.now() - skippedTime) / (1000 * 60 * 60 * 24)
      if (daysSinceSkipped < 7) { // Don't show for 7 days
        setShowWelcome(false)
      }
    }
  }, [])

  if (!showWelcome || currentTier === KycTier.TIER_3) {
    return null
  }

  const currentStep = steps.find(step => step.current)
  const nextTier = currentStep?.tier || KycTier.TIER_1

  return (
    <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {currentTier === KycTier.TIER_0 ? 'Complete Your Setup' : 'Upgrade Your Account'}
            </h3>
            <p className="text-sm text-gray-600">
              {currentTier === KycTier.TIER_0 
                ? 'Verify your identity to start using USD Financial'
                : 'Unlock more features with higher verification levels'
              }
            </p>
          </div>
        </div>
        <button
          onClick={handleSkipForNow}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center mb-6">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.completed 
                  ? 'bg-green-100 text-green-800' 
                  : step.current 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-500'
              }`}>
                {step.completed ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                step.completed ? 'bg-green-200' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Current Step Details */}
      {currentStep && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{currentStep.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{currentStep.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Requirements: {TieredKycService.getTierRequirements(nextTier).join(', ')}
            </div>
            <div className="text-xs text-blue-600">
              ⏱️ 2-3 minutes
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handleSkipForNow}
          className="flex-1 px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg font-medium transition-colors"
        >
          Skip for Now
        </button>
        <button
          onClick={() => handleStartVerification(nextTier)}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {currentTier === KycTier.TIER_0 ? 'Get Started' : 'Upgrade Now'}
        </button>
      </div>
    </div>
  )
}

export default KycOnboardingFlow
