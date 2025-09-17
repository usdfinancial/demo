'use client'

import { useState } from 'react'
import { CreditCard, Building2, ArrowDownLeft, ArrowUpRight, DollarSign, Clock, Shield, Zap, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, getStablecoinIcon, StablecoinSymbol } from '@/lib/data'

interface PaymentMethod {
  id: string
  type: 'bank' | 'card' | 'wire'
  name: string
  last4?: string
  bank?: string
  fees: { buy: number; sell: number }
  limits: { daily: number; monthly: number }
  processingTime: string
  icon: any
}

const paymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'bank',
    name: 'Chase Bank Account',
    last4: '4523',
    bank: 'JPMorgan Chase',
    fees: { buy: 0.5, sell: 0.5 },
    limits: { daily: 25000, monthly: 100000 },
    processingTime: '1-2 business days',
    icon: Building2
  },
  {
    id: '2',
    type: 'card',
    name: 'Visa Debit Card',
    last4: '8901',
    fees: { buy: 2.5, sell: 0 },
    limits: { daily: 5000, monthly: 25000 },
    processingTime: 'Instant',
    icon: CreditCard
  },
  {
    id: '3',
    type: 'wire',
    name: 'Wire Transfer',
    fees: { buy: 15, sell: 25 },
    limits: { daily: 500000, monthly: 2000000 },
    processingTime: '1-3 business days',
    icon: Building2
  }
]

export default function FiatGatewayPage() {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [stablecoin, setStablecoin] = useState<StablecoinSymbol>('USDC')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(paymentMethods[0])
  const [currency, setCurrency] = useState('USD')

  const currentRate = 1.0001 // USD to stablecoin rate
  const stablecoinAmount = amount ? (parseFloat(amount) * currentRate).toFixed(2) : '0'
  const fiatAmount = amount ? (parseFloat(amount) / currentRate).toFixed(2) : '0'
  const fees = amount ? (parseFloat(amount) * selectedMethod.fees[activeTab] / 100) : 0
  const totalAmount = amount ? (parseFloat(amount) + fees) : 0

  const recentTransactions = [
    { id: '1', type: 'buy', amount: 1000, stablecoin: 'USDC' as StablecoinSymbol, date: '2024-01-20', status: 'completed' },
    { id: '2', type: 'sell', amount: 500, stablecoin: 'USDT' as StablecoinSymbol, date: '2024-01-18', status: 'completed' },
    { id: '3', type: 'buy', amount: 2500, stablecoin: 'USDC' as StablecoinSymbol, date: '2024-01-15', status: 'pending' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Fiat Gateway
          </h1>
          <p className="text-muted-foreground mt-1">Buy and sell stablecoins with traditional currency</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-green-600" />
              Total Bought
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(15420)}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-blue-600" />
              Total Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(3280)}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Available Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(selectedMethod.limits.daily)}</div>
            <p className="text-sm text-muted-foreground">Daily remaining</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Processing Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{selectedMethod.processingTime}</div>
            <p className="text-sm text-muted-foreground">Current method</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Trading Interface */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Buy & Sell Stablecoins</CardTitle>
              <CardDescription>
                Convert between fiat currency and stablecoins with competitive rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy" className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4" />
                    Buy Stablecoins
                  </TabsTrigger>
                  <TabsTrigger value="sell" className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Sell Stablecoins
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="buy" className="space-y-4 mt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">You Pay ({currency})</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">You Receive</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={stablecoinAmount}
                          readOnly
                          className="text-xl h-12 bg-muted"
                        />
                        <Select value={stablecoin} onValueChange={(value: StablecoinSymbol) => setStablecoin(value)}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USDC">USDC</SelectItem>
                            <SelectItem value="USDT">USDT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Exchange rate:</span>
                        <span className="font-medium">1 USD = {currentRate} {stablecoin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing fee ({selectedMethod.fees.buy}%):</span>
                        <span className="font-medium">{formatCurrency(fees)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Total amount:</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" 
                    disabled={!amount || parseFloat(amount) <= 0}
                  >
                    Buy {stablecoinAmount} {stablecoin}
                  </Button>
                </TabsContent>

                <TabsContent value="sell" className="space-y-4 mt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">You Sell</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="text-xl h-12"
                        />
                        <Select value={stablecoin} onValueChange={(value: StablecoinSymbol) => setStablecoin(value)}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USDC">USDC</SelectItem>
                            <SelectItem value="USDT">USDT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">You Receive ({currency})</label>
                      <Input
                        type="text"
                        value={fiatAmount}
                        readOnly
                        className="text-xl h-12 bg-muted"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Exchange rate:</span>
                        <span className="font-medium">1 {stablecoin} = {(1/currentRate).toFixed(4)} USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing fee ({selectedMethod.fees.sell}%):</span>
                        <span className="font-medium">{formatCurrency(fees)}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>You'll receive:</span>
                        <span>{formatCurrency(parseFloat(fiatAmount) - fees)}</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" 
                    disabled={!amount || parseFloat(amount) <= 0}
                  >
                    Sell {amount} {stablecoin}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Choose your preferred payment method
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <div
                    key={method.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedMethod.id === method.id
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-200'
                    }`}
                    onClick={() => setSelectedMethod(method)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-emerald-600" />
                      <div className="flex-1">
                        <div className="font-medium">{method.name}</div>
                        {method.last4 && (
                          <div className="text-sm text-muted-foreground">
                            •••• {method.last4}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {activeTab === 'buy' ? method.fees.buy : method.fees.sell}% fee • {method.processingTime}
                        </div>
                      </div>
                      {selectedMethod.id === method.id && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Why Choose Our Gateway?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Bank-grade Security</div>
                  <div className="text-xs text-muted-foreground">Your funds are protected</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Fast Processing</div>
                  <div className="text-xs text-muted-foreground">Most transactions are instant</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium">Competitive Rates</div>
                  <div className="text-xs text-muted-foreground">Low fees, great exchange rates</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Fiat Transactions</CardTitle>
          <CardDescription>
            Your recent buy and sell activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-emerald-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    {tx.type === 'buy' ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {tx.type === 'buy' ? 'Bought' : 'Sold'} {getStablecoinIcon(tx.stablecoin)} {tx.stablecoin}
                    </p>
                    <p className="text-sm text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${tx.type === 'buy' ? 'text-green-600' : 'text-blue-600'}`}>
                    {formatCurrency(tx.amount)}
                  </p>
                  <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}