'use client'

import { useState } from 'react'
import { TrendingUp, ArrowUpDown, Shield, Zap, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  protocolsData, 
  yieldPositions, 
  stablecoinPortfolio,
  formatCurrency, 
  getStablecoinIcon,
  StablecoinSymbol
} from '@/lib/data'

export default function YieldPage() {
  const [selectedStablecoin, setSelectedStablecoin] = useState<StablecoinSymbol>('USDC')
  const [depositAmount, setDepositAmount] = useState('')
  const [selectedProtocol, setSelectedProtocol] = useState<string>('')

  const activePositions = yieldPositions.filter(p => p.isActive)
  const availableBalance = stablecoinPortfolio.find(b => b.symbol === selectedStablecoin)?.amount || 0

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200'
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'High': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getProtocolIcon = (protocol: string) => {
    const icons: Record<string, string> = {
      'Aave': '🔵',
      'Compound': '🟢', 
      'Yearn Finance': '🔷',
      'Convex Finance': '🟣',
      'Curve Finance': '🟡'
    }
    return icons[protocol] || '💰'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yield Farming</h1>
          <p className="text-muted-foreground">Maximize your stablecoin returns across DeFi protocols</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Position
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePositions.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {new Set(activePositions.map(p => p.protocol)).size} protocols
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposited</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(activePositions.reduce((sum, p) => sum + p.depositAmount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Initial deposits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(activePositions.reduce((sum, p) => sum + p.currentValue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(activePositions.reduce((sum, p) => sum + (p.currentValue - p.depositAmount), 0))} earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weighted APY</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(activePositions.reduce((sum, p) => sum + (p.apy * p.currentValue), 0) / 
                activePositions.reduce((sum, p) => sum + p.currentValue, 0)).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across positions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Your Positions</TabsTrigger>
          <TabsTrigger value="protocols">Available Protocols</TabsTrigger>
          <TabsTrigger value="deposit">New Deposit</TabsTrigger>
        </TabsList>

        {/* Active Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <div className="grid gap-4">
            {activePositions.map((position) => (
              <Card key={position.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getProtocolIcon(position.protocol)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{position.protocol}</h3>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            {getStablecoinIcon(position.stablecoin)}
                            <span>{position.stablecoin}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Deposited {position.duration} days ago
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="text-lg font-semibold">
                        {formatCurrency(position.currentValue)}
                      </div>
                      <div className="text-sm text-green-600">
                        +{formatCurrency(position.currentValue - position.depositAmount)} 
                        ({((position.currentValue - position.depositAmount) / position.depositAmount * 100).toFixed(2)}%)
                      </div>
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {position.apy}% APY
                      </Badge>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Withdraw</Button>
                        <Button size="sm">Add More</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Available Protocols Tab */}
        <TabsContent value="protocols" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {protocolsData.map((protocol) => (
              <Card key={protocol.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getProtocolIcon(protocol.name)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{protocol.name}</CardTitle>
                        <CardDescription>{protocol.type}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getRiskColor(protocol.risk)}>
                      {protocol.risk} Risk
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {protocol.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {protocol.currentApy}%
                        </div>
                        <div className="text-xs text-muted-foreground">Current APY</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {formatCurrency(protocol.tvl)}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Value Locked</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {protocol.supportedStablecoins.map((coin) => (
                        <Badge key={coin} variant="secondary" className="text-xs">
                          {getStablecoinIcon(coin)} {coin}
                        </Badge>
                      ))}
                    </div>

                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Deposit to {protocol.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* New Deposit Tab */}
        <TabsContent value="deposit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Stablecoins</CardTitle>
              <CardDescription>
                Start earning yield on your stablecoins across top DeFi protocols
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stablecoin</label>
                  <Select value={selectedStablecoin} onValueChange={(value) => setSelectedStablecoin(value as StablecoinSymbol)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stablecoinPortfolio.map((balance) => (
                        <SelectItem key={balance.symbol} value={balance.symbol}>
                          <div className="flex items-center space-x-2">
                            <span>{getStablecoinIcon(balance.symbol)}</span>
                            <span>{balance.symbol}</span>
                            <span className="text-muted-foreground">
                              ({formatCurrency(balance.amount)} available)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Protocol</label>
                  <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      {protocolsData
                        .filter(p => p.supportedStablecoins.includes(selectedStablecoin))
                        .map((protocol) => (
                          <SelectItem key={protocol.id} value={protocol.id}>
                            <div className="flex items-center space-x-2">
                              <span>{getProtocolIcon(protocol.name)}</span>
                              <span>{protocol.name}</span>
                              <span className="text-green-600 font-medium">
                                {protocol.currentApy}% APY
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="pr-16"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                    onClick={() => setDepositAmount(availableBalance.toString())}
                  >
                    MAX
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Available: {formatCurrency(availableBalance)} {selectedStablecoin}
                </p>
              </div>

              {selectedProtocol && depositAmount && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-medium">Deposit Summary</h4>
                  <div className="flex justify-between text-sm">
                    <span>Depositing:</span>
                    <span>{formatCurrency(parseFloat(depositAmount))} {selectedStablecoin}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Protocol:</span>
                    <span>{protocolsData.find(p => p.id === selectedProtocol)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expected APY:</span>
                    <span className="text-green-600 font-medium">
                      {protocolsData.find(p => p.id === selectedProtocol)?.currentApy}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated yearly earnings:</span>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(parseFloat(depositAmount) * (protocolsData.find(p => p.id === selectedProtocol)?.currentApy || 0) / 100)}
                    </span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                disabled={!selectedProtocol || !depositAmount || parseFloat(depositAmount) > availableBalance}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Start Earning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}