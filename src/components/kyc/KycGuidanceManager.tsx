'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { KycTier, TieredKycManager } from '@/lib/compliance/tieredKyc';

// Contextual KYC prompt triggers based on user actions
export enum KycPromptTrigger {
  LARGE_DEPOSIT = 'large_deposit',
  WITHDRAWAL_ATTEMPT = 'withdrawal_attempt', 
  CARD_REQUEST = 'card_request',
  LOAN_APPLICATION = 'loan_application',
  HIGH_FREQUENCY_TRADING = 'high_frequency_trading',
  BUSINESS_UPGRADE = 'business_upgrade',
  ONBOARDING_COMPLETE = 'onboarding_complete',
  MONTHLY_LIMIT_REACHED = 'monthly_limit_reached',
  CROSS_CHAIN_BRIDGE = 'cross_chain_bridge'
}

interface KycPromptConfig {
  title: string;
  subtitle: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  benefits: string[];
  consequences?: string[];
  recommendedTier: KycTier;
  estimatedTime: string;
  context: string;
  illustration: string;
  primaryAction: string;
  secondaryAction?: string;
}

// Contextual messaging framework inspired by Stripe, Coinbase, Revolut
const KYC_PROMPT_CONFIGS: Record<KycPromptTrigger, KycPromptConfig> = {
  [KycPromptTrigger.LARGE_DEPOSIT]: {
    title: "🎉 Large deposit detected!",
    subtitle: "Unlock full access to use your $[AMOUNT]",
    urgency: 'high',
    benefits: [
      "Instantly access your full deposit",
      "Remove monthly transaction limits", 
      "Enable cross-chain transfers",
      "Access premium trading features"
    ],
    consequences: [
      "Deposit may be held pending verification",
      "Limited access to funds until verified"
    ],
    recommendedTier: KycTier.TIER_2,
    estimatedTime: "5-7 minutes",
    context: "Complete verification now to access your full deposit immediately",
    illustration: "💰",
    primaryAction: "Verify Now & Access Funds",
    secondaryAction: "I'll verify later"
  },

  [KycPromptTrigger.WITHDRAWAL_ATTEMPT]: {
    title: "Almost there! Quick verification needed",
    subtitle: "Secure your account to withdraw $[AMOUNT]",
    urgency: 'critical',
    benefits: [
      "Process withdrawal immediately",
      "Increase future withdrawal limits",
      "Enable automated withdrawals",
      "Priority transaction processing"
    ],
    consequences: [
      "Withdrawal blocked until verification",
      "Continued account limitations"
    ],
    recommendedTier: KycTier.TIER_1,
    estimatedTime: "3 minutes",
    context: "For your security and regulatory compliance, we need to verify your identity",
    illustration: "🔒",
    primaryAction: "Verify & Withdraw",
    secondaryAction: "Cancel withdrawal"
  },

  [KycPromptTrigger.CARD_REQUEST]: {
    title: "🎯 Unlock your USD Financial Card",
    subtitle: "Complete enhanced verification for debit card access",
    urgency: 'medium',
    benefits: [
      "Instant virtual debit card",
      "Physical card shipping",
      "Worldwide acceptance",
      "Real-time spending controls",
      "2% cashback on purchases"
    ],
    recommendedTier: KycTier.TIER_3,
    estimatedTime: "8-10 minutes",
    context: "Cards require enhanced identity verification for your protection",
    illustration: "💳",
    primaryAction: "Complete Verification",
    secondaryAction: "Learn more about cards"
  },

  [KycPromptTrigger.ONBOARDING_COMPLETE]: {
    title: "🚀 Welcome to USD Financial!",
    subtitle: "Your wallet is ready - let's unlock full features",
    urgency: 'low',
    benefits: [
      "Send & receive without limits",
      "Access yield farming",
      "Cross-chain bridging",
      "Investment opportunities",
      "Priority customer support"
    ],
    recommendedTier: KycTier.TIER_1,
    estimatedTime: "2-3 minutes",
    context: "Take 3 minutes now to unlock the full USD Financial experience",
    illustration: "🎉",
    primaryAction: "Get Started (3 min)",
    secondaryAction: "Explore features first"
  },

  [KycPromptTrigger.MONTHLY_LIMIT_REACHED]: {
    title: "📈 You're a power user!",
    subtitle: "Upgrade verification to remove monthly limits",
    urgency: 'medium',
    benefits: [
      "Remove $[CURRENT_LIMIT] monthly limit",
      "Unlimited transaction amounts",
      "Access institutional features",
      "Dedicated account manager"
    ],
    recommendedTier: KycTier.TIER_3,
    estimatedTime: "10 minutes",
    context: "Your activity shows you're ready for our premium tier",
    illustration: "📊",
    primaryAction: "Upgrade Now",
    secondaryAction: "Wait for next month"
  },

  [KycPromptTrigger.LOAN_APPLICATION]: {
    title: "💡 Crypto-backed loans available",
    subtitle: "Enhanced verification unlocks lending features",
    urgency: 'medium',
    benefits: [
      "Borrow against your crypto",
      "Competitive interest rates",
      "No credit check required",
      "Keep your crypto ownership",
      "Flexible repayment terms"
    ],
    recommendedTier: KycTier.TIER_3,
    estimatedTime: "10-12 minutes",
    context: "Lending requires enhanced verification for regulatory compliance",
    illustration: "🏦",
    primaryAction: "Enable Loans",
    secondaryAction: "Learn about lending"
  },

  [KycPromptTrigger.HIGH_FREQUENCY_TRADING]: {
    title: "⚡ Pro trader detected",
    subtitle: "Unlock advanced trading with full verification",
    urgency: 'medium',
    benefits: [
      "Lower trading fees",
      "Advanced order types",
      "API access",
      "Margin trading",
      "Priority execution"
    ],
    recommendedTier: KycTier.TIER_2,
    estimatedTime: "6 minutes",
    context: "Your trading activity qualifies for our professional tier benefits",
    illustration: "📈",
    primaryAction: "Upgrade Trading Account",
    secondaryAction: "Continue with basic trading"
  },

  [KycPromptTrigger.BUSINESS_UPGRADE]: {
    title: "🏢 Business features available",
    subtitle: "Unlock corporate banking with business verification",
    urgency: 'low',
    benefits: [
      "Multi-user account access",
      "Corporate debit cards",
      "Bulk payment processing",
      "Advanced accounting integration",
      "Dedicated business support"
    ],
    recommendedTier: KycTier.TIER_3,
    estimatedTime: "15 minutes",
    context: "Business accounts require enhanced verification and documentation",
    illustration: "🏢",
    primaryAction: "Set Up Business Account",
    secondaryAction: "Keep personal account"
  },

  [KycPromptTrigger.CROSS_CHAIN_BRIDGE]: {
    title: "🌉 Cross-chain bridging ready",
    subtitle: "Bridge tokens across networks with verified account",
    urgency: 'medium', 
    benefits: [
      "Bridge between all major chains",
      "Lowest bridging fees",
      "Fast cross-chain swaps",
      "Multi-chain portfolio view"
    ],
    recommendedTier: KycTier.TIER_2,
    estimatedTime: "5 minutes",
    context: "Cross-chain operations require identity verification for security",
    illustration: "🌉",
    primaryAction: "Enable Bridging",
    secondaryAction: "Learn about bridges"
  }
};

interface KycGuidanceManagerProps {
  trigger?: KycPromptTrigger;
  amount?: number;
  currentLimit?: number;
  onPromptAction: (action: 'proceed' | 'dismiss' | 'learn_more') => void;
  onClose: () => void;
}

const KycGuidanceManager: React.FC<KycGuidanceManagerProps> = ({
  trigger,
  amount,
  currentLimit,
  onPromptAction,
  onClose
}) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [currentTier, setCurrentTier] = useState<KycTier>(KycTier.TIER_0);

  useEffect(() => {
    if (user?.id) {
      // Fetch current tier
      TieredKycManager.getUserTier(user.id).then(setCurrentTier);
    }
  }, [user?.id]);

  if (!trigger || !isVisible) return null;

  const config = KYC_PROMPT_CONFIGS[trigger];
  
  // Replace dynamic values in text
  const processText = (text: string) => {
    return text
      .replace('[AMOUNT]', amount ? `${amount.toLocaleString()}` : '0')
      .replace('[CURRENT_LIMIT]', currentLimit ? `$${currentLimit.toLocaleString()}` : '$0');
  };

  const urgencyStyles = {
    low: 'border-blue-200 bg-blue-50',
    medium: 'border-amber-200 bg-amber-50', 
    high: 'border-orange-200 bg-orange-50',
    critical: 'border-red-200 bg-red-50'
  };

  const urgencyColors = {
    low: 'text-blue-800',
    medium: 'text-amber-800',
    high: 'text-orange-800', 
    critical: 'text-red-800'
  };

  const handleAction = (action: 'proceed' | 'dismiss' | 'learn_more') => {
    setIsVisible(false);
    onPromptAction(action);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-lg w-full rounded-2xl border-2 ${urgencyStyles[config.urgency]} bg-white shadow-2xl`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-4xl mb-3">{config.illustration}</div>
              <h3 className={`text-xl font-bold ${urgencyColors[config.urgency]} mb-1`}>
                {processText(config.title)}
              </h3>
              <p className="text-gray-600">
                {processText(config.subtitle)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Context & Time Estimate */}
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {config.estimatedTime} • {processText(config.context)}
          </div>
        </div>

        {/* Benefits */}
        <div className="p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            You'll unlock:
          </h4>
          <ul className="space-y-2 mb-4">
            {config.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 text-sm">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* Consequences (if any) */}
          {config.consequences && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 text-amber-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Without verification:
              </h4>
              <ul className="space-y-2 mb-4">
                {config.consequences.map((consequence, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm">{consequence}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => handleAction('proceed')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
              config.urgency === 'critical' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {config.primaryAction}
          </button>
          
          {config.secondaryAction && (
            <button
              onClick={() => handleAction('dismiss')}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {config.secondaryAction}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KycGuidanceManager;