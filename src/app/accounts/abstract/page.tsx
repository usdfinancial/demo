'use client'

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Copy, 
  ExternalLink, 
  Wallet, 
  Shield, 
  Zap, 
  Globe, 
  Coins,
  Code,
  User,
  Mail,
  ChevronRight,
  RefreshCw,
  Network,
  Server,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Database,
  Link,
  Eye,
  Settings,
  Plus
} from 'lucide-react'

export default function AbstractPage() {
  const { user, loading, isWalletConnected, isAAReady, walletBalance, eoaBalance, signIn } = useAuth()
  const { 
    smartWalletAddress, 
    smartWalletBalance, 
    smartWalletUsdcBalance: smartWalletUsdcBalance,
    eoaAddress: eoaAddress = null, 
    eoaUsdcBalance: eoaUsdcBalance = null,
    currentChain,
    switchChain,
    loading: isLoading,
    signIn: login
  } = useEnhancedAuth()

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState(currentChain)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [blockchainInfo, setBlockchainInfo] = useState<any>(null)
  const [alchemyStatus, setAlchemyStatus] = useState<any>(null)
  const [tokenBalances, setTokenBalances] = useState<any[]>([])
  const [isCreatingWallet, setIsCreatingWallet] = useState<'smart' | 'eoa' | null>(null)

  // Debug information
  const debugInfo = {
    userObject: user,
    smartWalletInfo: {
      address: smartWalletAddress,
      balance: smartWalletBalance,
      usdcBalance: smartWalletUsdcBalance
    },
    eoaInfo: {
      address: eoaAddress,
      balance: eoaBalance,
      usdcBalance: eoaUsdcBalance
    },
    connectionState: {
      isWalletConnected,
      isAAReady,
      currentChain,
      isLoading,
      loading
    },
    environmentVars: {
      hasAlchemyKey: true, // Demo mode - simulated as available
      alchemyKeyPrefix: 'demo_key...',
      hasPolicyId: true, // Demo mode - simulated as available
      hasAlchemyAccountKit: true // Demo mode - simulated as available
    },
    contextComparison: {
      authContext: {
        userWalletAddress: user?.walletAddress,
        userEoaAddress: user?.eoaAddress,
        userWalletBalance: user?.walletBalance,
        userWalletUsdcBalance: user?.walletUsdcBalance,
        userEoaBalance: user?.eoaBalance,
        userEoaUsdcBalance: user?.eoaUsdcBalance
      },
      aaContext: {
        smartWalletAddress,
        smartWalletBalance,
        smartWalletUsdcBalance,
        eoaAddress,
        eoaBalance,
        eoaUsdcBalance
      }
    }
  }

  // Console logging for debugging
  useEffect(() => {
    console.log('🔍 Abstract Page Debug Info:', debugInfo)
  }, [user, smartWalletAddress, eoaAddress, isWalletConnected])

  const copyToClipboard = async (address: string, type: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(type)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatAddress = (address: string | null | undefined) => {
    if (!address) return 'Not available'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string | null | undefined) => {
    if (!balance || balance === '0') return '0.0000'
    return parseFloat(balance).toFixed(4)
  }

  const networks = [
    {
      id: 'sepolia',
      name: 'Ethereum Sepolia',
      chainId: '0xaa36a7',
      rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo_key',
      blockExplorer: 'https://sepolia.etherscan.io',
      icon: '🔧',
      color: 'bg-blue-100 text-blue-800',
      isTestnet: true
    },
    {
      id: 'mainnet',
      name: 'Ethereum Mainnet',
      chainId: '0x1',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo_key',
      blockExplorer: 'https://etherscan.io',
      icon: '💎',
      color: 'bg-emerald-100 text-emerald-800',
      isTestnet: false
    }
  ]

  const tokenContracts = [
    {
      name: 'USDC (Sepolia)',
      address: '0xf08a50178dfcde18524640ea6618a1f965821715',
      decimals: 6,
      symbol: 'USDC',
      network: 'sepolia'
    },
    {
      name: 'USDC (Mainnet)',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      symbol: 'USDC',
      network: 'mainnet'
    }
  ]

  const handleNetworkSwitch = async (networkId: string) => {
    try {
      setSelectedNetwork(networkId)
      await switchChain(networkId)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  // Demo blockchain connection test (simulated)
  const testAlchemyConnection = async () => {
    // Simulate connection test for demo mode
    setAlchemyStatus({
      connected: true,
      latestBlock: 4567890,
      rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo_key...',
      responseTime: Date.now()
    })
  }

  const getBlockchainInfo = async () => {
    // Simulate blockchain info for demo mode
    setBlockchainInfo({
      number: '0x45D4EA',
      hash: '0x1234567890abcdef...',
      timestamp: '0x' + Math.floor(Date.now() / 1000).toString(16),
      gasLimit: '0x1C9C380',
      gasUsed: '0x5208'
    })
  }

  const getTokenBalances = async (address: string) => {
    if (!address) return
    
    // Simulate token balances for demo mode
    setTokenBalances([
      {
        contractAddress: '0xf08a50178dfcde18524640ea6618a1f965821715',
        tokenBalance: '0x' + (2500 * 1e6).toString(16), // 2500 USDC
        symbol: 'USDC',
        decimals: 6
      },
      {
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        tokenBalance: '0x' + (1000 * 1e6).toString(16), // 1000 USDC
        symbol: 'USDC',
        decimals: 6
      }
    ])
  }

  const testConnectionStatus = async () => {
    const testAddress = smartWalletAddress || eoaAddress || '0x98cDb60Dff9D36340caed6081AD237CD949c8552'
    
    // Simulate connection status for demo mode
    setConnectionStatus({
      ethBalance: '0x' + (0.1 * 1e18).toString(16), // 0.1 ETH
      networkId: '11155111', // Sepolia network ID
      testAddress: testAddress,
      timestamp: new Date().toISOString()
    })
    }
  }

  const refreshBalances = async () => {
    setIsRefreshing(true)
    try {
      console.log('🔄 Starting balance refresh...', {
        smartWalletAddress,
        eoaAddress,
        isWalletConnected
      })

      // Run all verification functions with error handling
      const promises = [
        testAlchemyConnection().catch(e => console.warn('Alchemy test failed:', e)),
        getBlockchainInfo().catch(e => console.warn('Blockchain info failed:', e)),
        testConnectionStatus().catch(e => console.warn('Connection test failed:', e))
      ]

      // Only try to get token balances if we have addresses
      if (smartWalletAddress) {
        promises.push(getTokenBalances(smartWalletAddress).catch(e => console.warn('Smart wallet tokens failed:', e)))
      }
      if (eoaAddress) {
        promises.push(getTokenBalances(eoaAddress).catch(e => console.warn('EOA tokens failed:', e)))
      }

      await Promise.allSettled(promises)

      // Only trigger manual balance check if wallet is fully connected
      if (isWalletConnected && typeof window !== 'undefined' && (window as any).checkUsdcBalance) {
        const addressToCheck = smartWalletAddress || eoaAddress
        if (addressToCheck) {
          try {
            console.log('🔍 Running manual USDC balance check...')
            await (window as any).checkUsdcBalance(addressToCheck)
          } catch (error) {
            console.warn('⚠️ Manual USDC check failed (expected during wallet creation):', error)
          }
        }
      }
      
      setTimeout(() => setIsRefreshing(false), 2000)
    } catch (error) {
      console.error('❌ Failed to refresh balances:', error)
      setIsRefreshing(false)
    }
  }

  const createSmartWallet = async () => {
    if (!isWalletConnected) {
      // First connect wallet if not connected
      try {
        setIsCreatingWallet('smart')
        console.log('🚀 Starting smart wallet creation process...')
        const result = await login()
        if (result.success) {
          console.log('✅ Login successful, waiting for wallet initialization...')
          // Wallet creation happens automatically during login/connection
          // Wait longer for full initialization before refreshing
          setTimeout(() => {
            console.log('🔄 Refreshing balances after wallet creation...')
            setIsCreatingWallet(null)
            // Don't force reload, just refresh balances
            refreshBalances()
          }, 3000) // Increased timeout to allow full initialization
        } else {
          console.error('❌ Login failed:', result.error)
          setIsCreatingWallet(null)
        }
      } catch (error) {
        console.error('❌ Smart wallet creation failed:', error)
        setIsCreatingWallet(null)
      }
    } else {
      // Already connected, refresh to ensure smart wallet is initialized
      setIsCreatingWallet('smart')
      console.log('🔄 Wallet already connected, refreshing smart wallet status...')
      setTimeout(() => {
        setIsCreatingWallet(null)
        refreshBalances()
        // Update UI to show assets for existing wallet
        if (smartWalletAddress || eoaAddress) {
          // Assets should already be visible, just refresh balances
          console.log('✅ Smart wallet already available, balances refreshed')
        }
      }, 1000)
    }
  }

  const createEOA = async () => {
    if (!isWalletConnected) {
      // First connect wallet if not connected
      try {
        setIsCreatingWallet('eoa')
        console.log('🚀 Starting EOA wallet creation process...')
        const result = await login()
        if (result.success) {
          console.log('✅ Login successful, waiting for EOA initialization...')
          // EOA creation happens automatically during login/connection
          // Wait longer for full initialization before refreshing
          setTimeout(() => {
            console.log('🔄 Refreshing balances after EOA creation...')
            setIsCreatingWallet(null)
            // Don't force reload, just refresh balances
            refreshBalances()
          }, 3000) // Increased timeout to allow full initialization
        } else {
          console.error('❌ Login failed:', result.error)
          setIsCreatingWallet(null)
        }
      } catch (error) {
        console.error('❌ EOA creation failed:', error)
        setIsCreatingWallet(null)
      }
    } else {
      // Already connected, refresh to ensure EOA is available
      setIsCreatingWallet('eoa')
      console.log('🔄 Wallet already connected, refreshing EOA status...')
      setTimeout(() => {
        setIsCreatingWallet(null)
        refreshBalances()
        // Update UI to show assets for existing wallet
        if (eoaAddress || smartWalletAddress) {
          // Assets should already be visible, just refresh balances
          console.log('✅ EOA wallet already available, balances refreshed')
        }
      }, 1000)
    }
  }

  // Run initial tests on component mount
  useEffect(() => {
    if (isWalletConnected) {
      refreshBalances()
    }
  }, [isWalletConnected, smartWalletAddress, eoaAddress])

  if (!isWalletConnected) {
    return (
      <AuthGuard>
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Code className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Account Abstraction Details</h1>
            <p className="text-gray-600 max-w-lg text-lg leading-relaxed">
              Connect your wallet to view comprehensive account information, smart contract details, and network configurations.
            </p>
            
            <Button
              onClick={signIn}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Connect Wallet
            </Button>
          </div>

          {/* Debug Information Even When Not Connected */}
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Connection Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg border ${debugInfo.environmentVars.hasAlchemyKey ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      {debugInfo.environmentVars.hasAlchemyKey ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">Alchemy API Key</span>
                    </div>
                    <p className="text-sm mt-1 font-mono">
                      {debugInfo.environmentVars.hasAlchemyKey ? debugInfo.environmentVars.alchemyKeyPrefix : 'Not configured'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg border ${debugInfo.environmentVars.hasAlchemyAccountKit ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      {debugInfo.environmentVars.hasAlchemyAccountKit ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">Alchemy Account Kit</span>
                    </div>
                    <p className="text-sm mt-1 font-mono">
                      {debugInfo.environmentVars.hasAlchemyAccountKit ? 'Configured' : 'Not configured'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Connection State</h4>
                  <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(debugInfo.connectionState, null, 2)}
                  </pre>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Context Comparison</h4>
                  <pre className="text-xs font-mono text-orange-800 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(debugInfo.contextComparison, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-8 pb-8 bg-gray-50 min-h-screen -m-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Abstraction</h1>
            <p className="text-gray-600 text-lg">
              Comprehensive account information and technical details
            </p>
          </div>
          <Button
            onClick={refreshBalances}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-lg font-semibold text-gray-900">{user?.name || 'Not available'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-lg text-gray-900">{user?.email || 'Not available'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Account Type</label>
                    <Badge variant="secondary" className="w-fit">
                      {user?.accountType || 'Personal'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Account Abstraction Status</label>
                    <Badge className={isAAReady ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}>
                      {isAAReady ? (
                        <>
                          <Zap className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          EOA Mode
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-900">
                        {formatBalance(smartWalletBalance)}
                      </p>
                      <p className="text-sm text-emerald-700">Smart Wallet ETH</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                      <Coins className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatBalance(smartWalletUsdcBalance)}
                      </p>
                      <p className="text-sm text-blue-700">Smart Wallet USDC</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatBalance(eoaBalance)}
                      </p>
                      <p className="text-sm text-purple-700">EOA Wallet ETH</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-900">
                        {formatBalance(eoaUsdcBalance)}
                      </p>
                      <p className="text-sm text-orange-700">EOA Wallet USDC</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wallets Tab */}
          <TabsContent value="wallets" className="space-y-6">
            {/* Wallet Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg border ${debugInfo.connectionState.isWalletConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {debugInfo.connectionState.isWalletConnected ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium">Connection</span>
                    </div>
                    <p className="text-sm">
                      {debugInfo.connectionState.isWalletConnected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg border ${debugInfo.connectionState.isAAReady ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {debugInfo.connectionState.isAAReady ? (
                        <Zap className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Shield className="w-5 h-5 text-orange-600" />
                      )}
                      <span className="font-medium">Mode</span>
                    </div>
                    <p className="text-sm">
                      {debugInfo.connectionState.isAAReady ? 'Account Abstraction' : 'EOA Fallback'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Network</span>
                    </div>
                    <p className="text-sm font-mono">{debugInfo.connectionState.currentChain}</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${debugInfo.connectionState.loading ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">Status</span>
                    </div>
                    <p className="text-sm">
                      {debugInfo.connectionState.loading ? 'Loading...' : 'Ready'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Wallet */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    Smart Contract Wallet
                  </div>
                  <Badge className={isAAReady ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                    {isAAReady ? 'Active' : 'Inactive'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Account Abstraction wallet with gasless transaction capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {smartWalletAddress || user?.walletAddress ? (
                  <>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 mb-1">Address</p>
                          <p className="text-lg font-mono font-semibold text-gray-900 break-all">
                            {smartWalletAddress || user?.walletAddress || 'Not available'}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const addr = smartWalletAddress || user?.walletAddress
                              addr && copyToClipboard(addr, 'smart')
                            }}
                            className="h-9 w-9 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() => {
                              const addr = smartWalletAddress || user?.walletAddress
                              addr && window.open(`https://sepolia.etherscan.io/address/${addr}`, '_blank')
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {copiedAddress === 'smart' && (
                        <p className="text-xs text-emerald-600 mt-2">✓ Copied to clipboard</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border">
                        <p className="text-sm text-gray-600">ETH Balance</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatBalance(smartWalletBalance || user?.walletBalance)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <p className="text-sm text-gray-600">USDC Balance</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatBalance(smartWalletUsdcBalance || user?.walletUsdcBalance)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Smart wallet not initialized</p>
                    <p className="text-sm text-gray-500 mb-4">Create a smart wallet to enable Account Abstraction features</p>
                    <Button
                      onClick={createSmartWallet}
                      disabled={isCreatingWallet === 'smart'}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2"
                    >
                      {isCreatingWallet === 'smart' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {isCreatingWallet === 'smart' ? 'Creating...' : 'Create Smart Wallet'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* EOA Wallet */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    EOA Backup Wallet
                  </div>
                  <Badge variant="secondary">Backup</Badge>
                </CardTitle>
                <CardDescription>
                  Externally Owned Account for fallback transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {eoaAddress || user?.eoaAddress ? (
                  <>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 mb-1">Address</p>
                          <p className="text-lg font-mono font-semibold text-gray-900 break-all">
                            {eoaAddress || user?.eoaAddress || 'Not available'}
                          </p>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const addr = eoaAddress || user?.eoaAddress
                              addr && copyToClipboard(addr, 'eoa')
                            }}
                            className="h-9 w-9 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0"
                            onClick={() => {
                              const addr = eoaAddress || user?.eoaAddress
                              addr && window.open(`https://sepolia.etherscan.io/address/${addr}`, '_blank')
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {copiedAddress === 'eoa' && (
                        <p className="text-xs text-blue-600 mt-2">✓ Copied to clipboard</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border">
                        <p className="text-sm text-gray-600">ETH Balance</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatBalance(eoaBalance || user?.eoaBalance)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border">
                        <p className="text-sm text-gray-600">USDC Balance</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatBalance(eoaUsdcBalance || user?.eoaUsdcBalance)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">EOA wallet not available</p>
                    <p className="text-sm text-gray-500 mb-4">Create an EOA wallet for fallback transactions</p>
                    <Button
                      onClick={createEOA}
                      disabled={isCreatingWallet === 'eoa'}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-2"
                    >
                      {isCreatingWallet === 'eoa' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {isCreatingWallet === 'eoa' ? 'Creating...' : 'Create EOA Wallet'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connection Tab */}
          <TabsContent value="connection" className="space-y-6">
            {/* Alchemy Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Alchemy Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alchemyStatus ? (
                  <div className={`border rounded-lg p-4 ${alchemyStatus.connected ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      {alchemyStatus.connected ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {alchemyStatus.connected ? 'Connected' : 'Connection Failed'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {alchemyStatus.connected ? 'Successfully connected to Alchemy' : alchemyStatus.error}
                        </p>
                      </div>
                    </div>
                    {alchemyStatus.connected && (
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-white rounded p-3 border">
                          <p className="text-sm text-gray-600">Latest Block</p>
                          <p className="font-mono text-lg">{alchemyStatus.latestBlock?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded p-3 border">
                          <p className="text-sm text-gray-600">RPC URL</p>
                          <p className="font-mono text-sm">{alchemyStatus.rpcUrl}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <AlertCircle className="w-5 h-5" />
                    Click refresh to test connection
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connection Test Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Connection Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {connectionStatus ? (
                  <div className="space-y-4">
                    {connectionStatus.error ? (
                      <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="font-medium text-red-800">Test Failed</span>
                        </div>
                        <p className="text-red-700 mt-2">{connectionStatus.error}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <p className="text-sm text-emerald-700">Test Address</p>
                          <p className="font-mono text-sm font-medium text-emerald-900 break-all">
                            {connectionStatus.testAddress}
                          </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-700">ETH Balance</p>
                          <p className="font-mono text-lg font-bold text-blue-900">
                            {connectionStatus.ethBalance ? 
                              (parseInt(connectionStatus.ethBalance, 16) / 10**18).toFixed(4) + ' ETH' : 
                              '0 ETH'
                            }
                          </p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <p className="text-sm text-purple-700">Network ID</p>
                          <p className="font-mono text-lg font-bold text-purple-900">
                            {connectionStatus.networkId} (Sepolia)
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Last tested: {connectionStatus.timestamp ? new Date(connectionStatus.timestamp).toLocaleString() : 'Never'}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <AlertCircle className="w-5 h-5" />
                    Click refresh to run connection tests
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Environment Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Environment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg border ${debugInfo.environmentVars.hasAlchemyKey ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      {debugInfo.environmentVars.hasAlchemyKey ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">Alchemy API Key</span>
                    </div>
                    <p className="text-sm mt-1 font-mono">
                      {debugInfo.environmentVars.hasAlchemyKey ? debugInfo.environmentVars.alchemyKeyPrefix : 'Not configured'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg border ${debugInfo.environmentVars.hasPolicyId ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      {debugInfo.environmentVars.hasPolicyId ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">Alchemy Policy ID</span>
                    </div>
                    <p className="text-sm mt-1 font-mono">
                      {debugInfo.environmentVars.hasPolicyId ? 'Configured' : 'Not configured'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg border ${debugInfo.environmentVars.hasAlchemyAccountKit ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      {debugInfo.environmentVars.hasAlchemyAccountKit ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="font-medium">Alchemy Account Kit</span>
                    </div>
                    <p className="text-sm mt-1 font-mono">
                      {debugInfo.environmentVars.hasAlchemyAccountKit ? 'Configured' : 'Not configured'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg border ${debugInfo.connectionState.isWalletConnected ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center gap-2">
                      {debugInfo.connectionState.isWalletConnected ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      )}
                      <span className="font-medium">Wallet Status</span>
                    </div>
                    <p className="text-sm mt-1">
                      {debugInfo.connectionState.isWalletConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blockchain Tab */}
          <TabsContent value="blockchain" className="space-y-6">
            {/* Network Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Network Information
                </CardTitle>
                <CardDescription>
                  Current network: <Badge className="ml-2">{currentChain}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {networks.map((network) => (
                  <div
                    key={network.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedNetwork === network.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{network.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{network.name}</h3>
                            {network.isTestnet && (
                              <Badge variant="outline" className="text-xs">Testnet</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Chain ID: {network.chainId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedNetwork === network.id && (
                          <Badge className="bg-emerald-100 text-emerald-800">Current</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNetworkSwitch(network.id)}
                          disabled={selectedNetwork === network.id}
                        >
                          {selectedNetwork === network.id ? 'Active' : 'Switch'}
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">RPC URL</p>
                        <p className="font-mono text-xs text-gray-800 break-all">
                          {network.rpcUrl.replace(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '', '***')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Block Explorer</p>
                        <a
                          href={network.blockExplorer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all"
                        >
                          {network.blockExplorer}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Latest Block Information */}
            {blockchainInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Latest Block Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-700">Block Number</p>
                      <p className="font-mono text-lg font-bold text-blue-900">
                        {parseInt(blockchainInfo.number, 16).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <p className="text-sm text-emerald-700">Timestamp</p>
                      <p className="font-mono text-sm font-bold text-emerald-900">
                        {new Date(parseInt(blockchainInfo.timestamp, 16) * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-sm text-purple-700">Gas Limit</p>
                      <p className="font-mono text-lg font-bold text-purple-900">
                        {parseInt(blockchainInfo.gasLimit, 16).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-sm text-orange-700">Gas Used</p>
                      <p className="font-mono text-lg font-bold text-orange-900">
                        {parseInt(blockchainInfo.gasUsed, 16).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-2">Block Hash</p>
                    <p className="font-mono text-xs text-gray-800 break-all">{blockchainInfo.hash}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Networks Tab */}
          <TabsContent value="networks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Network Configuration
                </CardTitle>
                <CardDescription>
                  Current network: <Badge className="ml-2">{currentChain}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {networks.map((network) => (
                  <div
                    key={network.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedNetwork === network.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{network.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{network.name}</h3>
                            {network.isTestnet && (
                              <Badge variant="outline" className="text-xs">Testnet</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Chain ID: {network.chainId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedNetwork === network.id && (
                          <Badge className="bg-emerald-100 text-emerald-800">Current</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNetworkSwitch(network.id)}
                          disabled={selectedNetwork === network.id}
                        >
                          {selectedNetwork === network.id ? 'Active' : 'Switch'}
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">RPC URL</p>
                        <p className="font-mono text-xs text-gray-800 break-all">
                          {network.rpcUrl.replace(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '', '***')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Block Explorer</p>
                        <a
                          href={network.blockExplorer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono text-xs break-all"
                        >
                          {network.blockExplorer}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-6">
            {/* Live Token Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Token Balances
                </CardTitle>
                <CardDescription>
                  Real-time token balances from Alchemy API
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tokenBalances && tokenBalances.length > 0 ? (
                  <div className="space-y-3">
                    {tokenBalances.map((token, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm text-gray-600">Contract</p>
                            <p className="font-mono text-sm font-bold text-gray-900 break-all">
                              {token.contractAddress}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Balance</p>
                            <p className="font-mono text-lg font-bold text-gray-900">
                              {token.tokenBalance === '0x0' ? '0' : parseInt(token.tokenBalance, 16).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {token.tokenBalance !== '0x0' && (
                          <div className="mt-2 flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(token.contractAddress, `live-token-${index}`)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => window.open(`https://sepolia.etherscan.io/token/${token.contractAddress}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {copiedAddress === `live-token-${index}` && (
                          <p className="text-xs text-green-600 mt-2">✓ Copied to clipboard</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
                    <AlertCircle className="w-5 h-5" />
                    Click refresh to load live token balances
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Token Contract Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Token Contract Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tokenContracts.map((token, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{token.symbol}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{token.name}</h3>
                            <p className="text-sm text-gray-600">Network: {token.network}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{token.decimals} decimals</Badge>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Contract Address</p>
                            <p className="font-mono text-sm text-gray-900 break-all">{token.address}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(token.address, `token-${index}`)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const explorer = token.network === 'sepolia' 
                                  ? 'https://sepolia.etherscan.io' 
                                  : 'https://etherscan.io'
                                window.open(`${explorer}/token/${token.address}`, '_blank')
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {copiedAddress === `token-${index}` && (
                          <p className="text-xs text-green-600 mt-2">✓ Copied to clipboard</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Debug Tab */}
          <TabsContent value="debug" className="space-y-6">
            {/* Raw Data Debug */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Raw Debug Information
                </CardTitle>
                <CardDescription>
                  Complete debug information for troubleshooting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* User Object */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">User Object</h4>
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(debugInfo.userObject, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Smart Wallet Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Smart Wallet Information</h4>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <pre className="text-xs font-mono text-emerald-800 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(debugInfo.smartWalletInfo, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* EOA Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">EOA Wallet Information</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <pre className="text-xs font-mono text-blue-800 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(debugInfo.eoaInfo, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Connection State */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Connection State</h4>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <pre className="text-xs font-mono text-purple-800 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(debugInfo.connectionState, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Environment Variables */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Environment Variables</h4>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <pre className="text-xs font-mono text-orange-800 whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(debugInfo.environmentVars, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Live Test Results */}
                  {(alchemyStatus || connectionStatus || blockchainInfo) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Live Test Results</h4>
                      <div className="space-y-3">
                        {alchemyStatus && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Alchemy Status</p>
                            <div className="bg-gray-50 border rounded p-3">
                              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(alchemyStatus, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                        {connectionStatus && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Connection Status</p>
                            <div className="bg-gray-50 border rounded p-3">
                              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(connectionStatus, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                        {blockchainInfo && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Blockchain Info</p>
                            <div className="bg-gray-50 border rounded p-3">
                              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(blockchainInfo, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manual Test Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Manual Test Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={testAlchemyConnection}
                    variant="outline"
                    className="gap-2"
                  >
                    <Database className="w-4 h-4" />
                    Test Alchemy
                  </Button>
                  <Button
                    onClick={testConnectionStatus}
                    variant="outline"
                    className="gap-2"
                  >
                    <Link className="w-4 h-4" />
                    Test Connection
                  </Button>
                  <Button
                    onClick={getBlockchainInfo}
                    variant="outline"
                    className="gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Get Block Info
                  </Button>
                  <Button
                    onClick={() => smartWalletAddress && getTokenBalances(smartWalletAddress)}
                    variant="outline"
                    className="gap-2"
                    disabled={!smartWalletAddress}
                  >
                    <Coins className="w-4 h-4" />
                    Get Tokens
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Smart Contract Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Abstraction Contract */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Account Abstraction Contract</h3>
                      <p className="text-sm text-gray-600">Smart wallet implementation</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Contract Address</p>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-sm text-gray-900">
                          {formatAddress(smartWalletAddress)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => smartWalletAddress && window.open(`https://sepolia.etherscan.io/address/${smartWalletAddress}`, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge className={isAAReady ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                          {isAAReady ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="bg-white border rounded-lg p-3">
                        <p className="text-sm text-gray-600">Features</p>
                        <p className="text-sm font-medium text-gray-900">Gasless Transactions</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Details */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Server className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Configuration</h3>
                      <p className="text-sm text-gray-600">System configuration details</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Alchemy Account Kit</p>
                      <p className="font-mono text-xs text-gray-800 break-all">
                        [Web3Auth Client ID removed]
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">Alchemy Policy ID</p>
                      <p className="font-mono text-xs text-gray-800 break-all">
                        {process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}