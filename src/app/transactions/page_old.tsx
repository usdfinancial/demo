'use client'

import React, { useState, useEffect } from 'react'
import { Send, Download, Plus, Filter, ArrowUpRight, ArrowDownLeft, Activity, TrendingUp, RefreshCw, Search, Calendar } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEnhancedAuth } from '@/components/providers/EnhancedAuthProvider'
import { findUserByEmail } from '@/lib/demoUsers'
import { demoTransactionService } from '@/lib/demo/demoServices'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

export default function TransactionsPage() {
  const { user } = useEnhancedAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (user?.email) {
      const demoUser = findUserByEmail(user.email)
      if (demoUser) {
        loadTransactionData(demoUser.id)
      }
    }
  }, [user?.email, currentPage, filterType, filterStatus])

  const loadTransactionData = async (userId: string) => {
    setIsLoading(true)
    try {
      const [transactionData, summaryData] = await Promise.all([
        demoTransactionService.getTransactionHistory(
          userId,
          {
            transactionType: filterType !== 'all' ? filterType : undefined,
            status: filterStatus !== 'all' ? [filterStatus] : undefined,
            search: searchTerm || undefined
          },
          currentPage,
          20
        ),
        demoTransactionService.getTransactionSummary(userId, '30d')
      ])
      setTransactions(transactionData.data)
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to load transaction data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num)
  }

  const handleRefresh = () => {
    if (user?.email) {
      const demoUser = findUserByEmail(user.email)
      if (demoUser) {
        loadTransactionData(demoUser.id)
      }
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'withdrawal': return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'transfer': return <Send className="h-4 w-4 text-blue-600" />
      case 'swap': return <Activity className="h-4 w-4 text-purple-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Please sign in to view transactions</h3>
            <p className="text-muted-foreground">Connect your account to access your transaction history</p>
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
              Transactions
            </h1>
            <p className="text-muted-foreground mt-1">Complete history of your stablecoin activity</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Transaction Summary */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{summary.totalTransactions}</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
              <h3 className="font-semibold">Send Stablecoins</h3>
              <p className="text-sm text-muted-foreground">Transfer USDC, USDT</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200">
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

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-emerald-200">
          <CardContent className="flex items-center p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4">
              <Download className="h-6 w-6 text-emerald-600" />
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
            <CardTitle className="text-base">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(1247.53)}</div>
            <p className="text-sm text-muted-foreground">Total spent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{formatCurrency(3950.00)}</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(124.75)}</div>
            <p className="text-sm text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Largest Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(450.00)}</div>
            <p className="text-sm text-muted-foreground">Food & Dining</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  )
}