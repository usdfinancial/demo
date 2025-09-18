'use client'

import { useState, useEffect } from 'react'
import { ArrowUpDown, TrendingUp, Clock, RefreshCw, Zap, Shield, Info, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mockStablecoinTransactions, formatCurrency, getStablecoinIcon, StablecoinSymbol } from '@/lib/data'

interface StablecoinPair {
  from: StablecoinSymbol
  to: StablecoinSymbol
  rate: number
  change: string
  trend: 'up' | 'down'
  liquidity: number
  fee: number
}

export default function SwapPage() {
  const [fromAmount, setFromAmount] = useState('1000')
  const [fromToken, setFromToken] = useState<StablecoinSymbol>('USDC')
  const [toToken, setToToken] = useState<StablecoinSymbol>('USDC')
  const [isSwapping, setIsSwapping] = useState(false)
  const [selectedChain, setSelectedChain] = useState(1) // Ethereum mainnet

  // Mock data for demonstration
  const quote = null
  const quoteLoading = false
  const quoteError = null
  const getQuote = () => {}
  const getExchangeRate = () => 0.9998
  const getPriceImpact = () => 0.02

  const stablecoinPairs: StablecoinPair[] = [
    { from: 'USDC', to: 'USDC', rate: 1.0000, change: '0.00%', trend: 'up', liquidity: 50000000, fee: 0.01 }
  ]

  const recentSwaps = mockStablecoinTransactions
    .filter(tx => tx.type === 'swap')
    .slice(0, 3)
    .map(tx => ({
      from: 'USDC' as StablecoinSymbol,
      to: tx.stablecoin,
      amount: Math.abs(tx.amount),
      converted: Math.abs(tx.amount) * 0.9998,
      date: tx.date,
      rate: 0.9998
    }))

  // Use mock data for demonstration
  const currentPair = stablecoinPairs.find(p => p.from === fromToken && p.to === toToken) || stablecoinPairs[0]
  const realExchangeRate = getExchangeRate()
  const toAmount = quote?.toTokenAmount || (fromAmount ? (parseFloat(fromAmount) * currentPair.rate).toFixed(4) : '0')
  const priceImpact = getPriceImpact()
  const estimatedFee = fromAmount ? (parseFloat(fromAmount) * 0.01 / 100).toFixed(4) : '0' // 0.01% fee estimate

  // Refresh quote (mock implementation)
  const handleRefreshQuote = () => {
    // Mock refresh - in a real implementation this would fetch new rates
    console.log('Refreshing quote...')
  }

  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
  }

  const handleSwap = async () => {
    setIsSwapping(true)
    // Simulate swap transaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSwapping(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Stablecoin Swap
          </h1>
          <p className="text-muted-foreground mt-1">Exchange stablecoins with minimal slippage and low fees</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedChain.toString()} onValueChange={(value) => setSelectedChain(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Ethereum</SelectItem>
              <SelectItem value="137">Polygon</SelectItem>
              <SelectItem value="42161">Arbitrum</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshQuote} disabled={quoteLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${quoteLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Swap Interface */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-emerald-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <ArrowUpDown className="h-4 w-4 text-white" />
                </div>
                Stablecoin Exchange
              </CardTitle>
              <CardDescription>
                Swap between stablecoins with institutional-grade liquidity and minimal fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* From Token */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">From</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10">
                    <span className="text-2xl">{getStablecoinIcon(fromToken)}</span>
                    <Select value={fromToken} onValueChange={(value: StablecoinSymbol) => setFromToken(value)}>
                      <SelectTrigger className="w-24 h-8 border-none bg-transparent p-0 font-semibold text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="h-20 text-2xl font-bold pl-28 pr-4 border-2 focus:border-emerald-300"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Balance: 25,847.32 {fromToken}</span>
                  <button className="text-emerald-600 hover:text-emerald-700 font-medium">Max</button>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleSwapTokens}
                  className="rounded-full border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <ArrowUpDown className="h-4 w-4 text-emerald-600" />
                </Button>
              </div>

              {/* To Token */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">To</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10">
                    <span className="text-2xl">{getStablecoinIcon(toToken)}</span>
                    <Select value={toToken} onValueChange={(value: StablecoinSymbol) => setToToken(value)}>
                      <SelectTrigger className="w-24 h-8 border-none bg-transparent p-0 font-semibold text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={toAmount}
                    readOnly
                    className="h-20 text-2xl font-bold pl-28 pr-4 bg-muted border-2"
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Balance: 12,453.67 {toToken}</span>
                  <span>≈ ${toAmount}</span>
                </div>
              </div>

              {/* Quote Status */}
              {quoteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <Info className="h-4 w-4" />
                    {quoteError}
                  </div>
                </div>
              )}

              {/* Transaction Details */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Exchange Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        1 {fromToken} = {realExchangeRate > 0 ? realExchangeRate.toFixed(6) : currentPair.rate} {toToken}
                      </span>
                      {quote && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Live Rate
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {priceImpact > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price Impact</span>
                      <span className={`font-medium ${priceImpact > 0.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {priceImpact.toFixed(3)}%
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Network Fee</span>
                    <span className="font-medium">${estimatedFee}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Minimum Received</span>
                    <span className="font-medium">{(parseFloat(toAmount) * 0.995).toFixed(4)} {toToken}</span>
                  </div>
                  
                  {quote?.estimatedGas && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Est. Gas</span>
                      <span className="font-medium">{quote.estimatedGas.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">You'll receive</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600">{toAmount} {toToken}</span>
                        {quoteLoading && (
                          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" 
                size="lg"
                onClick={handleSwap}
                disabled={isSwapping || !fromAmount || parseFloat(fromAmount) <= 0}
              >
                {isSwapping ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Swap Stablecoins
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Market Info Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Market Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Source</span>
                    <div className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Market</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Network</span>
                    <span className="text-sm font-medium">
                      {selectedChain === 1 ? 'Ethereum' : selectedChain === 137 ? 'Polygon' : 'Arbitrum'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price Impact</span>
                    <span className={`text-sm font-medium ${priceImpact > 0.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {priceImpact.toFixed(3)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Est. Gas</span>
                    <span className="text-sm font-medium">{quote.estimatedGas.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Liquidity</span>
                    <span className="text-sm font-medium">{formatCurrency(currentPair.liquidity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">24h Change</span>
                    <Badge variant={currentPair.trend === 'up' ? 'default' : 'secondary'} className="text-xs">
                      <TrendingUp className={`h-3 w-3 mr-1 ${currentPair.trend === 'down' ? 'rotate-180' : ''}`} />
                      {currentPair.change}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Slippage</span>
                    <span className="text-sm font-medium text-emerald-600">1.0%</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Why Stablecoins?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Price stability (~$1.00)</p>
              <p>• Instant settlements</p>
              <p>• Low volatility risk</p>
              <p>• Global accessibility</p>
              <p>• DeFi compatibility</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Stablecoin Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Live Stablecoin Rates
          </CardTitle>
          <CardDescription>
            Real-time exchange rates between major stablecoins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stablecoinPairs.map((pair, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow hover:border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span>{getStablecoinIcon(pair.from)}</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    <span>{getStablecoinIcon(pair.to)}</span>
                    <span className="font-medium text-sm">{pair.from}/{pair.to}</span>
                  </div>
                  <Badge variant={pair.trend === 'up' ? 'default' : 'secondary'} className="bg-emerald-100 text-emerald-800">
                    <TrendingUp className={`h-3 w-3 mr-1 ${pair.trend === 'down' ? 'rotate-180' : ''}`} />
                    {pair.change}
                  </Badge>
                </div>
                <div className="text-xl font-bold">{pair.rate}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  1 {pair.from} = {pair.rate} {pair.to}
                </div>
                <div className="text-xs text-muted-foreground">
                  Liquidity: {formatCurrency(pair.liquidity)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Recent Stablecoin Swaps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Recent Stablecoin Swaps
          </CardTitle>
          <CardDescription>
            Your recent stablecoin exchange transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSwaps.map((swap, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-emerald-50/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ArrowUpDown className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <span>{getStablecoinIcon(swap.from)}</span>
                      <span>{swap.from}</span>
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      <span>{getStablecoinIcon(swap.to)}</span>
                      <span>{swap.to}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rate: 1 {swap.from} = {swap.rate} {swap.to}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(swap.amount)} → {formatCurrency(swap.converted)}
                  </div>
                  <div className="text-sm text-muted-foreground">{swap.date}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}