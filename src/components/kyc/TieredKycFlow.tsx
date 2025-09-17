'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { KycTier, TieredKycManager } from '@/lib/compliance/tieredKyc';

// Persona configuration with tier-specific templates
const PERSONA_CONFIG = {
  baseUrl: 'https://withpersona.com/verify',
  environmentId: (typeof window !== 'undefined' ? (window as any).ENV?.NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID : null) || 'env_ueeK7hhHJWCQ4X491rPxwy3jMVGM',
  templates: {
    [KycTier.TIER_1]: (typeof window !== 'undefined' ? (window as any).ENV?.NEXT_PUBLIC_PERSONA_TIER1_TEMPLATE_ID : null) || 'itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8',
    [KycTier.TIER_2]: (typeof window !== 'undefined' ? (window as any).ENV?.NEXT_PUBLIC_PERSONA_TIER2_TEMPLATE_ID : null) || 'itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8',
    [KycTier.TIER_3]: (typeof window !== 'undefined' ? (window as any).ENV?.NEXT_PUBLIC_PERSONA_TIER3_TEMPLATE_ID : null) || 'itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8'
  }
};

// Tier configuration with USD Financial branding
const TIER_CONFIG = {
  [KycTier.TIER_1]: {
    title: 'Basic Verification',
    subtitle: 'Quick identity check to unlock basic features',
    timeEstimate: '2-3 minutes',
    icon: '📱',
    gradient: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    requirements: [
      'Phone number verification',
      'Basic identity information (name, DOB)',
      'Email confirmation'
    ],
    benefits: [
      'Send up to $1,000 per transaction',
      'Monthly volume up to $3,000',
      'Basic swaps and transfers',
      'Transaction history access'
    ]
  },
  [KycTier.TIER_2]: {
    title: 'Full Verification',
    subtitle: 'Complete identity verification for core platform features',
    timeEstimate: '5-10 minutes',
    icon: '🆔',
    gradient: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-800',
    requirements: [
      'Government-issued ID (driver\'s license or passport)',
      'Selfie with liveness detection',
      'Address verification document',
      'Sanctions screening'
    ],
    benefits: [
      'Transactions up to $10,000',
      'Monthly volume up to $50,000',
      'Fiat on/off ramps',
      'Cross-chain bridging',
      'DeFi yield farming',
      'Investment products'
    ]
  },
  [KycTier.TIER_3]: {
    title: 'Enhanced Verification',
    subtitle: 'Premium verification for high-value and institutional features',
    timeEstimate: '10-15 minutes',
    icon: '🏆',
    gradient: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-800',
    requirements: [
      'Enhanced identity documentation',
      'Proof of funds verification',
      'Source of wealth documentation',
      'Enhanced sanctions screening',
      'Business documents (if applicable)'
    ],
    benefits: [
      'Unlimited transaction amounts',
      'Stablecoin debit cards (virtual & physical)',
      'Crypto-collateralized loans',
      'DeFi insurance products',
      'Business account features',
      'Priority customer support'
    ]
  }
};

// Custom hook for tier-aware Persona hosted flow
const usePersonaTieredFlow = ({ onComplete, onCancel, userId, targetTier }: {
  onComplete: (result: { inquiryId: string; status: string; tier: KycTier }) => void;
  onCancel: () => void;
  userId?: string;
  targetTier: KycTier;
}) => {
  const openPersonaFlow = () => {
    try {
      const templateId = PERSONA_CONFIG.templates[targetTier];
      
      if (!templateId) {
        console.error(`No Persona template configured for tier: ${targetTier}`);
        return;
      }

      // Ensure we're in a browser environment
      if (typeof window === 'undefined') {
        console.error('Window object not available');
        return;
      }

      // Create tier-specific Persona hosted flow URL
      const params = new URLSearchParams({
        'inquiry-template-id': templateId,
        'environment-id': PERSONA_CONFIG.environmentId,
        'redirect-uri': `${window.location.origin}/kyc?status=completed&tier=${targetTier}`,
        ...(userId && { 'reference-id': userId })
      });

      const personaUrl = `${PERSONA_CONFIG.baseUrl}?${params.toString()}`;
      
      console.log(`Opening Persona ${targetTier} KYC flow:`, personaUrl);

      // Open Persona in optimized popup for mobile and desktop
      const popup = window.open(
        personaUrl,
        'persona-kyc',
        'width=500,height=700,scrollbars=yes,resizable=yes,location=no,menubar=no,toolbar=no'
      );

      if (!popup) {
        console.error('Failed to open Persona popup - popup blocked?');
        return;
      }

      // Monitor popup for completion with tier context
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            const urlParams = new URLSearchParams(window.location.search);
            const status = urlParams.get('status');
            const inquiryId = urlParams.get('inquiry-id');
            const tier = urlParams.get('tier') as KycTier;

            if (status === 'completed' && inquiryId && tier) {
              onComplete({ inquiryId, status: 'completed', tier });
            } else if (status === 'cancelled') {
              onCancel();
            }
          }
        } catch (error) {
          console.error('Error checking popup status:', error);
          clearInterval(checkClosed);
        }
      }, 1000);
    } catch (error) {
      console.error('Error opening Persona flow:', error);
    }
  };

  return { open: openPersonaFlow };
};

