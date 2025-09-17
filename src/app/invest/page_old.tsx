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
  investedAmount: number
  returns: number
  returnsPercent: number
  allocation: number
  riskLevel: 'Low' | 'Medium' | 'High'
  apy?: number
  description: string
}

interface TokenizedAsset {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  marketCap: number
  description: string
  minInvestment: number
  category: string
  apy: number
}

const portfolioData: Investment[] = [
  {
    id: '1',
    name: 'US Treasury Bills',
    type: 'tokenized-asset',
    currentValue: 5250.00,
    investedAmount: 5000.00,
    returns: 250.00,
    returnsPercent: 5.0,
    allocation: 35,
    riskLevel: 'Low',
    apy: 5.2,
    description: 'Tokenized US government short-term securities'
  },
  {
    id: '2',
    name: 'Real Estate Portfolio',
    type: 'tokenized-asset',
    currentValue: 3150.00,
    investedAmount: 3000.00,
    returns: 150.00,
    returnsPercent: 5.0,
    allocation: 25,
    riskLevel: 'Medium',
    apy: 8.5,
    description: 'Diversified commercial real estate investments'
  },
  {
    id: '3',
    name: 'Conservative Auto-Invest',
    type: 'auto-invest',
    currentValue: 2120.00,
    investedAmount: 2000.00,
    returns: 120.00,
    returnsPercent: 6.0,
    allocation: 20,
    riskLevel: 'Low',
    apy: 4.8,
    description: 'Automated investment in low-risk assets'
  },
  {
    id: '4',
    name: 'Growth Portfolio',
    type: 'portfolio',
    currentValue: 1580.00,
    investedAmount: 1500.00,
    returns: 80.00,
    returnsPercent: 5.3,
    allocation: 15,
    riskLevel: 'High',
    apy: 12.2,
    description: 'Higher risk growth-focused investments'
  }
]

const tokenizedAssets: TokenizedAsset[] = [
  {
    id: '1',
    name: 'US Treasury Bills',
    symbol: 'USTB',
    price: 100.25,
    change24h: 0.05,
    marketCap: 2500000000,
    description: 'Tokenized short-term US government securities with stable returns',
    minInvestment: 100,
    category: 'Government Bonds',
    apy: 5.2
  },
  {
    id: '2',
    name: 'Real Estate Index',
    symbol: 'REIT',
    price: 52.80,
    change24h: 1.2,
    marketCap: 850000000,
    description: 'Diversified commercial real estate investment trust',
    minInvestment: 50,
    category: 'Real Estate',
    apy: 8.5
  },
  {
    id: '3',
    name: 'Corporate Bonds',
    symbol: 'CORP',
    price: 98.45,
    change24h: -0.3,
    marketCap: 1200000000,
    description: 'Investment-grade corporate bond portfolio',
    minInvestment: 250,
    category: 'Corporate Bonds',
    apy: 6.8
  },
  {
    id: '4',
    name: 'Gold Tokens',
    symbol: 'GOLD',
    price: 1875.30,
    change24h: 0.8,
    marketCap: 450000000,
    description: 'Physical gold-backed digital tokens',
    minInvestment: 25,
    category: 'Precious Metals',
    apy: 3.2
  }
]

export default function InvestPage() {
  const { user } = useEnhancedAuth()
  const [selectedAsset, setSelectedAsset] = useState<TokenizedAsset | null>(null)
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [userInvestments, setUserInvestments] = useState<any[]>([])
  const [availableAssets, setAvailableAssets] = useState<any[]>([])
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  const totalPortfolioValue = portfolioSummary?.totalCurrentValue || 0
  const totalInvested = portfolioSummary?.totalInvested || 0
  const totalReturns = parseFloat(portfolioSummary?.totalUnrealizedPnl || '0')
  const totalReturnsPercent = portfolioSummary?.totalReturnPercentage || 0

  const handleRefresh = async () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

        {/* Portfolio Overview */}
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
                {totalInvested > 0 && (
                  <span className={totalPortfolioValue >= totalInvested ? 'text-green-600' : 'text-red-600'}>
                    {totalPortfolioValue >= totalInvested ? '+' : ''}{formatCurrency(totalPortfolioValue - totalInvested)} ({((totalPortfolioValue - totalInvested) / totalInvested * 100).toFixed(2)}%)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
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
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getRiskColor(investment.riskLevel)}>
                                {investment.riskLevel} Risk
                              </Badge>
                              {investment.apy && (
                                <Badge variant="outline" className="text-xs">
                                  {investment.apy}% APY
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(investment.currentValue)}</div>
                          <div className="text-sm text-green-600">+{formatCurrency(investment.returns)}</div>
                          <div className="text-xs text-muted-foreground">{investment.allocation}% allocation</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress to target:</span>
                          <span>{((investment.currentValue / investment.investedAmount - 1) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min(((investment.currentValue / investment.investedAmount - 1) * 100), 100)} className="h-2" />
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
                            <span className="font-bold text-emerald-600">{asset.symbol}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{asset.name}</h3>
                            <p className="text-sm text-muted-foreground">{asset.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {asset.category}
                              </Badge>
                              <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                {asset.apy}% APY
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">${asset.price.toFixed(2)}</div>
                          <div className={`text-sm ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {asset.change24h > 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Min: {formatCurrency(asset.minInvestment)}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Market Cap:</span>
                          <div className="font-medium">${formatLargeNumber(asset.marketCap)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Min Investment:</span>
                          <div className="font-medium">{formatCurrency(asset.minInvestment)}</div>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-500"
                        onClick={() => handleInvestNow(asset.id)}
                        disabled={isInvesting && selectedAsset?.id === asset.id}
                      >
                        {isInvesting && selectedAsset?.id === asset.id ? 'Investing...' : 'Invest Now'}
                      </Button>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="performance" className="space-y-4 mt-6">
                  <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-emerald-700 mb-4">Portfolio Performance Summary</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Invested:</span>
                          <span className="font-medium">{formatCurrency(totalInvested)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Value:</span>
                          <span className="font-medium">{formatCurrency(totalPortfolioValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Returns:</span>
                          <span className="font-medium text-green-600">+{formatCurrency(totalReturns)}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Return Rate:</span>
                          <span className="font-medium text-green-600">+{totalReturnsPercent.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time Period:</span>
                          <span className="font-medium">YTD</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Risk Level:</span>
                          <span className="font-medium">Balanced</span>
                        </div>
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
      </div>

      {/* Investment Categories */}
      <div className="grid gap-4 md:grid-cols-4">
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

        <Card 
          className="border-emerald-200 cursor-pointer hover:bg-emerald-50 transition-colors"
          onClick={() => window.location.href = '/invest/defi'}
        >
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <Target className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">DeFi Yield Farming</h3>
              <p className="text-sm text-muted-foreground">Maximize returns through DeFi</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </AuthGuard>
  )
}