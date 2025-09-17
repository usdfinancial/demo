'use client'

import React, { useState, useEffect } from 'react'
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
  Copy,
  ExternalLink
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
import { Separator } from '@/components/ui/separator'

export default function DemoWalletPage() {
  const { user } = useEnhancedAuth()
  const [showBalance, setShowBalance] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => {
    if (user?.email) {
      const demoUser = findUserByEmail(user.email)
      if (demoUser) {
        const profile = mockDataGenerator.generateUserFinancialProfile(demoUser)
        setUserProfile(profile)
        
        // Get recent transactions
        demoTransactionService.getRecentTransactions(demoUser.id, 5).then(setRecentTransactions)
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to view your wallet</h3>
            <p className="text-muted-foreground">Connect your account to access your financial dashboard</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading your wallet...</p>
        </div>
      </div>
    )
  }

  const totalBalance = Object.values(userProfile.balances || {}).reduce((sum: number, chain: any) => {
    return sum + (chain.USDC || 0) + (chain.USDT || 0)
  }, 0)

  return (
    <AuthGuard>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallet</h1>
            <p className="text-muted-foreground">Manage your multi-chain stablecoin portfolio</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Balance Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Total Balance
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">
              {showBalance ? formatCurrency(totalBalance) : '••••••'}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="flex-1" size="sm">
                <ArrowDownLeft className="h-4 w-4 mr-2" />
                Deposit
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Receive
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chain Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Chain Balances</CardTitle>
              <CardDescription>Your stablecoin distribution across networks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(userProfile.balances || {}).map(([chainId, balance]: [string, any]) => {
                const chainConfig = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG]
                const chainTotal = (balance.USDC || 0) + (balance.USDT || 0)
                
                return (
                  <div key={chainId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{chainConfig?.icon || '🔗'}</div>
                      <div>
                        <div className="font-medium">{chainConfig?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          USDC: {formatCurrency(balance.USDC || 0)} | USDT: {formatCurrency(balance.USDT || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(chainTotal)}</div>
                      <div className="text-xs text-muted-foreground">
                        {((chainTotal / totalBalance) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )
              })}
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
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((tx, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {tx.transaction_type === 'deposit' && <ArrowDownLeft className="h-4 w-4 text-green-600" />}
                        {tx.transaction_type === 'withdrawal' && <ArrowUpRight className="h-4 w-4 text-red-600" />}
                        {tx.transaction_type === 'transfer' && <Send className="h-4 w-4 text-blue-600" />}
                        {!['deposit', 'withdrawal', 'transfer'].includes(tx.transaction_type) && <Activity className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{tx.transaction_type.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(parseFloat(tx.amount))}</div>
                      <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Yield Farming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Earn passive income on your stablecoins through DeFi protocols
              </p>
              <Button className="w-full" variant="outline">
                Explore Opportunities
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Cross-Chain Bridge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Move your assets seamlessly between different blockchain networks
              </p>
              <Button className="w-full" variant="outline">
                Bridge Assets
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Funds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deposit stablecoins from your bank account or other wallets
              </p>
              <Button className="w-full">
                Add Funds
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Demo Badge */}
        <div className="text-center py-4">
          <Badge variant="secondary" className="text-xs">
            🚀 Demo Mode - All data is simulated for demonstration purposes
          </Badge>
        </div>
      </div>
    </AuthGuard>
  )
}
