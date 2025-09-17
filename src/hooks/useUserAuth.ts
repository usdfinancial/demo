import { useEffect, useState, useCallback } from 'react'
import { useAlchemyAuth, type AlchemyUser } from './useAlchemyAuth'
import { userAuthService, type SimpleUser as USDFinancialUser } from '@/lib/services/userAuthService'

/**
 * Simple authentication hook for standard Alchemy Account Kit behavior
 * No email consolidation - each auth method creates separate users
 */
export function useUserAuth() {
  const alchemyAuth = useAlchemyAuth()
  const [usdUser, setUsdUser] = useState<USDFinancialUser | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)

  /**
   * Sync Alchemy user with USD Financial database
   * Creates separate user records for each authentication method
   */
  const syncUser = useCallback(async (alchemyUser: AlchemyUser) => {
    if (!alchemyUser?.address) {
      console.warn('⚠️ Cannot sync user: no wallet address provided')
      return null
    }

    setIsUserLoading(true)
    setUserError(null)

    try {
      const walletAddress = alchemyAuth.smartAccountAddress || alchemyUser.address

      console.log('👤 Syncing user with standard Alchemy behavior:', {
        email: alchemyUser.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'none',
        walletAddress: walletAddress.slice(0, 8) + '...',
        authType: alchemyUser.authType || 'unknown'
      })

      // First, try to find existing user by wallet address
      let existingUser = await userAuthService.findUserByWalletAddress(walletAddress)

      if (existingUser) {
        console.log('✅ Found existing user by wallet address')
        
        // Update last authentication time
        await userAuthService.updateLastAuth(existingUser.id)
        setUsdUser(existingUser)
        return existingUser
      }

      // If no user found, create a new one (standard Alchemy behavior)
      console.log('🆕 Creating new user for wallet address')
      
      const newUser = await userAuthService.createUser({
        email: alchemyUser.email,
        smartWalletAddress: walletAddress,
        eoaAddress: alchemyUser.address,
        authMethod: (alchemyUser.authType || 'wallet') as any,
        profile: {
          firstName: alchemyUser.givenName,
          lastName: alchemyUser.familyName,
          displayName: alchemyUser.name
        }
      })

      console.log('✅ Created new USD Financial user:', {
        id: newUser.id,
        email: newUser.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'none',
        authMethod: newUser.authMethod
      })

      setUsdUser(newUser)
      return newUser

    } catch (error) {
      console.error('❌ Error syncing user:', error)
      setUserError(error instanceof Error ? error.message : 'Failed to sync user')
      return null
    } finally {
      setIsUserLoading(false)
    }
  }, [alchemyAuth.smartAccountAddress])

  /**
   * Verify user email
   */
  const verifyEmail = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const success = await userAuthService.verifyEmail(userId)
      if (success && usdUser) {
        setUsdUser({ ...usdUser, isEmailVerified: true })
      }
      return success
    } catch (error) {
      console.error('Error verifying email:', error)
      return false
    }
  }, [usdUser])

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profileData: any): Promise<boolean> => {
    if (!usdUser) return false

    try {
      const updatedUser = await userAuthService.updateProfile(usdUser.id, profileData)
      if (updatedUser) {
        setUsdUser(updatedUser)
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating profile:', error)
      return false
    }
  }, [usdUser])

  // Sync when Alchemy user changes
  useEffect(() => {
    if (alchemyAuth.isAuthenticated && alchemyAuth.user) {
      syncUser(alchemyAuth.user)
    } else if (!alchemyAuth.isAuthenticated) {
      setUsdUser(null)
      setUserError(null)
    }
  }, [alchemyAuth.isAuthenticated, alchemyAuth.user, syncUser])

  return {
    // User state
    user: usdUser,
    isLoading: isUserLoading || alchemyAuth.isLoading,
    error: userError || alchemyAuth.error,
    isAuthenticated: alchemyAuth.isAuthenticated && !!usdUser,

    // Authentication methods (passthrough to Alchemy)
    signIn: alchemyAuth.signIn,
    signOut: alchemyAuth.signOut,
    authenticate: alchemyAuth.authenticate,
    loginWithEmail: alchemyAuth.loginWithEmail,
    loginWithGoogle: alchemyAuth.loginWithGoogle,
    loginWithPasskey: alchemyAuth.loginWithPasskey,

    // User management
    verifyEmail,
    updateProfile,
    syncUser,

    // Alchemy auth data (for compatibility)
    alchemyAuth,
  }
}