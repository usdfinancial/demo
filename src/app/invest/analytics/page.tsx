'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Target, PieChart, Activity, ArrowUpRight, ArrowDownRight, Filter, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'

interface PortfolioHolding {
  id: string
  name: string
  symbol: string
  category: string
  allocation: number
  value: number
  invested: number
  returns: number
  returnsPercent: number
  performance24h: number
  performance7d: number
  performance30d: number
  apy: number
  currency: StablecoinSymbol
}

interface PerformanceMetric {
  period: string
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
}

const portfolioHoldings: PortfolioHolding[] = [
  {
    id: '1',
    name: 'US Treasury Bills Token',
    symbol: 'USTB',
    category: 'Government Bonds',
    allocation: 35.2,
    value: 17600,
    invested: 17000,
    returns: 600,
    returnsPercent: 3.5,
    performance24h: 0.05,
    performance7d: 0.3,
    performance30d: 1.2,
    apy: 5.2,
    currency: 'USDC'
  },
  {
    id: '2',
    name: 'Real Estate Investment Trust',
    symbol: 'REIT',
    category: 'Real Estate',
    allocation: 28.7,
    value: 14350,
    invested: 13500,
    returns: 850,
    returnsPercent: 6.3,
    performance24h: 1.2,
    performance7d: 2.8,
    performance30d: 4.1,
    apy: 8.5,
    currency: 'USDT'
  },
  {
    id: '3',
    name: 'Investment Grade Corporate Bonds',
    symbol: 'CORP',
    category: 'Corporate Bonds',
    allocation: 20.1,
    value: 10050,
    invested: 9800,
    returns: 250,
    returnsPercent: 2.6,
    performance24h: -0.3,
    performance7d: 0.8,
    performance30d: 1.9,
    apy: 6.8,
    currency: 'USDC'
  },
  {
    id: '4',
    name: 'Technology Stock Index',
    symbol: 'TECH',
    category: 'Equity Index',
    allocation: 16.0,
    value: 8000,
    invested: 7200,
    returns: 800,
    returnsPercent: 11.1,
    performance24h: 2.4,
    performance7d: 5.6,
    performance30d: 8.9,
    apy: 12.1,
    currency: 'USDT'
  }
]

const performanceData: PerformanceMetric[] = [
  {
    period: '1M',
    totalReturn: 1250,
    totalReturnPercent: 2.5,
    annualizedReturn: 7.8,
    volatility: 4.2,
    sharpeRatio: 1.85,
    maxDrawdown: -1.8,
    winRate: 68.5
  },
  {
    period: '3M',
    totalReturn: 3200,
    totalReturnPercent: 6.8,
    annualizedReturn: 8.4,
    volatility: 5.1,
    sharpeRatio: 1.65,
    maxDrawdown: -3.2,
    winRate: 71.2
  },
  {
    period: '6M',
    totalReturn: 5800,
    totalReturnPercent: 12.3,
    annualizedReturn: 9.1,
    volatility: 6.8,
    sharpeRatio: 1.34,
    maxDrawdown: -5.7,
    winRate: 73.8
  },
  {
    period: '1Y',
    totalReturn: 8900,
    totalReturnPercent: 18.7,
    annualizedReturn: 18.7,
    volatility: 8.9,
    sharpeRatio: 2.10,
    maxDrawdown: -8.3,
    winRate: 76.4
  }
]

interface RiskMetric {
  name: string
  value: number
  description: string
  status: 'low' | 'medium' | 'high'
}

const riskMetrics: RiskMetric[] = [
  {
    name: 'Portfolio Beta',
    value: 0.72,
    description: 'Lower volatility than market',
    status: 'low'
  },
  {
    name: 'Value at Risk (95%)',
    value: -2.8,
    description: 'Maximum expected loss',
    status: 'medium'
  },
  {
    name: 'Concentration Risk',
    value: 35.2,
    description: 'Largest single position',
    status: 'medium'
  },
  {
    name: 'Correlation Risk',
    value: 0.43,
    description: 'Asset correlation average',
    status: 'low'
  }
]

