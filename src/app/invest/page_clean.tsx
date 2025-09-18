'use client'

import React, { useState } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { tokenizedAssets, userInvestmentPositions, autoInvestPlans, yieldPositions, formatCurrency, type UserInvestment, type AutoInvestPlan, type YieldPosition } from '@/lib/data'
import { TrendingUp, Target, BarChart3, DollarSign, Plus, Eye, PieChart, Calendar, Shield, Zap, Activity, RefreshCw, Settings, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const [selectedTab, setSelectedTab] = useState('portfolio')
  const [isLoading, setIsLoading] = useState(false)
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState('')
  const [investAmount, setInvestAmount] = useState('')
  const [isAutoInvestModalOpen, setIsAutoInvestModalOpen] = useState(false)

  // Calculate portfolio summary from actual data
  const totalInvested = userInvestmentPositions.reduce((sum, inv) => sum + inv.investedAmount, 0)
  const totalCurrentValue = userInvestmentPositions.reduce((sum, inv) => sum + inv.currentValue, 0)
  const totalGainLoss = totalCurrentValue - totalInvested
  const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0

  const portfolioSummary: PortfolioSummary = {
    totalCurrentValue,
    totalInvested,
    totalGainLoss,
    totalGainLossPercentage,
    monthlyGain: totalGainLoss * 0.1, // Mock monthly gain
    yearlyProjection: totalCurrentValue * 1.08 // Mock 8% yearly projection
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleInvest = (asset: any) => {
    setSelectedAsset(asset.name)
    setIsInvestModalOpen(true)
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to access investments</h3>
            <p className="text-muted-foreground">Connect your account to start building your portfolio</p>
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
            <p className="text-muted-foreground">Build wealth with tokenized assets and DeFi strategies</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              onClick={() => setIsAutoInvestModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Auto-Invest
            </Button>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(portfolioSummary.totalCurrentValue)}
              </div>
              <p className="text-sm text-muted-foreground">Current value</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" />
                Total Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(portfolioSummary.totalInvested)}
              </div>
              <p className="text-sm text-muted-foreground">Principal amount</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {portfolioSummary.totalGainLoss >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                Total Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolioSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioSummary.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(portfolioSummary.totalGainLoss)}
              </div>
              <p className={`text-sm ${portfolioSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioSummary.totalGainLoss >= 0 ? '+' : ''}{portfolioSummary.totalGainLossPercentage.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                Yearly Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(portfolioSummary.yearlyProjection)}
              </div>
              <p className="text-sm text-muted-foreground">Estimated growth</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-600" />
              Investment Management
            </CardTitle>
            <CardDescription>
              Manage your investment portfolio and explore new opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="assets">Assets</TabsTrigger>
                <TabsTrigger value="auto-invest">Auto-Invest</TabsTrigger>
                <TabsTrigger value="defi">DeFi</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio" className="space-y-6 mt-6">
                <div className="space-y-4">
                  {userInvestmentPositions.map((investment) => (
                    <div key={investment.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{investment.assetSymbol}</h3>
                            <p className="text-sm text-muted-foreground">
                              {investment.quantity} shares
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {formatCurrency(investment.currentValue)}
                          </div>
                          <div className={`text-sm ${investment.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {investment.unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(investment.unrealizedPnl)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Invested</div>
                          <div className="font-medium">{formatCurrency(investment.investedAmount)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Avg Price</div>
                          <div className="font-medium">{formatCurrency(investment.averagePrice)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Return</div>
                          <div className={`font-medium ${investment.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {((investment.unrealizedPnl / investment.investedAmount) * 100).toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          Buy More
                        </Button>
                        <Button size="sm" variant="outline">
                          Sell
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="assets" className="space-y-6 mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {tokenizedAssets.map((asset) => (
                    <div key={asset.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{asset.name}</h3>
                            <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                          </div>
                        </div>
                        <Badge className={getRiskColor(asset.riskLevel)}>
                          {asset.riskLevel}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{asset.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <div className="text-muted-foreground">Price</div>
                          <div className="font-medium">{formatCurrency(asset.currentPrice)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Expected APY</div>
                          <div className="font-medium text-emerald-600">{asset.expectedApy.toFixed(2)}%</div>
                        </div>
                      </div>

                      <Button 
                        size="sm" 
                        className="w-full bg-emerald-500 hover:bg-emerald-600"
                        onClick={() => handleInvest(asset)}
                      >
                        Invest Now
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="auto-invest" className="space-y-6 mt-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">Automated Investment Plans</h3>
                  <p className="text-sm text-muted-foreground">
                    Set up recurring investments to build wealth over time
                  </p>
                </div>

                <div className="space-y-4">
                  {autoInvestPlans.map((plan) => (
                    <div key={plan.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Target className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{plan.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(plan.monthlyAmount)} monthly
                            </p>
                          </div>
                        </div>
                        <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                          {plan.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <div className="text-muted-foreground">Total Invested</div>
                          <div className="font-medium">{formatCurrency(plan.totalInvested)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Current Value</div>
                          <div className="font-medium">{formatCurrency(plan.currentValue)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Next Investment</div>
                          <div className="font-medium">{plan.nextInvestment}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="defi" className="space-y-6 mt-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">DeFi Yield Positions</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn yield through decentralized finance protocols
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {yieldPositions.map((position) => (
                    <div key={position.id} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Percent className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{position.protocol}</h3>
                            <p className="text-sm text-muted-foreground">{position.stablecoin}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">
                            {position.apy.toFixed(2)}% APY
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <div className="text-muted-foreground">Position Value</div>
                          <div className="font-medium">{formatCurrency(position.currentValue)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rewards Earned</div>
                          <div className="font-medium text-green-600">
                            {formatCurrency(position.currentValue * 0.05)}
                          </div>
                        </div>
                      </div>

                      <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600">
                        Manage Position
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-emerald-200">
                    <CardHeader>
                      <CardTitle className="text-base">Portfolio Allocation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {userInvestmentPositions.slice(0, 4).map((investment, index) => {
                          const percentage = (investment.currentValue / portfolioSummary.totalCurrentValue) * 100
                          return (
                            <div key={investment.id} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>{investment.assetSymbol}</span>
                                <span>{percentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-emerald-200">
                    <CardHeader>
                      <CardTitle className="text-base">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Return</span>
                        <span className={`text-sm font-medium ${portfolioSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {portfolioSummary.totalGainLossPercentage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Growth</span>
                        <span className="text-sm font-medium text-emerald-600">+2.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Risk Score</span>
                        <span className="text-sm font-medium">Medium</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Diversification</span>
                        <span className="text-sm font-medium text-emerald-600">Good</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Investment Modal */}
        <Dialog open={isInvestModalOpen} onOpenChange={setIsInvestModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invest in {selectedAsset}</DialogTitle>
              <DialogDescription>
                Purchase shares of this tokenized asset
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Investment Amount (USDC)</Label>
                <Input 
                  placeholder="1000" 
                  type="number" 
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                />
              </div>
              {investAmount && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Investment Amount:</span>
                      <span className="font-medium">{formatCurrency(parseFloat(investAmount))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Shares:</span>
                      <span className="font-medium">{(parseFloat(investAmount) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsInvestModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Invest Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Auto-Invest Modal */}
        <Dialog open={isAutoInvestModalOpen} onOpenChange={setIsAutoInvestModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Auto-Invest Plan</DialogTitle>
              <DialogDescription>
                Set up automated recurring investments
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Plan Name</Label>
                <Input placeholder="My Investment Plan" />
              </div>
              <div>
                <Label className="text-sm font-medium">Monthly Amount (USDC)</Label>
                <Input placeholder="500" type="number" />
              </div>
              <div>
                <Label className="text-sm font-medium">Investment Strategy</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative (Low Risk)</SelectItem>
                    <SelectItem value="balanced">Balanced (Medium Risk)</SelectItem>
                    <SelectItem value="aggressive">Aggressive (High Risk)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAutoInvestModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Create Plan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
