'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Shield, Zap, Wallet, ArrowRight, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAccountKit } from '@/contexts/AccountKitContext'

interface EnhancedAccountKitModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (userData: any) => void
}

export function EnhancedAccountKitModal({ isOpen, onClose, onSuccess }: EnhancedAccountKitModalProps) {
  const { authenticate, user, isAuthenticated, isLoading } = useAccountKit()
  const [email, setEmail] = useState('')
  const [localLoading, setLocalLoading] = useState(false)
  const [step, setStep] = useState<'welcome' | 'email' | 'loading' | 'success'>('welcome')
  const [authError, setAuthError] = useState<string | null>(null)

  // Auto-close and notify parent when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && user) {
      setStep('success')
      setTimeout(() => {
        onSuccess?.(user)
        onClose()
        handleReset()
      }, 2000)
    }
  }, [isAuthenticated, user, onSuccess, onClose])

  const handleReset = () => {
    setStep('welcome')
    setEmail('')
    setAuthError(null)
    setLocalLoading(false)
  }

  const handleClose = () => {
    if (localLoading || isLoading) return
    onClose()
    handleReset()
  }

  const handleEmailAuth = async () => {
    if (!email) return
    
    setLocalLoading(true)
    setAuthError(null)
    setStep('loading')
    
    try {
      const result = await authenticate(email)
      if (!result.success) {
        setAuthError(result.error || 'Authentication failed')
        setStep('email')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setAuthError('Authentication failed. Please try again.')
      setStep('email')
    } finally {
      setLocalLoading(false)
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
            {step === 'welcome' && <Sparkles className="h-8 w-8 text-white" />}
            {step === 'email' && <Mail className="h-8 w-8 text-white" />}
            {step === 'loading' && <RefreshCw className="h-8 w-8 text-white animate-spin" />}
            {step === 'success' && <Wallet className="h-8 w-8 text-white" />}
          </div>
          
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {step === 'welcome' && 'Welcome to USD Financial'}
            {step === 'email' && 'Enter Your Email'}
            {step === 'loading' && 'Creating Your Account'}
            {step === 'success' && 'Account Created!'}
          </DialogTitle>
          
          <DialogDescription className="text-slate-600 leading-relaxed">
            {step === 'welcome' && 'Choose your preferred method to access Account Kit smart wallet'}
            {step === 'email' && 'We\'ll send you a secure login link to create your smart wallet'}
            {step === 'loading' && 'Setting up your gasless smart wallet on Ethereum...'}
            {step === 'success' && 'Your Alchemy Account Kit smart wallet is ready!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Error Display */}
          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <X className="h-4 w-4" />
                {authError}
              </p>
            </div>
          )}

          {step === 'welcome' && (
            <div className="space-y-4">
              {/* Account Kit Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-900">Gasless Transactions</p>
                    <p className="text-sm text-emerald-700">Real Alchemy-sponsored transactions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Smart Contract Wallet</p>
                    <p className="text-sm text-blue-700">Enhanced security with Account Kit</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Wallet className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">Real Blockchain</p>
                    <p className="text-sm text-purple-700">Ethereum Sepolia testnet</p>
                  </div>
                </div>
              </div>

              {/* Auth Options */}
              <div className="space-y-3">
                <Button
                  onClick={() => setStep('email')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
                  size="lg"
                >
                  <Mail className="h-4 w-4" />
                  Continue with Email
                </Button>
              </div>
            </div>
          )}

          {step === 'email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-2 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    disabled={localLoading}
                    required
                  />
                </div>
              </div>

              <Button
                onClick={handleEmailAuth}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={localLoading || !email}
              >
                {localLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Smart Wallet
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setStep('welcome')}
                className="w-full"
                disabled={localLoading}
              >
                Back
              </Button>
            </div>
          )}

          {step === 'loading' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <div className="h-5 w-5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm text-emerald-900">Connecting to Alchemy Account Kit...</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="text-sm text-blue-900">Deploying smart contract wallet...</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="h-5 w-5 border-2 border-purple-300 rounded-full animate-spin" />
                  <span className="text-sm text-purple-900">Setting up gasless transactions...</span>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                  <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                  <span className="text-sm text-emerald-900">Smart wallet created successfully</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-900">Gasless transactions enabled</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-purple-900">Enhanced security activated</span>
                </div>
              </div>

              <div className="text-center">
                <RefreshCw className="h-5 w-5 mx-auto animate-spin text-emerald-600 mb-2" />
                <p className="text-sm text-slate-600">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {/* Account Kit Info */}
          {step === 'welcome' && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <h5 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Powered by Alchemy Account Kit
              </h5>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Real smart contract wallets on Ethereum</li>
                <li>• Magic link email authentication</li>
                <li>• Gasless transactions with Alchemy sponsorship</li>
                <li>• Enhanced security with Account Abstraction</li>
              </ul>
            </div>
          )}

          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}