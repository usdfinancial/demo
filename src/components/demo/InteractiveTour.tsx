'use client'

import React, { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface TourStep {
  id: string
  title: string
  description: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
}

interface InteractiveTourProps {
  steps: TourStep[]
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export function InteractiveTour({ steps, isOpen, onClose, onComplete }: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentStep, isPlaying, steps.length])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      steps[currentStep + 1]?.action?.()
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    onComplete?.()
    onClose()
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const handleRestart = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  if (!isOpen || steps.length === 0) return null

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="absolute top-4 right-4">
        <Card className="w-96 shadow-xl border-2 border-emerald-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                🎯 Interactive Tour
                <Badge variant="secondary" className="text-xs">
                  {currentStep + 1} of {steps.length}
                </Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-emerald-700 mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentStepData.description}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={currentStep >= steps.length - 1}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Auto'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestart}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restart
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                >
                  {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            {currentStep === steps.length - 1 && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-700 font-medium">
                  🎉 Tour Complete! You've explored the key features of USD Financial.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Predefined tour configurations
export const dashboardTour: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to USD Financial',
    description: 'Your comprehensive stablecoin financial platform. Let\'s explore the key features together.',
  },
  {
    id: 'balance-overview',
    title: 'Multi-Chain Balance Overview',
    description: 'View your USDC and USDT balances across 5 major blockchain networks in real-time.',
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Access frequently used features like sending, receiving, and swapping stablecoins.',
  },
  {
    id: 'recent-activity',
    title: 'Recent Activity',
    description: 'Monitor your latest transactions and financial activities across all services.',
  },
  {
    id: 'navigation',
    title: 'Feature Navigation',
    description: 'Explore Exchange, Investments, Cards, Loans, Business, and Insurance modules.',
  }
]

export const exchangeTour: TourStep[] = [
  {
    id: 'exchange-intro',
    title: 'Exchange & DeFi Hub',
    description: 'Swap stablecoins and earn yield through integrated DeFi protocols.',
  },
  {
    id: 'swap-interface',
    title: 'Stablecoin Swapping',
    description: 'Exchange between USDC and USDT with real-time rates and minimal fees.',
  },
  {
    id: 'yield-farming',
    title: 'DeFi Yield Farming',
    description: 'Earn passive income by providing liquidity to top DeFi protocols like Aave and Compound.',
  },
  {
    id: 'protocol-selection',
    title: 'Protocol Integration',
    description: 'Choose from 5 major DeFi protocols with AI-optimized yield strategies.',
  }
]

export const investmentTour: TourStep[] = [
  {
    id: 'investment-intro',
    title: 'Investment Portfolio',
    description: 'Build a diversified portfolio with tokenized real-world assets.',
  },
  {
    id: 'asset-marketplace',
    title: 'Tokenized Assets',
    description: 'Invest in US Treasury Bills, Real Estate, Gold, and Corporate Bonds.',
  },
  {
    id: 'portfolio-analytics',
    title: 'Performance Analytics',
    description: 'Track your investment performance with detailed analytics and insights.',
  },
  {
    id: 'auto-invest',
    title: 'Auto-Invest Strategies',
    description: 'Set up automated investment plans with AI-powered asset allocation.',
  }
]
