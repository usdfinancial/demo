'use client'

import React, { Component, useState, useEffect } from 'react'
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  TrendingUp,
  Activity,
  Eye,
  EyeOff,
  Send,
  Download,
  Plus,
  Zap,
  Shield,
  Globe,
  AlertCircle,
  Sparkles,
  Copy,
  Settings,
  Coins,
  BarChart3
} from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { mockDataGenerator, CHAIN_CONFIG } from '@/lib/demo/mockDataGenerator'
import { demoTransactionService } from '@/lib/demo/demoServices'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { EnhancedDepositModal } from '@/components/wallet/EnhancedDepositModal'
import { EnhancedWithdrawModal } from '@/components/wallet/EnhancedWithdrawModal'
import { MultiChainDepositModal } from '@/components/wallet/MultiChainDepositModal'
import { MultiChainWithdrawModal } from '@/components/wallet/MultiChainWithdrawModal'
import { TransactionReceiptModal } from '@/components/wallet/TransactionReceiptModal'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Simple error boundary class component
class WalletErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Wallet Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 bg-red-50 rounded-2xl p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-900">Something went wrong</h2>
            <p className="text-red-700 max-w-md">
              We encountered an error while loading your wallet. Please try refreshing the page.
            </p>
            <Button 
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.location.reload()
              }} 
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function WalletPage() {
  const { 
    user,
    isWalletConnected,
    loading,
    isAAReady,
    walletBalance,
    eoaBalance,
    signIn,
    sendTransaction,
    sendGaslessTransaction
  } = useEnhancedAuth()
  
  const [showBalance, setShowBalance] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [walletCreationStep, setWalletCreationStep] = useState('welcome')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showMultiChainDeposit, setShowMultiChainDeposit] = useState(false)
  const [showMultiChainWithdraw, setShowMultiChainWithdraw] = useState(false)
  const [isPriceLoading, setIsPriceLoading] = useState(false)
  const [ethPrice, setEthPrice] = useState(2500)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  useEffect(() => {
    if (user?.email) {
      const demoUser = findUserByEmail(user.email)
      if (demoUser) {
        const profile = mockDataGenerator.generateUserFinancialProfile(demoUser)
        setUserProfile(profile)
      }
    }
  }, [user?.email])
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  // Demo function for wallet settings
  const handleWalletSettings = () => {
    setShowSettingsModal(true)
    // Auto-close after 3 seconds for demo
    setTimeout(() => setShowSettingsModal(false), 3000)
  }

  // Demo function for copying wallet addresses
  const handleCopyAddress = async (address: string, type: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(type)
      setTimeout(() => setCopiedAddress(null), 2000)
      
      // Show demo notification
      console.log(`✅ Demo: Copied ${type} address to clipboard: ${address}`)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }

  // Demo function for viewing on blockchain explorer
  const handleViewOnExplorer = (address: string, networkId: string = 'sepolia') => {
    const explorerUrls = {
      sepolia: 'https://sepolia.etherscan.io/address/',
      ethereum: 'https://etherscan.io/address/',
      polygon: 'https://polygonscan.com/address/',
      arbitrum: 'https://arbiscan.io/address/',
      optimism: 'https://optimistic.etherscan.io/address/'
    }
    
    const baseUrl = explorerUrls[networkId as keyof typeof explorerUrls] || explorerUrls.sepolia
    const explorerUrl = `${baseUrl}${address}`
    
    console.log(`🔍 Demo: Opening explorer for ${address} on ${networkId}`)
    console.log(`🌐 Explorer URL: ${explorerUrl}`)
    
    // In a real app, this would open the URL
    // window.open(explorerUrl, '_blank')
    
    // For demo, show a notification
    alert(`Demo: Would open blockchain explorer for address ${address.slice(0, 6)}...${address.slice(-4)} on ${networkId} network`)
  }

  // Demo function for showing QR code
  const handleShowQRCode = (address: string, type: string) => {
    console.log(`📱 Demo: Showing QR code for ${type} address: ${address}`)
    
    // For demo, show a notification
    alert(`Demo: QR Code for ${type}\n\nAddress: ${address}\n\nIn a real app, this would display a scannable QR code for easy mobile wallet transfers.`)
  }

  // Monitor authentication state changes
  useEffect(() => {
    console.log('🔄 Wallet state changed:', { 
      isWalletConnected, 
      user: !!user, 
      loading, 
      isAAReady,
      isCreatingWallet,
      walletAddress: user?.walletAddress,
      eoaAddress: user?.eoaAddress,
      walletBalance,
      eoaBalance,
      walletUsdcBalance: (user as any)?.walletUsdcBalance,
      walletEthBalance: (user as any)?.walletEthBalance,
      usdcTokenInfo: (user as any)?.usdcTokenInfo,
      userObject: user ? Object.keys(user) : []
    })
    
    // Update creation step based on authentication state
    if (isCreatingWallet) {
      if (isWalletConnected && user) {
        console.log('✅ Wallet creation successful!')
        setWalletCreationStep('ready')
        setIsCreatingWallet(false)
      } else if (loading) {
        setWalletCreationStep('authenticating')
      } else {
        setWalletCreationStep('creating')
      }
    } else {
      setWalletCreationStep('idle')
    }
  }, [isWalletConnected, user, loading, isAAReady, isCreatingWallet])

  // Auto-reset creation state if user cancels authentication
  useEffect(() => {
    if (isCreatingWallet && !loading && !isWalletConnected && !user) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Authentication appears to have been cancelled, resetting state')
        setIsCreatingWallet(false)
        setWalletCreationStep('idle')
      }, 3000) // Wait 3 seconds before assuming cancellation

      return () => clearTimeout(timeout)
    }
  }, [isCreatingWallet, loading, isWalletConnected, user])

  // Real wallet assets based on actual balances - with safe parsing
  const realAssets = [
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      balance: parseFloat(walletBalance || '0'),
      usdValue: parseFloat(walletBalance || '0') * (ethPrice || 0),
      icon: '💎',
      change24h: 0.05,
      minimumWithdraw: 0.001,
      isNative: true
    },
    {
      id: 'usdc',
      name: (user as any)?.usdcTokenInfo?.name || 'USD Coin',
      symbol: (user as any)?.usdcTokenInfo?.symbol || 'USDC',
      balance: parseFloat((user as any)?.walletUsdcBalance || '0'),
      usdValue: parseFloat((user as any)?.walletUsdcBalance || '0'), // USDC is $1
      icon: '💵',
      change24h: 0.00,
      minimumWithdraw: 1,
      isNative: false,
      contractAddress: (user as any)?.usdcTokenInfo?.address,
      decimals: (user as any)?.usdcTokenInfo?.decimals
    },
    {
      id: 'eth-eoa',
      name: 'Ethereum (Backup)',
      symbol: 'ETH',
      balance: parseFloat(eoaBalance || '0'),
      usdValue: parseFloat(eoaBalance || '0') * (ethPrice || 0),
      icon: '🔒',
      change24h: 0.05,
      minimumWithdraw: 0.001,
      isNative: true,
      isBackup: true
    },
    {
      id: 'usdc-eoa',
      name: 'USD Coin (Backup)',
      symbol: 'USDC',
      balance: parseFloat((user as any)?.eoaUsdcBalance || '0'),
      usdValue: parseFloat((user as any)?.eoaUsdcBalance || '0'), // USDC is $1
      icon: '🔒',
      change24h: 0.00,
      minimumWithdraw: 1,
      isNative: false,
      isBackup: true
    }
  ].filter(asset => asset && !isNaN(asset.balance) && asset.balance > 0) // Only show valid assets with balance

  // Manual refresh function for testing
  const refreshBalances = async () => {
    console.log('🔄 Manually refreshing balances...')
    
    // Test the new balance service
    if (typeof window !== 'undefined' && (window as any).testBalanceService) {
      console.log('🧪 Running balance service test...')
      await (window as any).testBalanceService()
    }
    
    // Force re-authentication to trigger balance refresh
    window.location.reload()
  }
  
  // Expose refresh function globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).refreshBalances = refreshBalances
  }

  const networks = [
    {
      id: 'sepolia',
      name: 'Ethereum Sepolia',
      displayName: 'Sepolia Testnet',
      smartWalletAddress: user?.walletAddress || '',
      eoaAddress: user?.eoaAddress || '',
      minimumDeposit: 0.001,
      estimatedTime: '30 seconds',
      fee: 0,
      icon: '🔧',
      isTestnet: true
    },
    {
      id: 'ethereum',
      name: 'Ethereum Mainnet',
      displayName: 'Ethereum',
      smartWalletAddress: user?.walletAddress || '',
      eoaAddress: user?.eoaAddress || '',
      minimumDeposit: 0.01,
      estimatedTime: '2-5 minutes',
      fee: 0.002,
      icon: '💎'
    }
  ]

  // Safe calculation of total balance
  const totalBalance = Array.isArray(realAssets) 
    ? realAssets.reduce((sum, asset) => {
        const value = isNaN(asset?.usdValue) ? 0 : asset.usdValue
        return sum + value
      }, 0)
    : 0

  const handleCreateWallet = async () => {
    try {
      setIsCreatingWallet(true)
      console.log('🚀 Starting wallet creation process...')
      
      // Trigger Alchemy Account Kit authentication
      const result = await signIn()
      console.log('✅ Authentication result:', result)
      
      // The wallet will appear automatically once authentication is successful
      // The isWalletConnected state will update from the provider
      
    } catch (error) {
      console.error('❌ Failed to create wallet:', error)
      setIsCreatingWallet(false) // Only set to false on error, success is handled by state change
    }
  }

  const handleAssetClick = (asset: any) => {
    console.log('Asset clicked:', asset)
  }

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction({
      ...transaction,
      asset: realAssets[0],
      network: networks[0],
      timestamp: new Date().toISOString(),
      confirmations: 12,
      requiredConfirmations: 12
    })
    setShowReceiptModal(true)
  }

  const handleWithdraw = async (data: any) => {
    try {
      let txHash: string
      
      // Use gasless or regular transaction based on user choice
      if (data.useGasless && isAAReady && sendGaslessTransaction) {
        txHash = await sendGaslessTransaction(data.address, data.amount.toString())
      } else {
        txHash = await sendTransaction(data.address, data.amount.toString())
      }
      
      // Add transaction to real history (mock implementation for demo)
      const asset = realAssets.find(a => a.id === data.assetId)
      const newTransaction = {
        id: Date.now().toString(),
        type: 'send',
        description: `Sent ${data.amount} ${asset?.symbol || 'ETH'} to ${data.address.slice(0, 6)}...${data.address.slice(-4)}`,
        amount: -data.amount,
        currency: asset?.symbol || 'ETH',
        status: 'pending',
        hash: txHash,
        gasUsed: data.useGasless ? 0 : 21000,
        gasPrice: data.useGasless ? 0 : 20,
        isGasless: data.useGasless && isAAReady,
        walletType: data.useGasless && isAAReady ? 'smart' : 'eoa',
        to: data.address,
        timestamp: new Date().toISOString()
      }
      
      setSelectedTransaction({
        ...newTransaction,
        asset: asset,
        network: networks.find(n => n.id === data.networkId),
        timestamp: new Date().toISOString(),
        confirmations: 0,
        requiredConfirmations: 12,
        toAddress: data.address,
        usdValue: data.amount
      })
      
      setShowReceiptModal(true)
      
      // Simulate confirmation after 3 seconds
      setTimeout(() => {
        // Update transaction status to completed in real service
        // transactionHistoryService.updateTransactionStatus(newTransaction.id, 'completed', 12)
      }, 3000)
      
    } catch (error) {
      console.error('Withdrawal failed:', error)
      // Handle error - could show toast notification
    }
  }

  // Enhanced wallet initialization screen
  if (!isWalletConnected) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-3xl p-8">
        <div className="text-center space-y-6 max-w-2xl">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <Wallet className="w-16 h-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-800" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Your Smart Wallet Awaits
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Experience the future of digital finance with Account Abstraction technology.
              No gas fees, no complexity—just seamless transactions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <Card className="border-0 bg-white/60 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Zap className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Gasless Transactions</p>
                <p className="text-sm text-gray-600">No ETH needed for fees</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/60 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Enhanced Security</p>
                <p className="text-sm text-gray-600">Smart contract protection</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/60 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Globe className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Social Login</p>
                <p className="text-sm text-gray-600">Google & Email access</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/60 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900">Always Available</p>
                <p className="text-sm text-gray-600">EOA backup included</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {loading || isCreatingWallet ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-emerald-500 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-900 mb-2">
                {walletCreationStep === 'authenticating' && 'Authenticating...'}
                {walletCreationStep === 'creating' && 'Creating Your Smart Wallet'}
                {walletCreationStep === 'ready' && 'Wallet Ready!'}
                {!isCreatingWallet && 'Initializing System'}
              </p>
              <p className="text-gray-600">
                {walletCreationStep === 'authenticating' && 'Please complete authentication in the popup'}
                {walletCreationStep === 'creating' && 'Setting up your Account Abstraction wallet...'}
                {walletCreationStep === 'ready' && 'Your smart wallet is ready to use!'}
                {!isCreatingWallet && 'Loading your dashboard...'}
              </p>
              
              {walletCreationStep === 'authenticating' && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <p className="text-sm text-blue-800 flex items-center justify-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Complete login in the popup window
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p className="mb-1">Popup blocked? Check your browser settings</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateWallet}
                      className="text-xs"
                    >
                      Retry Authentication
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Button
            onClick={handleCreateWallet}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-16 py-6 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
          >
            <Wallet className="w-6 h-6 mr-3" />
            Create Smart Wallet
          </Button>
        )}
        
        <p className="text-sm text-gray-500 text-center max-w-md">
          By creating a wallet, you agree to our terms and conditions. Your wallet will be secured by Alchemy Account Kit.
        </p>
      </div>
    )
  }

  // Enhanced wallet status indicator
  const getWalletStatusInfo = () => {
    if (isAAReady) {
      return {
        status: 'Active',
        description: 'Account Abstraction • Gasless Transactions',
        color: 'emerald',
        icon: Zap
      }
    }
    return {
      status: 'Backup Mode',
      description: 'Smart Contract Wallet • EOA Backup',
      color: 'orange', 
      icon: Shield
    }
  }

  const walletStatus = getWalletStatusInfo()
  const StatusIcon = walletStatus.icon

  return (
    <AuthGuard>
      <WalletErrorBoundary>
        <div className="space-y-6">
          {/* Enhanced Header with Gradient Background - Similar to Send Money */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl border border-purple-100 p-8 mb-8">
            <div className="absolute inset-0 bg-grid-slate-100 opacity-30"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 ${walletStatus.color === 'emerald' ? 'bg-emerald-500' : 'bg-orange-500'} rounded-xl`}>
                      <StatusIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-slate-900">Smart Wallet</h1>
                      <p className="text-slate-600 text-lg">{walletStatus.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-sm text-purple-700">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span>{isAAReady ? 'Gasless transactions' : 'Standard wallet'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Smart contract security</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Multi-chain ready</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={`bg-white/80 backdrop-blur-sm border-white/20 px-4 py-2 ${walletStatus.color === 'emerald' ? 'text-emerald-800' : 'text-orange-800'}`}>
                    <StatusIcon className="h-4 w-4 mr-2" />
                    {walletStatus.status}
                  </Badge>
                  <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white" onClick={refreshBalances}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white"
                    onClick={handleWalletSettings}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Cards - Enhanced Design */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-purple-600" />
                  Total Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{isPriceLoading ? 'Loading...' : formatCurrency(totalBalance || 0)}</div>
                <p className="text-sm text-muted-foreground">Across all assets</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="h-4 w-4 text-purple-600" />
                  Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realAssets?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Active holdings</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  Gasless TX
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{isAAReady ? '∞' : '0'}</div>
                <p className="text-sm text-muted-foreground">Available</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">100%</div>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Address Display - Enhanced */}
          {(user?.walletAddress || user?.eoaAddress || user?.smartWalletAddress || user?.address) && (
            <Card className="shadow-sm border-slate-200/60">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Copy className="h-5 w-5 text-purple-600" />
                  </div>
                  Wallet Addresses
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Your smart contract and backup wallet addresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(user?.walletAddress || user?.smartWalletAddress) && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                              <Zap className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-emerald-800">Smart Contract Wallet</span>
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">Primary</Badge>
                          </div>
                          <div className="font-mono text-lg font-bold text-gray-900 bg-white/80 rounded-lg px-3 py-2 border">
                            {user.walletAddress || user.smartWalletAddress}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyAddress(user.walletAddress || user.smartWalletAddress || '', 'Smart Wallet')}
                          className="ml-3 h-8 w-8 p-0 hover:bg-emerald-100"
                        >
                          <Copy className={`w-4 h-4 ${copiedAddress === 'Smart Wallet' ? 'text-emerald-800' : 'text-emerald-600'}`} />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {(user?.eoaAddress || user?.address) && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                              <Shield className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-blue-800">Backup EOA Wallet</span>
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Backup</Badge>
                          </div>
                          <div className="font-mono text-lg font-bold text-gray-900 bg-white/80 rounded-lg px-3 py-2 border">
                            {user.eoaAddress || user.address}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyAddress(user.eoaAddress || user.address || '', 'EOA Backup')}
                          className="ml-3 h-8 w-8 p-0 hover:bg-blue-100"
                        >
                          <Copy className={`w-4 h-4 ${copiedAddress === 'EOA Backup' ? 'text-blue-800' : 'text-blue-600'}`} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-12 bg-white border border-gray-200">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="multichain" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Multi-Chain</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Features</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </TabsTrigger>
            <TabsTrigger value="demo" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Demo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Enhanced Wallet Overview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Portfolio Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {formatCurrency(userProfile?.totalBalance || 125750)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Balance</p>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setShowDepositModal(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <ArrowDownLeft className="w-4 h-4 mr-2" />
                      Deposit
                    </Button>
                    <Button 
                      onClick={() => setShowWithdrawModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Withdraw
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Detailed Wallet Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Smart Wallet Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Smart Wallet</p>
                    <p className="font-mono text-sm">{user?.walletAddress || user?.smartWalletAddress || 'Not connected'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Backup Address</p>
                    <p className="font-mono text-sm">{user?.eoaAddress || user?.address || 'Not available'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Smart Wallet Balance</p>
                    <p className="text-lg font-semibold">{walletBalance || '0'} ETH</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={isAAReady ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                      {isAAReady ? 'Ready' : 'Initializing'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Asset Management */}
            <div className="space-y-6">
              <Card className="shadow-sm border-slate-200/60">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Coins className="h-5 w-5 text-purple-600" />
                    </div>
                    Asset Portfolio
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {realAssets?.length || 0} asset{(realAssets?.length || 0) !== 1 ? 's' : ''} • Total value {isPriceLoading ? 'Loading...' : formatCurrency(totalBalance || 0)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(realAssets && realAssets.length > 0) ? (
                    <div className="space-y-3">
                      {realAssets.map((asset, index) => (
                        <div key={asset.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => handleAssetClick && handleAssetClick(asset)}>
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{asset.icon}</div>
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{asset.balance.toFixed(6)}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(asset.usdValue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assets Yet</h3>
                      <p className="text-gray-600 mb-6">Deposit funds to start building your portfolio</p>
                      <Button onClick={() => setShowDepositModal(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Make First Deposit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent Activity Preview */}
              <Card className="shadow-sm border-slate-200/60">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Your latest wallet transactions and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Activity</h3>
                    <p className="text-gray-600 mb-4">Your transaction history will appear here</p>
                    <Button onClick={() => setShowDepositModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Make Your First Transaction
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="multichain" className="space-y-6">
            {/* Multi-Chain Balance View */}
            {(user?.walletAddress || user?.smartWalletAddress) && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Multi-Chain Balances
                    </CardTitle>
                    <CardDescription>
                      Your balances across different blockchain networks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">Ethereum</span>
                        </div>
                        <p className="text-2xl font-bold">{walletBalance || '0'} ETH</p>
                        <p className="text-sm text-muted-foreground">Sepolia Testnet</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                          <span className="font-medium">Polygon</span>
                        </div>
                        <p className="text-2xl font-bold">0 MATIC</p>
                        <p className="text-sm text-muted-foreground">Amoy Testnet</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
                          <span className="font-medium">Arbitrum</span>
                        </div>
                        <p className="text-2xl font-bold">0 ETH</p>
                        <p className="text-sm text-muted-foreground">Sepolia Testnet</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Multi-Chain Actions */}
                <Card className="shadow-sm border-slate-200/60">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Globe className="h-5 w-5 text-purple-600" />
                      </div>
                      Multi-Chain Actions
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Deposit and withdraw across multiple blockchain networks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => setShowMultiChainDeposit(true)}
                        className="h-auto p-6 flex-col bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                      >
                        <ArrowDownLeft className="w-8 h-8 mb-3" />
                        <span className="font-semibold text-lg">Multi-Chain Deposit</span>
                        <span className="text-sm opacity-90 mt-2">
                          Deposit from any network
                        </span>
                      </Button>
                      
                      <Button
                        onClick={() => setShowMultiChainWithdraw(true)}
                        className="h-auto p-6 flex-col bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                      >
                        <ArrowUpRight className="w-8 h-8 mb-3" />
                        <span className="font-semibold text-lg">Multi-Chain Withdraw</span>
                        <span className="text-sm opacity-90 mt-2">
                          Send to any network
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Fallback if no wallet address */}
            {!(user?.walletAddress || user?.smartWalletAddress) && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Wallet Address Required
                  </h3>
                  <p className="text-gray-600">
                    Please ensure your smart wallet is properly initialized to view multi-chain balances.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="features">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Smart Wallet Features
                  </CardTitle>
                  <CardDescription>
                    Advanced features available with your smart contract wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${isAAReady ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Zap className={`h-6 w-6 ${isAAReady ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Gasless Transactions</h3>
                        <p className="text-sm text-muted-foreground">
                          Send transactions without paying gas fees
                        </p>
                        <Badge className={`mt-2 ${isAAReady ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {isAAReady ? 'Available' : 'Initializing'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Enhanced Security</h3>
                        <p className="text-sm text-muted-foreground">
                          Smart contract-based security features
                        </p>
                        <Badge className="mt-2 bg-blue-100 text-blue-800">Active</Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Globe className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Multi-Chain Support</h3>
                        <p className="text-sm text-muted-foreground">
                          Access multiple blockchain networks
                        </p>
                        <Badge className="mt-2 bg-purple-100 text-purple-800">Ready</Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Settings className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Programmable Logic</h3>
                        <p className="text-sm text-muted-foreground">
                          Custom transaction rules and automation
                        </p>
                        <Badge className="mt-2 bg-orange-100 text-orange-800">Coming Soon</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="space-y-6">
              {/* Multi-Chain Transaction History */}
              {(user?.walletAddress || user?.smartWalletAddress) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Multi-Chain Transaction History
                    </CardTitle>
                    <CardDescription>
                      Transaction history across all supported networks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Multi-Chain Transactions</h3>
                      <p className="text-gray-600 mb-4">Your cross-chain transaction history will appear here</p>
                      <Button onClick={() => setShowMultiChainDeposit(true)} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Start Multi-Chain Transaction
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Legacy Smart Wallet Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Smart Wallet Transactions
                  </CardTitle>
                  <CardDescription>
                    Transaction history from your smart contract wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Smart Wallet Transactions</h3>
                    <p className="text-gray-600 mb-4">Your smart wallet transaction history will appear here</p>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Badge className={`${isAAReady ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {isAAReady ? 'Smart Wallet Ready' : 'Initializing'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="demo">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Gasless Transaction Demo
                  </CardTitle>
                  <CardDescription>
                    Experience the power of Account Abstraction with gasless transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isAAReady ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <Zap className={`w-8 h-8 ${isAAReady ? 'text-green-600' : 'text-orange-600'}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {isAAReady ? 'Gasless Transactions Ready!' : 'Initializing Smart Wallet...'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {isAAReady 
                          ? 'Your smart wallet is ready to send transactions without gas fees'
                          : 'Please wait while we initialize your Account Abstraction wallet'
                        }
                      </p>
                      <Badge className={`${isAAReady ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {isAAReady ? 'Account Abstraction Active' : 'Setting Up...'}
                      </Badge>
                    </div>
                    
                    {isAAReady && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-green-600" />
                            <span className="font-medium">No Gas Fees</span>
                          </div>
                          <p className="text-sm text-gray-600">Send transactions without paying ETH for gas</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">Smart Contract Security</span>
                          </div>
                          <p className="text-sm text-gray-600">Enhanced security through programmable logic</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

      <EnhancedDepositModal
        open={showDepositModal}
        onOpenChange={setShowDepositModal}
        networks={networks}
        currentBalance={walletBalance || '0'}
        isAAReady={isAAReady}
      />

      <EnhancedWithdrawModal
        open={showWithdrawModal}
        onOpenChange={setShowWithdrawModal}
        assets={realAssets}
        networks={networks}
        onConfirmWithdraw={handleWithdraw}
        isAAReady={isAAReady}
      />

      <MultiChainDepositModal
        open={showMultiChainDeposit}
        onOpenChange={setShowMultiChainDeposit}
        walletAddress={user?.walletAddress || user?.smartWalletAddress || ''}
        currentBalance={walletBalance || '0'}
        isAAReady={isAAReady}
        showTestnets={true}
      />

      <MultiChainWithdrawModal
        open={showMultiChainWithdraw}
        onOpenChange={setShowMultiChainWithdraw}
        walletAddress={user?.walletAddress || user?.smartWalletAddress || ''}
        onConfirmWithdraw={handleWithdraw}
        isAAReady={isAAReady}
        showTestnets={true}
      />

      {selectedTransaction && (
        <TransactionReceiptModal
          open={showReceiptModal}
          onOpenChange={setShowReceiptModal}
          transaction={selectedTransaction}
        />
      )}

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              Wallet Settings
            </DialogTitle>
            <DialogDescription>
              Demo wallet configuration options
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div>
                <p className="font-medium text-emerald-900">Demo Mode</p>
                <p className="text-sm text-emerald-700">Interactive demonstration active</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Available Settings:</p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Network preferences</li>
                <li>• Transaction notifications</li>
                <li>• Security settings</li>
                <li>• Backup & recovery</li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <Button 
                onClick={() => setShowSettingsModal(false)} 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Close Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </WalletErrorBoundary>
</AuthGuard>
  )
}