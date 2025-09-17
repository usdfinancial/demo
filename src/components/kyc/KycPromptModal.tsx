'use client'

import React, { useState } from 'react'
import { KycTier, TieredKycService } from '@/lib/services/tieredKycService'

interface KycPromptModalProps {
  isOpen: boolean
  onClose: () => void
  requiredTier: KycTier
  currentTier: KycTier
  action: string
  amount?: number
  onStartVerification: (tier: KycTier) => void
}

const KycPromptModal: React.FC<KycPromptModalProps> = ({
  isOpen,
  onClose,
  requiredTier,
  currentTier,
  action,
  amount,
  onStartVerification
}) => {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const tierName = TieredKycService.formatTierName(requiredTier)
  const requirements = TieredKycService.getTierRequirements(requiredTier)
  const benefits = TieredKycService.getTierBenefits(requiredTier)

  const handleStartVerification = async () => {
    setLoading(true)
    onStartVerification(requiredTier)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Verification Required
          </h2>
          <p className="text-gray-600 text-sm">
            {amount 
              ? `To ${action} $${amount.toLocaleString()}, you need ${tierName} verification`
              : `To access ${action}, you need ${tierName} verification`
            }
          </p>
        </div>

        {/* Current vs Required */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Current Level:</span>
            <span className="font-medium text-gray-900">
              {TieredKycService.formatTierName(currentTier)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Required Level:</span>
            <span className="font-medium text-blue-600">{tierName}</span>
          </div>
        </div>

        {/* Requirements */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">What you'll need:</h3>
          <ul className="space-y-2">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Benefits */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">You'll unlock:</h3>
          <ul className="space-y-1">
            {benefits.slice(0, 3).map((benefit, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span className="text-sm text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleStartVerification}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Verify Now'}
          </button>
        </div>

        {/* Time estimate */}
        <p className="text-center text-xs text-gray-500 mt-3">
          ⏱️ Takes 2-3 minutes • Bank-level security
        </p>
      </div>
    </div>
  )
}

export default KycPromptModal
