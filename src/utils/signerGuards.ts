/**
 * Utility functions to safely handle signer operations
 * Prevents SignerNotConnectedError by checking connection status before operations
 */

export interface SignerStatus {
  isConnected: boolean
  isInitializing?: boolean
  isAuthenticating?: boolean
}

export interface SignerGuardResult {
  canProceed: boolean
  error?: string
}

/**
 * Check if signer is properly connected and ready for operations
 */
export function checkSignerConnection(signerStatus: SignerStatus, user: any): SignerGuardResult {
  // If still initializing, wait
  if (signerStatus.isInitializing) {
    return {
      canProceed: false,
      error: 'Signer is initializing. Please wait...'
    }
  }

  // If not connected at all
  if (!signerStatus.isConnected) {
    return {
      canProceed: false,
      error: 'Signer not connected. Please authenticate first.'
    }
  }

  // If connected but no user data (stale connection)
  if (signerStatus.isConnected && (!user || user === false)) {
    return {
      canProceed: false,
      error: 'Invalid authentication state. Please sign in again.'
    }
  }

  // All checks passed
  return {
    canProceed: true
  }
}

/**
 * Wrapper for async operations that require a connected signer
 */
export async function withSignerGuard<T>(
  signerStatus: SignerStatus,
  user: any,
  operation: () => Promise<T>,
  fallbackError: string = 'Operation failed due to signer connection issues'
): Promise<T> {
  const guardResult = checkSignerConnection(signerStatus, user)
  
  if (!guardResult.canProceed) {
    throw new Error(guardResult.error || fallbackError)
  }

  try {
    return await operation()
  } catch (error: any) {
    // If we get a signer connection error, provide more helpful message
    if (error.message?.includes('Signer not connected') || 
        error.message?.includes('SignerNotConnectedError')) {
      throw new Error('Authentication required. Please sign in and try again.')
    }
    // Re-throw original error
    throw error
  }
}

/**
 * Check if a smart account client is ready for use
 */
export function checkSmartAccountReady(smartAccountClient: any, address?: string): SignerGuardResult {
  if (!smartAccountClient) {
    return {
      canProceed: false,
      error: 'Smart account client not initialized'
    }
  }

  if (!address) {
    return {
      canProceed: false,
      error: 'Smart account address not available'
    }
  }

  return {
    canProceed: true
  }
}

/**
 * Safe transaction sender that checks all prerequisites
 */
export async function safeTransactionSend(
  signerStatus: SignerStatus,
  user: any,
  smartAccountClient: any,
  address: string | null,
  transactionFn: () => Promise<any>
): Promise<any> {
  // Check signer connection
  const signerGuard = checkSignerConnection(signerStatus, user)
  if (!signerGuard.canProceed) {
    throw new Error(signerGuard.error)
  }

  // Check smart account readiness
  const accountGuard = checkSmartAccountReady(smartAccountClient, address || undefined)
  if (!accountGuard.canProceed) {
    throw new Error(accountGuard.error)
  }

  // Execute transaction with error handling
  return withSignerGuard(signerStatus, user, transactionFn)
}