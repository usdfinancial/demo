'use client'

import React, { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { MockDataExtensions } from '@/lib/demo/mockDataExtensions'
import { demoCardService } from '@/lib/demo/demoServices'
import { StablecoinSymbol } from '@/lib/data'
import { CreditCard, Plus, Settings, Eye, EyeOff, Lock, Unlock, DollarSign, TrendingUp, Shield, Zap, Activity, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { NotificationModal } from '@/components/ui/NotificationModal'

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

interface DebitCard {
  id: string
  type: 'physical' | 'virtual'
  name: string
  last4: string
  expiryDate: string
  status: 'active' | 'locked' | 'expired'
  balance: number
  currency: StablecoinSymbol
  monthlySpend: number
  limits: {
    daily: number
    monthly: number
    atm: number
  }
  features: string[]
}

const userCards: DebitCard[] = [
  {
    id: '1',
    type: 'physical',
    name: 'USD Financial Visa',
    last4: '4523',
    expiryDate: '12/27',
    status: 'active',
    balance: 2500.00,
    currency: 'USDC',
    monthlySpend: 1850.25,
    limits: { daily: 5000, monthly: 25000, atm: 1000 },
    features: ['Contactless', '1% Cashback', 'Global ATM', 'Real-time notifications']
  },
  {
    id: '2',
    type: 'virtual',
    name: 'Virtual Card - Online',
    last4: '8901',
    expiryDate: '06/26',
    status: 'active',
    balance: 500.00,
    currency: 'USDC',
    monthlySpend: 234.50,
    limits: { daily: 1000, monthly: 5000, atm: 0 },
    features: ['Online only', 'Instant creation', 'Disposable', 'Merchant controls']
  }
]

export default function CardsPage() {
  const [showBalance, setShowBalance] = useState(false)
  const [selectedCard, setSelectedCard] = useState<DebitCard>(userCards[0])
  const [cards, setCards] = useState<DebitCard[]>(userCards)
  const [isLoading, setIsLoading] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)

  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0)
  const totalSpend = cards.reduce((sum, card) => sum + card.monthlySpend, 0)

  const handleLockCard = async (cardId: string) => {
    setIsLoading(true)
    try {
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, status: card.status === 'active' ? 'locked' : 'active' } : card
      ))
    } catch (error) {
      console.error('Failed to toggle card status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFunds = (cardId: string) => {
    // Navigate to add funds functionality
    console.log('Add funds to card:', cardId)
  }

  const handleOrderCard = () => {
    console.log('Demo: Card ordering initiated')
    setShowOrderModal(true)
  }

  const handleCardSettings = () => {
    // Navigate to card controls
    window.location.href = '/cards/controls'
  }

  const handleAdjustLimits = () => {
    // Navigate to card controls with limits tab
    window.location.href = '/cards/controls'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'locked': return 'bg-red-100 text-red-800 border-red-200'
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Stablecoin Cards
          </h1>
          <p className="text-muted-foreground mt-1">Spend your stablecoins anywhere with our debit cards</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            onClick={handleOrderCard}
          >
            <Plus className="h-4 w-4 mr-2" />
            Order Card
          </Button>
          <Button 
            variant="outline" 
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            onClick={handleCardSettings}
          >
            <Settings className="h-4 w-4 mr-2" />
            Card Settings
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalBalance)}</div>
            <p className="text-sm text-muted-foreground">Across all cards</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Monthly Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Active Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cards.filter(c => c.status === 'active').length}</div>
            <p className="text-sm text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Cashback Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(18.50)}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Card Management */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Your Cards
              </CardTitle>
              <CardDescription>
                Manage your physical and virtual stablecoin debit cards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cards">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cards">My Cards</TabsTrigger>
                  <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="cards" className="space-y-4 mt-6">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedCard.id === card.id
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-200'
                      }`}
                      onClick={() => setSelectedCard(card)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{card.name}</h3>
                            <p className="text-sm text-muted-foreground">•••• •••• •••• {card.last4}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getStatusColor(card.status)}>
                                {card.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {card.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {showBalance ? formatCurrency(card.balance) : '••••'}
                          </div>
                          <div className="text-sm text-muted-foreground">{card.currency}</div>
                          <div className="text-xs text-muted-foreground">Exp: {card.expiryDate}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 border-2 border-dashed border-emerald-200 rounded-lg text-center">
                    <CreditCard className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Need another card?</p>
                    <p className="text-xs text-muted-foreground mb-3">Order physical or create virtual cards instantly</p>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500"
                      onClick={handleOrderCard}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Order Card
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="mt-6">
                  <div className="space-y-3">
                    {[
                      { id: '1', merchant: 'Amazon', amount: 89.99, date: '2024-01-20', category: 'Shopping', card: '4523' },
                      { id: '2', merchant: 'Starbucks', amount: 4.75, date: '2024-01-20', category: 'Food', card: '4523' },
                      { id: '3', merchant: 'Uber', amount: 23.50, date: '2024-01-19', category: 'Transport', card: '8901' },
                      { id: '4', merchant: 'Netflix', amount: 15.99, date: '2024-01-18', category: 'Entertainment', card: '8901' }
                    ].map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-emerald-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="font-medium">{tx.merchant}</div>
                            <div className="text-sm text-muted-foreground">•••• {tx.card} • {tx.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(tx.amount)}</div>
                          <div className="text-xs text-muted-foreground">{tx.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Card Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-600" />
                Card Controls
              </CardTitle>
              <CardDescription>
                {selectedCard.name} (•••• {selectedCard.last4})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Show Balance</div>
                  <div className="text-sm text-muted-foreground">Display card balances</div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Card Status</div>
                  <div className="text-sm text-muted-foreground">Lock/unlock card</div>
                </div>
                <Button 
                  size="sm" 
                  variant={selectedCard.status === 'active' ? 'destructive' : 'default'}
                  className={selectedCard.status === 'active' ? '' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}
                  onClick={() => handleLockCard(selectedCard.id)}
                  disabled={isLoading}
                >
                  {selectedCard.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  {selectedCard.status === 'active' ? 'Lock' : 'Unlock'}
                </Button>
              </div>

              <div className="pt-2 border-t">
                <h4 className="font-medium mb-3">Spending Limits</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Daily limit:</span>
                    <span className="font-medium">{formatCurrency(selectedCard.limits.daily)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly limit:</span>
                    <span className="font-medium">{formatCurrency(selectedCard.limits.monthly)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ATM daily:</span>
                    <span className="font-medium">{formatCurrency(selectedCard.limits.atm)}</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={handleAdjustLimits}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Adjust Limits
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Card Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedCard.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium">{feature}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Card Benefits */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Instant Spending</h3>
              <p className="text-sm text-muted-foreground">Use your stablecoins anywhere</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Cashback Rewards</h3>
              <p className="text-sm text-muted-foreground">Earn 1% back on all purchases</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Global Acceptance</h3>
              <p className="text-sm text-muted-foreground">Works worldwide with Visa network</p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      {/* Order Card Modal */}
      <NotificationModal
        open={showOrderModal}
        onOpenChange={setShowOrderModal}
        type="success"
        title="Card Order Initiated"
        message="Your new card order has been successfully started"
        details={[
          "Card Type: Physical or Virtual (your choice)",
          "Processing Time: 2-3 business days for virtual, 5-7 days for physical",
          "Shipping: Free worldwide delivery",
          "Activation: Instant via mobile app",
          "Features: Contactless payments, global acceptance, real-time controls"
        ]}
        actionLabel="View Card Options"
        onAction={() => {
          setShowOrderModal(false)
          window.location.href = '/cards/physical'
        }}
        showCopy={true}
        copyText={`Card Order: New USD Financial Card | ${new Date().toISOString()}`}
      />
    </AuthGuard>
  )
}