'use client'

import { useState } from 'react'
import { AlertTriangle, TrendingUp, BarChart3, Clock, Shield, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  protocolsData, 
  stablecoinPortfolio,
  formatCurrency, 
  getStablecoinIcon,
  StablecoinSymbol
} from '@/lib/data'

// Mock depeg data
const depegAlerts = [
  {
    stablecoin: 'USDT' as StablecoinSymbol,
    currentPrice: 0.9994,
    depegPercentage: 0.06,
    severity: 'low' as const,
    timestamp: new Date('2024-01-15T10:30:00Z')
  }
]

// Mock market data
const marketData = {
  totalMarketCap: 125000000000, // $125B
  top5MarketCap: 118000000000,  // $118B (94.4%)
  averageApy: 4.3,
  protocolsCount: 12,
  totalTvl: 45000000000 // $45B
}

const stablecoinPrices = [
  { symbol: 'USDC' as StablecoinSymbol, price: 1.0001, change24h: 0.01, marketCap: 42500000000, volume24h: 8200000000 },
  { symbol: 'USDT' as StablecoinSymbol, price: 0.9994, change24h: -0.06, marketCap: 85000000000, volume24h: 18400000000 }
]

export default function AnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriceChangeColor = (change: number) => {
    if (change > 0.05) return 'text-green-600'
    if (change < -0.05) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stablecoin Analytics</h1>
          <p className="text-muted-foreground">Real-time market intelligence and stability monitoring</p>
        </div>
      </div>

      {/* Depeg Alerts */}
      {depegAlerts.length > 0 && (
        <div className="space-y-2">
          {depegAlerts.map((alert, index) => (
            <Alert key={index} className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <span className="font-medium">Depeg Alert:</span> {alert.stablecoin} is trading at 
                ${alert.currentPrice.toFixed(4)} ({alert.depegPercentage}% below peg)
                <Badge className={`ml-2 ${getSeverityColor(alert.severity)}`}>
                  {alert.severity} severity
                </Badge>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Market Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Market Cap</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(marketData.totalMarketCap)}</div>
            <p className="text-xs text-muted-foreground">
              All stablecoins combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Concentration</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.4%</div>
            <p className="text-xs text-muted-foreground">
              Top 5 stablecoins share
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average APY</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{marketData.averageApy}%</div>
            <p className="text-xs text-muted-foreground">
              Across DeFi protocols
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total TVL</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(marketData.totalTvl)}</div>
            <p className="text-xs text-muted-foreground">
              Locked in DeFi
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="prices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prices">Price Monitoring</TabsTrigger>
          <TabsTrigger value="protocols">Protocol Analysis</TabsTrigger>
          <TabsTrigger value="stability">Stability Metrics</TabsTrigger>
        </TabsList>

        {/* Price Monitoring Tab */}
        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stablecoin Price Tracking</CardTitle>
              <CardDescription>
                Real-time prices and market data for major stablecoins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stablecoinPrices.map((coin) => (
                  <div key={coin.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getStablecoinIcon(coin.symbol)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{coin.symbol}</h3>
                          {Math.abs(coin.change24h) > 0.1 && (
                            <Badge variant="outline" className="text-xs">
                              Attention
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Market Cap: {formatCurrency(coin.marketCap)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-mono">${coin.price.toFixed(4)}</div>
                      <div className={`text-sm ${getPriceChangeColor(coin.change24h)}`}>
                        {coin.change24h > 0 ? '+' : ''}{coin.change24h.toFixed(2)}% (24h)
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatCurrency(coin.volume24h)} 
                      </div>
                      <div className="text-xs text-muted-foreground">24h Volume</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Protocol Analysis Tab */}
        <TabsContent value="protocols" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {protocolsData.map((protocol) => (
              <Card key={protocol.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {protocol.name === 'Aave' && '🔵'}
                        {protocol.name === 'Compound' && '🟢'}
                        {protocol.name === 'Yearn Finance' && '🔷'}
                        {protocol.name === 'Convex Finance' && '🟣'}
                        {protocol.name === 'Curve Finance' && '🟡'}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{protocol.name}</CardTitle>
                        <CardDescription>{protocol.type}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {protocol.risk} Risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {protocol.currentApy}%
                      </div>
                      <div className="text-xs text-muted-foreground">Current APY</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(protocol.tvl)}
                      </div>
                      <div className="text-xs text-muted-foreground">TVL</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>TVL Distribution</span>
                      <span>{((protocol.tvl / marketData.totalTvl) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(protocol.tvl / marketData.totalTvl) * 100} className="h-2" />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {protocol.supportedStablecoins.map((coin) => (
                      <Badge key={coin} variant="secondary" className="text-xs">
                        {getStablecoinIcon(coin)} {coin}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Stability Metrics Tab */}
        <TabsContent value="stability" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stability Score</CardTitle>
                <CardDescription>
                  Overall stability assessment across all stablecoins
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {stablecoinPrices.slice(0, 4).map((coin) => {
                  const stabilityScore = Math.max(0, 100 - Math.abs(coin.change24h) * 1000)
                  return (
                    <div key={coin.symbol}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <span>{getStablecoinIcon(coin.symbol)}</span>
                          <span className="font-medium">{coin.symbol}</span>
                        </div>
                        <span className="text-sm font-medium">{stabilityScore.toFixed(1)}/100</span>
                      </div>
                      <Progress value={stabilityScore} className="h-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>
                  Risk factors and monitoring alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Collateral Health</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Good</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Market Volatility</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Liquidity Depth</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Excellent</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Protocol Security</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">High</Badge>
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