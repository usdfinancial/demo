'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

// Simplified Persona configuration
const PERSONA_CONFIG = {
  baseUrl: 'https://withpersona.com/verify',
  environmentId: 'env_ueeK7hhHJWCQ4X491rPxwy3jMVGM',
  templateId: 'itmpl_5aKCN8nrmDhNoSSQV8Y4WKA13UK8'
};

// Tier definitions
enum KycTier {
  TIER_0 = 'tier_0',
  TIER_1 = 'tier_1', 
  TIER_2 = 'tier_2',
  TIER_3 = 'tier_3'
}

const TIER_CONFIG = {
  [KycTier.TIER_1]: {
    title: 'Basic Verification',
    subtitle: 'Quick identity check for basic features',
    timeEstimate: '2-3 minutes',
    icon: '📱',
    gradient: 'from-blue-500 to-blue-600',
    requirements: [
      'Phone number verification',
      'Basic identity information',
      'Email confirmation'
    ],
    benefits: [
      'Send up to $1,000 per transaction',
      'Monthly volume up to $3,000',
      'Basic swaps and transfers'
    ]
  },
  [KycTier.TIER_2]: {
    title: 'Full Verification', 
    subtitle: 'Complete identity verification for core features',
    timeEstimate: '5-10 minutes',
    icon: '🆔',
    gradient: 'from-emerald-500 to-emerald-600',
    requirements: [
      'Government-issued ID',
      'Selfie with liveness detection',
      'Address verification',
      'Sanctions screening'
    ],
    benefits: [
      'Transactions up to $10,000',
      'Monthly volume up to $50,000',
      'Fiat on/off ramps',
      'Cross-chain bridging'
    ]
  },
  [KycTier.TIER_3]: {
    title: 'Enhanced Verification',
    subtitle: 'Premium verification for high-value features',
    timeEstimate: '10-15 minutes', 
    icon: '🏆',
    gradient: 'from-purple-500 to-purple-600',
    requirements: [
      'Enhanced identity documentation',
      'Proof of funds verification',
      'Source of wealth documentation',
      'Enhanced sanctions screening'
    ],
    benefits: [
      'Unlimited transaction amounts',
      'Stablecoin debit cards',
      'Crypto-collateralized loans',
      'Business account features'
    ]
  }
};

