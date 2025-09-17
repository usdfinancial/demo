'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Shield, Zap, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSimpleAccountKit } from '@/contexts/SimpleAccountKitProvider'

interface SimpleAccountKitModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (userData: any) => void
}

export function SimpleAccountKitModal({ isOpen, onClose, onSuccess }: SimpleAccountKitModalProps) {
  const { authenticate, user, isAuthenticated } = useSimpleAccountKit()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'verification' | 'success'>('email')
  const [authError, setAuthError] = useState<string | null>(null)

  // Auto-close and notify parent when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && user && step === 'success') {
      setTimeout(() => {
        onSuccess(user)
        onClose()
        setStep('email')
        setEmail('')
        setAuthError(null)
      }, 1500)
    }
  }, [isAuthenticated, user, step, onSuccess, onClose])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setAuthError(null)
    
    try {
      // Simulate Account Kit email sending
      await new Promise(resolve => setTimeout(resolve, 1500))
      setStep('verification')
    } catch (error) {
      console.error('Email authentication failed:', error)
      setAuthError('Failed to send email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationComplete = async () => {
    setIsLoading(true)
    setAuthError(null)
    
    try {
      // Use the actual authentication method from SimpleAccountKitProvider
      const result = await authenticate(email)
      
      if (result.success) {
        setStep('success')
        // The useEffect will handle closing the modal when authentication completes
      } else {
        setAuthError(result.error || 'Authentication failed. Please try again.')
      }
    } catch (error) {
      console.error('Verification failed:', error)
      setAuthError('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (isLoading) return
    onClose()
    setStep('email')
    setEmail('')
    setAuthError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
            {step === 'email' && <Mail className="h-8 w-8 text-white" />}
            {step === 'verification' && <Shield className="h-8 w-8 text-white" />}
            {step === 'success' && <Wallet className="h-8 w-8 text-white" />}
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {step === 'email' && 'Welcome to USD Financial'}
            {step === 'verification' && 'Check Your Email'}
            {step === 'success' && 'Smart Wallet Created!'}
          </DialogTitle>
          <DialogDescription className="text-slate-600 leading-relaxed">
            {step === 'email' && 'Sign in with your email to get started with Account Kit'}
            {step === 'verification' && 'We sent you a secure login link. Click it to continue.'}
            {step === 'success' && 'Your smart wallet is ready with gasless transactions enabled!'}
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

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-2 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating Account...
                  </>
                ) : (
                  'Continue with Email'
                )}
              </Button>
            </form>
          )}

          {step === 'verification' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <p className="text-sm text-emerald-700">
                  We sent a secure login link to <strong>{email}</strong>
                </p>
              </div>
              
              <Button
                onClick={handleVerificationComplete}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Setting up Smart Wallet...
                  </>
                ) : (
                  'I clicked the email link'
                )}
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <Zap className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Gasless Transactions Enabled</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Smart Contract Security</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Wallet className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Web2-like Experience</span>
                </div>
              </div>

              <div className="text-center">
                <div className="h-5 w-5 mx-auto animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <p className="text-sm text-slate-600 mt-2">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {/* Features Info */}
          {step === 'email' && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <h5 className="text-sm font-medium text-slate-700">Powered by Account Kit</h5>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Email-based authentication with magic links</li>
                <li>• Smart contract wallets for enhanced security</li>
                <li>• Gasless transactions with gas sponsorship</li>
                <li>• Seamless Web2-like user experience</li>
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