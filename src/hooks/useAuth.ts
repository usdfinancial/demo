'use client'

import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'

export function useAuth() {
  const { 
    user, 
    loading, 
    authenticate,
    signIn, 
    signUp, 
    signInWithGoogle, 
    signOut, 
    isWalletConnected, 
    isAAReady,
    walletBalance, 
    eoaBalance,
    sendTransaction,
    sendGaslessTransaction,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal
  } = useEnhancedAuth()

  // Unified authentication methods - all use Account Kit modal
  const showLogin = async (redirectTo: string = '/dashboard') => {
    try {
      console.log('🔑 Triggering login flow via Account Kit')
      await authenticate(redirectTo)
    } catch (error) {
      console.error('Authentication error:', error)
    }
  }

  const showSignup = async (redirectTo: string = '/dashboard') => {
    try {
      console.log('✍️ Triggering signup flow via Account Kit (unified)')
      await authenticate(redirectTo) // No distinction between signup/login
    } catch (error) {
      console.error('Authentication error:', error)
    }
  }

  const hideAuth = () => {
    // Close Account Kit modal
    closeAuthModal()
  }

  // Legacy compatibility methods - all route to unified authentication
  const switchToSignup = showSignup
  const switchToLogin = showLogin
  
  // Direct modal control
  const showAuthModal = openAuthModal
  const hideAuthModal = closeAuthModal

  return {
    // User state
    user,
    loading,
    
    // Unified authentication methods
    authenticate, // Primary unified auth method
    signIn, // Alias for authenticate
    signUp, // Alias for authenticate (no distinction)
    signInWithGoogle,
    signOut,
    
    // UI control methods
    showLogin,
    showSignup,
    hideAuth,
    switchToSignup,
    switchToLogin,
    showAuthModal,
    hideAuthModal,
    
    // Modal state (Account Kit controlled)
    isAuthModalOpen,
    isLoginModalOpen: isAuthModalOpen, // Backward compatibility
    isSignupModalOpen: isAuthModalOpen, // Backward compatibility
    
    // Wallet capabilities
    isWalletConnected,
    isAAReady,
    walletBalance,
    eoaBalance,
    sendTransaction,
    sendGaslessTransaction
  }
}