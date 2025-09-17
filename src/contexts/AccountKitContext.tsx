'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useAlchemyAuth } from '@/hooks/useAlchemyAuth'

interface EmailAuthResult {
  success: boolean
  error?: string
  debugInfo?: {
    emailFormatValid: boolean
    alchemyApiKey: boolean
    userAgent: string
    timestamp: number
    attemptId: string
  }
}

interface AccountKitContextType {
  // User state
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  
  // Authentication methods
  authenticate: (email: string) => Promise<EmailAuthResult>
  signOut: () => Promise<void>
  
  // Debug information
  lastEmailAttempt: EmailAuthResult | null
  emailDebugLog: EmailAuthResult[]
}

const AccountKitContext = createContext<AccountKitContextType | null>(null)

export function useAccountKit() {
  const context = useContext(AccountKitContext)
  if (!context) {
    throw new Error('useAccountKit must be used within AccountKitProvider')
  }
  return context
}

interface AccountKitProviderProps {
  children: ReactNode
}

export function AccountKitProvider({ children }: AccountKitProviderProps) {
  const alchemyAuth = useAlchemyAuth()
  const [lastEmailAttempt, setLastEmailAttempt] = useState<EmailAuthResult | null>(null)
  const [emailDebugLog, setEmailDebugLog] = useState<EmailAuthResult[]>([])

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Enhanced authentication with debugging
  const authenticate = async (email: string): Promise<EmailAuthResult> => {
    const attemptId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()
    
    console.log('🔍 Email authentication attempt:', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for privacy
      attemptId,
      timestamp: new Date(timestamp).toISOString()
    })

    // Email format validation
    const emailFormatValid = isValidEmail(email)
    if (!emailFormatValid) {
      const result: EmailAuthResult = {
        success: false,
        error: 'Invalid email format',
        debugInfo: {
          emailFormatValid: false,
          alchemyApiKey: !!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
          timestamp,
          attemptId
        }
      }
      
      setLastEmailAttempt(result)
      setEmailDebugLog(prev => [...prev.slice(-9), result]) // Keep last 10 attempts
      
      console.error('❌ Email authentication failed: Invalid format', result)
      return result
    }

    // Environment validation
    const alchemyApiKey = !!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    if (!alchemyApiKey) {
      const result: EmailAuthResult = {
        success: false,
        error: 'Alchemy API key not configured',
        debugInfo: {
          emailFormatValid: true,
          alchemyApiKey: false,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
          timestamp,
          attemptId
        }
      }
      
      setLastEmailAttempt(result)
      setEmailDebugLog(prev => [...prev.slice(-9), result])
      
      console.error('❌ Email authentication failed: Missing API key', result)
      return result
    }

    try {
      // Check for potential email delivery blockers
      const emailDomain = email.split('@')[1]?.toLowerCase()
      const commonProblematicDomains = [
        'outlook.com', 'live.com', 'hotmail.com', // Microsoft domains sometimes have stricter filters
        'yahoo.com', 'ymail.com', // Yahoo has aggressive spam filtering
        'icloud.com', 'me.com' // Apple domains can be restrictive
      ]
      
      const isProblematicDomain = commonProblematicDomains.includes(emailDomain)
      if (isProblematicDomain) {
        console.warn(`⚠️ Email domain ${emailDomain} may have stricter spam filtering`)
      }

      // Attempt authentication through Alchemy
      console.log('🔄 Calling Alchemy Account Kit authentication...')
      const authResult = await alchemyAuth.loginWithEmail(email)
      
      if (authResult.success === false) {
        const result: EmailAuthResult = {
          success: false,
          error: authResult.error || 'Authentication failed',
          debugInfo: {
            emailFormatValid: true,
            alchemyApiKey: true,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
            timestamp,
            attemptId
          }
        }
        
        setLastEmailAttempt(result)
        setEmailDebugLog(prev => [...prev.slice(-9), result])
        
        console.error('❌ Alchemy authentication failed:', result)
        return result
      }

      // Success case
      const result: EmailAuthResult = {
        success: true,
        debugInfo: {
          emailFormatValid: true,
          alchemyApiKey: true,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
          timestamp,
          attemptId
        }
      }
      
      setLastEmailAttempt(result)
      setEmailDebugLog(prev => [...prev.slice(-9), result])
      
      console.log('✅ Email authentication successful:', {
        attemptId,
        timestamp: new Date(timestamp).toISOString(),
        domain: emailDomain,
        isProblematicDomain
      })
      
      return result
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error'
      
      const result: EmailAuthResult = {
        success: false,
        error: errorMessage,
        debugInfo: {
          emailFormatValid: true,
          alchemyApiKey: true,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
          timestamp,
          attemptId
        }
      }
      
      setLastEmailAttempt(result)
      setEmailDebugLog(prev => [...prev.slice(-9), result])
      
      console.error('❌ Email authentication exception:', error, result)
      return result
    }
  }

  // Debug logging for authentication state changes
  useEffect(() => {
    if (alchemyAuth.error) {
      console.error('🚨 Alchemy Auth Error:', alchemyAuth.error)
    }
    
    if (alchemyAuth.user) {
      console.log('✅ Alchemy User Authenticated:', {
        hasUser: !!alchemyAuth.user,
        authType: alchemyAuth.user.authType,
        email: alchemyAuth.user.email ? alchemyAuth.user.email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined
      })
    }
  }, [alchemyAuth.user, alchemyAuth.error])

  const contextValue: AccountKitContextType = {
    // User state from Alchemy
    user: alchemyAuth.user,
    isAuthenticated: alchemyAuth.isAuthenticated,
    isLoading: alchemyAuth.isLoading,
    
    // Enhanced authentication with debugging
    authenticate,
    signOut: alchemyAuth.signOut,
    
    // Debug information
    lastEmailAttempt,
    emailDebugLog
  }

  return (
    <AccountKitContext.Provider value={contextValue}>
      {children}
    </AccountKitContext.Provider>
  )
}

// Browser console debugging utilities
if (typeof window !== 'undefined') {
  (window as any).getEmailDebugLog = () => {
    const accountKit = (window as any).accountKitDebug
    return accountKit?.emailDebugLog || []
  }
  
  (window as any).getLastEmailAttempt = () => {
    const accountKit = (window as any).accountKitDebug
    return accountKit?.lastEmailAttempt || null
  }
  
  console.log('🔧 Email Debug Tools Available:')
  console.log('- getEmailDebugLog() - View all email authentication attempts')
  console.log('- getLastEmailAttempt() - View the most recent email attempt')
}