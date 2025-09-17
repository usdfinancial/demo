'use client'

import React, { ReactNode, createContext, useContext, useState, useEffect } from 'react'
// import { AlchemyAccountKitProvider } from './AlchemyAccountKitProvider' // Disabled for demo mode
import { useDemoAuth } from '@/hooks/useDemoAuth'
import { useSessionManager, type SessionWarning } from '@/hooks/useSessionManager'
import { SessionWarningDialog } from '@/components/auth/SessionWarningDialog'
import { multiChainBalanceService, TokenBalance, type NetworkBalance, type AggregatedBalance } from '@/lib/services/balanceService'
import { safeTransactionSend, checkSignerConnection } from '@/utils/signerGuards'

interface EnhancedAuthContextType {
  // User state
  user: any
  isLoading: boolean
  isAuthenticated: boolean
  isConnected: boolean
  
  // Unified authentication methods  
  authenticate: (redirectTo?: string) => Promise<any>
  signIn: (redirectTo?: string) => Promise<any>
  signUp: (redirectTo?: string) => Promise<any>
  signOut: () => Promise<void>
  signInWithGoogle: (redirectTo?: string) => Promise<any>
  loginWithEmail: (email?: string, redirectTo?: string) => Promise<any>
  loginWithGoogle: (redirectTo?: string) => Promise<any>
  loginWithPasskey: (redirectTo?: string) => Promise<any>
  switchUser: () => Promise<any>
  
  // Smart Account functionality
  account: any
  smartAccountClient: any
  smartAccountAddress: string | null
  smartAccountBalance: string | null
  isSmartAccountReady: boolean
  
  // Wallet connection state
  isWalletConnected: boolean
  isAAReady: boolean
  walletBalance: string | null
  eoaBalance: string | null
  
  // Multi-chain balance state
  multiChainBalances: AggregatedBalance | null
  sepoliaBalance: NetworkBalance | null
  totalUSDC: string
  networksWithBalance: number
  
  // Transaction methods
  sendTransaction: (to: string, value: string, data?: string) => Promise<any>
  sendGaslessTransaction?: (to: string, value: string, data?: string) => Promise<any>
  sendUSDC?: (to: string, amount: string, network?: string) => Promise<any>
  
  // Modal state
  isAuthModalOpen: boolean
  setIsAuthModalOpen: (open: boolean) => void
  openAuthModal: () => void
  closeAuthModal: () => void
  
  // Status & Error handling
  status: string
  error: string | null
  loading: boolean

  // Session Management
  currentSessionWarning: SessionWarning | null
  timeUntilSessionExpiry: number
  sessionStats: any
  extendSession: () => void
  
