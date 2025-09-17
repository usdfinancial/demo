'use client'

import { useState } from 'react'
import { TrendingUp, DollarSign, Zap, Shield, Target, BarChart3, ArrowRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, getStablecoinIcon, StablecoinSymbol } from '@/lib/data'

interface YieldProduct {
  id: string
  name: string
  protocol: string
  apy: number
  minDeposit: number
  maxDeposit: number
  riskLevel: 'Low' | 'Medium' | 'High'
  lockPeriod: string
  stablecoin: StablecoinSymbol
  tvl: number
  description: string
  features: string[]
}

const yieldProducts: YieldProduct[] = [
  {
    id: '1',
    name: 'USDC Savings Plus',
    protocol: 'Aave V3',
    apy: 4.2,
    minDeposit: 100,
    maxDeposit: 1000000,
    riskLevel: 'Low',
    lockPeriod: 'No lock',
    stablecoin: 'USDC',
    tvl: 150000000,
    description: 'Earn stable yield on your USDC with institutional-grade security',
    features: ['Compound interest', 'Instant withdrawal', 'Insurance coverage']
  },
  {
    id: '2',
    name: 'USDT High Yield',
    protocol: 'Compound',
    apy: 5.8,
    minDeposit: 500,
    maxDeposit: 500000,
    riskLevel: 'Medium',
    lockPeriod: '30 days',
    stablecoin: 'USDT',
    tvl: 85000000,
    description: 'Higher yields with 30-day commitment period',
    features: ['Higher APY', 'Monthly rewards', 'Early withdrawal (penalty)']
  },
  {
    id: '3',
    name: 'USDC Vault Strategy',
    protocol: 'Yearn Finance',
    apy: 7.5,
    minDeposit: 1000,
    maxDeposit: 250000,
    riskLevel: 'High',
    lockPeriod: '90 days',
    stablecoin: 'USDC',
    tvl: 45000000,
    description: 'Advanced yield strategies for experienced users',
    features: ['Auto-compounding', 'Strategy optimization', 'Higher risk/reward']
  }
]

export default function EarnInterestPage() {
  const [selectedProduct, setSelectedProduct] = useState<YieldProduct | null>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [selectedStablecoin, setSelectedStablecoin] = useState<StablecoinSymbol>('USDC')

  const currentBalance = selectedStablecoin === 'USDC' ? 25431.89 : 15200.00
  const estimatedEarnings = depositAmount ? (parseFloat(depositAmount) * (selectedProduct?.apy || 4.2) / 100 / 12) : 0

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Earn Interest
          </h1>
          <p className="text-muted-foreground mt-1">Grow your stablecoins with secure yield products</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
            <Plus className="h-4 w-4 mr-2" />
            Start Earning
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Total Earning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(8420.50)}</div>
            <p className="text-sm text-muted-foreground">Across all products</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Monthly Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(234.50)}</div>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Average APY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8%</div>
            <p className="text-sm text-muted-foreground">Weighted average</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              Active Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-sm text-muted-foreground">Yield products</p>
          </CardContent>
        </Card>
      </div>

      {/* Yield Products */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Available Yield Products
              </CardTitle>
              <CardDescription>
                Choose from our curated selection of secure yield opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {yieldProducts.map((product) => (
                <div 
                  key={product.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedProduct?.id === product.id 
                      ? 'border-emerald-300 bg-emerald-50' 
                      : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getStablecoinIcon(product.stablecoin)}</div>
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.protocol} • TVL: {formatCurrency(product.tvl)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getRiskColor(product.riskLevel)}>
                            {product.riskLevel} Risk
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {product.lockPeriod}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">{product.apy}%</div>
                      <div className="text-sm text-muted-foreground">APY</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {product.features.map((feature, index) => (
                      <span key={index} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Deposit Panel */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                Start Earning
              </CardTitle>
              <CardDescription>
                {selectedProduct ? `Deposit ${selectedProduct.stablecoin} into ${selectedProduct.name}` : 'Select a product to get started'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProduct ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deposit Amount</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="pr-16"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        {selectedProduct.stablecoin}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Available: {formatCurrency(currentBalance)}</span>
                      <button 
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={() => setDepositAmount(currentBalance.toString())}
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-emerald-700 mb-2">Earnings Estimate</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Monthly earnings:</span>
                        <span className="font-medium text-green-600">+{formatCurrency(estimatedEarnings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual earnings:</span>
                        <span className="font-medium text-green-600">+{formatCurrency(estimatedEarnings * 12)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>APY:</span>
                        <span className="font-medium">{selectedProduct.apy}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Minimum deposit:</span>
                      <span>{formatCurrency(selectedProduct.minDeposit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lock period:</span>
                      <span>{selectedProduct.lockPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk level:</span>
                      <span>{selectedProduct.riskLevel}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" 
                    disabled={!depositAmount || parseFloat(depositAmount) < selectedProduct.minDeposit}
                  >
                    Deposit & Start Earning
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Select a yield product to start earning interest on your stablecoins</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Secure & Insured</h3>
              <p className="text-sm text-muted-foreground">Your deposits are protected</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <Zap className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Instant Access</h3>
              <p className="text-sm text-muted-foreground">No waiting periods</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Compound Growth</h3>
              <p className="text-sm text-muted-foreground">Earnings automatically reinvested</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}