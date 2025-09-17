'use client'

import { useEffect } from 'react'
import { X, Mail, Lock, Wallet, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAccountKit } from '@/contexts/AccountKitContext'

interface AccountKitLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountKitLoginModal({ isOpen, onClose }: AccountKitLoginModalProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    openAuthModal, 
    isAuthModalOpen,
    user 
  } = useAccountKit()

  // Close modal when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      onClose()
    }
  }, [isAuthenticated, user, onClose])

  // Open Account Kit modal when this modal is opened
  useEffect(() => {
    if (isOpen && !isAuthModalOpen && !isAuthenticated) {
      openAuthModal()
    }
  }, [isOpen, isAuthModalOpen, isAuthenticated, openAuthModal])

  const handleClose = () => {
    if (isLoading) return
    onClose()
  }

  const handleOpenAuth = () => {
    openAuthModal()
  }

  return (
    <Dialog open={isOpen && !isAuthModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Welcome to USD Financial
          </DialogTitle>
          <DialogDescription className="text-slate-600 leading-relaxed">
            Experience the future of financial services with smart wallets, gasless transactions, and seamless authentication
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-emerald-900">Email & Social Login</h4>
                <p className="text-xs text-emerald-700">Sign in with your email or social accounts</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Gasless Transactions</h4>
                <p className="text-xs text-blue-700">No need to worry about gas fees</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-purple-900">Smart Wallet Security</h4>
                <p className="text-xs text-purple-700">Advanced security with passkey support</p>
              </div>
            </div>
          </div>

          {/* Get Started Button */}
          <Button
            onClick={handleOpenAuth}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Connecting...
              </>
            ) : (
              'Get Started'
            )}
          </Button>

          {/* Info Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <h5 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              What's New with Account Kit
            </h5>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• One-click authentication with email or social accounts</li>
              <li>• Smart contract wallets with enhanced security</li>
              <li>• Gasless transactions sponsored by USD Financial</li>
              <li>• Passkey support for secure, passwordless access</li>
              <li>• Seamless Web2-like user experience</li>
            </ul>
          </div>

          {/* Privacy Note */}
          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              Your data is encrypted and secure.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}