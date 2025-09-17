'use client'

import { useState } from 'react'
import { TrendingUp, Zap, Target, DollarSign, Shield, Activity, Layers, ArrowUpDown, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'

interface DeFiProtocol {
  id: string
  name: string
  category: 'Lending' | 'DEX' | 'Yield Farming' | 'Liquidity Mining'
  tvl: number
  apy: number
  risk: 'Low' | 'Medium' | 'High'
  description: string
  features: string[]
  token: string
  minDeposit: number
  lockPeriod: number
}

interface YieldFarm {
  id: string
  name: string
  pair: string
  protocol: string
  apy: number
  totalStaked: number
  yourStake: number
  rewards: number
  multiplier: number
  endDate: string
  isActive: boolean
}

interface LiquidityPool {
  id: string
  name: string
  pair: string
  fee: number
  volume24h: number
  liquidity: number
  apy: number
  yourLiquidity: number
  rewards: number
  impermanentLoss: number
}

const defiProtocols: DeFiProtocol[] = [
  {
    id: '1',
    name: 'Compound Finance',
    category: 'Lending',
    tvl: 8500000000,
    apy: 4.2,
    risk: 'Low',
    description: 'Decentralized lending protocol for earning interest on stablecoins',
    features: ['Instant liquidity', 'Compound interest', 'cToken rewards', 'Governance rights'],
    token: 'COMP',
    minDeposit: 100,
    lockPeriod: 0
  },
  {
    id: '2',
    name: 'Uniswap V3',
    category: 'DEX',
    tvl: 12500000000,
    apy: 6.8,
    risk: 'Medium',
    description: 'Automated market maker for providing liquidity and earning fees',
    features: ['Concentrated liquidity', 'Fee collection', 'LP tokens', 'Impermanent loss protection'],
    token: 'UNI',
    minDeposit: 500,
    lockPeriod: 0
  },
  {
    id: '3',
    name: 'Curve Finance',
    category: 'Yield Farming',
    tvl: 4200000000,
    apy: 12.5,
    risk: 'Medium',
    description: 'Optimized for stablecoin trading with additional yield farming rewards',
    features: ['Low slippage', 'CRV rewards', 'Gauge voting', 'Boosted yields'],
    token: 'CRV',
    minDeposit: 250,
    lockPeriod: 0
  },
  {
    id: '4',
    name: 'SushiSwap',
    category: 'Liquidity Mining',
    tvl: 3800000000,
    apy: 15.2,
    risk: 'High',
    description: 'Community-driven DEX with yield farming and liquidity mining',
    features: ['SUSHI rewards', 'Onsen farms', 'BentoBox', 'Cross-chain'],
    token: 'SUSHI',
    minDeposit: 1000,
    lockPeriod: 7
  }
]

const yieldFarms: YieldFarm[] = [
  {
    id: '1',
    name: 'USDC-USDT Farm',
    pair: 'USDC/USDT',
    protocol: 'Curve',
    apy: 12.5,
    totalStaked: 125000000,
    yourStake: 5000,
    rewards: 156.25,
    multiplier: 2.5,
    endDate: '2024-06-30',
    isActive: true
  },
  {
    id: '2',
    name: 'Stablecoin Pool',
    pair: 'USDC/DAI',
    protocol: 'Compound',
    apy: 8.3,
    totalStaked: 89000000,
    yourStake: 0,
    rewards: 0,
    multiplier: 1.5,
    endDate: '2024-05-15',
    isActive: true
  },
  {
    id: '3',
    name: 'High Yield Farm',
    pair: 'USDC/FRAX',
    protocol: 'SushiSwap',
    apy: 18.7,
    totalStaked: 45000000,
    yourStake: 2500,
    rewards: 89.25,
    multiplier: 4.0,
    endDate: '2024-04-30',
    isActive: true
  }
]

const liquidityPools: LiquidityPool[] = [
  {
    id: '1',
    name: 'USDC-USDT 0.05%',
    pair: 'USDC/USDT',
    fee: 0.05,
    volume24h: 45000000,
    liquidity: 285000000,
    apy: 3.2,
    yourLiquidity: 3500,
    rewards: 28.50,
    impermanentLoss: -0.02
  },
  {
    id: '2',
    name: 'USDC-DAI 0.05%',
    pair: 'USDC/DAI',
    fee: 0.05,
    volume24h: 28000000,
    liquidity: 195000000,
    apy: 2.8,
    yourLiquidity: 0,
    rewards: 0,
    impermanentLoss: 0
  }
]

export default function DeFiPage() {
  const [selectedProtocol, setSelectedProtocol] = useState<DeFiProtocol | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState<StablecoinSymbol>('USDC')
  const [isDepositing, setIsDepositing] = useState(false)
  const [autoCompound, setAutoCompound] = useState(true)
  const [selectedTab, setSelectedTab] = useState('protocols')

  const totalDeposited = yieldFarms.reduce((sum, farm) => sum + farm.yourStake, 0) + 
                         liquidityPools.reduce((sum, pool) => sum + pool.yourLiquidity, 0)
  const totalRewards = yieldFarms.reduce((sum, farm) => sum + farm.rewards, 0) + 
                       liquidityPools.reduce((sum, pool) => sum + pool.rewards, 0)
  const averageAPY = yieldFarms.length > 0 
    ? yieldFarms.reduce((sum, farm) => sum + farm.apy, 0) / yieldFarms.length 
    : 0

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Lending': return 'bg-blue-500'
      case 'DEX': return 'bg-purple-500'
      case 'Yield Farming': return 'bg-green-500'
      case 'Liquidity Mining': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toString()
  }

  const handleDeposit = async () => {
    if (!selectedProtocol || !depositAmount || parseFloat(depositAmount) < selectedProtocol.minDeposit) {
      alert(`Minimum deposit is ${formatCurrency(selectedProtocol?.minDeposit || 0)}`)
      return
    }

    setIsDepositing(true)
    try {
      // Simulate DeFi interaction
      await new Promise(resolve => setTimeout(resolve, 3000))
      alert(`Successfully deposited ${formatCurrency(parseFloat(depositAmount))} ${selectedCurrency} to ${selectedProtocol.name}!`)
      setDepositAmount('')
    } catch (error) {
      console.error('Deposit failed:', error)
    } finally {
      setIsDepositing(false)
    }
  }

  const handleQuickAction = (action: string, id?: string) => {
    switch (action) {
      case 'harvest':
        alert(`Harvesting rewards for ${id}...`)
        break
      case 'compound':
        alert(`Auto-compounding rewards for ${id}...`)
        break
      case 'withdraw':
        alert(`Withdrawing from ${id}...`)
        break
      default:
        break
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            DeFi Yield Farming
          </h1>
          <p className="text-muted-foreground mt-1">Maximize returns through decentralized finance protocols</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
            <Plus className="h-4 w-4 mr-2" />
            New Position
          </Button>
        </div>
      </div>

      {/* DeFi Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Total Deposited
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDeposited)}</div>
            <p className="text-sm text-muted-foreground">Across all protocols</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Total Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRewards)}</div>
            <p className="text-sm text-muted-foreground">Earned from farming</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              Average APY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAPY.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Weighted average</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yieldFarms.filter(f => f.yourStake > 0).length + liquidityPools.filter(p => p.yourLiquidity > 0).length}</div>
            <p className="text-sm text-muted-foreground">Earning yield</p>
          </CardContent>
        </Card>
      </div>

      {/* DeFi Interface */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                DeFi Opportunities
              </CardTitle>
              <CardDescription>
                Explore yield farming and liquidity mining opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="protocols">Protocols</TabsTrigger>
                  <TabsTrigger value="farms">Yield Farms</TabsTrigger>
                  <TabsTrigger value="pools">Liquidity Pools</TabsTrigger>
                </TabsList>

                <TabsContent value="protocols" className="space-y-4 mt-6">
                  {defiProtocols.map((protocol) => (
                    <div
                      key={protocol.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedProtocol?.id === protocol.id
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-200'
                      }`}
                      onClick={() => setSelectedProtocol(protocol)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded ${getCategoryColor(protocol.category)}`} />
                          <div>
                            <h3 className="font-semibold">{protocol.name}</h3>
                            <p className="text-sm text-muted-foreground">{protocol.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {protocol.category}
                              </Badge>
                              <Badge className={`${getRiskColor(protocol.risk)} text-xs`}>
                                {protocol.risk} Risk
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">{protocol.apy}%</div>
                          <div className="text-sm text-muted-foreground">APY</div>
                          <div className="text-xs text-muted-foreground">TVL: ${formatLargeNumber(protocol.tvl)}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {protocol.features.map((feature, index) => (
                          <span key={index} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="farms" className="space-y-4 mt-6">
                  {yieldFarms.map((farm) => (
                    <div key={farm.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{farm.name}</h3>
                            <p className="text-sm text-muted-foreground">{farm.protocol} • {farm.pair}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                {farm.multiplier}x Multiplier
                              </Badge>
                              <Badge variant={farm.isActive ? 'default' : 'secondary'} className="text-xs">
                                {farm.isActive ? 'Active' : 'Ended'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">{farm.apy}%</div>
                          <div className="text-sm text-muted-foreground">APY</div>
                          <div className="text-xs text-muted-foreground">Ends: {farm.endDate}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Your Stake:</span>
                          <div className="font-medium">{formatCurrency(farm.yourStake)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pending Rewards:</span>
                          <div className="font-medium text-green-600">{formatCurrency(farm.rewards)}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Total Staked: ${formatLargeNumber(farm.totalStaked)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleQuickAction('harvest', farm.id)}
                          >
                            Harvest
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleQuickAction('compound', farm.id)}
                          >
                            Compound
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="pools" className="space-y-4 mt-6">
                  {liquidityPools.map((pool) => (
                    <div key={pool.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <ArrowUpDown className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{pool.name}</h3>
                            <p className="text-sm text-muted-foreground">{pool.pair} • {pool.fee}% fee</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                Volume: ${formatLargeNumber(pool.volume24h)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">{pool.apy}%</div>
                          <div className="text-sm text-muted-foreground">APY</div>
                          <div className="text-xs text-muted-foreground">TVL: ${formatLargeNumber(pool.liquidity)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Your Liquidity:</span>
                          <div className="font-medium">{formatCurrency(pool.yourLiquidity)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Earned Fees:</span>
                          <div className="font-medium text-green-600">{formatCurrency(pool.rewards)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">IL:</span>
                          <div className={`font-medium ${pool.impermanentLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pool.impermanentLoss >= 0 ? '+' : ''}{pool.impermanentLoss.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          24h Volume: ${formatLargeNumber(pool.volume24h)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleQuickAction('withdraw', pool.id)}
                          >
                            Remove Liquidity
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* DeFi Sidebar */}
        <div className="space-y-4">
          {selectedProtocol && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deposit to {selectedProtocol.name}</CardTitle>
                <CardDescription>
                  {selectedProtocol.apy}% APY • {selectedProtocol.risk} Risk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deposit Amount</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={`Min: ${formatCurrency(selectedProtocol.minDeposit)}`}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={selectedCurrency} onValueChange={(value: StablecoinSymbol) => setSelectedCurrency(value)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Auto-compound rewards</label>
                  <Switch checked={autoCompound} onCheckedChange={setAutoCompound} />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Annual Yield:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency((parseFloat(depositAmount) || 0) * selectedProtocol.apy / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Yield:</span>
                    <span className="font-medium">
                      {formatCurrency((parseFloat(depositAmount) || 0) * selectedProtocol.apy / 100 / 365)}
                    </span>
                  </div>
                  {selectedProtocol.lockPeriod > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lock Period:</span>
                      <span className="font-medium">{selectedProtocol.lockPeriod} days</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  onClick={handleDeposit}
                  disabled={isDepositing || !depositAmount || parseFloat(depositAmount) < selectedProtocol.minDeposit}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isDepositing ? 'Depositing...' : `Deposit ${selectedCurrency}`}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">DeFi Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Decentralized</div>
                  <div className="text-xs text-muted-foreground">Non-custodial protocols</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">High Yields</div>
                  <div className="text-xs text-muted-foreground">Maximize returns</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Real-time Rewards</div>
                  <div className="text-xs text-muted-foreground">Continuous compounding</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Composability</div>
                  <div className="text-xs text-muted-foreground">Stack multiple protocols</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-yellow-800 mb-1">Smart Contract Risk</div>
                <div className="text-xs text-yellow-600">
                  DeFi protocols involve smart contract risks. Only invest what you can afford to lose.
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-800 mb-1">Impermanent Loss</div>
                <div className="text-xs text-blue-600">
                  Liquidity provision may result in impermanent loss due to price divergence.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}