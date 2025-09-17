'use client'

import React, { useState, useMemo } from 'react'
import { useAuthModal, useSignerStatus, useUser, useLogout, useSmartAccountClient, useAccount } from '@account-kit/react'
import type { Address } from 'viem'

export interface AlchemyUser {
  address?: Address
  email?: string
  name?: string
  authType?: 'email' | 'social' | 'wallet' | 'guest' | 'passkey'
  type: 'email' | 'social' | 'wallet' | 'guest'
  // NEW: Enhanced fields for email consolidation
  actualAuthMethod?: 'email' | 'google' | 'wallet' | 'passkey'
  primaryIdentifier?: string  // Email (preferred) or address for consolidation
}

// Real Alchemy Account Kit authentication integration
export function useAlchemyAuth() {
  // Real Alchemy hooks
  const { openAuthModal, closeAuthModal, isOpen: isAuthModalOpen } = useAuthModal()
  const signerStatus = useSignerStatus()
  const user = useUser()
  const { logout, isLoggingOut, error: logoutError } = useLogout()
  const { client: smartAccountClient } = useSmartAccountClient({ type: 'LightAccount' })
  const { account, address: smartAccountAddress } = useAccount({ type: 'LightAccount' })

  const [onboardingStep, setOnboardingStep] = useState<'welcome' | 'auth' | 'verify' | 'create-account' | 'complete'>('welcome')
  const [error, setError] = useState<string | null>(null)
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null)
  const [hasTriggeredWelcomeEmail, setHasTriggeredWelcomeEmail] = useState<Set<string>>(new Set())

  // Enhanced user mapping with email consolidation
  const mappedUser: AlchemyUser | null = useMemo(() => {
    if (!user) return null
    
    try {
      // Determine actual authentication method used
      const authMethod = determineAuthMethod(user)
      
      return {
        address: user.address as Address,
        email: user.email || undefined,
        name: user.email || user.address || 'User',
        // NEW: Always consolidate by email when available
        authType: user.email ? 'email' : 'wallet',
        type: user.email ? 'email' : 'wallet',
        // NEW: Track the actual method used for this session
        actualAuthMethod: authMethod,
        // NEW: Universal identifier for user consolidation
        primaryIdentifier: user.email || user.address
      }
    } catch (error) {
      console.error('❌ User mapping error:', error)
      // Return basic user object on error
      return {
        address: user.address as Address,
        email: user.email || undefined,
        name: user.email || user.address || 'User',
        authType: user.email ? 'email' : 'wallet',
        type: user.email ? 'email' : 'wallet',
        actualAuthMethod: 'email',
        primaryIdentifier: user.email || user.address
      }
    }
  }, [user])

  // Determine the actual authentication method used based on Alchemy Account Kit user object
  const determineAuthMethod = (alchemyUser: any): 'email' | 'google' | 'wallet' | 'passkey' => {
    if (!alchemyUser.email && !alchemyUser.address) return 'wallet'

    // Use actual Alchemy Account Kit user object fields
    try {
      console.log('🔍 Detecting auth method for user (Alchemy Account Kit):', {
        type: alchemyUser.type, // "eoa" | "sca"
        hasEmail: !!alchemyUser.email,
        hasIdToken: !!alchemyUser.idToken, // OAuth indicator
        hasCredentialId: !!alchemyUser.credentialId, // Passkey indicator
        userId: alchemyUser.userId,
        orgId: alchemyUser.orgId,
        address: alchemyUser.address,
        userObjectKeys: Object.keys(alchemyUser || {})
      })

      // 1. Check for passkey authentication (WebAuthn/FIDO)
      // credentialId is present when using passkey authentication
      if (alchemyUser.credentialId) {
        console.log('✅ Detected Passkey authentication (credentialId present)')
        return 'passkey'
      }

      // 2. Check for Google OAuth authentication
      // idToken is present when using OAuth providers like Google
      if (alchemyUser.idToken) {
        console.log('✅ Detected Google OAuth authentication (idToken present)')
        return 'google'
      }

      // 3. Check for wallet-only authentication (no email)
      if (!alchemyUser.email && alchemyUser.address) {
        console.log('✅ Detected Wallet-only authentication (no email)')
        return 'wallet'
      }

      // 4. Email authentication (has email but no idToken or credentialId)
      if (alchemyUser.email && !alchemyUser.idToken && !alchemyUser.credentialId) {
        console.log('✅ Detected Email authentication (email present, no OAuth/passkey indicators)')
        return 'email'
      }

      // 5. Fallback: if has email but unclear method, default to email
      if (alchemyUser.email) {
        console.log('⚠️ Email present but unclear method - defaulting to email')
        return 'email'
      }

      // Ultimate fallback: wallet
      console.log('⚠️ Using ultimate fallback - defaulting to wallet')
      return 'wallet'

    } catch (error) {
      console.error('❌ Auth method detection error:', error)
      // Log the error but provide safe fallback
      const fallback = alchemyUser.email ? 'email' : 'wallet'
      console.log('🔄 Using error fallback:', fallback)
      return fallback
    }
  }

  // Derived state - be more precise about loading states
  const isLoading = signerStatus.isInitializing || isLoggingOut
  const isAuthenticated = signerStatus.isConnected && !!user && user !== false
  const isConnected = signerStatus.isConnected

  // Trigger welcome email for new users (consolidated by email)
  const triggerWelcomeEmail = async (user: AlchemyUser) => {
    try {
      // NEW: Use email as primary identifier for consolidation
      const primaryIdentifier = user.primaryIdentifier || user.email || user.address || 'unknown'
      
      // Prevent duplicate welcome emails for the same email address
      if (hasTriggeredWelcomeEmail.has(primaryIdentifier)) {
        console.log('🚫 Welcome email already sent to:', primaryIdentifier.replace(/(.{2}).*(@.*)/, '$1***$2'))
        return
      }

      console.log('📧 Triggering welcome email for new user:', {
        primaryIdentifier: primaryIdentifier.replace(/(.{2}).*(@.*)/, '$1***$2'),
        email: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
        address: user.address,
        authMethod: user.actualAuthMethod,
        consolidatedType: user.authType
      })

      // Check email preferences first
      const userIdentifier = user.primaryIdentifier || user.email || user.address || 'unknown'
      const preferencesResponse = await fetch('/api/emails/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'canSend',
          userIdentifier,
          emailType: 'welcome'
        })
      }).catch(() => null)

      // If preferences check fails, default to allowing welcome emails for new users
      if (preferencesResponse) {
        const { canSend } = await preferencesResponse.json()
        if (!canSend) {
          console.log('🚫 Welcome email blocked by user preferences:', userIdentifier)
          return
        }
      }

      const welcomeEmailData = {
        recipient: {
          email: user.email || `${user.address}@temp.usdfinancial.com`, // Fallback for wallet-only users
          firstName: user.name?.split(' ')[0] || 'Valued Customer',
          lastName: user.name?.split(' ').slice(1).join(' ') || undefined,
          name: user.name || 'Valued Customer'
        },
        data: {
          firstName: user.name?.split(' ')[0] || 'Valued Customer',
          lastName: user.name?.split(' ').slice(1).join(' ') || undefined,
          signupSource: user.actualAuthMethod === 'wallet' ? 'wallet_connect' : 
                       user.actualAuthMethod === 'google' ? 'google_oauth' :
                       user.actualAuthMethod === 'passkey' ? 'passkey_auth' : 'email_signup',
          country: 'United States', // Default - could be enhanced with geo-detection
          signupTimestamp: new Date().toISOString(),
          referralCode: undefined, // Could be enhanced with referral tracking
          estimatedSavings: '$840',
          welcomeBonus: '$25'
        }
      }

      // Send welcome email via API
      const response = await fetch('/api/emails/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(welcomeEmailData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Welcome email sent successfully:', result.messageId)
        
        // Mark this user as having received welcome email (by primary identifier)
        setHasTriggeredWelcomeEmail(prev => new Set(prev).add(primaryIdentifier))
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Failed to send welcome email:', error)
      }
    } catch (error) {
      console.error('❌ Welcome email trigger error:', error)
    }
  }

  // Save user to database when authenticated with comprehensive logging
  const saveUserToDatabase = async (user: AlchemyUser) => {
    try {
      console.log('🚨 SAVE USER TO DATABASE CALLED:', {
        email: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
        address: user.address,
        authMethod: user.actualAuthMethod,
        timestamp: new Date().toISOString()
      })

      if (!user.email && !user.address) {
        console.warn('⚠️ Cannot save user: missing email and address')
        return null
      }

      // Get request information for security logging (browser environment)
      let requestInfo: any = {}
      if (typeof window !== 'undefined' && window.navigator) {
        requestInfo = {
          userAgent: window.navigator.userAgent,
          // Note: IP address will be captured on the server side
          deviceFingerprint: btoa(`${window.navigator.userAgent}|${window.navigator.language}|${window.screen.width}x${window.screen.height}`)
        }
      }

      console.log('💾 Saving user to database:', {
        email: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
        address: user.address,
        authMethod: user.actualAuthMethod,
        deviceInfo: {
          userAgent: requestInfo.userAgent?.substring(0, 50) + '...',
          fingerprint: requestInfo.deviceFingerprint?.substring(0, 20) + '...'
        }
      })

      // Prepare user data for database
      const userData = {
        email: user.email,
        smartWalletAddress: smartAccountAddress || user.address,
        eoaAddress: user.address,
        authMethod: user.actualAuthMethod || 'email',
        profile: {
          firstName: user.name?.split(' ')[0],
          lastName: user.name?.split(' ').slice(1).join(' ') || undefined
        }
      }

      // Try to find existing user first
      let existingUser = null
      const findResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Info': JSON.stringify(requestInfo) // Send client info for server-side logging
        },
        body: JSON.stringify({
          action: 'find-user',
          email: user.email,
          smartWalletAddress: userData.smartWalletAddress
        })
      }).catch(() => null)

      if (findResponse?.ok) {
        const result = await findResponse.json()
        existingUser = result.data
      }

      if (existingUser) {
        // Update last auth time and log authentication
        console.log('📝 Updating existing user last auth time')
        await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Info': JSON.stringify(requestInfo)
          },
          body: JSON.stringify({
            action: 'update-last-auth',
            userId: existingUser.id,
            loginMethod: user.actualAuthMethod,
            loginStatus: 'success'
          })
        }).catch(console.error)
        
        return existingUser
      } else {
        // Create new user
        console.log('🆕 Creating new user in database')
        const createResponse = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Info': JSON.stringify(requestInfo)
          },
          body: JSON.stringify({
            action: 'create-user',
            userData,
            loginMethod: user.actualAuthMethod
          })
        })

        if (createResponse.ok) {
          const result = await createResponse.json()
          console.log('✅ User created in database:', result.data?.id)
          return result.data
        } else {
          const error = await createResponse.json().catch(() => ({ error: 'Unknown error' }))
          console.error('❌ Failed to create user in database:', error)
          
          // Log failed user creation attempt
          await fetch('/api/auth/user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Client-Info': JSON.stringify(requestInfo)
            },
            body: JSON.stringify({
              action: 'log-failed-signup',
              email: user.email,
              loginMethod: user.actualAuthMethod,
              error: error.error
            })
          }).catch(() => {})
          
          return null
        }
      }
    } catch (error) {
      console.error('❌ Database save error:', error)
      return null
    }
  }

  // Single useEffect to handle authentication state changes and prevent duplicate database saves
  const [hasProcessedAuth, setHasProcessedAuth] = React.useState(false)
  const processedUserRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    console.log('🚨 AUTH EFFECT TRIGGERED:', {
      isAuthenticated,
      pendingRedirect,
      hasMappedUser: !!mappedUser,
      hasProcessedAuth,
      userId: mappedUser?.primaryIdentifier,
      processedUserId: processedUserRef.current,
      windowAvailable: typeof window !== 'undefined'
    })

    // Only process authentication once per user per session to prevent duplicates
    const currentUserId = mappedUser?.primaryIdentifier || mappedUser?.address
    const alreadyProcessedThisUser = processedUserRef.current === currentUserId
    const isDifferentUser = processedUserRef.current && processedUserRef.current !== currentUserId

    // Reset flags if a different user is detected
    if (isDifferentUser) {
      console.log('🔄 Different user detected, resetting auth flags:', {
        previousUser: processedUserRef.current,
        newUser: currentUserId
      })
      setHasProcessedAuth(false)
      processedUserRef.current = null
    }

    if (isAuthenticated && mappedUser && !hasProcessedAuth && !alreadyProcessedThisUser) {
      console.log('✅ Processing authentication - saving user to database')
      setHasProcessedAuth(true)
      processedUserRef.current = currentUserId

      // Save user to database (only once per auth session)
      console.log('🚨 CALLING SAVE USER TO DATABASE (SINGLE CALL)', {
        userId: currentUserId,
        email: mappedUser.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
      })

      saveUserToDatabase(mappedUser)
        .then(savedUser => {
          console.log('✅ User saved successfully:', savedUser?.id)
          // Only send welcome email for truly new users
          if (savedUser && !savedUser.last_auth_at) {
            return triggerWelcomeEmail(mappedUser)
          }
        })
        .catch(error => {
          console.error('❌ Failed to save user:', error)
          // Reset flags on error to allow retry
          setHasProcessedAuth(false)
          processedUserRef.current = null
        })
        .finally(() => {
          // Handle redirect after database save completes
          if (pendingRedirect && typeof window !== 'undefined') {
            console.log('✅ Authentication processing complete, redirecting to:', pendingRedirect)
            const redirectUrl = pendingRedirect
            setPendingRedirect(null)
            window.location.href = redirectUrl
          }
        })
    } else if (isAuthenticated && pendingRedirect && (hasProcessedAuth || alreadyProcessedThisUser) && typeof window !== 'undefined') {
      // User already processed, just handle redirect
      console.log('✅ User already processed, redirecting to:', pendingRedirect)
      const redirectUrl = pendingRedirect
      setPendingRedirect(null)
      window.location.href = redirectUrl
    } else if (alreadyProcessedThisUser) {
      console.log('🚫 Skipping auth processing - user already processed:', currentUserId)
    }
  }, [isAuthenticated, pendingRedirect, mappedUser, hasProcessedAuth])

  // Reset hasProcessedAuth when user logs out
  React.useEffect(() => {
    if (!isAuthenticated && (hasProcessedAuth || processedUserRef.current)) {
      console.log('🔄 User logged out, resetting auth processing flags')
      setHasProcessedAuth(false)
      processedUserRef.current = null
    }
  }, [isAuthenticated, hasProcessedAuth])

  const prevAuthModalOpenRef = React.useRef<boolean>();
  // Clear pending redirect if auth modal is closed without authentication
  React.useEffect(() => {
    if (prevAuthModalOpenRef.current && !isAuthModalOpen && pendingRedirect && !isAuthenticated) {
      console.log('🚫 Auth modal closed without authentication, clearing pending redirect')
      setPendingRedirect(null)
    }
    prevAuthModalOpenRef.current = isAuthModalOpen;
  }, [isAuthModalOpen, pendingRedirect, isAuthenticated]);

  // Unified authentication method - no distinction between signup/login
  const authenticate = async (redirectTo: string = '/dashboard') => {
    try {
      setError(null)
      
      // Check if signer is already connected and has valid user
      if (signerStatus.isConnected && user) {
        console.log('✅ User already authenticated, redirecting...', { 
          userType: user.type,
          email: user.email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
          address: user.address
        })
        if (typeof window !== 'undefined') {
          window.location.href = redirectTo
        }
        return { success: true, user }
      }
      
      // Clean up any stale connections
      if (signerStatus.isConnected && (!user || user === false)) {
        console.log('🔄 Cleaning up stale connection...')
        await logout()
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Set redirect destination for post-auth navigation
      console.log('📝 Setting authentication redirect to:', redirectTo)
      setPendingRedirect(redirectTo)
      
      console.log('🔐 Opening Alchemy Account Kit authentication...', {
        signerConnected: signerStatus.isConnected,
        isAuthenticating: signerStatus.isAuthenticating,
        hasUser: !!user,
        redirectTo
      })
      
      // Open Alchemy's authentication modal
      openAuthModal()
      return { success: true }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'
      console.error('❌ Authentication error:', err)
      setError(errorMessage)
      setPendingRedirect(null)
      return { success: false, error: errorMessage }
    }
  }

  // Alias methods for backward compatibility
  const signIn = authenticate
  const signUp = authenticate

  const signOut = async () => {
    try {
      setError(null)
      console.log('🔌 Signing out securely...')
      
      // Add slight delay for better UX in logout dialog
      await new Promise(resolve => setTimeout(resolve, 200))
      
      await logout()
      console.log('✅ Secure sign out completed')
      
      // Clear any local storage or session data if needed
      if (typeof window !== 'undefined') {
        // Clear any cached balance data
        localStorage.removeItem('balance_cache')
        localStorage.removeItem('network_stats')
        // Clear any other USD Financial specific data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('usd_financial_') || key.startsWith('cctp_')) {
            localStorage.removeItem(key)
          }
        })
      }
      
    } catch (err) {
      console.error('❌ Sign out error:', err)
      setError('Sign out failed')
      throw err // Re-throw to let the UI handle the error
    }
  }

  // Simplified authentication helpers (Alchemy handles the specifics)
  const loginWithEmail = async (email?: string, redirectTo: string = '/dashboard') => {
    console.log('📧 Email login requested:', {
      hasEmail: !!email,
      maskedEmail: email?.replace(/(.{2}).*(@.*)/, '$1***$2'),
      timestamp: new Date().toISOString()
    })
    
    // Since Alchemy Account Kit handles email input in the modal,
    // we just need to open the authentication flow
    return authenticate(redirectTo)
  }

  const loginWithGoogle = async (redirectTo: string = '/dashboard') => {
    console.log('🔑 Google login requested')
    return authenticate(redirectTo)
  }

  // Passkey authentication (handled by Account Kit)
  const loginWithPasskey = async (redirectTo: string = '/dashboard') => {
    console.log('🔐 Passkey login requested')
    return authenticate(redirectTo)
  }

  // Helper function to switch users (logout then login)
  const switchUser = async () => {
    try {
      setError(null)
      console.log('🔄 Switching user...')
      await logout()
      // Wait for logout to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      openAuthModal()
      return { success: true }
    } catch (err) {
      console.error('❌ User switch error:', err)
      setError('User switch failed')
      return { success: false, error: 'User switch failed' }
    }
  }

  const setIsAuthModalOpen = (open: boolean) => {
    if (open) {
      openAuthModal()
    } else {
      closeAuthModal()
    }
  }

  const sendTransaction = async (to: Address, value: bigint, data: `0x${string}` = '0x') => {
    if (!signerStatus.isConnected) {
      throw new Error('Signer not connected');
    }
    if (!smartAccountClient) {
      throw new Error('Smart account client not available')
    }
    
    try {
      const result = await smartAccountClient.sendUserOperation({
        uo: {
          target: to,
          data: data,
          value: value,
        },
      })
      return result
    } catch (err) {
      console.error('Transaction error:', err)
      throw err
    }
  }

  return {
    // User state
    user: mappedUser,
    isConnected,
    isLoading,
    isAuthenticated,

    // Unified authentication methods
    authenticate, // Primary method - handles all auth types
    signIn, // Alias for authenticate
    signUp, // Alias for authenticate (no distinction)
    signOut,
    loginWithEmail,
    loginWithGoogle,
    loginWithPasskey, // New passkey support
    switchUser,

    // Onboarding state (for backward compatibility)
    onboardingStep,
    setOnboardingStep,

    // Smart Account functionality
    account,
    smartAccountClient,
    smartAccountAddress,
    smartAccountBalance: null, // TODO: implement balance fetching
    isSmartAccountReady: !!smartAccountClient,

    // Transaction methods
    sendTransaction,
    isSendingTransaction: false, // TODO: track transaction state

    // Modal state
    isAuthModalOpen,
    setIsAuthModalOpen,
    openAuthModal,
    closeAuthModal,

    // Status & Error handling
    status: isConnected ? 'connected' : 'disconnected',
    error: error || logoutError?.message || null,
    signerStatus, // Expose raw signer status for debugging
  }
}