  // Additional properties for compatibility
  smartWalletAddress: string | null
  smartWalletBalance: string | null
  smartWalletUsdcBalance: string | null
  eoaAddress: string | null
  eoaUsdcBalance: string | null
  currentChain: string
  switchChain: (chainId: string) => Promise<void>
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | null>(null)

export function useEnhancedAuth() {
  const context = useContext(EnhancedAuthContext)
  if (!context) {
    throw new Error('useEnhancedAuth must be used within EnhancedAuthProvider')
  }
  return context
}

function EnhancedAuthProviderInner({ children }: { children: ReactNode }) {
  const authData = useDemoAuth()
  
  // Multi-chain balance state
  const [aggregatedBalance, setAggregatedBalance] = useState<AggregatedBalance | null>(null)
  const [sepoliaBalance, setSepoliaBalance] = useState<NetworkBalance | null>(null)
  const [balancesLoading, setBalancesLoading] = useState<boolean>(false)
  
  // Session warning dialog state
  const [isSessionWarningOpen, setIsSessionWarningOpen] = useState(false)

  // Session management (temporarily simplified to prevent re-renders)
  const sessionManager = React.useMemo(() => ({
    currentWarning: null,
    timeUntilExpiry: 30 * 60 * 1000,
    sessionStats: {
      sessionStartTime: Date.now(),
      lastActivity: Date.now(),
      totalSessionTime: 0
    },
    extendSession: () => {
      console.log('✅ Session extended')
      setIsSessionWarningOpen(false)
    },
    dismissWarning: () => {
      setIsSessionWarningOpen(false)
    },
    handleAutoLogout: async () => {
      await authData.signOut()
      // After logout, redirect to landing page
      window.location.href = '/'
    }
  }), [])
  
  // Map the Alchemy auth data to our enhanced interface
  // Fetch balances when addresses are available - debounced to prevent excessive calls
  useEffect(() => {
    let isCancelled = false

    const fetchBalances = async () => {
      const smartWalletAddress = authData.smartAccountAddress
      const eoaAddress = authData.user?.address
      
      if (!smartWalletAddress && !eoaAddress) return
      if (isCancelled) return
      
      setBalancesLoading(true)
      
      try {
        // Fetch multi-chain balances for smart wallet if available (primary)
        if (smartWalletAddress && !isCancelled) {
          console.log('🌐 Fetching multi-chain balances for smart wallet:', smartWalletAddress)
          
          // Fetch aggregated balances across all supported networks
          const networks = ['sepolia', 'arbitrumSepolia', 'baseSepolia', 'optimismSepolia', 'polygonAmoy', 'fuji'] as const
          const aggregatedBalances = await multiChainBalanceService.getAllNetworkBalances(smartWalletAddress, networks, false) // disable cache temporarily to get fresh data
          
          if (!isCancelled) {
            setAggregatedBalance(aggregatedBalances)
            
            // Extract Sepolia balance for backward compatibility
            const sepoliaNW = aggregatedBalances.networks.find(n => n.network === 'Ethereum Sepolia')
            setSepoliaBalance(sepoliaNW || null)
            
            console.log('✅ Multi-chain balances fetched:', {
              address: smartWalletAddress,
              totalNetworks: aggregatedBalances.networks.length,
              totalUSDC: aggregatedBalances.totalUSDC,
              sepoliaETH: sepoliaNW?.eth || '0',
              sepoliaUSDC: sepoliaNW?.usdc?.balance || '0',
              networksWithBalance: aggregatedBalances.networks.filter(n => n.usdc && parseFloat(n.usdc.balance) > 0).length,
              detailedBalances: aggregatedBalances.networks.map(n => ({
                network: n.network,
                chainId: n.chainId,
                eth: n.eth,
                usdcBalance: n.usdc?.balance,
                usdcDecimals: n.usdc?.decimals,
                hasError: !!n.error,
                error: n.error
              }))
            })
          }
        }
        // TODO: Also fetch EOA balances if needed
      } catch (error) {
        console.error('❌ Error fetching multi-chain balances:', error)
        if (!isCancelled) {
          setAggregatedBalance(null)
          setSepoliaBalance(null)
        }
      } finally {
        if (!isCancelled) {
          setBalancesLoading(false)
        }
      }
    }

    // Only fetch balances when authenticated and addresses are available - with debounce
    if (authData.isAuthenticated && authData.smartAccountAddress) {
      const timer = setTimeout(fetchBalances, 500) // 500ms debounce
      return () => {
        isCancelled = true
        clearTimeout(timer)
      }
    }

    return () => {
      isCancelled = true
    }
  }, [authData.isAuthenticated, authData.smartAccountAddress]) // Removed balancesLoading dependency

  const enhancedUser = React.useMemo(() => {
    if (!authData.user) return null
    
    return {
      ...authData.user,
      // Map the addresses for compatibility with wallet components
      walletAddress: authData.smartAccountAddress || null, // Smart wallet address
      eoaAddress: authData.user.address || null, // EOA address from user
      smartWalletAddress: authData.smartAccountAddress || null, // Alias for smart wallet
      backupAddress: authData.user.address || null, // Alias for backup EOA
      
      // Add multi-chain balance information
      walletUsdcBalance: sepoliaBalance?.usdc?.balance || '0', // Sepolia USDC for backward compatibility
      walletEthBalance: sepoliaBalance?.eth || '0', // Sepolia ETH for backward compatibility
      usdcTokenInfo: sepoliaBalance?.usdc || null, // Sepolia USDC token info for backward compatibility
      
      // Add aggregated multi-chain balance information
      totalUSDC: aggregatedBalance?.totalUSDC || '0',
      multiChainBalances: aggregatedBalance,
      sepoliaBalance: sepoliaBalance,
      networksWithBalance: aggregatedBalance?.networks.filter(n => n.usdc && parseFloat(n.usdc.balance) > 0).length || 0
    }
  }, [
    authData.user, 
    authData.smartAccountAddress, 
    sepoliaBalance?.usdc?.balance,
    sepoliaBalance?.eth,
    aggregatedBalance?.totalUSDC,
    aggregatedBalance?.networks.length
  ])

  // Debug logging for authentication state changes (throttled to prevent infinite re-renders)
  React.useEffect(() => {
    const logTimeout = setTimeout(() => {
      console.log('🔄 Alchemy auth state update:', {
        user: !!authData.user,
        userAddress: authData.user?.address,
        smartAccountAddress: authData.smartAccountAddress,
        isLoading: authData.isLoading,
        isAuthenticated: authData.isAuthenticated,
        isConnected: authData.isConnected,
        isSmartAccountReady: authData.isSmartAccountReady,
        error: authData.error
      })
    }, 100)
    
    return () => clearTimeout(logTimeout)
  }, [authData.isAuthenticated, authData.smartAccountAddress]) // Reduced dependencies
  
  // Debug logging for enhanced user object (throttled)
  React.useEffect(() => {
    if (!enhancedUser) return
    
    const logTimeout = setTimeout(() => {
      console.log('🔍 Enhanced user addresses and balances:', {
        walletAddress: enhancedUser.walletAddress,
        eoaAddress: enhancedUser.eoaAddress,
        smartWalletAddress: enhancedUser.smartWalletAddress,
        backupAddress: enhancedUser.backupAddress,
        originalAddress: enhancedUser.address,
        // Multi-chain balances
        totalUSDC: enhancedUser.totalUSDC,
        networksWithBalance: enhancedUser.networksWithBalance
      })
    }, 200)
    
    return () => clearTimeout(logTimeout)
  }, [enhancedUser?.address, enhancedUser?.smartWalletAddress]) // Only depend on stable identifiers
  
  // Debug logging for multi-chain balance updates (throttled)
  React.useEffect(() => {
    const logTimeout = setTimeout(() => {
      console.log('💰 Multi-chain balance state update:', {
        aggregatedBalanceExists: !!aggregatedBalance,
        totalUSDC: aggregatedBalance?.totalUSDC || '0',
        totalNetworks: aggregatedBalance?.networks.length || 0,
        sepoliaETH: sepoliaBalance?.eth || '0',
        sepoliaUSDC: sepoliaBalance?.usdc?.balance || '0',
        balancesLoading,
        lastUpdated: aggregatedBalance?.lastUpdated
      })
    }, 300)
    
    return () => clearTimeout(logTimeout)
  }, [!!aggregatedBalance, !!sepoliaBalance]) // Only depend on existence, not content

  const enhancedAuthData: EnhancedAuthContextType = {
    // User state
    user: enhancedUser,
    isLoading: authData.isLoading,
    isAuthenticated: authData.isAuthenticated,
    isConnected: authData.isConnected,
    loading: authData.isLoading,
    
    // Unified authentication methods
    authenticate: authData.authenticate,
    signIn: authData.signIn,
    signUp: authData.signUp,
    signOut: authData.signOut,
    signInWithGoogle: authData.loginWithGoogle,
    loginWithEmail: authData.loginWithEmail,
    loginWithGoogle: authData.loginWithGoogle,
    loginWithPasskey: authData.loginWithPasskey,
    switchUser: authData.switchUser,
    
    // Smart Account functionality
    account: authData.account,
    smartAccountClient: authData.smartAccountClient,
    smartAccountAddress: authData.smartAccountAddress,
    smartAccountBalance: authData.smartAccountBalance,
    isSmartAccountReady: authData.isSmartAccountReady,
    
    // Wallet connection state
    isWalletConnected: authData.isAuthenticated && !!authData.user, // Connected if authenticated and has user
    isAAReady: authData.isSmartAccountReady,
    walletBalance: sepoliaBalance?.eth || null, // Real ETH balance from Sepolia
    eoaBalance: authData.user?.address ? '0.0' : null, // EOA balance (TODO: fetch separately if needed)
    
    // Multi-chain balance state
    multiChainBalances: aggregatedBalance,
    sepoliaBalance: sepoliaBalance,
    totalUSDC: aggregatedBalance?.totalUSDC || '0',
    networksWithBalance: aggregatedBalance?.networks.filter(n => n.usdc && parseFloat(n.usdc.balance) > 0).length || 0,
    
    // Transaction methods with signer guards
    sendTransaction: async (to: string, value: string, data?: string) => {
      const signerCheck = checkSignerConnection(
        { 
          isConnected: authData.isConnected, 
          isInitializing: authData.isLoading 
        }, 
        authData.user
      );
      
      if (!signerCheck.canProceed) {
        throw new Error(signerCheck.error || 'Cannot send transaction: signer not ready');
      }
      
      return authData.sendTransaction(to, value, data);
    },
    sendGaslessTransaction: async (to: string, value: string, data?: string) => {
      return safeTransactionSend(
        { 
          isConnected: authData.isConnected, 
          isInitializing: authData.isLoading 
        },
        authData.user,
        authData.smartAccountClient,
        authData.smartAccountAddress,
        () => authData.sendTransaction(to, value, data)
      );
    },
    sendUSDC: async (to: string, amount: string, network?: string) => {
      // USDC contract addresses for testnet networks
      const usdcAddresses: Record<string, string> = {
        'Ethereum Sepolia': '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
        'Arbitrum Sepolia': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
        'Base Sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        'OP Sepolia': '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
        'Polygon Amoy Testnet': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
        'Avalanche Fuji': '0x5425890298aed601595a70AB815c96711a31Bc65'
      }
      
      const selectedNetwork = network || 'Ethereum Sepolia' // Default to Sepolia
      const usdcContractAddress = usdcAddresses[selectedNetwork]
      
      if (!usdcContractAddress) {
        throw new Error(`USDC contract address not found for network: ${selectedNetwork}`)
      }

      // IMPORTANT: Account Kit is currently configured for Ethereum Sepolia only
      // Other networks will fail until multi-chain support is implemented
      if (selectedNetwork !== 'Ethereum Sepolia') {
        throw new Error(`Network "${selectedNetwork}" is not yet supported. Account Kit is currently configured for Ethereum Sepolia only. Multi-chain support coming soon!`)
      }

      // Convert amount to proper decimals (USDC has 6 decimals)
      const amountInDecimals = BigInt(parseFloat(amount) * 10**6)
      
      // Create ERC20 transfer function call data
      const transferFunctionSignature = '0xa9059cbb' // transfer(address,uint256) function selector
      const paddedRecipient = to.slice(2).padStart(64, '0') // Remove 0x and pad to 32 bytes
      const paddedAmount = amountInDecimals.toString(16).padStart(64, '0') // Convert to hex and pad
      const transferData = `${transferFunctionSignature}${paddedRecipient}${paddedAmount}`

      console.log('🏗️ Building USDC transfer transaction:', {
        network: selectedNetwork,
        usdcContract: usdcContractAddress,
        recipient: to,
        amount: amount,
        amountInDecimals: amountInDecimals.toString(),
        transferData
      })

      return safeTransactionSend(
        { 
          isConnected: authData.isConnected, 
          isInitializing: authData.isLoading 
        },
        authData.user,
        authData.smartAccountClient,
        authData.smartAccountAddress,
        async () => {
          // Use the existing sendTransaction method with USDC contract call data
          return authData.sendTransaction(usdcContractAddress, '0', transferData)
        }
      );
    },
    
    // Modal state
    isAuthModalOpen: authData.isAuthModalOpen,
    setIsAuthModalOpen: authData.setIsAuthModalOpen,
    openAuthModal: authData.openAuthModal,
    closeAuthModal: authData.closeAuthModal,
    
    // Status & Error handling
    status: authData.status,
    error: authData.error,

    // Session Management
    currentSessionWarning: sessionManager.currentWarning,
    timeUntilSessionExpiry: sessionManager.timeUntilExpiry,
    sessionStats: sessionManager.sessionStats,
    extendSession: sessionManager.extendSession,
    
    // Additional properties for compatibility
    smartWalletAddress: authData.smartAccountAddress,
    smartWalletBalance: sepoliaBalance?.eth || null,
    smartWalletUsdcBalance: sepoliaBalance?.usdc?.balance || null,
    eoaAddress: authData.user?.address || null,
    eoaUsdcBalance: null, // TODO: implement EOA USDC balance if needed
    currentChain: 'sepolia', // Default to sepolia for now
    switchChain: async (chainId: string) => {
      console.log('Switch chain requested:', chainId)
      // TODO: implement chain switching if needed
    },
  }

  // Session warning dialog handlers
  const handleExtendSession = () => {
    sessionManager.extendSession()
  }

  const handleDismissWarning = () => {
    sessionManager.dismissWarning()
    setIsSessionWarningOpen(false)
  }

  const handleLogoutNow = async () => {
    setIsSessionWarningOpen(false)
    await sessionManager.handleAutoLogout()
  }

  return (
    <EnhancedAuthContext.Provider value={enhancedAuthData}>
      {children}
      
      {/* Session Warning Dialog */}
      <SessionWarningDialog
        warning={sessionManager.currentWarning}
        isOpen={isSessionWarningOpen}
        onExtendSession={handleExtendSession}
        onDismiss={handleDismissWarning}
        onLogoutNow={handleLogoutNow}
        userName={enhancedUser?.name}
        userEmail={enhancedUser?.email}
      />
    </EnhancedAuthContext.Provider>
  )
}

export function EnhancedAuthProvider({ children }: { children: ReactNode }) {
  // Demo mode: Skip AlchemyAccountKitProvider and use demo authentication directly
  return (
    <EnhancedAuthProviderInner>
      {children}
    </EnhancedAuthProviderInner>
  )
}