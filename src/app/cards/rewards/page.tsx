'use client'

import { useState } from 'react'
import { Gift, TrendingUp, Star, DollarSign, Trophy, Target, ArrowRight, Calendar, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, StablecoinSymbol } from '@/lib/data'

interface RewardCategory {
  name: string
  rate: number
  icon: any
  examples: string[]
  color: string
}

interface RewardTransaction {
  id: string
  merchant: string
  amount: number
  cashback: number
  category: string
  date: string
  rate: number
}

interface RewardTier {
  name: string
  minSpend: number
  benefits: string[]
  cashbackBonus: number
  color: string
}

const rewardCategories: RewardCategory[] = [
  {
    name: 'Dining',
    rate: 3.0,
    icon: '🍽️',
    examples: ['Restaurants', 'Food delivery', 'Coffee shops'],
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  {
    name: 'Online Shopping',
    rate: 2.0,
    icon: '🛒',
    examples: ['E-commerce', 'Digital goods', 'Subscriptions'],
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    name: 'Travel',
    rate: 2.5,
    icon: '✈️',
    examples: ['Airlines', 'Hotels', 'Car rentals'],
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    name: 'Everything Else',
    rate: 1.0,
    icon: '💳',
    examples: ['All other purchases'],
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  }
]

const rewardTiers: RewardTier[] = [
  {
    name: 'Silver',
    minSpend: 0,
    benefits: ['1% base cashback', 'Monthly statements', 'Basic support'],
    cashbackBonus: 0,
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  {
    name: 'Gold',
    minSpend: 2500,
    benefits: ['1.5% base cashback', 'Priority support', 'No foreign fees', 'Travel insurance'],
    cashbackBonus: 0.5,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  {
    name: 'Platinum',
    minSpend: 10000,
    benefits: ['2% base cashback', 'Concierge service', 'Airport lounge access', 'Extended warranty'],
    cashbackBonus: 1.0,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  }
]

const recentCashback: RewardTransaction[] = [
  {
    id: '1',
    merchant: 'Amazon',
    amount: 89.99,
    cashback: 1.80,
    category: 'Online Shopping',
    date: '2024-01-20',
    rate: 2.0
  },
  {
    id: '2',
    merchant: 'Starbucks',
    amount: 4.75,
    cashback: 0.14,
    category: 'Dining',
    date: '2024-01-20',
    rate: 3.0
  },
  {
    id: '3',
    merchant: 'United Airlines',
    amount: 450.00,
    cashback: 11.25,
    category: 'Travel',
    date: '2024-01-19',
    rate: 2.5
  },
  {
    id: '4',
    merchant: 'Target',
    amount: 67.50,
    cashback: 0.68,
    category: 'Everything Else',
    date: '2024-01-18',
    rate: 1.0
  }
]

export default function RewardsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [isRedeeming, setIsRedeeming] = useState(false)
  
  const totalCashback = recentCashback.reduce((sum, tx) => sum + tx.cashback, 0)
  const totalSpent = recentCashback.reduce((sum, tx) => sum + tx.amount, 0)
  const averageRate = totalSpent > 0 ? (totalCashback / totalSpent) * 100 : 0
  
  const currentTier = rewardTiers.find((tier, index) => {
    const nextTier = rewardTiers[index + 1]
    return totalSpent >= tier.minSpend && (!nextTier || totalSpent < nextTier.minSpend)
  }) || rewardTiers[0]

  const nextTier = rewardTiers.find(tier => tier.minSpend > totalSpent)
  const tierProgress = nextTier ? ((totalSpent - currentTier.minSpend) / (nextTier.minSpend - currentTier.minSpend)) * 100 : 100

  const handleRedeemRewards = async (type: string) => {
    setIsRedeeming(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert(`${type} redemption would be processed here`)
    } catch (error) {
      console.error('Redemption failed:', error)
    } finally {
      setIsRedeeming(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Rewards & Cashback
          </h1>
          <p className="text-muted-foreground mt-1">Earn cashback on every purchase with your stablecoin cards</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            onClick={() => handleRedeemRewards('General')}
            disabled={isRedeeming}
          >
            <Gift className="h-4 w-4 mr-2" />
            {isRedeeming ? 'Processing...' : 'Redeem Rewards'}
          </Button>
        </div>
      </div>

      {/* Rewards Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(125.84)}</div>
            <p className="text-sm text-muted-foreground">All time cashback</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalCashback)}</div>
            <p className="text-sm text-muted-foreground">+{formatCurrency(totalCashback - 8.45)} vs last month</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              Average Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Effective cashback rate</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-emerald-600" />
              Current Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentTier.name}</div>
            <p className="text-sm text-muted-foreground">Reward tier status</p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      {nextTier && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-emerald-600" />
              Tier Progress
            </CardTitle>
            <CardDescription>
              Keep spending to unlock higher reward rates and exclusive benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Progress to {nextTier.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(totalSpent)} of {formatCurrency(nextTier.minSpend)} required
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{tierProgress.toFixed(0)}%</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(nextTier.minSpend - totalSpent)} to go
                  </div>
                </div>
              </div>
              <Progress value={tierProgress} className="h-2" />
              <div className="grid gap-3 md:grid-cols-3">
                {rewardTiers.map((tier) => (
                  <div key={tier.name} className="text-center">
                    <Badge className={`${tier.color} mb-2`}>
                      {tier.name}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(tier.minSpend)}+ spend
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-600" />
                Cashback Categories
              </CardTitle>
              <CardDescription>
                Earn different rates based on your spending categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="categories">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="categories">Earning Rates</TabsTrigger>
                  <TabsTrigger value="history">Recent Cashback</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-4 mt-6">
                  {rewardCategories.map((category) => (
                    <div key={category.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{category.icon}</div>
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {category.examples.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-emerald-600">{category.rate}%</div>
                          <div className="text-sm text-muted-foreground">Cashback</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-emerald-700 mb-2">Bonus Categories This Quarter</h4>
                    <div className="space-y-1 text-sm text-emerald-600">
                      <div>🎬 Streaming Services: 5% cashback (limited time)</div>
                      <div>⛽ Gas Stations: 4% cashback (through March)</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <div className="space-y-3">
                    {recentCashback.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-emerald-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-medium">{tx.merchant}</div>
                            <div className="text-sm text-muted-foreground">{tx.category} • {tx.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">+{formatCurrency(tx.cashback)}</div>
                          <div className="text-xs text-muted-foreground">{tx.rate}% of {formatCurrency(tx.amount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Rewards Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-600" />
                Current Tier Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentTier.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-600" />
                  <div className="text-sm">{benefit}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Redeem Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm"
                onClick={() => handleRedeemRewards('Statement Credit')}
                disabled={isRedeeming}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Statement Credit
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm"
                onClick={() => handleRedeemRewards('Transfer to Wallet')}
                disabled={isRedeeming}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Transfer to Wallet
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm"
                onClick={() => handleRedeemRewards('Gift Cards')}
                disabled={isRedeeming}
              >
                <Gift className="h-4 w-4 mr-2" />
                Gift Cards
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-sm"
                onClick={() => handleRedeemRewards('Merchant Credits')}
                disabled={isRedeeming}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Merchant Credits
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Special Offers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm font-medium text-yellow-800">Limited Time</div>
                <div className="text-xs text-yellow-600">5% cashback on streaming services through February</div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Referral Bonus</div>
                <div className="text-xs text-blue-600">Earn $25 for each friend you refer</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Monthly Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Monthly Rewards Goal
          </CardTitle>
          <CardDescription>
            Track your progress towards your monthly cashback target
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCashback)}</div>
              <div className="text-sm text-muted-foreground">Earned This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(25.00)}</div>
              <div className="text-sm text-muted-foreground">Monthly Goal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(25.00 - totalCashback)}</div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>
          <Progress value={(totalCashback / 25.00) * 100} className="mt-4 h-2" />
          <div className="text-sm text-muted-foreground text-center mt-2">
            {((totalCashback / 25.00) * 100).toFixed(0)}% complete
          </div>
        </CardContent>
      </Card>
    </div>
  )
}