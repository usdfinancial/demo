'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { demoUsers, type DemoUser } from '@/lib/demoUsers'

export interface DemoAuthUser {
  id: string
  name: string
  email: string
  image?: string
  address?: string
  accountType: 'personal' | 'business' | 'premium'
  balance: number
  authType: 'demo'
  type: 'demo'
}

// Demo authentication hook that bypasses Alchemy Account Kit
export function useDemoAuth() {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize with first demo user on mount
  useEffect(() => {
    const initializeDemoUser = () => {
      try {
        // Check if there's a saved demo user in localStorage
        const savedUserId = localStorage.getItem('demo-current-user-id')
        let initialUser = demoUsers[0] // Default to first user
        
        if (savedUserId) {
          const foundUser = demoUsers.find(user => user.id === savedUserId)
          if (foundUser) {
            initialUser = foundUser
          }
        }
        
        setCurrentUser(initialUser)
        console.log('🎭 Demo Auth: Initialized with user:', initialUser.name)
      } catch (err) {
        console.error('🎭 Demo Auth: Initialization error:', err)
        setCurrentUser(demoUsers[0]) // Fallback to first user
      } finally {
        setIsLoading(false)
      }
    }

    // Small delay to simulate loading
    const timer = setTimeout(initializeDemoUser, 500)
    return () => clearTimeout(timer)
  }, [])

  // Save current user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('demo-current-user-id', currentUser.id)
    }
  }, [currentUser])

  // Map demo user to auth format
  const mappedUser: DemoAuthUser | null = useMemo(() => {
    if (!currentUser) return null
    
    return {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      image: currentUser.image,
      address: `0x${currentUser.id.replace('demo-user-', '').padStart(40, '0')}`,
      accountType: currentUser.accountType,
      balance: currentUser.balance,
      authType: 'demo',
      type: 'demo'
    }
  }, [currentUser])

  // Demo authentication methods
  const authenticate = async (redirectTo?: string) => {
    console.log('🎭 Demo Auth: Authenticate called')
    return { success: true, user: mappedUser }
  }

  const signIn = async (redirectTo?: string) => {
    console.log('🎭 Demo Auth: Sign in called')
    return { success: true, user: mappedUser }
  }

  const signUp = async (redirectTo?: string) => {
    console.log('🎭 Demo Auth: Sign up called')
    return { success: true, user: mappedUser }
  }

  const signOut = async () => {
    console.log('🎭 Demo Auth: Sign out called')
    setCurrentUser(null)
    localStorage.removeItem('demo-current-user-id')
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    console.log('🎭 Demo Auth: Google sign in called')
    return { success: true, user: mappedUser }
  }

  const loginWithEmail = async (email?: string, redirectTo?: string) => {
    console.log('🎭 Demo Auth: Email login called')
    return { success: true, user: mappedUser }
  }

  const loginWithGoogle = async (redirectTo?: string) => {
    console.log('🎭 Demo Auth: Google login called')
    return { success: true, user: mappedUser }
  }

  const loginWithPasskey = async (redirectTo?: string) => {
    console.log('🎭 Demo Auth: Passkey login called')
    return { success: true, user: mappedUser }
  }

  // Demo-specific user switching
  const switchUser = async (newUser?: DemoUser) => {
    try {
      setError(null)
      
      if (newUser) {
        // Switch to specific user
        console.log('🎭 Demo Auth: Switching to user:', newUser.name)
        setCurrentUser(newUser)
        return { success: true, user: newUser }
      } else {
        // Cycle to next user
        const currentIndex = demoUsers.findIndex(user => user.id === currentUser?.id)
        const nextIndex = (currentIndex + 1) % demoUsers.length
        const nextUser = demoUsers[nextIndex]
        
        console.log('🎭 Demo Auth: Cycling to next user:', nextUser.name)
        setCurrentUser(nextUser)
        return { success: true, user: nextUser }
      }
    } catch (err) {
      console.error('🎭 Demo Auth: Switch user error:', err)
      setError('User switch failed')
      return { success: false, error: 'User switch failed' }
    }
  }

  return {
    // User state
    user: mappedUser,
    isLoading,
    isAuthenticated: !!currentUser,
    isConnected: !!currentUser,
    loading: isLoading,
    error,

    // Authentication methods
    authenticate,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    loginWithEmail,
    loginWithGoogle,
    loginWithPasskey,
    switchUser,

    // Smart Account functionality (mocked)
    account: null,
    smartAccountClient: null,
    smartAccountAddress: mappedUser?.address || null,
    smartAccountBalance: null,
    isSmartAccountReady: !!currentUser,

    // Transaction methods (mocked)
    sendTransaction: async (to: string, value: string, data?: string) => {
      console.log('🎭 Demo Auth: Mock transaction:', { to, value, data })
      return { success: true, hash: '0xdemo' + Date.now() }
    },

    // Modal state (mocked for compatibility)
    isAuthModalOpen: false,
    setIsAuthModalOpen: (open: boolean) => {
      console.log('🎭 Demo Auth: Modal state change:', open)
    },
    openAuthModal: () => {
      console.log('🎭 Demo Auth: Open auth modal')
    },
    closeAuthModal: () => {
      console.log('🎭 Demo Auth: Close auth modal')
    },
    
    // Signer status (mocked)
    status: 'CONNECTED',

    // Demo utilities
    getAllDemoUsers: () => demoUsers,
    getCurrentDemoUser: () => currentUser,
    findUserByEmail: (email: string) => demoUsers.find(user => user.email === email)
  }
}