export default function PortfolioAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('1Y')
  const [selectedTab, setSelectedTab] = useState('overview')
  const [isExporting, setIsExporting] = useState(false)

  const totalPortfolioValue = portfolioHoldings.reduce((sum, holding) => sum + holding.value, 0)
  const totalInvested = portfolioHoldings.reduce((sum, holding) => sum + holding.invested, 0)
  const totalReturns = totalPortfolioValue - totalInvested
  const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0

  const currentMetrics = performanceData.find(p => p.period === selectedPeriod) || performanceData[3]

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create mock CSV data
      const csvData = [
        ['Asset', 'Value', 'Returns', 'Allocation'],
        ...portfolioHoldings.map(h => [h.name, h.value, h.returns, h.allocation])
      ]
      
      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `portfolio-analytics-${selectedPeriod}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getRiskColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Government Bonds': return 'bg-blue-500'
      case 'Real Estate': return 'bg-orange-500'
      case 'Corporate Bonds': return 'bg-green-500'
      case 'Equity Index': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Portfolio Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Comprehensive analysis of your investment performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {performanceData.map((period) => (
                <SelectItem key={period.period} value={period.period}>
                  {period.period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
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
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPortfolioValue)}</div>
            <p className="text-sm text-muted-foreground">Current value</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Total Returns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(totalReturns)}</div>
            <p className="text-sm text-muted-foreground">+{totalReturnsPercent.toFixed(1)}% gain</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              Annualized Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.annualizedReturn.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">{selectedPeriod} period</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              Sharpe Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.sharpeRatio.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Risk-adjusted return</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-emerald-600" />
                    Asset Allocation
                  </CardTitle>
                  <CardDescription>
                    Distribution of your portfolio by asset class
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {portfolioHoldings.map((holding) => (
                      <div key={holding.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${getCategoryColor(holding.category)}`} />
                            <span className="font-medium">{holding.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {holding.category}
                            </Badge>
                          </div>
                          <span className="text-sm font-medium">{holding.allocation.toFixed(1)}%</span>
                        </div>
                        <Progress value={holding.allocation} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(holding.value)}</span>
                          <span className={holding.returnsPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {holding.returnsPercent >= 0 ? '+' : ''}{holding.returnsPercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Invested:</span>
                    <span className="font-medium">{formatCurrency(totalInvested)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Value:</span>
                    <span className="font-medium">{formatCurrency(totalPortfolioValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unrealized P&L:</span>
                    <span className={`font-medium ${totalReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalReturns >= 0 ? '+' : ''}{formatCurrency(totalReturns)}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Return:</span>
                      <span className={`font-medium ${totalReturnsPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalReturnsPercent >= 0 ? '+' : ''}{totalReturnsPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Performers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {portfolioHoldings
                    .sort((a, b) => b.returnsPercent - a.returnsPercent)
                    .slice(0, 3)
                    .map((holding) => (
                      <div key={holding.id} className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-sm">{holding.symbol}</div>
                          <div className="text-xs text-muted-foreground">{holding.category}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${holding.returnsPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {holding.returnsPercent >= 0 ? '+' : ''}{holding.returnsPercent.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">{formatCurrency(holding.returns)}</div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="holdings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Holdings</CardTitle>
              <CardDescription>
                Detailed breakdown of all your investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolioHoldings.map((holding) => (
                  <div key={holding.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <span className="font-bold text-emerald-600">{holding.symbol}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{holding.name}</h3>
                          <p className="text-sm text-muted-foreground">{holding.category} • {holding.currency}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {holding.allocation.toFixed(1)}% allocation
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatCurrency(holding.value)}</div>
                        <div className={`text-sm ${holding.returnsPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.returnsPercent >= 0 ? '+' : ''}{formatCurrency(holding.returns)}
                        </div>
                        <div className="text-xs text-muted-foreground">{holding.apy}% APY</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Invested:</span>
                        <div className="font-medium">{formatCurrency(holding.invested)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">24h Change:</span>
                        <div className={`font-medium flex items-center gap-1 ${holding.performance24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.performance24h >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {holding.performance24h >= 0 ? '+' : ''}{holding.performance24h.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">7d Change:</span>
                        <div className={`font-medium flex items-center gap-1 ${holding.performance7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.performance7d >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {holding.performance7d >= 0 ? '+' : ''}{holding.performance7d.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">30d Change:</span>
                        <div className={`font-medium flex items-center gap-1 ${holding.performance30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.performance30d >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {holding.performance30d >= 0 ? '+' : ''}{holding.performance30d.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators for {selectedPeriod}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="text-sm text-emerald-600">Total Return</div>
                    <div className="text-lg font-bold text-emerald-700">
                      +{formatCurrency(currentMetrics.totalReturn)}
                    </div>
                    <div className="text-xs text-emerald-600">
                      +{currentMetrics.totalReturnPercent.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-600">Annualized</div>
                    <div className="text-lg font-bold text-blue-700">
                      {currentMetrics.annualizedReturn.toFixed(1)}%
                    </div>
                    <div className="text-xs text-blue-600">
                      Per year
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm text-yellow-600">Volatility</div>
                    <div className="text-lg font-bold text-yellow-700">
                      {currentMetrics.volatility.toFixed(1)}%
                    </div>
                    <div className="text-xs text-yellow-600">
                      Standard deviation
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-sm text-purple-600">Win Rate</div>
                    <div className="text-lg font-bold text-purple-700">
                      {currentMetrics.winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-purple-600">
                      Positive periods
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Metrics</CardTitle>
                <CardDescription>
                  Risk assessment for {selectedPeriod}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sharpe Ratio:</span>
                    <span className="font-medium">{currentMetrics.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Max Drawdown:</span>
                    <span className="font-medium text-red-600">{currentMetrics.maxDrawdown.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Volatility:</span>
                    <span className="font-medium">{currentMetrics.volatility.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Period Comparison</h4>
                  <div className="space-y-2">
                    {performanceData.map((period) => (
                      <div key={period.period} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{period.period}:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${period.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {period.totalReturnPercent >= 0 ? '+' : ''}{period.totalReturnPercent.toFixed(1)}%
                          </span>
                          {period.period === selectedPeriod && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Risk Assessment
                </CardTitle>
                <CardDescription>
                  Comprehensive risk analysis of your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskMetrics.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{metric.name}</div>
                      <Badge className={getRiskColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {typeof metric.value === 'number' ? (
                        metric.name.includes('Risk') && metric.value < 1 ? 
                          metric.value.toFixed(2) : 
                          metric.value % 1 === 0 ? metric.value.toString() : metric.value.toFixed(1)
                      ) : metric.value}
                      {metric.name.includes('%') || metric.name.includes('Risk') ? '%' : ''}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metric.description}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Recommendations</CardTitle>
                <CardDescription>
                  Suggestions to optimize your portfolio risk profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="font-medium text-yellow-800">Concentration Risk</div>
                  </div>
                  <div className="text-sm text-yellow-700">
                    Consider reducing your largest position (35.2%) to improve diversification. Target maximum 25% per asset.
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div className="font-medium text-blue-800">Diversification Opportunity</div>
                  </div>
                  <div className="text-sm text-blue-700">
                    Your portfolio has good sector diversification. Consider adding international exposure for further risk reduction.
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="font-medium text-green-800">Risk-Adjusted Performance</div>
                  </div>
                  <div className="text-sm text-green-700">
                    Your Sharpe ratio of {currentMetrics.sharpeRatio.toFixed(2)} indicates excellent risk-adjusted returns. Maintain current strategy.
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <div className="font-medium text-purple-800">Rebalancing</div>
                  </div>
                  <div className="text-sm text-purple-700">
                    Consider monthly rebalancing to maintain target allocations and capture rebalancing premium.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}