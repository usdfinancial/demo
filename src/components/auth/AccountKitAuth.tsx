'use client'

import { useEffect } from 'react'
import { AuthCard } from '@account-kit/react'
import { useAccountKit } from '@/contexts/AccountKitContext'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Shield, Zap, Lock, Mail } from 'lucide-react'

interface AccountKitAuthProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountKitAuth({ isOpen, onClose }: AccountKitAuthProps) {
  const { isAuthenticated, user, isLoading } = useAccountKit()

  // Close modal when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      onClose()
    }
  }, [isAuthenticated, user, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Access USD Financial
          </DialogTitle>
          <DialogDescription className="text-slate-600 leading-relaxed">
            Your secure stablecoin financial platform. Sign in to access all features.
          </DialogDescription>
        </DialogHeader>
        
        {/* Trust Indicators */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="flex flex-col items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <Lock className="h-5 w-5 text-emerald-600 mb-1" />
            <span className="text-xs font-medium text-emerald-900">Bank-Level</span>
            <span className="text-xs text-emerald-700">Security</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Zap className="h-5 w-5 text-blue-600 mb-1" />
            <span className="text-xs font-medium text-blue-900">Gasless</span>
            <span className="text-xs text-blue-700">Transactions</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <Mail className="h-5 w-5 text-purple-600 mb-1" />
            <span className="text-xs font-medium text-purple-900">Email &</span>
            <span className="text-xs text-purple-700">Social Login</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enhanced Auth Card with optimized configuration */}
          <AuthCard 
            config={{
              auth: {
                sections: [
                  // Primary: Email (most trusted for financial services)
                  [{ type: "email" as const }],
                  // Secondary: Google (secure and convenient)
                  [{ type: "social" as const, authProviderId: "google", mode: "popup" }],
                  // Progressive: Passkeys (for returning users)
                  [{ type: "passkey" as const }],
                ],
                addPasskeyOnSignup: true,
              },
              theme: {
                borderRadius: "md",
                colors: {
                  "btn-primary": "#059669",
                  "btn-primary-hover": "#047857",
                  "fg-accent-brand": "#059669",
                },
              },
            }}
          />

          {/* Security Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Secure Authentication</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your account is protected with enterprise-grade encryption. We sponsor gas fees for seamless transactions.
            </p>
          </div>

          {/* Legal Notice */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            By continuing, you agree to our{' '}
            <button className="text-emerald-600 hover:text-emerald-700 underline" onClick={() => {/* TODO: Open terms */}}>
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-emerald-600 hover:text-emerald-700 underline" onClick={() => {/* TODO: Open privacy */}}>
              Privacy Policy
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}