const SimpleTieredKyc = () => {
  const { user, loading } = useAuth();
  const [selectedTier, setSelectedTier] = useState<KycTier>(KycTier.TIER_1);
  const [kycStatus, setKycStatus] = useState('unverified');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch KYC status
  useEffect(() => {
    const fetchKycStatus = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/user/kyc?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setKycStatus(data.data.kycStatus);
            }
          }
        } catch (error) {
          console.error('Error fetching KYC status:', error);
        }
      }
    };

    fetchKycStatus();
  }, [user?.id]);

  const openPersonaFlow = () => {
    try {
      if (typeof window === 'undefined') return;

      const params = new URLSearchParams({
        'inquiry-template-id': PERSONA_CONFIG.templateId,
        'environment-id': PERSONA_CONFIG.environmentId,
        'redirect-uri': `${window.location.origin}/kyc?status=completed`,
        ...(user?.id && { 'reference-id': user.id })
      });

      const personaUrl = `${PERSONA_CONFIG.baseUrl}?${params.toString()}`;
      
      const popup = window.open(
        personaUrl,
        'persona-kyc',
        'width=500,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        setError('Popup blocked. Please allow popups and try again.');
        return;
      }

      setIsProcessing(true);
      
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            setIsProcessing(false);
            // Check for completion in URL params
            const urlParams = new URLSearchParams(window.location.search);
            const status = urlParams.get('status');
            if (status === 'completed') {
              setKycStatus('pending');
              setError(null);
            }
          }
        } catch (error) {
          console.error('Error checking popup:', error);
          clearInterval(checkClosed);
          setIsProcessing(false);
        }
      }, 1000);
    } catch (error) {
      console.error('Error opening Persona flow:', error);
      setError('Failed to open verification flow. Please try again.');
    }
  };

  if (loading || isProcessing) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">
            {isProcessing ? 'Processing verification...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Identity Verification</h1>
            <p className="text-slate-600 mb-6">Please sign in to access identity verification.</p>
            
            <button
              onClick={() => window.location.href = '/'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Enhanced Header - matching Profile page pattern */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 rounded-2xl border border-emerald-100 p-6 mb-8">
        <div className="absolute inset-0 bg-grid-slate-100 opacity-30"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Identity Verification</h1>
              </div>
              <p className="text-slate-600 text-lg">Choose your verification level to unlock USD Financial's stablecoin financial features</p>
              <div className="flex items-center gap-6 mt-3 text-sm text-emerald-700">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Secure verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Tiered access levels</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Quick processing</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {kycStatus === 'approved' && (
                <Badge className="bg-white/80 backdrop-blur-sm border-white/20 px-4 py-2 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verified
                </Badge>
              )}
              {kycStatus === 'pending' && (
                <Badge className="bg-white/80 backdrop-blur-sm border-white/20 px-4 py-2 text-amber-800">
                  <Clock className="h-4 w-4 mr-2" />
                  Pending
                </Badge>
              )}
              {kycStatus === 'unverified' && (
                <Badge className="bg-white/80 backdrop-blur-sm border-white/20 px-4 py-2 text-slate-800">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Not Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">

          {/* Error Alert */}
          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Check */}
          {kycStatus === 'approved' && (
            <Card>
              <CardContent className="pt-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-700 mb-2">Verification Complete! 🎉</h3>
                  <p className="text-emerald-600">You have successfully completed identity verification.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {kycStatus === 'pending' && (
            <Card>
              <CardContent className="pt-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-amber-700 mb-2">Verification in Progress</h3>
                  <p className="text-amber-600">Your verification is being reviewed. We'll notify you once complete.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tier Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Choose Your Verification Level</CardTitle>
              <CardDescription className="text-center">
                Select the verification tier that matches your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[KycTier.TIER_1, KycTier.TIER_2, KycTier.TIER_3].map((tier) => {
                  const config = TIER_CONFIG[tier];
                  const isSelected = selectedTier === tier;
                  
                  return (
                    <div
                      key={tier}
                      className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        isSelected ? 'scale-105' : ''
                      }`}
                      onClick={() => setSelectedTier(tier)}
                    >
                      <div className={`h-full rounded-xl p-6 border-2 transition-all ${
                        isSelected 
                          ? `bg-gradient-to-br ${config.gradient} text-white border-transparent shadow-xl` 
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-md'
                      }`}>
                        <div className="text-center">
                          <div className="text-3xl mb-3">{config.icon}</div>
                          <h4 className={`text-lg font-bold mb-2 ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}>
                            {config.title}
                          </h4>
                          <p className={`text-sm mb-4 ${
                            isSelected ? 'text-white/90' : 'text-slate-600'
                          }`}>
                            {config.subtitle}
                          </p>
                          <p className={`text-xs font-medium ${
                            isSelected ? 'text-white/80' : 'text-slate-500'
                          }`}>
                            ⏱️ {config.timeEstimate}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Tier Details */}
          {selectedTier && TIER_CONFIG[selectedTier] && (
            <Card className="overflow-hidden">
              <div className={`bg-gradient-to-r ${TIER_CONFIG[selectedTier].gradient} p-6 text-white`}>
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">{TIER_CONFIG[selectedTier].icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{TIER_CONFIG[selectedTier].title}</h2>
                    <p className="text-white/90">{TIER_CONFIG[selectedTier].subtitle}</p>
                    <p className="text-white/80 text-sm mt-1">
                      ⏱️ Estimated time: {TIER_CONFIG[selectedTier].timeEstimate}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                  {/* Requirements */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" />
                      Required Documents
                    </h3>
                    <div className="space-y-3">
                      {TIER_CONFIG[selectedTier].requirements.map((req: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-slate-700 text-sm leading-relaxed">{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 text-blue-500 mr-2" />
                      Unlocked Features
                    </h3>
                    <div className="space-y-3">
                      {TIER_CONFIG[selectedTier].benefits.map((benefit: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            <Shield className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="text-slate-700 text-sm leading-relaxed">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="text-center pt-4 border-t border-slate-200">
                  {kycStatus === 'approved' ? (
                    <button
                      onClick={() => window.location.href = '/dashboard'}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Go to Dashboard
                    </button>
                  ) : (
                    <div>
                      <button
                        onClick={openPersonaFlow}
                        className={`bg-gradient-to-r ${TIER_CONFIG[selectedTier].gradient} text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-opacity-50`}
                      >
                        Start {TIER_CONFIG[selectedTier].title}
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-center text-xs text-slate-500">
                    <Shield className="w-3 h-3 mr-2" />
                    🔒 Powered by Persona • Bank-level security • Your data is encrypted and protected
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
};

export default SimpleTieredKyc;
