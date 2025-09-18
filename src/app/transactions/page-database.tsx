'use client'

import { useState, useEffect } from 'react'
import { Send, Download, Plus, Filter, Loader2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionHistoryDatabase } from '@/components/shared/TransactionHistoryDatabase'
import { useAuth } from '@/hooks/useAuth'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { formatCurrency } from '@/lib/data'

interface TransactionSummary {
  totalSpent: number
  totalIncome: number
  averageTransaction: number
  largestExpense: number
  largestExpenseCategory: string
  transactionCount: number
  monthlySpent: number
  monthlyIncome: number
}

export default function TransactionsPageDatabase() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load transaction summary from API
  useEffect(() => {
    const loadSummary = async () => {
      if (!user?.address) return
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/transactions?userId=${user.address}&action=summary`)
        if (!response.ok) {
          throw new Error('Failed to load transaction summary')
        }
        
        const data = await response.json()
        
        // Transform API data to component format with fallback values
        const summaryData: TransactionSummary = {
          totalSpent: parseFloat(data.totalSpent || '0'),
          totalIncome: parseFloat(data.totalIncome || '0'),
          averageTransaction: parseFloat(data.averageTransaction || '0'),
          largestExpense: parseFloat(data.largestExpense || '0'),
          largestExpenseCategory: data.largestExpenseCategory || 'N/A',
          transactionCount: parseInt(data.transactionCount || '0'),
          monthlySpent: parseFloat(data.monthlySpent || data.totalSpent || '0'),
          monthlyIncome: parseFloat(data.monthlyIncome || data.totalIncome || '0')
        }
        
        setSummary(summaryData)
      } catch (err) {
        console.error('Error loading transaction summary:', err)
        setError(err instanceof Error ? err.message : 'Failed to load transaction summary')
        
        // Set fallback values on error
        setSummary({
          totalSpent: 0,
          totalIncome: 0,
          averageTransaction: 0,
          largestExpense: 0,
          largestExpenseCategory: 'N/A',
          transactionCount: 0,
          monthlySpent: 0,
          monthlyIncome: 0
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadSummary()
  }, [user?.address])

  const handleSendStablecoins = () => {
    // Redirect to send functionality
    window.location.href = '/accounts/send'
  }

  const handleAddStablecoins = () => {
    // Redirect to deposit/bridge functionality
    window.location.href = '/accounts/wallet'
  }

  const handleEarnYield = () => {
    // Redirect to investment pages
    window.location.href = '/invest/defi'
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
              <p className="text-slate-600">Loading your transaction history...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Stablecoin Transactions
            </h1>
            <p className="text-muted-foreground mt-1">
              {summary && summary.transactionCount > 0 
                ? `Complete history of your ${summary.transactionCount} stablecoin transactions`
                : 'Complete history of your stablecoin activity'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={() => {
                const message = `Advanced Transaction Filters:\n\n` +
                  `Stablecoin Transaction Analysis:\n` +
                  `• Filter by stablecoin type (USDC, USDT)\n` +
                  `• Date range selection (custom periods)\n` +
                  `• Transaction amount ranges\n` +
                  `• Transaction types (send, receive, yield, swap)\n` +
                  `• Network/chain filtering (Ethereum, Polygon, etc.)\n\n` +
                  `Advanced Filters:\n` +
                  `• Merchant/counterparty filtering\n` +
                  `• Gas fee analysis and optimization\n` +
                  `• Yield farming transaction isolation\n` +
                  `• Cross-chain bridge transaction tracking\n` +
                  `• Smart contract interaction analysis\n\n` +
                  `USD Financial's filtering system helps you analyze your ` +
                  `stablecoin transaction patterns for better financial insights ` +
                  `and tax reporting compliance.`
                alert(message)
              }}
              title="Advanced filtering options for stablecoin transaction analysis"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
              onClick={() => {
                const message = `Transaction Export Options:\n\n` +
                  `Stablecoin Transaction Reports:\n` +
                  `• CSV export for accounting software integration\n` +
                  `• PDF statements for record keeping\n` +
                  `• Tax-ready reports with cost basis calculations\n` +
                  `• Multi-chain consolidated statements\n` +
                  `• Yield farming income summaries\n\n` +
                  `Export Formats:\n` +
                  `• CSV: Compatible with Excel, QuickBooks, TurboTax\n` +
                  `• PDF: Professional statements with USD Financial branding\n` +
                  `• JSON: Raw data for custom analysis\n` +
                  `• Blockchain receipts: On-chain transaction proofs\n\n` +
                  `All exports maintain stablecoin transaction integrity and ` +
                  `include comprehensive metadata for compliance and analysis. ` +
                  `Perfect for tax preparation and financial audits.`
                alert(message)
              }}
              title="Export stablecoin transaction data in multiple formats"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stablecoin Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200"
            onClick={handleSendStablecoins}
          >
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <Send className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Send Stablecoins</h3>
                <p className="text-sm text-muted-foreground">Transfer USDC, USDT</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200"
            onClick={handleAddStablecoins}
          >
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mr-4">
                <Plus className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold">Add Stablecoins</h3>
                <p className="text-sm text-muted-foreground">Deposit from exchange</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200"
            onClick={handleEarnYield}
          >
            <CardContent className="flex items-center p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Earn Yield</h3>
                <p className="text-sm text-muted-foreground">Stake for rewards</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                This Month Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary ? formatCurrency(summary.monthlySpent) : formatCurrency(0)}
              </div>
              <p className="text-sm text-muted-foreground">Total outgoing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{summary ? formatCurrency(summary.monthlyIncome) : formatCurrency(0)}
              </div>
              <p className="text-sm text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Average Transaction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary ? formatCurrency(summary.averageTransaction) : formatCurrency(0)}
              </div>
              <p className="text-sm text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Largest Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary ? formatCurrency(summary.largestExpense) : formatCurrency(0)}
              </div>
              <p className="text-sm text-muted-foreground">
                {summary?.largestExpenseCategory || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <TransactionHistoryDatabase 
          showFilters={true}
          showExport={true}
        />

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="text-red-600 text-sm">
                <strong>Note:</strong> {error}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  )
}