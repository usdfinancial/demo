'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { KycTier } from '@/lib/compliance/tieredKyc';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
  benefits: string[];
  required: boolean;
  completed: boolean;
  tier: KycTier;
}

interface ProgressiveKycOnboardingProps {
  onStepComplete: (stepId: string, tier: KycTier) => void;
  onSkip: () => void;
  onClose: () => void;
}

const ProgressiveKycOnboarding: React.FC<ProgressiveKycOnboardingProps> = ({
  onStepComplete,
  onSkip,
  onClose
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to USD Financial! 🎉',
      description: 'Your secure wallet is ready. Let\'s unlock the full experience in just a few steps.',
      icon: '🚀',
      estimatedTime: '30 seconds',
      benefits: ['Access to basic transfers', 'Portfolio tracking', 'Transaction history'],
      required: false,
      completed: false,
      tier: KycTier.TIER_0
    },
    {
      id: 'basic_verification',
      title: 'Basic Verification',
      description: 'Quick identity check to start sending and receiving funds.',
      icon: '📱',
      estimatedTime: '2-3 minutes',
      benefits: [
        'Send up to $1,000 per transaction',
        'Monthly volume up to $3,000',
        'Basic swaps and transfers',
        'Email & SMS notifications'
      ],
      required: true,
      completed: false,
      tier: KycTier.TIER_1
    },
    {
      id: 'full_verification',
      title: 'Full Verification',
      description: 'Complete identity verification for advanced features and higher limits.',
      icon: '🆔',
      estimatedTime: '5-7 minutes',
      benefits: [
        'Transactions up to $10,000',
        'Monthly volume up to $50,000',
        'Fiat on/off ramps',
        'Cross-chain bridging',
        'DeFi yield farming'
      ],
      required: false,
      completed: false,
      tier: KycTier.TIER_2
    },
    {
      id: 'enhanced_verification', 
      title: 'Enhanced Verification',
      description: 'Premium verification for cards, loans, and unlimited features.',
      icon: '🏆',
      estimatedTime: '10-12 minutes',
      benefits: [
        'Unlimited transaction amounts',
        'Virtual & physical debit cards',
        'Crypto-collateralized loans',
        'Business account features',
        'Priority customer support'
      ],
      required: false,
      completed: false,
      tier: KycTier.TIER_3
    }
  ];

  const [steps, setSteps] = useState(onboardingSteps);

  useEffect(() => {
    // Load completion status from localStorage or API
    const savedProgress = localStorage.getItem(`kyc_progress_${user?.id}`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCompletedSteps(new Set(progress.completedSteps || []));
      setCurrentStep(progress.currentStep || 0);
    }
  }, [user?.id]);

  const handleStepComplete = async (step: OnboardingStep) => {
    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(step.id);
    setCompletedSteps(newCompletedSteps);

    // Save progress
    localStorage.setItem(`kyc_progress_${user?.id}`, JSON.stringify({
      completedSteps: Array.from(newCompletedSteps),
      currentStep: currentStep + 1
    }));

    // Trigger verification process
    onStepComplete(step.id, step.tier);

    // Move to next step or complete
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSkip();
    }
  };

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  if (!currentStepData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-8 text-center border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="text-6xl mb-4">{currentStepData.icon}</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 text-lg mb-4">
            {currentStepData.description}
          </p>
          
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {currentStepData.estimatedTime}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-6 h-6 text-emerald-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            You'll unlock:
          </h3>
          
          <div className="grid gap-3 mb-8">
            {currentStepData.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 leading-relaxed">{benefit}</span>
              </div>
            ))}
          </div>

          {/* What You'll Need */}
          {currentStepData.tier !== KycTier.TIER_0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-8">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                What you'll need:
              </h4>
              <div className="text-blue-800 text-sm space-y-1">
                {currentStepData.tier === KycTier.TIER_1 && (
                  <>
                    <div>• Phone number for SMS verification</div>
                    <div>• Basic personal information (name, DOB)</div>
                    <div>• Email access for confirmation</div>
                  </>
                )}
                {currentStepData.tier === KycTier.TIER_2 && (
                  <>
                    <div>• Government-issued ID (driver's license/passport)</div>
                    <div>• Camera or phone for selfie verification</div>
                    <div>• Proof of address document</div>
                  </>
                )}
                {currentStepData.tier === KycTier.TIER_3 && (
                  <>
                    <div>• Enhanced identity documents</div>
                    <div>• Proof of funds or income</div>
                    <div>• Source of wealth documentation</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Progress Visualization */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    index < currentStep 
                      ? 'bg-emerald-500 text-white' 
                      : index === currentStep
                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300'
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index < currentStep ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-1 rounded-full ${
                      index < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3">
          {currentStepData.id === 'welcome' ? (
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Get Started
            </button>
          ) : (
            <>
              <button
                onClick={() => handleStepComplete(currentStepData)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Start Verification
              </button>
              
              {!currentStepData.required && (
                <button
                  onClick={handleSkipStep}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-lg transition-colors"
                >
                  {currentStep === steps.length - 1 ? 'Finish Later' : 'Skip for Now'}
                </button>
              )}
            </>
          )}
        </div>

        {/* Security Badge */}
        <div className="px-8 pb-4">
          <div className="text-center text-xs text-gray-500 flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Powered by Persona • Bank-level security • Your data is encrypted and protected
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressiveKycOnboarding;