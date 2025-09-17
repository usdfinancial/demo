'use client'

import React, { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { MockDataExtensions } from '@/lib/demo/mockDataExtensions'
import { demoInvestmentService } from '@/lib/demo/demoServices'
import { TrendingUp, Target, BarChart3, DollarSign, Plus, Eye, PieChart, Calendar, Shield, Zap, Activity, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface Investment {
  id: string
  name: string
  type: 'tokenized-asset' | 'auto-invest' | 'portfolio'
  currentValue: number
  invested: number
  allocation: number
  risk: 'Low' | 'Medium' | 'High'
  apy: number
  description: string
}

interface TokenizedAsset {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: number
  apy: number
  risk: 'Low' | 'Medium' | 'High'
  category: string
  description: string
}

interface PortfolioSummary {
  totalCurrentValue: number
  totalInvested: number
  totalGainLoss: number
  totalGainLossPercentage: number
  monthlyGain: number
  yearlyProjection: number
}

export default function InvestPage() {
  const { user } = useEnhancedAuth()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null)
  const [userInvestments, setUserInvestments] = useState<Investment[]>([])
  const [availableAssets, setAvailableAssets] = useState<TokenizedAsset[]>([])

  // Mock data
  const investments: Investment[] = [
    {
      id: '1',
      name: 'Real Estate Portfolio',
      type: 'tokenized-asset',
      currentValue: 15000,
      invested: 12000,
      allocation: 35,
      risk: 'Medium',
      apy: 8.5,
      description: 'Diversified real estate investments'
    },
    {
      id: '2',
      name: 'Auto-Invest Plan',
      type: 'auto-invest',
      currentValue: 8500,
      invested: 8000,
      allocation: 25,
      risk: 'Low',
      apy: 6.2,
      description: 'Automated monthly investments'
    },
    {
      id: '3',
      name: 'Growth Portfolio',
      type: 'portfolio',
      currentValue: 12000,
      invested: 10000,
      allocation: 40,
      risk: 'High',
      apy: 12.3,
      description: 'High-growth asset mix'
    }
  ]

  const tokenizedAssets: TokenizedAsset[] = [
    {
      id: '1',
      name: 'US Real Estate Index',
      symbol: 'USREI',
      price: 125.50,
      change24h: 2.3,
      marketCap: 2500000000,
      apy: 8.5,
      risk: 'Medium',
      category: 'Real Estate',
      description: 'Tokenized US commercial real estate'
    },
    {
      id: '2',
      name: 'Treasury Bond Token',
      symbol: 'USTB',
      price: 98.75,
      change24h: 0.1,
      marketCap: 5000000000,
      apy: 4.2,
      risk: 'Low',
      category: 'Bonds',
      description: 'US Treasury bonds on blockchain'
    }
  ]

  useEffect(() => {
    if (user?.email) {
      const demoUser = findUserByEmail(user.email)
      if (demoUser) {
        // Load user's investment data
        demoInvestmentService.getPortfolioSummary(demoUser.id).then(setPortfolioSummary)
        demoInvestmentService.getUserInvestments(demoUser.id).then(setUserInvestments)
        demoInvestmentService.getAvailableAssets().then(setAvailableAssets)
      }
    }
  }, [user?.email])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const totalPortfolioValue = portfolioSummary?.totalCurrentValue || 35500
  const totalInvested = portfolioSummary?.totalInvested || 30000
  const totalGain = totalPortfolioValue - totalInvested
  const totalGainPercentage = (totalGain / totalInvested) * 100

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action)
    // Implement quick actions
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to view investments</h3>
            <p className="text-muted-foreground">Connect your account to access your investment portfolio</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Investment Portfolio
            </h1>
            <p className="text-muted-foreground">Grow your wealth with tokenized assets and automated strategies</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
              <Plus className="h-4 w-4 mr-2" />
              New Investment
            </Button>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalPortfolioValue)}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className={totalGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)} ({totalGainPercentage.toFixed(2)}%)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Investment Portfolio
              </CardTitle>
              <CardDescription>
                Your current investments and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
                  <TabsTrigger value="assets">Tokenized Assets</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-6">
                  {investments.map((investment) => (
                    <div key={investment.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            {investment.type === 'tokenized-asset' && <DollarSign className="h-6 w-6 text-emerald-600" />}
                            {investment.type === 'auto-invest' && <Target className="h-6 w-6 text-emerald-600" />}
                            {investment.type === 'portfolio' && <PieChart className="h-6 w-6 text-emerald-600" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{investment.name}</h3>
                            <p className="text-sm text-muted-foreground">{investment.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(investment.currentValue)}</div>
                          <div className="text-sm text-muted-foreground">
                            Invested: {formatCurrency(investment.invested)}
                          </div>
                          <Badge className={`text-xs mt-1 ${getRiskColor(investment.risk)}`}>
                            {investment.risk} Risk
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>APY: {investment.apy}%</span>
                        <span className="text-emerald-600">
                          +{formatCurrency(investment.currentValue - investment.invested)} 
                          ({(((investment.currentValue - investment.invested) / investment.invested) * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="assets" className="space-y-4 mt-6">
                  {tokenizedAssets.map((asset) => (
                    <div key={asset.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{asset.name}</h3>
                            <p className="text-sm text-muted-foreground">{asset.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(asset.price)}</div>
                          <div className={`text-sm ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span>APY: {asset.apy}%</span>
                          <Badge className={`text-xs ${getRiskColor(asset.risk)}`}>
                            {asset.risk} Risk
                          </Badge>
                        </div>
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                          <Plus className="h-4 w-4 mr-1" />
                          Invest
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="performance" className="space-y-4 mt-6">
                  <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-emerald-700 mb-4">Portfolio Performance Summary</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-sm text-emerald-600">Total Return</div>
                        <div className="text-2xl font-bold text-emerald-700">
                          +{formatCurrency(totalGain)} ({totalGainPercentage.toFixed(2)}%)
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-emerald-600">Monthly Growth</div>
                        <div className="text-2xl font-bold text-emerald-700">+2.8%</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <h4 className="font-medium">Asset Allocation</h4>
                    {investments.map((investment) => (
                      <div key={investment.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{investment.name}:</span>
                          <span>{investment.allocation}%</span>
                        </div>
                        <Progress value={investment.allocation} className="h-2" />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Investment Sidebar */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Investment Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-sm font-medium text-emerald-800">Monthly Target</div>
                  <div className="text-xs text-emerald-600">Invest $500 monthly</div>
                  <Progress value={75} className="mt-2 h-2" />
                  <div className="text-xs text-emerald-600 mt-1">$375 / $500 this month</div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Retirement Goal</div>
                  <div className="text-xs text-blue-600">$1M by age 65</div>
                  <Progress value={15} className="mt-2 h-2" />
                  <div className="text-xs text-blue-600 mt-1">15% complete</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium">Moderate Risk</div>
                    <div className="text-xs text-muted-foreground">Balanced growth strategy</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Your portfolio is well-diversified across low to medium-risk investments, suitable for steady growth.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={() => handleQuickAction('auto-invest')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Auto-Invest Setup
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={() => handleQuickAction('rebalance')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Rebalance Portfolio
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={() => handleQuickAction('report')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Performance Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm"
                  onClick={() => handleQuickAction('schedule')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Investment
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Investment Categories */}
          <div className="md:col-span-3 grid gap-4 md:grid-cols-3">
            <Card 
              className="border-emerald-200 cursor-pointer hover:bg-emerald-50 transition-colors"
              onClick={() => window.location.href = '/invest/assets'}
            >
              <CardContent className="flex items-center p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Tokenized Assets</h3>
                  <p className="text-sm text-muted-foreground">Real-world assets on blockchain</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-emerald-200 cursor-pointer hover:bg-emerald-50 transition-colors"
              onClick={() => window.location.href = '/invest/auto'}
            >
              <CardContent className="flex items-center p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                  <Target className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Auto-Invest</h3>
                  <p className="text-sm text-muted-foreground">Automated dollar-cost averaging</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-emerald-200 cursor-pointer hover:bg-emerald-50 transition-colors"
              onClick={() => window.location.href = '/invest/staking'}
            >
              <CardContent className="flex items-center p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                  <Zap className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Staking</h3>
                  <p className="text-sm text-muted-foreground">Earn yield on stablecoins</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
