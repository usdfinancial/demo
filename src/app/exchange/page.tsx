'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, ArrowLeftRight, RefreshCw, BarChart3, DollarSign, Timer, Globe, Zap, Shield, Activity } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { MockDataExtensions } from '@/lib/demo/mockDataExtensions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { getStablecoinIcon, StablecoinSymbol } from '@/lib/data'

interface ExchangeRate {
  from: string
  to: string
  rate: number
  change24h: number
  volume24h: number
  lastUpdated: string
}

interface MarketData {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
  stability: number
}

const exchangeRates: ExchangeRate[] = [
  {
    from: 'USDC',
    to: 'USDT',
    rate: 0.9998,
    change24h: 0.001,
    volume24h: 125000000,
    lastUpdated: '2 seconds ago'
  },
  {
    from: 'USDT',
    to: 'USDC',
    rate: 1.0002,
    change24h: -0.001,
    volume24h: 98000000,
    lastUpdated: '2 seconds ago'
  },
  {
    from: 'USDC',
    to: 'USD',
    rate: 1.0001,
    change24h: 0.0005,
    volume24h: 45000000,
    lastUpdated: '5 seconds ago'
  },
  {
    from: 'USDT',
    to: 'USD',
    rate: 0.9999,
    change24h: -0.0003,
    volume24h: 52000000,
    lastUpdated: '3 seconds ago'
  }
]

const marketData: MarketData[] = [
  {
    symbol: 'USDC',
    price: 1.0001,
    change24h: 0.0005,
    volume24h: 2500000000,
    marketCap: 32000000000,
    stability: 99.8
  },
  {
    symbol: 'USDT',
    price: 0.9999,
    change24h: -0.0003,
    volume24h: 4200000000,
    marketCap: 83000000000,
    stability: 99.7
  }
]

export default function ExchangePage() {
  const { user } = useEnhancedAuth()
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState('USDC')
  const [toCurrency, setToCurrency] = useState('USDT')
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [defiPositions, setDefiPositions] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (user?.email) {
      const demoUser = findUserByEmail(user.email)
      if (demoUser) {
        const defiData = MockDataExtensions.generateDeFiPositions(demoUser)
        setDefiPositions(defiData.positions)
        setUserProfile(demoUser)
      }
    }
  }, [user?.email])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const currentRate = exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency)?.rate || 1
  
  // Calculate toAmount based on fromAmount and current rate
  const calculatedToAmount = fromAmount ? (parseFloat(fromAmount) * currentRate).toFixed(6) : ''
  
  // Update toAmount state when calculation changes
  useEffect(() => {
    setToAmount(calculatedToAmount)
  }, [calculatedToAmount])

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toString()
  }

  const refreshRates = async () => {
    setIsRefreshing(true)
    // Simulate API call
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const swapCurrencies = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Please sign in to access Exchange</div>
            <div className="text-muted-foreground">Connect your account to start trading stablecoins</div>
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
              Exchange
            </h1>
            <p className="text-muted-foreground">Swap stablecoins and access DeFi opportunities</p>
          </div>
          <Button 
            variant="outline" 
            onClick={refreshRates} 
            disabled={isLoading || isRefreshing}
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Rates
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200 md:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Exchange Stablecoins</CardTitle>
              <CardDescription>Swap between USDC, USDT, and USD</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="exchange" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="exchange">Exchange</TabsTrigger>
                  <TabsTrigger value="markets">Markets</TabsTrigger>
                </TabsList>
                
                <TabsContent value="exchange" className="mt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">From</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Select value={fromCurrency} onValueChange={setFromCurrency}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USDC">
                              <div className="flex items-center gap-2">
                                {getStablecoinIcon('USDC')} USDC
                              </div>
                            </SelectItem>
                            <SelectItem value="USDT">
                              <div className="flex items-center gap-2">
                                {getStablecoinIcon('USDC')} USDT
                              </div>
                            </SelectItem>
                            <SelectItem value="USD">
                              <div className="flex items-center gap-2">
                                💵 USD
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={swapCurrencies}
                        className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">To</label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={toAmount}
                          readOnly
                          className="flex-1 bg-muted"
                        />
                        <Select value={toCurrency} onValueChange={setToCurrency}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USDC">
                              <div className="flex items-center gap-2">
                                {getStablecoinIcon('USDC')} USDC
                              </div>
                            </SelectItem>
                            <SelectItem value="USDT">
                              <div className="flex items-center gap-2">
                                {getStablecoinIcon('USDC')} USDT
                              </div>
                            </SelectItem>
                            <SelectItem value="USD">
                              <div className="flex items-center gap-2">
                                💵 USD
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {currentRate && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>1 {fromCurrency} =</span>
                            <span className="font-medium">{currentRate.toFixed(6)} {toCurrency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>24h Change:</span>
                            <span className={`font-medium ${currentRate ? (exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency)?.change24h || 0) >= 0 ? 'text-green-600' : 'text-red-600' : ''}`}>
                              {currentRate ? `${(exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency)?.change24h || 0) > 0 ? '+' : ''}${(exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency)?.change24h || 0).toFixed(3)}%` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>24h Volume:</span>
                            <span className="font-medium">
                              {currentRate ? `$${formatLargeNumber(exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency)?.volume24h || 0)}` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-emerald-200">
                            <span>Last updated:</span>
                            <span>{currentRate ? exchangeRates.find(r => r.from === fromCurrency && r.to === toCurrency)?.lastUpdated : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {fromAmount && toAmount && (
                      <Button className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Exchange {fromAmount} {fromCurrency} for {toAmount} {toCurrency}
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="markets" className="mt-6">
                  <div className="space-y-4">
                    {marketData.map((coin) => (
                      <div key={coin.symbol} className="p-4 border rounded-lg hover:bg-emerald-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{getStablecoinIcon(coin.symbol as StablecoinSymbol)}</div>
                            <div>
                              <h3 className="font-semibold">{coin.symbol}</h3>
                              <p className="text-sm text-muted-foreground">
                                Market Cap: ${formatLargeNumber(coin.marketCap)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">${coin.price.toFixed(4)}</div>
                            <div className={`text-sm flex items-center gap-1 ${coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {coin.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {Math.abs(coin.change24h).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">24h Volume</div>
                            <div className="font-medium">${formatLargeNumber(coin.volume24h)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Stability Score</div>
                            <div className="font-medium">{coin.stability}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Exchange Rates Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Timer className="h-4 w-4 text-emerald-600" />
                  Live Exchange Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {exchangeRates.map((rate, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rate.from}/{rate.to}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{rate.rate.toFixed(4)}</div>
                      <div className={`text-xs ${rate.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rate.change24h >= 0 ? '+' : ''}{rate.change24h.toFixed(3)}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exchange Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Timer className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium">Real-time Rates</div>
                    <div className="text-xs text-muted-foreground">Updated every second</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium">No Hidden Fees</div>
                    <div className="text-xs text-muted-foreground">Transparent pricing</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium">Global Markets</div>
                    <div className="text-xs text-muted-foreground">24/7 availability</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Exchange</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm">
                  USDC → USDT
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  USDT → USDC
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  USD → USDC
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  USD → USDT
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