const TieredKycFlow = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  
  // Initialize search params on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);
  
  const urlTier = searchParams?.get('tier') as KycTier;
  const isWelcome = searchParams?.get('welcome') === 'true';
  const [targetTier, setTargetTier] = useState<KycTier>(urlTier || KycTier.TIER_1);
  const [currentTier, setCurrentTier] = useState<KycTier>(KycTier.TIER_0);
  const [kycStatus, setKycStatus] = useState('unverified');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tierLimits, setTierLimits] = useState<any>(null);

  const { open } = usePersonaTieredFlow({
    userId: user?.id,
    targetTier,
    onComplete: async ({ inquiryId, status, tier }) => {
      console.log(`Persona ${tier} KYC completed: ${inquiryId} with status ${status}`);
      setLoading(true);
      
      try {
        const response = await fetch('/api/user/kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            inquiryId,
            status: status === 'completed' ? 'approved' : 'pending',
            tier,
            targetTier: tier
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update KYC status');
        }

        const data = await response.json();
        if (data.success) {
          setKycStatus(data.data.kycStatus);
          setCurrentTier(data.data.currentTier || tier);
          setError(null);
          
          console.log(`✅ Successfully upgraded to ${tier}`);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('KYC status update error:', error);
        setError('An error occurred while updating your verification status. Please contact support if this issue persists.');
      } finally {
        setLoading(false);
      }
    },
    onCancel: () => {
      console.log(`User cancelled the ${targetTier} KYC process`);
      setError(null);
    },
  });

  // Fetch current user tier and status
  useEffect(() => {
    const fetchUserTierStatus = async () => {
      if (user?.id) {
        try {
          const [tierResponse, kycResponse] = await Promise.all([
            fetch(`/api/user/tier?userId=${user.id}`),
            fetch(`/api/user/kyc?userId=${user.id}`)
          ]);

          if (tierResponse.ok) {
            const tierData = await tierResponse.json();
            if (tierData.success) {
              setCurrentTier(tierData.data.currentTier);
              setTierLimits(tierData.data.tierLimits);
            }
          }

          if (kycResponse.ok) {
            const kycData = await kycResponse.json();
            if (kycData.success) {
              setKycStatus(kycData.data.kycStatus);
            }
          }
        } catch (error) {
          console.error('Error fetching user status:', error);
          setError('Unable to load your current verification status.');
        }
      }
    };

    fetchUserTierStatus();
  }, [user?.id]);

  // Auto-set target tier based on current tier if not specified
  useEffect(() => {
    if (!urlTier && currentTier) {
      const nextTier = getNextTier(currentTier);
      if (nextTier !== currentTier) {
        setTargetTier(nextTier);
      }
    }
  }, [currentTier, urlTier]);

  const getNextTier = (current: KycTier): KycTier => {
    const tierOrder = [KycTier.TIER_0, KycTier.TIER_1, KycTier.TIER_2, KycTier.TIER_3];
    const currentIndex = tierOrder.indexOf(current);
    return tierOrder[Math.min(currentIndex + 1, tierOrder.length - 1)];
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Identity Verification</h1>
            <p className="text-slate-600">Please sign in to access identity verification and unlock platform features.</p>
          </div>
        </div>
      </div>
    );
  }

  const config = TIER_CONFIG[targetTier];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {isWelcome ? '🎉 Welcome to USD Financial!' : 'Identity Verification'}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {isWelcome 
              ? 'Your secure wallet is ready! Complete verification to unlock transfers, trading, and premium features.'
              : 'Secure your account and unlock USD Financial\'s full suite of stablecoin financial features'
            }
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Status Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Current Status</h2>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                TieredKycManager.getTierColor(currentTier).bg
              } ${TieredKycManager.getTierColor(currentTier).text}`}>
                {TieredKycManager.formatTierName(currentTier)}
              </span>
            </div>
            
            {tierLimits && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 text-sm font-medium mb-1">Max Transaction</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${tierLimits.maxTransactionAmount === Infinity ? '∞' : tierLimits.maxTransactionAmount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 text-sm font-medium mb-1">Monthly Limit</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${tierLimits.maxMonthlyVolume === Infinity ? '∞' : tierLimits.maxMonthlyVolume?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 text-sm font-medium mb-1">Available Features</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {tierLimits.allowedFeatures?.length || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tier Selection */}
        <div className="max-w-6xl mx-auto mb-12">
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">Choose Your Verification Level</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[KycTier.TIER_1, KycTier.TIER_2, KycTier.TIER_3].map((tier) => {
              const tierConfig = TIER_CONFIG[tier];
              const isSelected = targetTier === tier;
              const isCompleted = currentTier >= tier;
              
              return (
                <div
                  key={tier}
                  className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    isSelected ? 'scale-105' : ''
                  }`}
                  onClick={() => !isCompleted && setTargetTier(tier)}
                >
                  <div className={`h-full rounded-2xl p-8 border-2 transition-all ${
                    isSelected 
                      ? `bg-gradient-to-br ${tierConfig.gradient} text-white border-transparent shadow-2xl` 
                      : isCompleted 
                        ? `${tierConfig.bgColor} ${tierConfig.borderColor}` 
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-lg'
                  }`}>
                    <div className="text-center">
                      <div className="text-4xl mb-4">
                        {isCompleted ? '✅' : tierConfig.icon}
                      </div>
                      <h4 className={`text-xl font-bold mb-2 ${
                        isSelected ? 'text-white' : isCompleted ? tierConfig.textColor : 'text-slate-900'
                      }`}>
                        {tierConfig.title}
                      </h4>
                      <p className={`text-sm mb-4 ${
                        isSelected ? 'text-white/90' : 'text-slate-600'
                      }`}>
                        {tierConfig.subtitle}
                      </p>
                      <p className={`text-xs font-medium ${
                        isSelected ? 'text-white/80' : 'text-slate-500'
                      }`}>
                        ⏱️ {tierConfig.timeEstimate}
                      </p>
                      
                      {isCompleted && (
                        <div className="mt-4">
                          <span className="inline-block bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            ✓ Completed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification Details */}
        {config && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className={`bg-gradient-to-r ${config.gradient} p-8 text-white`}>
                <div className="flex items-center mb-4">
                  <div className="text-5xl mr-6">{config.icon}</div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{config.title}</h2>
                    <p className="text-white/90 text-lg">{config.subtitle}</p>
                    <p className="text-white/80 text-sm mt-1">
                      ⏱️ Estimated time: {config.timeEstimate}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
                  {/* Requirements */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Required Documents
                    </h3>
                    <div className="space-y-4">
                      {config.requirements.map((req, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-slate-700 leading-relaxed">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      Unlocked Features
                    </h3>
                    <div className="space-y-4">
                      {config.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-slate-700 leading-relaxed">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="text-center pt-8 border-t border-slate-200">
                  {kycStatus === 'pending' ? (
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-amber-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-amber-700 mb-2">Verification in Progress</h3>
                      <p className="text-slate-600 mb-4">
                        Your {config.title.toLowerCase()} is being reviewed. We'll notify you once complete.
                      </p>
                    </div>
                  ) : currentTier >= targetTier ? (
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-emerald-700 mb-2">Verification Complete ✨</h3>
                      <p className="text-slate-600 mb-6">
                        You have successfully completed {config.title.toLowerCase()}.
                      </p>
                      <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={open}
                        className={`bg-gradient-to-r ${config.gradient} text-white font-semibold py-4 px-12 rounded-xl text-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-opacity-50`}
                      >
                        Start {config.title}
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-6 flex items-center justify-center text-sm text-slate-500">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    🔒 Powered by Persona • Bank-level security • Your data is encrypted and protected
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TieredKycFlow;
