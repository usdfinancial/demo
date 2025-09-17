'use client'

import { useState } from 'react'
import { Zap, Lock, Unlock, DollarSign, TrendingUp, Clock, Shield, Target, Calendar, Award, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'

interface StakingPool {
  id: string
  name: string
  protocol: string
  token: string
  apy: number
  minStake: number
  lockPeriod: number
  totalStaked: number
  yourStake: number
  rewards: number
  riskLevel: 'Low' | 'Medium' | 'High'
  features: string[]
  currency: StablecoinSymbol
  isActive: boolean
}

interface StakingPosition {
  id: string
  poolId: string
  amount: number
  startDate: string
  endDate: string
  currentRewards: number
  totalRewards: number
  status: 'active' | 'unlocking' | 'completed'
  apy: number
}

const stakingPools: StakingPool[] = [
  {
    id: '1',
    name: 'USDC Yield Pool',
    protocol: 'Compound Finance',
    token: 'USDC',
    apy: 4.2,
    minStake: 100,
    lockPeriod: 0,
    totalStaked: 125000000,
    yourStake: 5000,
    rewards: 42.50,
    riskLevel: 'Low',
    features: ['No lock period', 'Compound protocol', 'Insurance covered', 'Real-time rewards'],
    currency: 'USDC',
    isActive: true
  },
  {
    id: '2',
    name: 'USDT Stability Pool',
    protocol: 'Aave',
    token: 'USDT',
    apy: 3.8,
    minStake: 250,
    lockPeriod: 0,
    totalStaked: 89000000,
    yourStake: 0,
    rewards: 0,
    riskLevel: 'Low',
    features: ['Variable APY', 'Instant withdrawal', 'Aave protocol', 'Safety module'],
    currency: 'USDT',
    isActive: true
  },
  {
    id: '3',
    name: 'High Yield USDC',
    protocol: 'DeFi Pulse',
    token: 'USDC',
    apy: 8.5,
    minStake: 1000,
    lockPeriod: 30,
    totalStaked: 45000000,
    yourStake: 2500,
    rewards: 89.25,
    riskLevel: 'Medium',
    features: ['30-day lock', 'Higher rewards', 'Yield farming', 'Auto-compound'],
    currency: 'USDC',
    isActive: true
  },
  {
    id: '4',
    name: 'Premium Staking',
    protocol: 'YieldMax',
    token: 'USDC',
    apy: 12.8,
    minStake: 5000,
    lockPeriod: 90,
    totalStaked: 25000000,
    yourStake: 0,
    rewards: 0,
    riskLevel: 'High',
    features: ['90-day lock', 'Maximum yields', 'Risk premium', 'Early withdrawal penalty'],
    currency: 'USDC',
    isActive: true
  }
]

const stakingPositions: StakingPosition[] = [
  {
    id: '1',
    poolId: '1',
    amount: 5000,
    startDate: '2024-01-15',
    endDate: '2024-01-15',
    currentRewards: 42.50,
    totalRewards: 210.50,
    status: 'active',
    apy: 4.2
  },
  {
    id: '2',
    poolId: '3',
    amount: 2500,
    startDate: '2024-01-10',
    endDate: '2024-02-09',
    currentRewards: 89.25,
    totalRewards: 178.50,
    status: 'active',
    apy: 8.5
  }
]

export default function StakingPage() {
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [stakeCurrency, setStakeCurrency] = useState<StablecoinSymbol>('USDC')
  const [isStaking, setIsStaking] = useState(false)
  const [pools, setPools] = useState<StakingPool[]>(stakingPools)
  const [positions, setPositions] = useState<StakingPosition[]>(stakingPositions)

  const totalStaked = positions.reduce((sum, pos) => sum + pos.amount, 0)
  const totalRewards = positions.reduce((sum, pos) => sum + pos.currentRewards, 0)
  const averageAPY = positions.length > 0 
    ? positions.reduce((sum, pos) => sum + pos.apy, 0) / positions.length 
    : 0

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount || parseFloat(stakeAmount) < selectedPool.minStake) {
      alert(`Minimum stake is ${formatCurrency(selectedPool?.minStake || 0)}`)
      return
    }

    setIsStaking(true)
    try {
      const amount = parseFloat(stakeAmount)
      const newPosition: StakingPosition = {
        id: (positions.length + 1).toString(),
        poolId: selectedPool.id,
        amount,
        startDate: new Date().toISOString().split('T')[0],
        endDate: selectedPool.lockPeriod > 0 
          ? new Date(Date.now() + selectedPool.lockPeriod * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        currentRewards: 0,
        totalRewards: 0,
        status: 'active',
        apy: selectedPool.apy
      }

      setPositions(prev => [...prev, newPosition])
      setPools(prev => prev.map(pool => 
        pool.id === selectedPool.id 
          ? { ...pool, yourStake: pool.yourStake + amount, totalStaked: pool.totalStaked + amount }
          : pool
      ))

      setStakeAmount('')
      alert(`Successfully staked ${formatCurrency(amount)} ${stakeCurrency} in ${selectedPool.name}!`)
      
    } catch (error) {
      console.error('Staking failed:', error)
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async (positionId: string) => {
    const position = positions.find(p => p.id === positionId)
    if (!position) return

    try {
      setPositions(prev => prev.filter(p => p.id !== positionId))
      setPools(prev => prev.map(pool => 
        pool.id === position.poolId 
          ? { ...pool, yourStake: Math.max(0, pool.yourStake - position.amount) }
          : pool
      ))

      alert(`Successfully unstaked ${formatCurrency(position.amount)} and claimed ${formatCurrency(position.currentRewards)} rewards!`)
      
    } catch (error) {
      console.error('Unstaking failed:', error)
    }
  }

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Stablecoin Staking
          </h1>
          <p className="text-muted-foreground mt-1">Earn yield on your stablecoins through secure DeFi protocols</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
            <Zap className="h-4 w-4 mr-2" />
            Start Staking
          </Button>
        </div>
      </div>

      {/* Staking Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Total Staked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalStaked)}</div>
            <p className="text-sm text-muted-foreground">Across all pools</p>
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
            <p className="text-sm text-muted-foreground">Earned rewards</p>
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
              <Award className="h-4 w-4 text-emerald-600" />
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.filter(p => p.status === 'active').length}</div>
            <p className="text-sm text-muted-foreground">Earning rewards</p>
          </CardContent>
        </Card>
      </div>

      {/* Staking Interface */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                Staking Pools
              </CardTitle>
              <CardDescription>
                Choose from various staking pools with different risk levels and rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pools">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pools">Available Pools</TabsTrigger>
                  <TabsTrigger value="positions">My Positions</TabsTrigger>
                </TabsList>

                <TabsContent value="pools" className="space-y-4 mt-6">
                  {pools.map((pool) => (
                    <div
                      key={pool.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedPool?.id === pool.id
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-200'
                      }`}
                      onClick={() => setSelectedPool(pool)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <span className="font-bold text-emerald-600">{pool.token}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{pool.name}</h3>
                            <p className="text-sm text-muted-foreground">{pool.protocol}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getRiskColor(pool.riskLevel)}>
                                {pool.riskLevel} Risk
                              </Badge>
                              {pool.lockPeriod > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {pool.lockPeriod} day lock
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">{pool.apy}%</div>
                          <div className="text-sm text-muted-foreground">APY</div>
                          <div className="text-xs text-muted-foreground">Min: {formatCurrency(pool.minStake)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Staked:</span>
                          <div className="font-medium">${formatLargeNumber(pool.totalStaked)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Your Stake:</span>
                          <div className="font-medium">{formatCurrency(pool.yourStake)}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {pool.features.map((feature, index) => (
                          <span key={index} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="positions" className="space-y-4 mt-6">
                  {positions.map((position) => {
                    const pool = pools.find(p => p.id === position.poolId)
                    return (
                      <div key={position.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                              <Lock className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{pool?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Staked: {formatCurrency(position.amount)} • APY: {position.apy}%
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={position.status === 'active' ? 'default' : 'secondary'}>
                                  {position.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">+{formatCurrency(position.currentRewards)}</div>
                            <div className="text-sm text-muted-foreground">Current rewards</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Start Date:</span>
                            <div className="font-medium">{position.startDate}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">End Date:</span>
                            <div className="font-medium">{position.endDate}</div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleUnstake(position.id)}
                        >
                          <Unlock className="h-4 w-4 mr-2" />
                          Unstake & Claim Rewards
                        </Button>
                      </div>
                    )
                  })}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Staking Sidebar */}
        <div className="space-y-4">
          {selectedPool && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stake in {selectedPool.name}</CardTitle>
                <CardDescription>
                  {selectedPool.apy}% APY • {selectedPool.riskLevel} Risk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stake Amount</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={`Min: ${formatCurrency(selectedPool.minStake)}`}
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={stakeCurrency} onValueChange={(value: StablecoinSymbol) => setStakeCurrency(value)}>
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

                {selectedPool.lockPeriod > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Lock Period</span>
                    </div>
                    <div className="text-xs text-yellow-600">
                      Funds will be locked for {selectedPool.lockPeriod} days
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Annual Rewards:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency((parseFloat(stakeAmount) || 0) * selectedPool.apy / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Rewards:</span>
                    <span className="font-medium">
                      {formatCurrency((parseFloat(stakeAmount) || 0) * selectedPool.apy / 100 / 365)}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  onClick={handleStake}
                  disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) < selectedPool.minStake}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isStaking ? 'Staking...' : `Stake ${stakeCurrency}`}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Staking Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Secure Protocols</div>
                  <div className="text-xs text-muted-foreground">Audited DeFi protocols</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Real-time Rewards</div>
                  <div className="text-xs text-muted-foreground">Compound continuously</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Stablecoin Yields</div>
                  <div className="text-xs text-muted-foreground">Earn on USDC/USDT</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Flexible Options</div>
                  <div className="text-xs text-muted-foreground">Various lock periods</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}