'use client'

import { useState } from 'react'
import { Zap, Target, Calendar, DollarSign, Plus, Settings, TrendingUp, Pause, Play, BarChart3, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'

interface AutoInvestPlan {
  id: string
  name: string
  amount: number
  frequency: 'weekly' | 'monthly' | 'quarterly'
  nextInvestment: string
  totalInvested: number
  currentValue: number
  returns: number
  returnsPercent: number
  isActive: boolean
  strategy: string
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive'
  allocation: { asset: string; percentage: number; color: string }[]
  currency: StablecoinSymbol
}

interface InvestmentStrategy {
  id: string
  name: string
  description: string
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive'
  expectedAPY: number
  minAmount: number
  allocation: { asset: string; percentage: number }[]
  features: string[]
}

const existingPlans: AutoInvestPlan[] = [
  {
    id: '1',
    name: 'Conservative Growth',
    amount: 500,
    frequency: 'monthly',
    nextInvestment: '2024-02-01',
    totalInvested: 6000,
    currentValue: 6420,
    returns: 420,
    returnsPercent: 7.0,
    isActive: true,
    strategy: 'Conservative Portfolio',
    riskLevel: 'Conservative',
    allocation: [
      { asset: 'US Treasury Bills', percentage: 60, color: 'bg-blue-500' },
      { asset: 'Corporate Bonds', percentage: 30, color: 'bg-green-500' },
      { asset: 'Gold', percentage: 10, color: 'bg-yellow-500' }
    ],
    currency: 'USDC'
  },
  {
    id: '2',
    name: 'Tech Growth Fund',
    amount: 250,
    frequency: 'weekly',
    nextInvestment: '2024-01-25',
    totalInvested: 3250,
    currentValue: 3580,
    returns: 330,
    returnsPercent: 10.2,
    isActive: true,
    strategy: 'Aggressive Growth',
    riskLevel: 'Aggressive',
    allocation: [
      { asset: 'Tech Index', percentage: 70, color: 'bg-purple-500' },
      { asset: 'Real Estate', percentage: 20, color: 'bg-orange-500' },
      { asset: 'Corporate Bonds', percentage: 10, color: 'bg-green-500' }
    ],
    currency: 'USDT'
  }
]

const investmentStrategies: InvestmentStrategy[] = [
  {
    id: '1',
    name: 'Conservative Portfolio',
    description: 'Low-risk strategy focused on capital preservation with steady returns',
    riskLevel: 'Conservative',
    expectedAPY: 5.5,
    minAmount: 100,
    allocation: [
      { asset: 'US Treasury Bills', percentage: 60 },
      { asset: 'Corporate Bonds', percentage: 30 },
      { asset: 'Gold', percentage: 10 }
    ],
    features: ['Capital preservation', 'Steady income', 'Low volatility', 'Government backing']
  },
  {
    id: '2',
    name: 'Balanced Growth',
    description: 'Moderate risk strategy balancing growth potential with stability',
    riskLevel: 'Moderate',
    expectedAPY: 8.2,
    minAmount: 200,
    allocation: [
      { asset: 'Real Estate', percentage: 40 },
      { asset: 'Corporate Bonds', percentage: 30 },
      { asset: 'Tech Index', percentage: 20 },
      { asset: 'Gold', percentage: 10 }
    ],
    features: ['Balanced approach', 'Diversification', 'Growth potential', 'Risk management']
  },
  {
    id: '3',
    name: 'Aggressive Growth',
    description: 'Higher risk strategy targeting maximum long-term growth',
    riskLevel: 'Aggressive',
    expectedAPY: 12.8,
    minAmount: 500,
    allocation: [
      { asset: 'Tech Index', percentage: 50 },
      { asset: 'Real Estate', percentage: 25 },
      { asset: 'Renewable Energy', percentage: 15 },
      { asset: 'Corporate Bonds', percentage: 10 }
    ],
    features: ['High growth potential', 'Tech exposure', 'Long-term focus', 'Higher volatility']
  }
]

export default function AutoInvestPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<InvestmentStrategy | null>(null)
  const [plans, setPlans] = useState<AutoInvestPlan[]>(existingPlans)
  const [newPlan, setNewPlan] = useState({
    amount: '',
    frequency: 'monthly',
    strategy: '',
    currency: 'USDC' as StablecoinSymbol
  })
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const totalInvested = plans.reduce((sum, plan) => sum + plan.totalInvested, 0)
  const totalCurrentValue = plans.reduce((sum, plan) => sum + plan.currentValue, 0)
  const totalReturns = totalCurrentValue - totalInvested
  const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0

  const handleCreatePlan = async () => {
    if (!newPlan.amount || !newPlan.strategy) return
    
    const strategy = investmentStrategies.find(s => s.id === newPlan.strategy)
    if (!strategy) return

    setIsCreating(true)
    try {
      const newAutoPlan: AutoInvestPlan = {
        id: (plans.length + 1).toString(),
        name: `${strategy.name} Plan`,
        amount: parseFloat(newPlan.amount),
        frequency: newPlan.frequency as 'weekly' | 'monthly' | 'quarterly',
        nextInvestment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalInvested: 0,
        currentValue: 0,
        returns: 0,
        returnsPercent: 0,
        isActive: true,
        strategy: strategy.name,
        riskLevel: strategy.riskLevel,
        allocation: strategy.allocation.map((alloc, index) => ({
          asset: alloc.asset,
          percentage: alloc.percentage,
          color: ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'][index % 4]
        })),
        currency: newPlan.currency
      }

      setPlans(prev => [...prev, newAutoPlan])
      setNewPlan({ amount: '', frequency: 'monthly', strategy: '', currency: 'USDC' })
      setSelectedStrategy(null)
      
    } catch (error) {
      console.error('Failed to create plan:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleTogglePlan = async (planId: string) => {
    setIsUpdating(true)
    try {
      setPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, isActive: !plan.isActive } : plan
      ))
    } catch (error) {
      console.error('Failed to toggle plan:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCreateNewPlan = () => {
    document.getElementById('create-tab')?.click()
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Conservative': return 'bg-green-100 text-green-800 border-green-200'
      case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Aggressive': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      case 'quarterly': return 'Quarterly'
      default: return frequency
    }
  }

  const calculateAnnualInvestment = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'weekly': return amount * 52
      case 'monthly': return amount * 12
      case 'quarterly': return amount * 4
      default: return amount * 12
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Auto-Invest
          </h1>
          <p className="text-muted-foreground mt-1">Automate your investments with dollar-cost averaging</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            onClick={handleCreateNewPlan}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Plan
          </Button>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalInvested)}</div>
            <p className="text-sm text-muted-foreground">All auto-invest plans</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Current Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div>
            <p className="text-sm text-muted-foreground">Portfolio value</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
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
              <Target className="h-4 w-4 text-emerald-600" />
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.filter(p => p.isActive).length}</div>
            <p className="text-sm text-muted-foreground">Running automatically</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Invest Management */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                Auto-Invest Plans
              </CardTitle>
              <CardDescription>
                Manage your automated investment strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="plans">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="plans">My Plans</TabsTrigger>
                  <TabsTrigger value="create" id="create-tab">Create New</TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="space-y-4 mt-6">
                  {plans.map((plan) => (
                    <div key={plan.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            {plan.isActive ? <Play className="h-6 w-6 text-emerald-600" /> : <Pause className="h-6 w-6 text-gray-400" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{plan.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(plan.amount)} {getFrequencyLabel(plan.frequency).toLowerCase()} • {plan.currency}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getRiskColor(plan.riskLevel)}>
                                {plan.riskLevel}
                              </Badge>
                              <Badge variant={plan.isActive ? "default" : "secondary"}>
                                {plan.isActive ? "Active" : "Paused"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(plan.currentValue)}</div>
                          <div className="text-sm text-green-600">+{formatCurrency(plan.returns)}</div>
                          <div className="text-xs text-muted-foreground">Next: {plan.nextInvestment}</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Allocation:</span>
                        </div>
                        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                          {plan.allocation.map((alloc, index) => (
                            <div
                              key={index}
                              className={alloc.color}
                              style={{ width: `${alloc.percentage}%` }}
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {plan.allocation.map((alloc, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded ${alloc.color}`} />
                              <span>{alloc.asset}: {alloc.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="text-sm text-muted-foreground">
                          Returns: {plan.returnsPercent.toFixed(1)}% • Total Invested: {formatCurrency(plan.totalInvested)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => alert(`Settings for ${plan.name} would open here`)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleTogglePlan(plan.id)}
                            disabled={isUpdating}
                          >
                            {plan.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="create" className="space-y-6 mt-6">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Investment Amount</label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={newPlan.amount}
                          onChange={(e) => setNewPlan({...newPlan, amount: e.target.value})}
                          className="text-lg h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Frequency</label>
                        <Select value={newPlan.frequency} onValueChange={(value) => setNewPlan({...newPlan, frequency: value})}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Currency</label>
                        <Select value={newPlan.currency} onValueChange={(value: StablecoinSymbol) => setNewPlan({...newPlan, currency: value})}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USDC">USDC</SelectItem>
                            <SelectItem value="USDT">USDT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Strategy</label>
                        <Select value={newPlan.strategy} onValueChange={(value) => {
                          setNewPlan({...newPlan, strategy: value})
                          setSelectedStrategy(investmentStrategies.find(s => s.id === value) || null)
                        }}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Choose strategy" />
                          </SelectTrigger>
                          <SelectContent>
                            {investmentStrategies.map((strategy) => (
                              <SelectItem key={strategy.id} value={strategy.id}>
                                {strategy.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {selectedStrategy && (
                      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                        <h4 className="font-semibold text-emerald-700 mb-3">Investment Plan Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Investment amount:</span>
                            <span className="font-medium">{formatCurrency(parseFloat(newPlan.amount) || 0)} {newPlan.frequency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Annual investment:</span>
                            <span className="font-medium">{formatCurrency(calculateAnnualInvestment(parseFloat(newPlan.amount) || 0, newPlan.frequency))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expected APY:</span>
                            <span className="font-medium text-green-600">{selectedStrategy.expectedAPY}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Risk level:</span>
                            <span className="font-medium">{selectedStrategy.riskLevel}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      disabled={!newPlan.amount || !newPlan.strategy || isCreating}
                      onClick={handleCreatePlan}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {isCreating ? 'Creating Plan...' : 'Create Auto-Invest Plan'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Investment Strategies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {investmentStrategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedStrategy?.id === strategy.id
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-200'
                  }`}
                  onClick={() => setSelectedStrategy(strategy)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{strategy.name}</div>
                    <Badge className={`${getRiskColor(strategy.riskLevel)} text-xs`}>
                      {strategy.riskLevel}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">{strategy.description}</div>
                  <div className="flex justify-between text-xs">
                    <span>Expected APY:</span>
                    <span className="font-medium text-green-600">{strategy.expectedAPY}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auto-Invest Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Dollar-Cost Averaging</div>
                  <div className="text-xs text-muted-foreground">Reduce market timing risk</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Automated Investing</div>
                  <div className="text-xs text-muted-foreground">Set it and forget it</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Disciplined Approach</div>
                  <div className="text-xs text-muted-foreground">Remove emotional decisions</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Goal-Based Investing</div>
                  <div className="text-xs text-muted-foreground">Build wealth systematically</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedStrategy && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Strategy Allocation</CardTitle>
                <CardDescription>
                  {selectedStrategy.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedStrategy.allocation.map((alloc, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{alloc.asset}:</span>
                      <span className="font-medium">{alloc.percentage}%</span>
                    </div>
                    <Progress value={alloc.percentage} className="h-2" />
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Min Investment: {formatCurrency(selectedStrategy.minAmount)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}