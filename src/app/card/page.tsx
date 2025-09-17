'use client'

import { useState, useEffect } from 'react'
import { Settings, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VirtualCard } from '@/components/card/VirtualCard'
import { SpendingChart } from '@/components/card/SpendingChart'
import { TransactionHistory } from '@/components/shared/TransactionHistory'
import { formatCurrency, mockStablecoinTransactions, getStablecoinIcon, getTransactionTypeIcon } from '@/lib/data'
import { summarizeSpending } from '@/lib/ai-client'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'

export default function CardPage() {
  const { totalUSDC, multiChainBalances, smartAccountBalance } = useEnhancedAuth()
  const [aiSummary, setAiSummary] = useState<string>('Loading AI insights...')
  const [isLoadingAI, setIsLoadingAI] = useState(true)

  // Calculate actual balances from real data
  const getActualBalance = () => {
    return parseFloat(totalUSDC || '0') || parseFloat(smartAccountBalance || '0') || 0
  }

  const actualTotalBalance = getActualBalance()
  const actualUSDCBalance = parseFloat(totalUSDC || '0') || 0
  const actualUSDTBalance = 0 // For now, showing 0 as we primarily use USDC
  
  // Calculate realistic daily spending based on balance (small percentage)
  const dailySpendingAmount = Math.min(actualTotalBalance * 0.02, 500) // Max 2% or $500, whichever is lower

  useEffect(() => {
    const generateAISummary = async () => {
      try {
        // Create spending data from stablecoin transactions
        const spendTransactions = mockStablecoinTransactions.filter(tx => tx.type === 'spend')
        const totalSpent = spendTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)
        
        const spendingByCategory = spendTransactions.reduce((acc, tx) => {
          const category = tx.description.includes('Amazon') ? 'Online Shopping' : 
                          tx.description.includes('Coffee') ? 'Food & Dining' :
                          tx.description.includes('Gas') ? 'Transportation' : 'Other'
          acc[category] = (acc[category] || 0) + Math.abs(tx.amount)
          return acc
        }, {} as Record<string, number>)

        const mockSpendingData = Object.entries(spendingByCategory).map(([category, amount]) => ({
          category,
          amount
        }))

        const result = await summarizeSpending({ 
          spendingData: JSON.stringify(mockSpendingData) 
        })
        setAiSummary(result.summary)
      } catch (error) {
        setAiSummary('Your stablecoin spending shows excellent financial discipline. Most transactions are essential purchases with minimal fees thanks to stablecoin efficiency.')
      } finally {
        setIsLoadingAI(false)
      }
    }

    generateAISummary()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Stablecoin Debit Card
          </h1>
          <p className="text-muted-foreground mt-1">Spend your stablecoins anywhere Visa is accepted</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
            <Settings className="h-4 w-4 mr-2" />
            Card Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Stablecoin Debit Card */}
        <div className="lg:col-span-1">
          <VirtualCard 
            className="group hover:scale-105 transition-transform duration-300" 
            balance={actualTotalBalance}
            primaryStablecoin="USDC"
          />
          
          {/* Card Actions */}
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                <Lock className="h-4 w-4 mr-2" />
                Freeze Card
              </Button>
              <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                <Eye className="h-4 w-4 mr-2" />
                Show PIN
              </Button>
            </div>
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" size="sm">
              Add Stablecoins
            </Button>
          </div>
        </div>

        {/* Stablecoin Card Features */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stablecoin Balance Overview */}
          <Card className="border-emerald-200">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">UF</span>
                </div>
                Stablecoin Balances
              </CardTitle>
              <CardDescription>
                Your available stablecoin balances for card spending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-2xl mb-1">🔵</div>
                  <div className="text-sm font-medium text-emerald-600">USDC</div>
                  <div className="text-lg font-bold">{formatCurrency(actualUSDCBalance)}</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-2xl mb-1">🟢</div>
                  <div className="text-sm font-medium text-emerald-600">USDT</div>
                  <div className="text-lg font-bold">{formatCurrency(actualUSDTBalance)}</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-2xl mb-1">🔒</div>
                  <div className="text-sm font-medium text-emerald-600">Total</div>
                  <div className="text-lg font-bold">{formatCurrency(actualTotalBalance)}</div>
                </div>
              </div>
              <div className={`text-sm text-muted-foreground leading-relaxed p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg ${isLoadingAI ? 'animate-pulse' : ''}`}>
                <div className="font-medium text-emerald-700 mb-2">💡 Stablecoin Spending Insights</div>
                {aiSummary}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                  ⚡ Instant settlements
                </div>
                <div className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">
                  💰 Zero forex fees
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                  🌍 Global acceptance
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stablecoin Card Benefits */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-emerald-600">⚡</span>
                  Daily Spending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(dailySpendingAmount)}</div>
                <p className="text-sm text-muted-foreground">Available for spending today</p>
                <div className="mt-2 w-full bg-emerald-100 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
                <p className="text-xs text-emerald-600 mt-1">No daily limits • Spend freely</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-emerald-600">🔒</span>
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time notifications</span>
                    <span className="text-emerald-600 text-xs font-medium">✓ ON</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Biometric security</span>
                    <span className="text-emerald-600 text-xs font-medium">✓ ON</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto-freeze suspicious</span>
                    <span className="text-emerald-600 text-xs font-medium">✓ ON</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stablecoin-only mode</span>
                    <span className="text-emerald-600 text-xs font-medium">✓ ON</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Spending Analytics */}
      <SpendingChart />

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  )
}