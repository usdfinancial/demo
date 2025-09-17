'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { 
  ArrowUpRight, 
  Plus, 
  Send, 
  ArrowLeftRight, 
  TrendingUp, 
  Zap, 
  Wallet,
  Shield,
  DollarSign,
  Activity,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

export const dynamic = 'force-dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSimpleAccountKit } from '@/contexts/SimpleAccountKitProvider'

export default function SimpleDashboard() {
  const router = useRouter()
  const { 
    user, 
    smartWalletAddress: smartAccountAddress, 
    smartWalletBalance: smartAccountBalance, 
    logout,
    sendGaslessTransaction
  } = useSimpleAccountKit()
  
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for hydration to complete
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Redirect if not authenticated - only after hydration
  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/')
    }
  }, [user, router, isHydrated])

  // Show loading until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirecting if no user (after hydration)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatBalance = (balance: string | null) => {
    if (!balance || balance === '0') return '0.0000'
    return parseFloat(balance).toFixed(4)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getAuthIcon = (authType: string) => {
    switch (authType) {
      case 'email': return '📧'
      case 'social': return '🔗'
      case 'passkey': return '🔑'
      default: return '👤'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Abstraction Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name}!</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                {getAuthIcon(user?.authType || '')}
                {user?.authType}
              </Badge>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Account Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Smart Account Balance */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Smart Account Balance</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="h-8 w-8 p-0"
                  >
                    {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {balanceVisible ? `${formatBalance(smartAccountBalance)} ETH` : '••••••••'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span>Sepolia Testnet</span>
                  </div>
                </CardContent>
              </Card>

              {/* Account Type */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Account Features</CardTitle>
                  <Zap className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm">Gasless Transactions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Smart Contract Security</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Social Recovery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Perform transactions with zero gas fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Send className="h-5 w-5" />
                    <span className="text-sm">Send</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Plus className="h-5 w-5" />
                    <span className="text-sm">Deposit</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <ArrowLeftRight className="h-5 w-5" />
                    <span className="text-sm">Swap</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm">Invest</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">Smart Account Created</p>
                        <p className="text-sm text-gray-600">Account Abstraction enabled</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800">Success</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Security Features Enabled</p>
                        <p className="text-sm text-gray-600">Social recovery configured</p>
                      </div>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Account Details */}
          <div className="space-y-6">
            {/* Smart Account Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                  Smart Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {smartAccountAddress && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <span className="font-mono text-sm flex-1">
                          {formatAddress(smartAccountAddress)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(smartAccountAddress)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://sepolia.etherscan.io/address/${smartAccountAddress}`, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                      {copiedAddress && (
                        <p className="text-xs text-emerald-600">✓ Address copied to clipboard</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Balance</label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{formatBalance(smartAccountBalance)}</span>
                        <span className="text-gray-600">ETH</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Network</label>
                      <Badge variant="outline" className="w-fit">
                        Sepolia Testnet
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* User Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {getAuthIcon(user?.authType || '')}
                  </div>
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-sm">{user?.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-sm">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Authentication</label>
                  <Badge variant="outline" className="w-fit gap-1">
                    {getAuthIcon(user?.authType || '')}
                    {user?.authType}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <Badge className="bg-emerald-100 text-emerald-800 w-fit">
                    {user?.isVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Gas Sponsor Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Gas Sponsorship
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Transactions</span>
                    <span className="text-sm font-medium">Unlimited</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Provider</span>
                    <span className="text-sm font-medium">Alchemy</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}